import { beforeEach, describe, expect, test, vi } from "vitest";

import { encodeSession } from "@/features/auth/server/session-codec";
import { testAccessToken, testRefreshToken } from "../../../support/auth";

const cookie = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  unstable_rethrow: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookie.value ? { value: cookie.value } : undefined),
  }),
}));

import {
  createTaskFn,
  getGoalReviewsFn,
  getGoalsFn,
  getGoalTasksFn,
} from "@/features/goals/server";

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

describe("goals server functions", () => {
  test.each([
    ["tasks", getGoalTasksFn],
    ["reviews", getGoalReviewsFn],
  ] as const)(
    "paginates %s with an opaque encoded cursor",
    async (resource, operation) => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ items: [], nextCursor: "next-page" })),
      );
      const result = await operation({
        data: { goalId: 7, limit: 20, cursor: "opaque+/=cursor" },
      });
      expect(result).toMatchObject({
        ok: true,
        data: { items: [], nextCursor: "next-page" },
      });
      expect(fetch).toHaveBeenCalledWith(
        `https://maya.test/goals/7/${resource}?limit=20&cursor=opaque%2B%2F%3Dcursor`,
        expect.anything(),
      );
    },
  );
  test("forwards the cursor and validates the page response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ items: [], nextCursor: "cursor-2" }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await getGoalsFn({
      data: { limit: 20, cursor: "cursor-1" },
    });

    expect(result).toEqual({
      ok: true,
      data: { items: [], nextCursor: "cursor-2" },
    });
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://maya.test/goals?limit=20&cursor=cursor-1",
    );
  });

  test("creates tasks using recurrenceMask and parses the response", async () => {
    const task = {
      id: 7,
      goalId: 1,
      title: "Entrenar",
      estimatedMinutes: 30,
      startTime: "08:00",
      frequency: "weekly" as const,
      recurrenceMask: 21,
      isActive: true,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(task), {
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await createTaskFn({
      data: {
        goalId: 1,
        title: task.title,
        estimatedMinutes: task.estimatedMinutes,
        startTime: task.startTime,
        frequency: task.frequency,
        recurrenceMask: task.recurrenceMask,
      },
    });

    expect(result).toEqual({ ok: true, data: task });
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://maya.test/goals/1/tasks",
    );
    expect(
      JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body)),
    ).toEqual({
      title: task.title,
      estimatedMinutes: task.estimatedMinutes,
      startTime: task.startTime,
      frequency: task.frequency,
      recurrenceMask: task.recurrenceMask,
    });
  });
});
