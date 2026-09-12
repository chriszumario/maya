import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { DashboardSummarySchema } from "@/features/dashboard/schemas/dashboard.schema";

const metrics = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
  completionRate: 0,
};

describe("dashboard schemas", () => {
  test("validates an empty dashboard summary", () => {
    const summary = {
      date: "2026-09-01",
      metricsAvailable: false,
      goalsAsOf: "current",
      goals: metrics,
      tasks: { ...metrics, plannedMinutes: 0, completedMinutes: 0 },
      checkIn: { journalRecorded: false, mealsLogged: 0, caloriesLogged: 0 },
    };

    expect(v.parse(DashboardSummarySchema, summary).goalsAsOf).toBe("current");
  });
});
