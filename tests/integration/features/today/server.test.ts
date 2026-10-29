import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("@/features/auth/server/authenticated-api.server", () => ({
  authenticatedApiFetch: mocks.api,
}));

import { updateTodayTaskFn } from "@/features/today/server";
import { ApiClientError } from "@/lib/api-client.server";

beforeEach(() => vi.resetAllMocks());

test("preserves the API date conflict without retrying the activity", async () => {
  mocks.api.mockRejectedValue(
    new ApiClientError({
      status: 409,
      code: "AGENDA_DATE_CHANGED",
      message: "El día cambió. Recarga la agenda antes de registrar actividad.",
    }),
  );
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
  expect(mocks.api).toHaveBeenCalledTimes(1);
});

test("sends the agenda date for the API to check against the current account timezone", async () => {
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
    expectedDate: "2026-10-20",
  });
});
