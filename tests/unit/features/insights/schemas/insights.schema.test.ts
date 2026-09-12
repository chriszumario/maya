import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { DashboardTrendsSchema } from "@/features/insights/schemas/insights.schema";

const dates = [
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
  "2026-09-05",
  "2026-09-06",
  "2026-09-07",
];
const series = dates.map((date, value) => ({ date, value }));

describe("dashboard API contract", () => {
  test("keeps all trend series aligned to the period", () => {
    const trends = v.parse(DashboardTrendsSchema, {
      dataComplete: true,
      missingDates: [],
      period: { from: dates[0], to: dates[6], days: 7 },
      tasks: Object.fromEntries([
        ["planned", series],
        ["pending", series],
        ["inProgress", series],
        ["completed", series],
        ["completionRate", series],
        ["plannedMinutes", series],
        ["completedMinutes", series],
      ]),
      goals: {
        statusDistribution: [{ status: "completed", value: 2 }],
        completed: series,
      },
      activity: {
        journalEntries: series,
        mealsLogged: series,
        caloriesLogged: series,
      },
    });

    expect(trends.tasks.planned).toHaveLength(7);
    expect(trends.tasks.completed).toHaveLength(7);
  });
});
