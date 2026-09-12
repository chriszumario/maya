import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { TodayTaskSchema } from "@/features/today/schemas";

const task = {
  id: 1,
  title: "Registrar avance",
  estimatedMinutes: 0,
  startTime: "08:00",
  goalTitle: "Meta",
  status: "pending",
  durationMinutes: 0,
};

describe("today schemas", () => {
  test("accepts tasks without measurable duration", () => {
    expect(v.safeParse(TodayTaskSchema, task).success).toBe(true);
    expect(
      v.safeParse(TodayTaskSchema, { ...task, estimatedMinutes: -1 }).success,
    ).toBe(false);
  });
});
