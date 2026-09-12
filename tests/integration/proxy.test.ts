import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client.server";
import { testAccessToken, testRefreshToken } from "../support/auth";

const mocks = vi.hoisted(() => ({ refreshTokens: vi.fn() }));

vi.mock("@/features/auth/server/refresh-tokens.server", () => ({
  refreshTokens: mocks.refreshTokens,
}));

import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE_NAME,
} from "@/features/auth/server/session-codec";
import { proxy } from "@/proxy";

const nowSeconds = 2_000_000_000;

function requestWithSession(expiresAt: number) {
  const session = encodeSession({
    accessToken: testAccessToken(expiresAt),
    refreshToken: testRefreshToken,
    user: {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
      timezone: "UTC",
    },
  });
  return new NextRequest("https://maya.test/goals?status=completed", {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${session}` },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(nowSeconds * 1_000);
});

afterEach(() => vi.useRealTimers());

describe("authentication proxy", () => {
  test("redirects an absent session to login and preserves the destination", async () => {
    const response = await proxy(
      new NextRequest("https://maya.test/goals?status=completed"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://maya.test/login?redirect=%2Fgoals%3Fstatus%3Dcompleted",
    );
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
  });

  test("does not refresh a token outside the refresh window", async () => {
    const response = await proxy(requestWithSession(nowSeconds + 60));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mocks.refreshTokens).not.toHaveBeenCalled();
  });

  test("persists and forwards a successful token rotation", async () => {
    const nextAccessToken = testAccessToken(nowSeconds + 3_600);
    const nextRefreshToken = "next-refresh-token-with-valid-length-123456";
    mocks.refreshTokens.mockResolvedValue({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    });

    const response = await proxy(requestWithSession(nowSeconds + 10));
    const responseSession = decodeSession(
      response.cookies.get(SESSION_COOKIE_NAME)?.value,
    );

    expect(mocks.refreshTokens).toHaveBeenCalledOnce();
    expect(responseSession).toMatchObject({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    });
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      SESSION_COOKIE_NAME,
    );
  });

  test.each(["INVALID_REFRESH_TOKEN", "REFRESH_TOKEN_REUSE"])(
    "clears the session after terminal refresh error %s",
    async (code) => {
      mocks.refreshTokens.mockRejectedValue(
        new ApiClientError({ code, message: "invalid", status: 401 }),
      );

      const response = await proxy(requestWithSession(nowSeconds));

      expect(response.status).toBe(307);
      expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
    },
  );

  test("returns 503 when an expired token cannot be refreshed temporarily", async () => {
    mocks.refreshTokens.mockRejectedValue(
      new ApiClientError({
        code: "NETWORK_ERROR",
        message: "unavailable",
        status: 503,
      }),
    );

    const response = await proxy(requestWithSession(nowSeconds));

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("5");
  });
});
