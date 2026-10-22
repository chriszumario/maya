import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTodayTasksFn: vi.fn(),
  updateTodayTaskFn: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ updateTag: mocks.updateTag }));
vi.mock("@/features/today/server", () => ({
  getTodayTasksFn: mocks.getTodayTasksFn,
  updateTodayTaskFn: mocks.updateTodayTaskFn,
}));

import {
  refreshTodayTasksFn,
  updateTodayTaskFn,
} from "@/features/today/actions";

beforeEach(() => vi.clearAllMocks());

describe("today actions", () => {
  test("invalidates all metrics even when the follow-up agenda read fails", async () => {
    mocks.updateTodayTaskFn.mockResolvedValue({ ok: true, data: { id: 1 } });
    mocks.getTodayTasksFn.mockResolvedValue({
      ok: false,
      error: { message: "temporary" },
    });
    const result = await updateTodayTaskFn({
      data: {
        taskId: 1,
        status: "completed",
        durationMinutes: 30,
        expectedDate: "2026-10-20",
      },
    });
    expect(result).toMatchObject({
      ok: true,
      data: { syncError: "temporary" },
    });
    expect(mocks.updateTag.mock.calls.map(([tag]) => tag)).toEqual([
      "today",
      "dashboard",
      "insights",
      "trends",
    ]);
  });
  test("fetches a fresh server snapshot before resuming a timer", async () => {
    const result = {
      ok: true as const,
      data: { date: "2026-09-08", tasks: [] },
    };
    mocks.getTodayTasksFn.mockResolvedValue(result);

    await expect(refreshTodayTasksFn()).resolves.toBe(result);
    expect(mocks.getTodayTasksFn).toHaveBeenCalledOnce();
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
});
