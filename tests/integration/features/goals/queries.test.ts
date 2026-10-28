import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getGoalFn: vi.fn(),
  getGoalTasksFn: vi.fn(),
  getGoalsFn: vi.fn(),
  getGoalReviewsFn: vi.fn(),
}));
vi.mock("@/features/goals/server", () => mocks);
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

import { getGoal, getGoalTasks } from "@/features/goals/queries";

beforeEach(() => vi.clearAllMocks());

test.each([getGoal, getGoalTasks])(
  "renders not-found for missing or inaccessible goals",
  async (query) => {
    const failure = {
      ok: false,
      error: {
        code: "NOT_FOUND",
        status: 404,
        message: "Recurso no encontrado",
      },
    };
    mocks.getGoalFn.mockResolvedValue(failure);
    mocks.getGoalTasksFn.mockResolvedValue(failure);
    await expect(query(123)).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  },
);

test("keeps service failures in the error boundary", async () => {
  mocks.getGoalFn.mockResolvedValue({
    ok: false,
    error: {
      code: "NETWORK_ERROR",
      status: 503,
      message: "Servicio no disponible",
    },
  });
  await expect(getGoal(123)).rejects.toThrow("Servicio no disponible");
});
