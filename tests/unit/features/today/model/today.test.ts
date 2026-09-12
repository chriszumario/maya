import { describe, expect, test } from "vitest";

import { updateTodayTaskData } from "@/features/today/model/today";

const today = {
  date: "2026-08-28",
  tasks: [
    {
      id: 7,
      title: "Tarea 7",
      estimatedMinutes: 30,
      startTime: "08:00",
      goalTitle: "Meta",
      status: "pending" as const,
      durationMinutes: 0,
    },
    {
      id: 8,
      title: "Tarea 8",
      estimatedMinutes: 30,
      startTime: "09:00",
      goalTitle: "Meta",
      status: "pending" as const,
      durationMinutes: 0,
    },
  ],
};

describe("today optimistic state", () => {
  test("updates only the selected task", () => {
    const updated = updateTodayTaskData(today, 7, "in_progress", 3);

    expect(updated.tasks[0]).toMatchObject({
      status: "in_progress",
      durationMinutes: 3,
    });
    expect(updated.tasks[1]).toEqual(today.tasks[1]);
    expect(today.tasks[0].status).toBe("pending");
  });
});
