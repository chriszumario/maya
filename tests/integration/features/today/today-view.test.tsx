// @vitest-environment happy-dom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

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

beforeEach(() => vi.clearAllMocks());

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
  fireEvent(document, new Event("visibilitychange"));
  fireEvent(window, new Event("pageshow"));
  expect(mocks.refreshTodayTasksFn).not.toHaveBeenCalled();
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

test("reconciles midnight while the running timer renders every second", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-20T23:59:30Z"));
  mocks.refreshTodayTasksFn.mockResolvedValue({
    ok: true,
    data: { date: "2026-10-21", tasks: [] },
  });
  window.localStorage.setItem(
    "maya:today-timer:1:2026-10-20",
    JSON.stringify({
      version: 2,
      taskId: 1,
      accumulatedSeconds: 0,
      startedAt: Date.now(),
      running: true,
      warningIssued: false,
      completionSignaled: false,
    }),
  );
  render(
    <TodayView
      userId={1}
      initialData={{
        date: "2026-10-20",
        tasks: [
          {
            id: 1,
            title: "Leer",
            goalTitle: "Aprender",
            estimatedMinutes: 30,
            startTime: "23:59",
            status: "in_progress",
            durationMinutes: 0,
          },
        ],
      }}
    />,
  );

  for (let second = 0; second < 60; second++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
  }

  expect(mocks.refreshTodayTasksFn).toHaveBeenCalledOnce();
  expect(screen.getByText("Tu agenda está despejada")).toBeDefined();
  expect(
    window.localStorage.getItem("maya:today-timer:1:2026-10-20"),
  ).toBeNull();
  expect(mocks.updateTodayTaskFn).not.toHaveBeenCalled();
});

test.each(["success", "failure"])(
  "keeps the new agenda when yesterday's pending write ends in %s",
  async (outcome) => {
    const task = {
      id: 1,
      title: "Leer",
      goalTitle: "Aprender",
      estimatedMinutes: 30,
      startTime: "09:00",
      status: "in_progress" as const,
      durationMinutes: 1,
    };
    const pending = Promise.withResolvers<unknown>();
    mocks.updateTodayTaskFn.mockReturnValue(pending.promise);
    const previous = { date: "2026-10-20", tasks: [task] };
    const { rerender } = render(
      <TodayView userId={1} initialData={previous} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
    });
    expect(mocks.updateTodayTaskFn).toHaveBeenCalledWith({
      data: {
        taskId: 1,
        status: "completed",
        durationMinutes: 1,
        expectedDate: previous.date,
      },
    });
    rerender(
      <TodayView userId={1} initialData={{ date: "2026-10-21", tasks: [] }} />,
    );
    await act(async () => {
      pending.resolve(
        outcome === "success"
          ? {
              ok: true,
              data: {
                taskLog: { taskId: 1, status: "completed", durationMinutes: 1 },
                today: {
                  ...previous,
                  tasks: [{ ...task, status: "completed" }],
                },
                syncError: null,
              },
            }
          : {
              ok: false,
              error: { code: "AGENDA_DATE_CHANGED", message: "El día cambió." },
            },
      );
    });
    expect(screen.getByText("Tu agenda está despejada")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Finalizar" })).toBeNull();
    expect(
      window.localStorage.getItem("maya:today-timer:1:2026-10-21"),
    ).toBeNull();
    expect(mocks.updateTodayTaskFn).toHaveBeenCalledOnce();
  },
);

test("shows a failed reopen without an unhandled rejection or changing the completed task", async () => {
  mocks.updateTodayTaskFn.mockResolvedValue({
    ok: false,
    error: { code: "GOAL_TERMINAL", message: "La meta ya está completada." },
  });
  render(
    <TodayView
      userId={1}
      initialData={{
        date: "2026-10-20",
        tasks: [
          {
            id: 1,
            title: "Leer",
            goalTitle: "Aprender",
            estimatedMinutes: 30,
            startTime: "09:00",
            status: "completed",
            durationMinutes: 30,
          },
        ],
      }}
    />,
  );
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Reabrir Leer" }));
  });
  expect(screen.getByText("La meta ya está completada.")).toBeDefined();
  expect(screen.getByRole("button", { name: "Reabrir Leer" })).toBeDefined();
});
