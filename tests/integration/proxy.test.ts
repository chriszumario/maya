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
const protectedUrl = "https://maya.test/goals?status=completed";
const loginUrl =
  "https://maya.test/login?redirect=%2Fgoals%3Fstatus%3Dcompleted";
const sessionExpiredUrl = "https://maya.test/auth/session-expired";
const user = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  isAdmin: false,
  timezone: "UTC",
};

function apiErrorResponse(status: number, code: string, headers?: HeadersInit) {
  return Response.json(
    { error: { code, message: "Request failed" } },
    { status, headers },
  );
}

function requestWithSession(expiresAt: number) {
  const session = encodeSession({
    accessToken: testAccessToken(expiresAt),
    refreshToken: testRefreshToken,
    user,
  });
  return new NextRequest(protectedUrl, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${session}` },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(nowSeconds * 1_000);
  vi.stubEnv("API_URL", "https://api.maya.test");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => Response.json(user)),
  );
});

afterEach(() => vi.useRealTimers());

describe("authentication proxy", () => {
  test("persists rotated tokens even if profile validation fails temporarily", async () => {
    const tokens = {
      accessToken: testAccessToken(nowSeconds + 1800),
      refreshToken: "rotated-refresh-token-for-temporary-profile-failure",
    };
    mocks.refreshTokens.mockResolvedValue(tokens);
    vi.mocked(fetch).mockResolvedValueOnce(
      apiErrorResponse(503, "RATE_LIMIT_UNAVAILABLE"),
    );
    const response = await proxy(requestWithSession(nowSeconds));
    expect(response.status).toBe(503);
    expect(
      decodeSession(response.cookies.get(SESSION_COOKIE_NAME)?.value),
    ).toMatchObject(tokens);
  });

  test("blocks later replay after an uncertain refresh without claiming revocation", async () => {
    mocks.refreshTokens.mockRejectedValue(
      new ApiClientError({
        code: "REFRESH_OUTCOME_UNCERTAIN",
        message: "uncertain",
        status: 503,
      }),
    );
    const response = await proxy(requestWithSession(nowSeconds));
    expect(response.headers.get("location")).toBe(sessionExpiredUrl);
    const value = response.cookies.get(SESSION_COOKIE_NAME)?.value;
    expect(decodeSession(value)).toMatchObject({
      refreshBlocked: true,
      refreshToken: testRefreshToken,
    });
    mocks.refreshTokens.mockClear();
    await proxy(
      new NextRequest("https://maya.test/today", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${value}` },
      }),
    );
    expect(mocks.refreshTokens).not.toHaveBeenCalled();
  });

  test.each([
    { status: 403, code: "FORBIDDEN", retryAfter: null },
    { status: 429, code: "RATE_LIMITED", retryAfter: "900" },
  ])(
    "keeps status $status without attempting refresh",
    async ({ status, code, retryAfter }) => {
      vi.mocked(fetch).mockResolvedValueOnce(
        apiErrorResponse(status, code, { "Retry-After": "900" }),
      );

      const response = await proxy(requestWithSession(nowSeconds + 60));

      expect(response.status).toBe(status);
      expect(response.headers.get("Retry-After")).toBe(retryAfter);
      expect(mocks.refreshTokens).not.toHaveBeenCalled();
      expect(response.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
    },
  );

  test("redirects an absent session to login and preserves the destination", async () => {
    const response = await proxy(new NextRequest(protectedUrl));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(loginUrl);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
  });

  test("does not refresh a token outside the refresh window", async () => {
    const response = await proxy(requestWithSession(nowSeconds + 60));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(mocks.refreshTokens).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.maya.test/auth/me",
      expect.anything(),
    );
  });

  test.each(["INVALID_TOKEN", "TOKEN_EXPIRED", "HTTP_ERROR"])(
    "recovers an access JWT rejected with 401 and code %s once",
    async (code) => {
      vi.mocked(fetch).mockResolvedValueOnce(apiErrorResponse(401, code));
      mocks.refreshTokens.mockResolvedValue({
        accessToken: testAccessToken(nowSeconds + 1800),
        refreshToken: testRefreshToken,
      });

      const response = await proxy(requestWithSession(nowSeconds + 60));

      expect(mocks.refreshTokens).toHaveBeenCalledWith(testRefreshToken, true);
      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(2);
    },
  );

  test("does not clear sessions or refresh on a temporary validation failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      apiErrorResponse(503, "RATE_LIMIT_UNAVAILABLE"),
    );

    const response = await proxy(requestWithSession(nowSeconds + 60));

    expect(response.status).toBe(503);
    expect(response.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
    expect(mocks.refreshTokens).not.toHaveBeenCalled();
  });

  test("stops after a second 401 without a refresh loop", async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      apiErrorResponse(401, "INVALID_TOKEN"),
    );
    mocks.refreshTokens.mockResolvedValue({
      accessToken: testAccessToken(nowSeconds + 1800),
      refreshToken: testRefreshToken,
    });

    const response = await proxy(requestWithSession(nowSeconds + 60));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(loginUrl);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
    expect(mocks.refreshTokens).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(2);
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

  test.each([
    "INVALID_REFRESH_TOKEN",
    "REFRESH_TOKEN_REUSE",
    "REFRESH_TOKEN_EXPIRED",
    "UNAUTHORIZED",
    "HTTP_ERROR",
  ])("clears the session after terminal refresh error %s", async (code) => {
    mocks.refreshTokens.mockRejectedValue(
      new ApiClientError({ code, message: "invalid", status: 401 }),
    );

    const response = await proxy(requestWithSession(nowSeconds));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(loginUrl);
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });

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
    expect(response.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
  });
});
