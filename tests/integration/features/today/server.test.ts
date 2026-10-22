import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ api: vi.fn(), user: vi.fn() }));
vi.mock("@/features/auth/server/authenticated-api.server", () => ({
  authenticatedApiFetch: mocks.api,
}));
vi.mock("@/features/auth/server/auth-session.server", () => ({
  readSessionUser: mocks.user,
}));

import { updateTodayTaskFn } from "@/features/today/server";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-21T02:00:00Z"));
  mocks.user.mockResolvedValue({ timezone: "America/La_Paz" });
});
afterEach(() => vi.useRealTimers());

test("does not replay an old task log after local midnight", async () => {
  const result = await updateTodayTaskFn({
    data: {
      taskId: 1,
      status: "completed",
      durationMinutes: 30,
      expectedDate: "2026-10-19",
    },
  });
  expect(result).toMatchObject({
    ok: false,
    error: { code: "AGENDA_DATE_CHANGED" },
  });
  expect(mocks.api).not.toHaveBeenCalled();
});

test("uses the account timezone and never sends a date to the log upsert", async () => {
  mocks.api.mockResolvedValue({
    id: 1,
    taskId: 1,
    localDate: "2026-10-20",
    status: "completed",
    durationMinutes: 30,
    createdAt: "2026-10-21 02:00:00",
    updatedAt: "2026-10-21 02:00:00",
  });
  const result = await updateTodayTaskFn({
    data: {
      taskId: 1,
      status: "completed",
      durationMinutes: 30,
      expectedDate: "2026-10-20",
    },
  });
  expect(result.ok).toBe(true);
  expect(JSON.parse(mocks.api.mock.calls[0][1].body)).toEqual({
    taskId: 1,
    status: "completed",
    durationMinutes: 30,
  });
});
