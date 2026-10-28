import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  CreateTaskInputSchema,
  GoalPageSchema,
  GoalTaskSchema,
  TaskFormSchema,
  UpdateGoalInputSchema,
  UpdateTaskInputSchema,
} from "@/features/goals/schemas";

const goal = {
  id: 1,
  userId: 2,
  title: "Meta",
  motivation: "Motivación",
  category: "growth",
  priority: "high",
  status: "pending",
  startDate: null,
  endedAt: null,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("goal schemas", () => {
  test("associates an invalid schedule with the schedule field", () => {
    const result = v.safeParse(TaskFormSchema, {
      title: "Entrenar",
      estimatedMinutes: "30",
      startTime: "08:00",
      frequency: "weekly",
      schedule: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(v.flatten(result.issues).nested?.schedule).toEqual([
        "Completa la programación requerida por la frecuencia.",
      ]);
    }
  });

  test("validates a cursor page and partial updates", () => {
    expect(
      v.parse(GoalPageSchema, { items: [goal], nextCursor: null }).items,
    ).toHaveLength(1);
    expect(
      v.safeParse(UpdateGoalInputSchema, { id: 1, priority: "low" }).success,
    ).toBe(true);
    expect(v.safeParse(UpdateGoalInputSchema, { id: 1 }).success).toBe(false);
  });

  test("validates recurrence masks for each task frequency", () => {
    const task = {
      goalId: 1,
      title: "Entrenar",
      estimatedMinutes: 30,
      startTime: "08:00",
    };

    expect(
      v.safeParse(CreateTaskInputSchema, {
        ...task,
        frequency: "weekly",
        recurrenceMask: 21,
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(CreateTaskInputSchema, { ...task, frequency: "weekly" })
        .success,
    ).toBe(false);
    expect(
      v.safeParse(CreateTaskInputSchema, {
        ...task,
        frequency: "weekly",
        recurrenceMask: 128,
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(CreateTaskInputSchema, { ...task, frequency: "daily" })
        .success,
    ).toBe(true);
    expect(
      v.safeParse(CreateTaskInputSchema, {
        ...task,
        estimatedMinutes: 0,
        frequency: "daily",
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(CreateTaskInputSchema, {
        ...task,
        estimatedMinutes: -1,
        frequency: "daily",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(CreateTaskInputSchema, {
        ...task,
        frequency: "monthly",
        recurrenceMask: 31,
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(CreateTaskInputSchema, {
        ...task,
        frequency: "once",
        recurrenceMask: 20260230,
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(CreateTaskInputSchema, {
        ...task,
        frequency: "once",
        recurrenceMask: 18991231,
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(CreateTaskInputSchema, {
        ...task,
        frequency: "once",
        recurrenceMask: 20260915,
      }).success,
    ).toBe(true);
  });

  test("validates recurrence mask updates", () => {
    expect(
      v.safeParse(UpdateTaskInputSchema, { taskId: 1, isActive: false })
        .success,
    ).toBe(true);
    expect(
      v.safeParse(UpdateTaskInputSchema, {
        taskId: 1,
        estimatedMinutes: 0,
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(UpdateTaskInputSchema, { taskId: 1, recurrenceMask: 64 })
        .success,
    ).toBe(true);
    expect(
      v.safeParse(UpdateTaskInputSchema, {
        taskId: 1,
        frequency: "weekly",
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(UpdateTaskInputSchema, {
        taskId: 1,
        frequency: "weekly",
        recurrenceMask: 127,
      }).success,
    ).toBe(true);
  });

  test("converts task form schedules to recurrence masks", () => {
    const form = {
      title: "Entrenar",
      estimatedMinutes: "30",
      startTime: "08:00",
    };

    expect(
      v.parse(TaskFormSchema, {
        ...form,
        frequency: "weekly",
        schedule: "65",
      }).recurrenceMask,
    ).toBe(65);
    expect(
      v.parse(TaskFormSchema, {
        ...form,
        frequency: "once",
        schedule: "2026-09-15",
      }).recurrenceMask,
    ).toBe(20260915);
    expect(
      v.parse(TaskFormSchema, {
        ...form,
        estimatedMinutes: "0",
        frequency: "daily",
        schedule: "",
      }),
    ).toMatchObject({ estimatedMinutes: 0, recurrenceMask: 0 });
  });

  test("parses the current task response contract", () => {
    const task = {
      id: 3,
      goalId: 1,
      title: "Entrenar",
      estimatedMinutes: 30,
      startTime: "08:00",
      frequency: "weekly",
      recurrenceMask: 21,
      isActive: true,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };

    expect(
      v.safeParse(GoalTaskSchema, { ...task, estimatedMinutes: 0 }).success,
    ).toBe(true);
    expect(
      v.safeParse(GoalTaskSchema, {
        ...task,
        recurrenceMask: undefined,
        daysOfWeek: "1,3,5",
      }).success,
    ).toBe(false);
  });
});
