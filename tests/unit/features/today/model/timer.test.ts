import { describe, expect, test } from "vitest";

import {
  createTaskTimer,
  finishTaskTimer,
  getElapsedSeconds,
  getRecordableSeconds,
  pauseTaskTimer,
  restoreTaskTimer,
  resumeTaskTimer,
} from "@/features/today/model/timer";

describe("today timer", () => {
  test("tracks elapsed wall-clock time", () => {
    const timer = createTaskTimer(7, 0, 1_000);

    expect(getElapsedSeconds(timer, 31_000)).toBe(30);
  });

  test("treats the Unix epoch as a valid start time", () => {
    expect(getElapsedSeconds(createTaskTimer(7, 0, 0), 5_000)).toBe(5);
  });

  test("pauses and resumes without losing time", () => {
    const paused = pauseTaskTimer(createTaskTimer(7, 10, 1_000), 6_000);
    const resumed = resumeTaskTimer(paused, 50_000);

    expect(getElapsedSeconds(resumed, 55_000)).toBe(20);
  });

  test("resumes from the server duration when it is greater", () => {
    const paused = pauseTaskTimer(createTaskTimer(7, 56, 1_000), 6_000);
    const resumed = resumeTaskTimer(paused, 50_000, 120);

    expect(getElapsedSeconds(resumed, 50_000)).toBe(120);
  });

  test("does not move backwards when the local duration is greater", () => {
    const paused = pauseTaskTimer(createTaskTimer(7, 235, 1_000), 6_000);
    const resumed = resumeTaskTimer(paused, 50_000, 180);

    expect(getElapsedSeconds(resumed, 50_000)).toBe(240);
  });

  test("includes locally elapsed time when reconciling a running timer", () => {
    const resumed = resumeTaskTimer(createTaskTimer(7, 100, 1_000), 6_000, 102);

    expect(getElapsedSeconds(resumed, 6_000)).toBe(105);
  });

  test("caps automatic completion but preserves overtime otherwise", () => {
    expect(getRecordableSeconds(95, 60, true)).toBe(60);
    expect(getRecordableSeconds(95, 60, false)).toBe(95);
  });

  test("restores legacy timers as paused", () => {
    const restored = restoreTaskTimer({ taskId: 7, elapsedSeconds: 42 }, [7]);

    expect(restored).toMatchObject({ accumulatedSeconds: 42, running: false });
  });

  test("restores the stored timer when multiple tasks are active", () => {
    const restored = restoreTaskTimer(
      {
        version: 2,
        taskId: 8,
        accumulatedSeconds: 10,
        startedAt: 1_000,
        running: true,
      },
      [7, 8],
    );

    expect(restored).toMatchObject({ taskId: 8, running: true });
    if (!restored) throw new Error("Expected the active timer to be restored.");
    expect(getElapsedSeconds(restored, 6_000)).toBe(15);
  });

  test("does not restore a timer for an inactive task", () => {
    expect(
      restoreTaskTimer(
        {
          version: 2,
          taskId: 8,
          accumulatedSeconds: 10,
          startedAt: 1_000,
          running: true,
        },
        [7],
      ),
    ).toBeNull();
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    "rejects an invalid persisted duration: %s",
    (accumulatedSeconds) => {
      expect(
        restoreTaskTimer(
          {
            version: 2,
            taskId: 7,
            accumulatedSeconds,
            startedAt: null,
            running: false,
          },
          [7],
        ),
      ).toBeNull();
    },
  );

  test("normalizes an invalid completion limit", () => {
    const finished = finishTaskTimer(createTaskTimer(7, 5, 1_000), Infinity);
    expect(finished.accumulatedSeconds).toBe(0);
  });
});
