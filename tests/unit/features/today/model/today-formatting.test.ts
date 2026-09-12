import { describe, expect, test } from "vitest";

import {
  findNextPendingTask,
  formatMinutes,
  formatTimer,
} from "@/features/today/model/today";

describe("today formatting", () => {
  test.each([
    [45, "45 min"],
    [60, "1 h"],
    [75, "1 h 15 min"],
  ])("formats %i minutes", (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });

  test.each([
    [65, "01:05"],
    [3_661, "01:01:01"],
    [-1, "00:00"],
  ])("formats %i timer seconds", (seconds, expected) => {
    expect(formatTimer(seconds)).toBe(expected);
  });

  test("prefers an active task over a pending task", () => {
    const tasks = [
      { id: 1, status: "pending", estimatedMinutes: 30 },
      { id: 2, status: "in_progress", estimatedMinutes: 30 },
    ];

    expect(
      findNextPendingTask(tasks as Parameters<typeof findNextPendingTask>[0]),
    ).toMatchObject({ id: 2 });
  });

  test("skips tasks without measurable duration", () => {
    const tasks = [
      { id: 1, status: "in_progress", estimatedMinutes: 0 },
      { id: 2, status: "pending", estimatedMinutes: 20 },
    ];

    expect(
      findNextPendingTask(tasks as Parameters<typeof findNextPendingTask>[0]),
    ).toMatchObject({ id: 2 });
  });
});
