import { describe, expect, test, vi } from "vitest";

import {
  decodeSession,
  encodeSession,
  SESSION_MAX_AGE_SECONDS,
} from "@/features/auth/server/session-codec";
import { testAccessToken, testRefreshToken } from "../../../../support/auth";

const validSession = {
  accessToken: testAccessToken(),
  refreshToken: testRefreshToken,
  user: {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    isAdmin: false,
    timezone: "UTC",
  },
};

describe("session codec", () => {
  test("round-trips a valid authenticated session", () => {
    expect(decodeSession(encodeSession(validSession))).toEqual(validSession);
  });

  test("rejects an authenticated but incomplete session payload", () => {
    expect(
      decodeSession(encodeSession({ accessToken: "only-one-token" })),
    ).toEqual({});
  });

  test("rejects a placeholder secret in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "SESSION_SECRET",
      "replace-with-a-random-secret-of-at-least-32-characters",
    );

    expect(() => encodeSession(validSession)).toThrow(
      "no ser un valor de ejemplo",
    );
  });

  test("rejects sessions that exceed the safe cookie budget", () => {
    expect(() =>
      encodeSession({
        ...validSession,
        accessToken: `${"a".repeat(3_000)}.payload.signature`,
      }),
    ).toThrow("tamaño seguro");
  });

  test("rejects truncated GCM tags even when their prefix is authentic", () => {
    const [iv, tag, ciphertext] = encodeSession(validSession).split(".");
    for (const length of [4, 8, 12, 13, 14, 15]) {
      const truncated = Buffer.from(tag ?? "", "base64url")
        .subarray(0, length)
        .toString("base64url");
      expect(decodeSession(`${iv}.${truncated}.${ciphertext}`)).toEqual({});
    }
  });

  test("rejects expired cookies even when replayed outside the browser", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-09-19T12:00:00Z"));
      const cookie = encodeSession(validSession);
      vi.advanceTimersByTime(SESSION_MAX_AGE_SECONDS * 1000 - 1);
      expect(decodeSession(cookie)).toEqual(validSession);
      vi.advanceTimersByTime(1000);
      expect(decodeSession(cookie)).toEqual({});
    } finally {
      vi.useRealTimers();
    }
  });

  test("rejects extra segments and modified ciphertext", () => {
    const cookie = encodeSession(validSession);
    expect(decodeSession(`${cookie}.extra`)).toEqual({});
    const [iv, tag, ciphertext] = cookie.split(".");
    expect(
      decodeSession(
        `${iv}.${tag}.${ciphertext?.startsWith("A") ? "B" : "A"}${ciphertext?.slice(1)}`,
      ),
    ).toEqual({});
  });
});
