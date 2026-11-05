import { type NextRequest, NextResponse } from "next/server";
import * as v from "valibot";

import type { AuthTokens, AuthUser } from "@/features/auth/model/auth";
import { AuthUserSchema } from "@/features/auth/schemas/auth.schema";
import { refreshTokens } from "@/features/auth/server/refresh-tokens.server";
import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/features/auth/server/session-codec";
import { ApiClientError, apiFetch } from "@/lib/api-client.server";

const REFRESH_WINDOW_SECONDS = 30;

function isUnauthorized(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && error.status === 401;
}

function isSessionRejected(error: unknown) {
  return (
    isUnauthorized(error) ||
    (error instanceof ApiClientError &&
      ["INVALID_REFRESH_TOKEN", "REFRESH_TOKEN_REUSE"].includes(error.code))
  );
}

function tokensChanged(previous: AuthTokens, current: AuthTokens) {
  return (
    previous.accessToken !== current.accessToken ||
    previous.refreshToken !== current.refreshToken
  );
}

async function fetchCurrentUser(accessToken: string) {
  const user = await apiFetch("/auth/me", { token: accessToken });
  return v.parse(AuthUserSchema, user);
}

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
  if (session.refreshBlocked)
    return NextResponse.redirect(new URL("/auth/session-expired", request.url));
  const expiresAt = tokenExpiration(accessToken);
  if (!expiresAt) return loginRedirect(request);
  const now = Math.floor(Date.now() / 1000);
  const originalTokens = { accessToken, refreshToken };
  let tokens = originalTokens;
  try {
    let currentUser: AuthUser | undefined;
    let accessTokenRejected = false;
    if (expiresAt > now + REFRESH_WINDOW_SECONDS) {
      try {
        currentUser = await fetchCurrentUser(accessToken);
      } catch (error) {
        if (!isUnauthorized(error)) throw error;
        accessTokenRejected = true;
      }
    }
    if (!currentUser) {
      tokens = await refreshTokens(refreshToken, accessTokenRejected);
      currentUser = await fetchCurrentUser(tokens.accessToken);
    }
    if (
      !tokensChanged(originalTokens, tokens) &&
      JSON.stringify(currentUser) === JSON.stringify(user)
    )
      return NextResponse.next();
    const encodedSession = encodeSession({
      ...session,
      ...tokens,
      user: currentUser,
    });

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
    if (isSessionRejected(error)) return loginRedirect(request);
    if (
      error instanceof ApiClientError &&
      error.code === "REFRESH_OUTCOME_UNCERTAIN"
    ) {
      const response = NextResponse.redirect(
        new URL("/auth/session-expired", request.url),
      );
      response.cookies.set(
        SESSION_COOKIE_NAME,
        encodeSession({ ...session, refreshBlocked: true }),
        sessionCookieOptions,
      );
      return response;
    }
    const status =
      error instanceof ApiClientError && [403, 429].includes(error.status)
        ? error.status
        : 503;
    const response = new NextResponse(
      status === 403
        ? "No tienes permisos para acceder."
        : "El servicio de autenticación no está disponible.",
      {
        status,
        headers:
          status === 403
            ? {}
            : {
                "Retry-After": String(
                  error instanceof ApiClientError ? (error.retryAfter ?? 5) : 5,
                ),
              },
      },
    );
    if (tokensChanged(originalTokens, tokens))
      response.cookies.set(
        SESSION_COOKIE_NAME,
        encodeSession({ ...session, ...tokens }),
        sessionCookieOptions,
      );
    return response;
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
