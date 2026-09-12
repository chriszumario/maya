import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { AdminStatsSchema } from "@/features/admin/schemas";

const stats = {
  users: { total: 3, active: 2, pending: 1, admins: 1 },
  activity: {
    period: "last_30_days",
    goals: 2,
    tasks: 4,
    taskExecution: {
      planned: 10,
      pending: 2,
      inProgress: 1,
      completed: 7,
      plannedMinutes: 300,
      completedMinutes: 210,
    },
    journalEntries: 5,
    nutritionEntries: 8,
  },
  topUsers: [],
  system: {
    version: "1.0.0",
    uptimeSeconds: 120,
    activeSessions: 2,
    aiConfigured: true,
  },
};

describe("admin API contract", () => {
  test("uses taskExecution instead of the removed taskLogs field", () => {
    expect(
      v.parse(AdminStatsSchema, stats).activity.taskExecution.completed,
    ).toBe(7);
    expect(() =>
      v.parse(AdminStatsSchema, {
        ...stats,
        activity: { ...stats.activity, taskExecution: undefined, taskLogs: 7 },
      }),
    ).toThrow();
  });
});
