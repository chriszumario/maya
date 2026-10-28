import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  decodeSession,
  encodeSession,
} from "@/features/auth/server/session-codec";
import { testAccessToken, testRefreshToken } from "../../../../support/auth";

const cookie = vi.hoisted(() => ({ value: "" }));
const redirectError = new Error("NEXT_REDIRECT");

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw redirectError;
  }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookie.value ? { value: cookie.value } : undefined),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

import { redirect } from "next/navigation";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

beforeEach(() => {
  cookie.value = encodeSession({
    accessToken: testAccessToken(),
    refreshToken: testRefreshToken,
    user: {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      isAdmin: false,
      timezone: "UTC",
    },
  });
  vi.stubEnv("API_URL", "https://maya.test");
  vi.stubGlobal("fetch", vi.fn());
});

describe("authenticated API client", () => {
  test("blocks direct server operations after an uncertain refresh", async () => {
    cookie.value = encodeSession({
      ...decodeSession(cookie.value),
      refreshBlocked: true,
    });

    await expect(
      authenticatedApiFetch("/goals", { method: "POST", body: "{}" }),
    ).rejects.toBe(redirectError);

    expect(fetch).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/auth/session-expired");
  });

  test("rejects a missing session without calling the API", async () => {
    cookie.value = "";
    await expect(authenticatedApiFetch("/protected")).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      status: 401,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("uses the access token from the encrypted session", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ ok: true }));

    await expect(authenticatedApiFetch("/protected")).resolves.toEqual({
      ok: true,
    });

    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("authorization")).toBe(`Bearer ${testAccessToken()}`);
  });

  test("redirects after one 401 without trying to refresh during rendering", async () => {
    vi.mocked(fetch).mockResolvedValue(
      json({ error: { code: "EXPIRED", message: "expired" } }, 401),
    );

    await expect(authenticatedApiFetch("/protected")).rejects.toBe(
      redirectError,
    );

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([input]) => String(input).endsWith("/auth/refresh")),
    ).toBe(false);
    expect(redirect).toHaveBeenCalledWith("/auth/session-expired");
  });
});
