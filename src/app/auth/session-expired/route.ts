import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/features/auth/server/session-codec";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
