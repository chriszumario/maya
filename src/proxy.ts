import { type NextRequest, NextResponse } from "next/server";

import { refreshTokens } from "@/features/auth/server/refresh-tokens.server";
import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/features/auth/server/session-codec";
import { ApiClientError } from "@/lib/api-client.server";

const REFRESH_WINDOW_SECONDS = 30;

function tokenExpiration(accessToken: string) {
  try {
    const [, payload] = accessToken.split(".");
    if (!payload) return null;
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    if (
      !claims ||
      typeof claims !== "object" ||
      !("exp" in claims) ||
      typeof claims.exp !== "number" ||
      !Number.isInteger(claims.exp) ||
      claims.exp <= 0
    ) {
      return null;
    }
    return claims.exp;
  } catch {
    return null;
  }
}

function loginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "redirect",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function proxy(request: NextRequest) {
  const session = decodeSession(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  const { accessToken, refreshToken, user } = session;

  if (!accessToken || !refreshToken || !user) return loginRedirect(request);
  const expiresAt = tokenExpiration(accessToken);
  if (!expiresAt) return loginRedirect(request);
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt > now + REFRESH_WINDOW_SECONDS) return NextResponse.next();

  try {
    const tokens = await refreshTokens(refreshToken);
    const encodedSession = encodeSession({ ...session, ...tokens });

    const requestHeaders = new Headers(request.headers);
    request.cookies.set(SESSION_COOKIE_NAME, encodedSession);
    requestHeaders.set("cookie", request.cookies.toString());

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      encodedSession,
      sessionCookieOptions,
    );
    return response;
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      ["INVALID_REFRESH_TOKEN", "REFRESH_TOKEN_REUSE"].includes(error.code)
    ) {
      return loginRedirect(request);
    }
    if (expiresAt > now) return NextResponse.next();
    return new NextResponse(
      "El servicio de autenticación no está disponible.",
      {
        status: 503,
        headers: { "Retry-After": "5" },
      },
    );
  }
}

export const config = {
  matcher: [
    "/",
    "/today/:path*",
    "/goals/:path*",
    "/journal/:path*",
    "/nutrition/:path*",
    "/insights/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
