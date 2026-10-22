import * as v from "valibot";

import {
  IdSchema,
  LocalDateSchema,
  TaskLogStatusSchema,
} from "@/lib/schemas/maya.schema";

export const TodayTaskStatusSchema = v.picklist([
  "pending",
  "in_progress",
  "completed",
]);

export const TaskLogSchema = v.object({
  id: IdSchema,
  taskId: IdSchema,
  localDate: LocalDateSchema,
  status: TaskLogStatusSchema,
  durationMinutes: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(0),
    v.maxValue(1_440),
  ),
  createdAt: v.string(),
  updatedAt: v.string(),
});

export const TodayTaskSchema = v.object({
  id: IdSchema,
  title: v.string(),
  estimatedMinutes: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(0),
    v.maxValue(1_440),
  ),
  startTime: v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):[0-5]\d$/)),
  goalTitle: v.string(),
  status: TodayTaskStatusSchema,
  durationMinutes: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(0),
    v.maxValue(1_440),
  ),
});

export const TodayTasksSchema = v.object({
  date: LocalDateSchema,
  tasks: v.array(TodayTaskSchema),
});

export const UpdateTodayTaskInputSchema = v.object({
  expectedDate: LocalDateSchema,
  taskId: IdSchema,
  status: TaskLogStatusSchema,
  durationMinutes: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(0),
    v.maxValue(1_440),
  ),
});

export type TodayTaskStatus = v.InferOutput<typeof TodayTaskStatusSchema>;
export type TaskLogStatus = v.InferOutput<typeof TaskLogStatusSchema>;
export type TaskLog = v.InferOutput<typeof TaskLogSchema>;
export type TodayTask = v.InferOutput<typeof TodayTaskSchema>;
export type TodayTasks = v.InferOutput<typeof TodayTasksSchema>;
