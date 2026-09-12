import { describe, expect, test, vi } from "vitest";

import {
  decodeSession,
  encodeSession,
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
});
