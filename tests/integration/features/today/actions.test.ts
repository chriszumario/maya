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

import { refreshTodayTasksFn } from "@/features/today/actions";

beforeEach(() => vi.clearAllMocks());

describe("today actions", () => {
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
