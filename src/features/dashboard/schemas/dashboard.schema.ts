import * as v from "valibot";

import {
  CountSchema,
  LocalDateSchema,
  NonNegativeNumberSchema,
} from "@/lib/schemas/maya.schema";

const PercentageSchema = v.pipe(v.number(), v.minValue(0), v.maxValue(100));

export const DashboardSummaryInputSchema = v.object({
  date: v.optional(LocalDateSchema),
});

export const DashboardSummarySchema = v.object({
  date: LocalDateSchema,
  metricsAvailable: v.boolean(),
  goalsAsOf: v.literal("current"),
  goals: v.object({
    total: CountSchema,
    pending: CountSchema,
    inProgress: CountSchema,
    completed: CountSchema,
    cancelled: CountSchema,
    completionRate: PercentageSchema,
  }),
  tasks: v.object({
    total: CountSchema,
    pending: CountSchema,
    inProgress: CountSchema,
    completed: CountSchema,
    completionRate: PercentageSchema,
    plannedMinutes: NonNegativeNumberSchema,
    completedMinutes: NonNegativeNumberSchema,
  }),
  checkIn: v.object({
    journalRecorded: v.boolean(),
    mealsLogged: CountSchema,
    caloriesLogged: NonNegativeNumberSchema,
  }),
});

export type DashboardSummaryInput = v.InferOutput<
  typeof DashboardSummaryInputSchema
>;
export type DashboardSummary = v.InferOutput<typeof DashboardSummarySchema>;
