import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateTag: vi.fn(),
  createGoalReviewFn: vi.fn(),
  deleteTaskFn: vi.fn(),
  getGoalReviews: vi.fn(),
}));

vi.mock("next/cache", () => ({ updateTag: mocks.updateTag }));
vi.mock("@/features/goals/server", () => ({
  createGoalReviewFn: mocks.createGoalReviewFn,
  deleteTaskFn: mocks.deleteTaskFn,
}));
vi.mock("@/features/goals/queries", () => ({
  getGoalReviews: mocks.getGoalReviews,
}));

import {
  createGoalReviewFn,
  deleteTaskFn,
  getGoalReviewsFn,
} from "@/features/goals/actions";

beforeEach(() => vi.clearAllMocks());

describe("goal actions", () => {
  test("invalidates every view affected by a successful review", async () => {
    mocks.createGoalReviewFn.mockResolvedValue({
      ok: true,
      data: { goalId: 7 },
    });

    await createGoalReviewFn({
      data: {
        goalId: 7,
        whatWorked: "Funcionó",
        whatDidNotWork: "No funcionó",
        nextActions: "Continuar",
        continueGoal: true,
      },
    });

    expect(mocks.updateTag.mock.calls.map(([tag]) => tag)).toEqual([
      "goals",
      "goal-7",
      "today",
      "dashboard",
      "insights",
      "trends",
    ]);
  });

  test("does not invalidate caches after a failed review", async () => {
    mocks.createGoalReviewFn.mockResolvedValue({
      ok: false,
      error: { code: "FAILED", message: "failed" },
    });

    await createGoalReviewFn({
      data: {
        goalId: 7,
        whatWorked: "Funcionó",
        whatDidNotWork: "No funcionó",
        nextActions: "Continuar",
        continueGoal: true,
      },
    });

    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  test.each([null, {}, { data: { taskId: 1 } }])(
    "rejects malformed delete-task input: %j",
    async (input) => {
      const result = await deleteTaskFn(
        input as Parameters<typeof deleteTaskFn>[0],
      );
      expect(result).toMatchObject({
        ok: false,
        error: { code: "VALIDATION_ERROR" },
      });
      expect(mocks.deleteTaskFn).not.toHaveBeenCalled();
    },
  );

  test("rejects malformed review-history input", async () => {
    const result = await getGoalReviewsFn(
      null as unknown as Parameters<typeof getGoalReviewsFn>[0],
    );
    expect(result).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(mocks.getGoalReviews).not.toHaveBeenCalled();
  });
});
