import { beforeEach, describe, expect, test, vi } from "vitest";

import { apiFetch } from "@/lib/api-client.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

beforeEach(() => {
  vi.stubEnv("API_URL", "https://maya.test/api");
  vi.stubGlobal("fetch", vi.fn());
});

describe("API client", () => {
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
      message: "La operación entra en conflicto con el estado actual.",
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
