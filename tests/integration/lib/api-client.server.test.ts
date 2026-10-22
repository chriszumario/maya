import { beforeEach, describe, expect, test, vi } from "vitest";

import { apiFetch } from "@/lib/api-client.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

beforeEach(() => {
  vi.stubEnv("API_URL", "https://maya.test");
  vi.stubGlobal("fetch", vi.fn());
});

describe("API client", () => {
  test("uses the documented default origin without an API prefix", async () => {
    vi.stubEnv("API_URL", undefined);
    vi.mocked(fetch).mockResolvedValue(json({ ok: true }));
    await apiFetch("/auth/me");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/auth/me",
      expect.anything(),
    );
  });

  test("retains request IDs and Retry-After seconds without exposing upstream text", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "RATE_LIMITED", message: "private" } }),
        {
          status: 429,
          headers: { "X-Request-Id": "support-123", "Retry-After": "900" },
        },
      ),
    );
    await expect(apiFetch("/goals")).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
      requestId: "support-123",
      retryAfter: 900,
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  test("allows more than the provider's 15-second timeout for AI", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    vi.mocked(fetch).mockResolvedValue(json({ calories: 300 }));
    await apiFetch("/ai/estimate-calories", { method: "POST", body: "{}" });
    expect(timeout).toHaveBeenCalledWith(20_000);
  });
  test("sends auth and JSON headers", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ ok: true }));

    await apiFetch("/protected", {
      token: "access-token",
      method: "POST",
      body: JSON.stringify({ value: 7 }),
    });

    const request = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = request?.headers as Headers;
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("content-type")).toBe("application/json");
    expect(request?.cache).toBe("no-store");
    expect(request?.redirect).toBe("error");
  });

  test("keeps API error code and status", async () => {
    vi.mocked(fetch).mockResolvedValue(
      json({ error: { code: "GOAL_TERMINAL", message: "internal" } }, 409),
    );

    await expect(apiFetch("/goals/1")).rejects.toMatchObject({
      code: "GOAL_TERMINAL",
      message: "La meta ya está completada o cancelada. Recarga sus datos.",
      status: 409,
    });
  });

  test("normalizes network failures without leaking their message", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(fetch).mockRejectedValue(new Error("private infrastructure"));

    await expect(apiFetch("/goals")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "El servicio no está disponible temporalmente.",
      status: 503,
    });
  });

  test("rejects plain HTTP for a remote production API", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_URL", "http://api.example.com/api");

    await expect(apiFetch("/goals")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 503,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("returns null for an empty successful response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch("/logout", { method: "POST" })).resolves.toBeNull();
  });

  test.each([
    "https://maya.test/api",
    "https://maya.test/v1",
    "ftp://localhost/api",
    "https://user:password@maya.test/api",
    "https://maya.test/api?redirect=elsewhere",
    "https://maya.test/api#fragment",
  ])("rejects unsafe API configuration: %s", async (url) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("API_URL", url);
    await expect(apiFetch("/auth/login")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
