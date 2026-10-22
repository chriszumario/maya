// @vitest-environment happy-dom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateTodayTaskFn: vi.fn(),
  refreshTodayTasksFn: vi.fn(),
}));
vi.mock("@/features/today/actions", () => mocks);
vi.mock("@/features/today/timer-feedback", () => ({
  playTimerTone: vi.fn(),
  primeTimerFeedback: vi.fn(),
  showBackgroundNotification: vi.fn(),
}));

import { TodayView } from "@/features/today/components/today-view";

afterEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

test("does not carry a persisted timer into a new server date", async () => {
  const initialData = {
    date: "2026-10-20",
    tasks: [
      {
        id: 1,
        title: "Leer",
        goalTitle: "Aprender",
        estimatedMinutes: 30,
        startTime: "09:00",
        status: "in_progress" as const,
        durationMinutes: 1,
      },
    ],
  };
  const { rerender } = render(
    <TodayView userId={1} initialData={initialData} />,
  );
  expect(
    window.localStorage.getItem("maya:today-timer:1:2026-10-20"),
  ).not.toBeNull();
  rerender(
    <TodayView userId={1} initialData={{ date: "2026-10-21", tasks: [] }} />,
  );
  expect(
    window.localStorage.getItem("maya:today-timer:1:2026-10-20"),
  ).toBeNull();
  expect(
    window.localStorage.getItem("maya:today-timer:1:2026-10-21"),
  ).toBeNull();
});

test("does not retry failed automatic completion until the user acts", async () => {
  vi.useFakeTimers();
  mocks.updateTodayTaskFn.mockResolvedValue({
    ok: false,
    error: { code: "UNAVAILABLE", message: "Servicio no disponible" },
  });
  window.localStorage.setItem(
    "maya:today-timer:1:2026-09-19",
    JSON.stringify({
      version: 2,
      taskId: 1,
      accumulatedSeconds: 60,
      startedAt: null,
      running: false,
      warningIssued: false,
      completionSignaled: false,
    }),
  );
  await act(async () => {
    render(
      <TodayView
        userId={1}
        initialData={{
          date: "2026-09-19",
          tasks: [
            {
              id: 1,
              title: "Leer",
              goalTitle: "Aprender",
              estimatedMinutes: 1,
              startTime: "09:00",
              status: "in_progress",
              durationMinutes: 0,
            },
          ],
        }}
      />,
    );
  });
  expect(mocks.updateTodayTaskFn).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000);
  });
  expect(mocks.updateTodayTaskFn).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Servicio no disponible")).toBeDefined();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
  });
  expect(mocks.updateTodayTaskFn).toHaveBeenCalledTimes(2);
});
