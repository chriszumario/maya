import * as v from "valibot";

import {
  CountSchema,
  GoalStatusSchema,
  IdSchema,
  LocalDateSchema,
  NonNegativeNumberSchema,
} from "@/lib/schemas/maya.schema";

const PercentageSchema = v.pipe(v.number(), v.minValue(0), v.maxValue(100));
const GoalPrioritySchema = v.picklist(["low", "medium", "high"]);

export const InsightsSchema = v.object({
  periodDays: v.pipe(v.number(), v.integer(), v.minValue(1)),
  dataComplete: v.boolean(),
  missingDates: v.array(LocalDateSchema),
  priorities: v.array(
    v.object({
      goalId: IdSchema,
      title: v.string(),
      priority: GoalPrioritySchema,
      status: GoalStatusSchema,
      reason: v.string(),
    }),
  ),
  alerts: v.array(
    v.object({
      code: v.picklist(["NO_RECENT_PROGRESS", "LOW_COMPLETION_RATE"]),
      severity: v.picklist(["info", "warning", "critical"]),
      message: v.string(),
    }),
  ),
  trends: v.array(
    v.object({
      code: v.picklist([
        "COMPLETION_UP",
        "COMPLETION_DOWN",
        "COMPLETION_STABLE",
      ]),
      direction: v.picklist(["up", "down", "stable"]),
      change: v.number(),
      message: v.string(),
    }),
  ),
  recommendations: v.array(
    v.object({
      code: v.picklist(["START_PRIORITY_GOAL", "REDUCE_DAILY_LOAD"]),
      message: v.string(),
    }),
  ),
});

export const TrendsInputSchema = v.object({
  days: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(7), v.maxValue(90)),
    30,
  ),
  endDate: v.optional(LocalDateSchema),
});

const DatedValueSchema = v.object({
  date: LocalDateSchema,
  value: NonNegativeNumberSchema,
});

const PercentageDatedValueSchema = v.object({
  date: LocalDateSchema,
  value: PercentageSchema,
});

function isAscendingSeries(series: Array<{ date: string }>) {
  return series.every(
    (item, index) => index === 0 || series[index - 1].date <= item.date,
  );
}

export const DashboardTrendsSchema = v.pipe(
  v.object({
    dataComplete: v.boolean(),
    missingDates: v.array(LocalDateSchema),
    period: v.object({
      from: LocalDateSchema,
      to: LocalDateSchema,
      days: v.pipe(v.number(), v.integer(), v.minValue(7), v.maxValue(90)),
    }),
    tasks: v.object({
      planned: v.array(DatedValueSchema),
      pending: v.array(DatedValueSchema),
      inProgress: v.array(DatedValueSchema),
      completed: v.array(DatedValueSchema),
      completionRate: v.array(PercentageDatedValueSchema),
      plannedMinutes: v.array(DatedValueSchema),
      completedMinutes: v.array(DatedValueSchema),
    }),
    goals: v.object({
      statusDistribution: v.array(
        v.object({
          status: GoalStatusSchema,
          value: CountSchema,
        }),
      ),
      completed: v.array(DatedValueSchema),
    }),
    activity: v.object({
      journalEntries: v.array(DatedValueSchema),
      mealsLogged: v.array(DatedValueSchema),
      caloriesLogged: v.array(DatedValueSchema),
    }),
  }),
  v.check((input) => {
    const datedSeries = [
      input.tasks.planned,
      input.tasks.pending,
      input.tasks.inProgress,
      input.tasks.completed,
      input.tasks.completionRate,
      input.tasks.plannedMinutes,
      input.tasks.completedMinutes,
      input.goals.completed,
      input.activity.journalEntries,
      input.activity.mealsLogged,
      input.activity.caloriesLogged,
    ];
    return datedSeries.every(
      (series) =>
        series.length === input.period.days && isAscendingSeries(series),
    );
  }, "Las series de tendencias no coinciden con el período solicitado."),
);

export type Insights = v.InferOutput<typeof InsightsSchema>;
export type TrendsInput = v.InferOutput<typeof TrendsInputSchema>;
export type DashboardTrends = v.InferOutput<typeof DashboardTrendsSchema>;
