import { createHash } from "node:crypto";
import { describe, expect, test, vi } from "vitest";

import { refreshTokens } from "@/features/auth/server/refresh-tokens.server";
import { testAccessToken } from "../../../../support/auth";

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });

describe("refresh token coordination", () => {
  test("revalidates a cached replay after a security-version change", async () => {
    vi.stubEnv("API_URL", "https://maya.test");
    const token = "refresh-token-for-security-version-test-123456";
    const successor = "successor-for-security-version-test-12345678";
    const first = {
      accessToken: testAccessToken(2_000_000_000),
      refreshToken: successor,
    };
    const reissued = {
      accessToken: testAccessToken(2_000_001_800),
      refreshToken: successor,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(first))
      .mockResolvedValueOnce(json(reissued));
    vi.stubGlobal("fetch", fetchMock);
    await expect(refreshTokens(token)).resolves.toEqual(first);
    await expect(refreshTokens(token, true)).resolves.toEqual(reissued);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toBe(
      fetchMock.mock.calls[1][1].body,
    );
  });

  test("treats a malformed successful rotation as uncertain instead of retrying later", async () => {
    vi.stubEnv("API_URL", "https://maya.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json({ accessToken: "invalid" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      refreshTokens("malformed-response-refresh-token-123456789"),
    ).rejects.toMatchObject({ code: "REFRESH_OUTCOME_UNCERTAIN" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  test("shares concurrent work and sends a stable idempotency key", async () => {
    vi.stubEnv("API_URL", "https://maya.test");
    const fetchMock = vi.fn().mockResolvedValue(
      json({
        accessToken: testAccessToken(),
        refreshToken: "rotated-refresh-token-with-valid-length-12345",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const refreshToken = "unique-refresh-token-for-idempotency-test-123";

    const [first, second] = await Promise.all([
      refreshTokens(refreshToken),
      refreshTokens(refreshToken),
    ]);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledOnce();
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("idempotency-key")).toBe(
      createHash("sha256").update(refreshToken, "utf8").digest("base64url"),
    );
    expect(headers.get("idempotency-key")).toHaveLength(43);
  });

  test("retries an in-progress rotation once with the same token and key", async () => {
    vi.useFakeTimers();
    vi.stubEnv("API_URL", "https://maya.test");
    const refreshToken = "retry-refresh-token-with-valid-length-123456789";
    const tokens = {
      accessToken: testAccessToken(),
      refreshToken: "retry-successor-token-with-valid-length-123456",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: "REFRESH_ROTATION_IN_PROGRESS",
              message: "in progress",
            },
          }),
          { status: 503, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(json(tokens));
    vi.stubGlobal("fetch", fetchMock);

    const result = refreshTokens(refreshToken);
    await vi.advanceTimersByTimeAsync(250);

    await expect(result).resolves.toEqual(tokens);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const requests = fetchMock.mock.calls.map(([, options]) => ({
      body: options?.body,
      key: new Headers(options?.headers).get("idempotency-key"),
    }));
    expect(requests[0]).toEqual(requests[1]);
    vi.useRealTimers();
  });

  test("retries a lost response within the replay window", async () => {
    vi.useFakeTimers();
    vi.stubEnv("API_URL", "https://maya.test");
    const refreshToken = "lost-response-refresh-token-with-valid-length-123";
    const tokens = {
      accessToken: testAccessToken(),
      refreshToken: "lost-response-successor-with-valid-length-12345",
    };
    const requestTimes: number[] = [];
    const startedAt = Date.now();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((_resolve, reject) => {
            requestTimes.push(Date.now() - startedAt);
            setTimeout(() => reject(new Error("response lost")), 7_000);
          }),
      )
      .mockImplementationOnce(() => {
        requestTimes.push(Date.now() - startedAt);
        return Promise.resolve(json(tokens));
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = refreshTokens(refreshToken);
    await vi.advanceTimersByTimeAsync(7_250);

    await expect(result).resolves.toEqual(tokens);
    expect(requestTimes).toEqual([0, 7_250]);
    expect(requestTimes[1]).toBeLessThan(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  test("does not retry after the safe replay deadline", async () => {
    vi.useFakeTimers();
    vi.stubEnv("API_URL", "https://maya.test");
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((_resolve, reject) => {
          setTimeout(() => reject(new Error("late network failure")), 9_500);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = refreshTokens(
      "late-failure-refresh-token-with-valid-length-123456",
    );
    const rejection = expect(result).rejects.toMatchObject({
      code: "REFRESH_OUTCOME_UNCERTAIN",
    });
    await vi.advanceTimersByTimeAsync(9_500);

    await rejection;
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  test("does not retry terminal refresh errors", async () => {
    vi.stubEnv("API_URL", "https://maya.test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "INVALID_IDEMPOTENCY_KEY", message: "invalid key" },
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      refreshTokens("invalid-key-refresh-token-with-valid-length-123456"),
    ).rejects.toMatchObject({ code: "INVALID_IDEMPOTENCY_KEY" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
