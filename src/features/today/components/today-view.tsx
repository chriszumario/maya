"use client";

import {
  CheckIcon,
  CircleAlertIcon,
  CircleIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerMutation as useMutation } from "@/hooks/use-server-mutation";
import { throwActionError } from "@/lib/action-error";
import { readStoredValue, writeStoredValue } from "@/lib/browser-storage";
import { localDateInTimeZone } from "@/lib/local-date";
import { cn } from "@/lib/utils";
import { refreshTodayTasksFn, updateTodayTaskFn } from "../actions";
import {
  createTaskTimer,
  finishTaskTimer,
  getElapsedSeconds,
  getRecordableSeconds,
  pauseTaskTimer,
  restoreTaskTimer,
  resumeTaskTimer,
  type TaskTimerState,
} from "../model/timer";
import {
  findNextPendingTask,
  formatMinutes,
  formatTimer,
  formatTodayDate,
  todayTaskStatusLabels,
  updateTodayTaskData,
} from "../model/today";
import type { TaskLogStatus, TodayTask, TodayTasks } from "../schemas";
import {
  playTimerTone,
  primeTimerFeedback,
  showBackgroundNotification,
} from "../timer-feedback";

function timerStorageKey(userId: number, date: string) {
  return `maya:today-timer:${userId}:${date}`;
}

function autoCompleteStorageKey(userId: number) {
  return `maya:today-auto-complete:${userId}`;
}

function boundedMinutes(seconds: number) {
  return Math.min(1_440, Math.ceil(seconds / 60));
}

export function TodayView({
  initialData,
  userId,
  timezone = "UTC",
}: {
  initialData: TodayTasks;
  userId: number;
  timezone?: string;
}) {
  const [data, setData] = useState(initialData);
  const tasks = data.tasks;
  const [timer, setTimer] = useState<TaskTimerState | null>(null);
  const [timerReady, setTimerReady] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [autoCompleteOverrides, setAutoCompleteOverrides] = useState<
    Record<string, boolean>
  >({});
  const [autoCompleteReady, setAutoCompleteReady] = useState(false);
  const [completionNotice, setCompletionNotice] = useState<{
    title: string;
    minutes: number;
  }>();
  const [syncWarning, setSyncWarning] = useState<string>();
  const warningFeedbackRef = useRef<number | null>(null);
  const completionFeedbackRef = useRef<number | null>(null);
  const completionInFlightRef = useRef<number | null>(null);
  const continueInFlightRef = useRef<number | null>(null);
  const timerKey = timerStorageKey(userId, data.date);
  const autoCompleteKey = autoCompleteStorageKey(userId);
  const snapshotDateRef = useRef(initialData.date);

  useEffect(() => {
    if (snapshotDateRef.current !== initialData.date) {
      writeStoredValue(timerStorageKey(userId, snapshotDateRef.current), null);
      setTimer(null);
      setTimerReady(false);
      setCompletionNotice(undefined);
      completionInFlightRef.current = null;
      snapshotDateRef.current = initialData.date;
    }
    setData(initialData);
  }, [initialData, userId]);

  const updateTask = useMutation({
    mutationFn: async ({
      task,
      status,
      durationMinutes,
    }: {
      task: TodayTask;
      status: TaskLogStatus;
      durationMinutes: number;
    }) => {
      const result = await updateTodayTaskFn({
        data: {
          taskId: task.id,
          status,
          durationMinutes,
          expectedDate: data.date,
        },
      });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onMutate: async ({ task, status, durationMinutes }) => {
      const previousToday = data;
      setSyncWarning(undefined);
      setData((current) =>
        updateTodayTaskData(current, task.id, status, durationMinutes),
      );
      return { previousToday };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousToday) {
        setData(context.previousToday);
      }
    },
    onSuccess: ({ syncError, taskLog, today }) => {
      setSyncWarning(syncError ?? undefined);
      setData(
        (current) =>
          today ??
          updateTodayTaskData(
            current,
            taskLog.taskId,
            taskLog.status,
            taskLog.durationMinutes,
          ),
      );
    },
  });

  const refreshToday = useMutation({
    mutationFn: async () => {
      const result = await refreshTodayTasksFn();
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onSuccess: (snapshot) => {
      if (snapshot.date !== data.date) {
        writeStoredValue(timerKey, null);
        setTimer(null);
        setCompletionNotice(undefined);
        completionInFlightRef.current = null;
      }
      setData(snapshot);
    },
  });

  const completedCount = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const completionRate = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;
  const plannedMinutes = tasks.reduce(
    (total, task) => total + task.estimatedMinutes,
    0,
  );
  const activeTask = timer
    ? (tasks.find(
        (task) =>
          task.id === timer.taskId &&
          task.status === "in_progress" &&
          task.estimatedMinutes > 0,
      ) ?? null)
    : null;
  const targetSeconds = activeTask ? activeTask.estimatedMinutes * 60 : 0;
  const elapsedSeconds =
    timer && activeTask ? getElapsedSeconds(timer, clockNow) : 0;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const overtimeSeconds = Math.max(0, elapsedSeconds - targetSeconds);
  const autoCompleteEnabled = activeTask
    ? (autoCompleteOverrides[String(activeTask.id)] ?? true)
    : true;
  const showFiveMinuteWarning = Boolean(
    activeTask &&
      timer &&
      targetSeconds > 300 &&
      remainingSeconds > 0 &&
      remainingSeconds <= 300,
  );
  const nextTask = findNextPendingTask(tasks);
  const busyTaskId = updateTask.variables?.task.id;
  const interactionPending = updateTask.isPending || refreshToday.isPending;
  const interactionError = updateTask.error ?? refreshToday.error;

  useEffect(() => {
    try {
      const stored = readStoredValue(autoCompleteKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        setAutoCompleteOverrides(
          Object.fromEntries(
            Object.entries(parsed).filter(
              (entry): entry is [string, boolean] =>
                typeof entry[1] === "boolean",
            ),
          ),
        );
      }
    } catch {
      writeStoredValue(autoCompleteKey, null);
    } finally {
      setAutoCompleteReady(true);
    }
  }, [autoCompleteKey]);

  useEffect(() => {
    if (timerReady) return;
    const serverActiveTasks = tasks.filter(
      (task) => task.status === "in_progress" && task.estimatedMinutes > 0,
    );
    const serverActiveTask = serverActiveTasks[0];
    const stored = readStoredValue(timerKey);
    if (stored) {
      try {
        const restored = restoreTaskTimer(
          JSON.parse(stored),
          serverActiveTasks.map((task) => task.id),
        );
        if (restored) {
          setTimer(restored);
          setClockNow(Date.now());
          setTimerReady(true);
          return;
        }
      } catch {
        writeStoredValue(timerKey, null);
      }
    }
    setTimer(
      serverActiveTask
        ? {
            version: 2,
            taskId: serverActiveTask.id,
            accumulatedSeconds: serverActiveTask.durationMinutes * 60,
            startedAt: null,
            running: false,
            warningIssued: false,
            completionSignaled: false,
          }
        : null,
    );
    setTimerReady(true);
  }, [tasks, timerKey, timerReady]);

  useEffect(() => {
    if (!timerReady) return;
    writeStoredValue(timerKey, timer ? JSON.stringify(timer) : null);
  }, [timer, timerKey, timerReady]);

  useEffect(() => {
    if (!timer?.running) return;
    setClockNow(Date.now());
    const interval = window.setInterval(() => setClockNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [timer?.running]);

  useEffect(() => {
    const syncClock = () => setClockNow(Date.now());
    document.addEventListener("visibilitychange", syncClock);
    window.addEventListener("pageshow", syncClock);
    return () => {
      document.removeEventListener("visibilitychange", syncClock);
      window.removeEventListener("pageshow", syncClock);
    };
  }, []);

  const reconcile = useEffectEvent(() => {
    if (
      document.visibilityState !== "hidden" &&
      !updateTask.isPending &&
      !refreshToday.isPending
    )
      refreshToday.mutate();
  });
  const checkDate = useEffectEvent(() => {
    if (localDateInTimeZone(timezone) !== data.date) reconcile();
  });

  useEffect(() => {
    document.addEventListener("visibilitychange", reconcile);
    window.addEventListener("pageshow", reconcile);
    const interval = window.setInterval(checkDate, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", reconcile);
      window.removeEventListener("pageshow", reconcile);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (
      !showFiveMinuteWarning ||
      !timer ||
      !activeTask ||
      timer.warningIssued ||
      warningFeedbackRef.current === activeTask.id
    ) {
      return;
    }
    warningFeedbackRef.current = activeTask.id;
    setTimer((current) =>
      current?.taskId === activeTask.id
        ? { ...current, warningIssued: true }
        : current,
    );
    void playTimerTone("warning");
    showBackgroundNotification(
      "Quedan 5 minutos",
      `Estás por terminar “${activeTask.title}”.`,
      `maya-timer-warning-${activeTask.id}`,
    );
  }, [activeTask, showFiveMinuteWarning, timer]);

  useEffect(() => {
    if (
      !timer ||
      !activeTask ||
      !autoCompleteReady ||
      remainingSeconds > 0 ||
      refreshToday.isPending ||
      document.visibilityState === "hidden"
    ) {
      return;
    }

    if (
      !timer.completionSignaled &&
      completionFeedbackRef.current !== activeTask.id
    ) {
      completionFeedbackRef.current = activeTask.id;
      setTimer((current) =>
        current?.taskId === activeTask.id
          ? autoCompleteEnabled
            ? finishTaskTimer(current, targetSeconds)
            : { ...current, completionSignaled: true }
          : current,
      );
      void playTimerTone("complete");
      showBackgroundNotification(
        "Tiempo completado",
        `“${activeTask.title}” llegó a ${activeTask.estimatedMinutes} minutos.`,
        `maya-timer-complete-${activeTask.id}`,
      );
    }

    if (
      !autoCompleteEnabled ||
      completionInFlightRef.current === activeTask.id
    ) {
      return;
    }

    completionInFlightRef.current = activeTask.id;
    void updateTask
      .mutateAsync({
        task: activeTask,
        status: "completed",
        durationMinutes: activeTask.estimatedMinutes,
      })
      .then(() => {
        setCompletionNotice({
          title: activeTask.title,
          minutes: activeTask.estimatedMinutes,
        });
        setTimer(null);
      })
      .catch(() => undefined);
  }, [
    activeTask,
    autoCompleteEnabled,
    autoCompleteReady,
    remainingSeconds,
    targetSeconds,
    timer,
    updateTask,
    refreshToday.isPending,
  ]);

  async function changeStatus(
    task: TodayTask,
    status: TaskLogStatus,
    durationMinutes = task.durationMinutes,
  ) {
    await updateTask.mutateAsync({ task, status, durationMinutes });
  }

  async function startTask(task: TodayTask) {
    if (task.estimatedMinutes <= 0) return;
    void primeTimerFeedback();
    const previousTimer = timer;
    const now = Date.now();
    setCompletionNotice(undefined);
    warningFeedbackRef.current = null;
    completionFeedbackRef.current = null;
    completionInFlightRef.current = null;
    setClockNow(now);
    setTimer(createTaskTimer(task.id, task.durationMinutes * 60, now));
    try {
      await changeStatus(task, "in_progress");
    } catch {
      setTimer((current) =>
        current?.taskId === task.id ? previousTimer : current,
      );
    }
  }

  async function pauseTimer() {
    if (!activeTask || !timer) return;
    const pausedTimer = pauseTaskTimer(timer, Date.now());
    const durationMinutes = boundedMinutes(pausedTimer.accumulatedSeconds);
    setTimer(pausedTimer);
    try {
      await changeStatus(activeTask, "in_progress", durationMinutes);
    } catch {
      setTimer((current) =>
        current?.taskId === activeTask.id ? timer : current,
      );
    }
  }

  async function continueTimer() {
    if (!timer || !activeTask || continueInFlightRef.current !== null) return;
    const taskId = activeTask.id;
    const requestDate = data.date;
    continueInFlightRef.current = taskId;
    void primeTimerFeedback();
    try {
      const refreshed = await refreshToday.mutateAsync();
      const serverTask =
        refreshed.date === requestDate
          ? refreshed.tasks.find(
              (task) => task.id === taskId && task.status === "in_progress",
            )
          : undefined;

      setData(refreshed);
      if (!serverTask) {
        if (refreshed.date !== requestDate) {
          writeStoredValue(timerKey, null);
        }
        setTimer((current) => (current?.taskId === taskId ? null : current));
        return;
      }

      const now = Date.now();
      setClockNow(now);
      setTimer((current) =>
        current?.taskId === taskId
          ? resumeTaskTimer(current, now, serverTask.durationMinutes * 60)
          : current,
      );
    } catch {
      // La mutación conserva el error para mostrarlo y el timer sigue pausado.
    } finally {
      continueInFlightRef.current = null;
    }
  }

  async function completeTask(task: TodayTask) {
    const hasActiveTimer = timer?.taskId === task.id;
    const seconds = hasActiveTimer
      ? getRecordableSeconds(
          getElapsedSeconds(timer, Date.now()),
          task.estimatedMinutes * 60,
          autoCompleteEnabled,
        )
      : task.durationMinutes * 60;
    if (hasActiveTimer) setTimer(null);
    try {
      await changeStatus(task, "completed", boundedMinutes(seconds));
    } catch {
      if (hasActiveTimer) setTimer(timer);
    }
  }

  async function reopenTask(task: TodayTask) {
    await changeStatus(task, "in_progress");
    if (timer?.taskId === task.id) setTimer(null);
  }

  function setTaskAutoComplete(taskId: number, checked: boolean) {
    const next = { ...autoCompleteOverrides, [String(taskId)]: checked };
    writeStoredValue(autoCompleteKey, JSON.stringify(next));
    setAutoCompleteOverrides(next);
  }

  return (
    <>
      <PageHeader
        eyebrow={formatTodayDate(data.date)}
        title="Una cosa a la vez"
        description="Ejecuta las tareas programadas y registra su estado real, sin añadir ruido a tu agenda."
      />

      {interactionError ? (
        <Alert variant="destructive" className="mb-5">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>No pudimos sincronizar el cambio</AlertTitle>
          <AlertDescription>{interactionError.message}</AlertDescription>
        </Alert>
      ) : null}
      {syncWarning ? (
        <Alert className="mb-5">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>Cambio guardado, sincronización pendiente</AlertTitle>
          <AlertDescription>{syncWarning}</AlertDescription>
        </Alert>
      ) : null}
      {completionNotice ? (
        <Alert className="mb-5" aria-live="polite">
          <CheckIcon aria-hidden="true" />
          <AlertTitle>Tarea completada automáticamente</AlertTitle>
          <AlertDescription>
            {completionNotice.title} · {completionNotice.minutes} min
            registrados.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Agenda de hoy</CardTitle>
            <CardDescription>
              {completedCount} de {tasks.length} tareas completadas ·{" "}
              {formatMinutes(plannedMinutes)} planificados
            </CardDescription>
            <CardAction>
              <Badge variant="outline">{completionRate}%</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col">
            {tasks.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CheckIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Tu agenda está despejada</EmptyTitle>
                  <EmptyDescription>
                    No hay tareas activas programadas para hoy.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ol>
                {tasks.map((task, index) => {
                  const isBusy = updateTask.isPending && busyTaskId === task.id;
                  const isActive = activeTask?.id === task.id;
                  return (
                    <li key={task.id}>
                      <article className="grid grid-cols-[3.25rem_2.25rem_minmax(0,1fr)] gap-x-3 py-4 sm:grid-cols-[3.5rem_2.25rem_minmax(0,1fr)_auto]">
                        <time
                          dateTime={`${data.date}T${task.startTime}`}
                          className="pt-2 text-xs font-medium tabular-nums text-muted-foreground"
                        >
                          {task.startTime}
                        </time>
                        <div
                          className={cn(
                            "relative flex justify-center",
                            index < tasks.length - 1 &&
                              "after:absolute after:top-9 after:-bottom-4 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-border",
                          )}
                        >
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant={
                                    task.status === "completed"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="icon-sm"
                                  className="relative z-10"
                                  disabled={interactionPending}
                                  onClick={() =>
                                    void (task.status === "completed"
                                      ? reopenTask(task)
                                      : completeTask(task))
                                  }
                                  aria-label={
                                    task.status === "completed"
                                      ? `Reabrir ${task.title}`
                                      : `Marcar ${task.title} como completada`
                                  }
                                />
                              }
                            >
                              {isBusy ? (
                                <Spinner />
                              ) : task.status === "completed" ? (
                                <CheckIcon aria-hidden="true" />
                              ) : (
                                <CircleIcon aria-hidden="true" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              {task.status === "completed"
                                ? "Reabrir tarea"
                                : "Marcar como completada"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2
                              className={cn(
                                "font-semibold",
                                task.status === "completed" &&
                                  "text-muted-foreground line-through",
                              )}
                            >
                              {task.title}
                            </h2>
                            {task.status === "in_progress" ? (
                              <Badge>
                                {todayTaskStatusLabels[task.status]}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.goalTitle} ·{" "}
                            {formatMinutes(task.estimatedMinutes)} estimados
                            {task.durationMinutes > 0
                              ? ` · ${formatMinutes(task.durationMinutes)} registrados`
                              : ""}
                          </p>
                        </div>
                        <div className="col-start-3 mt-3 flex flex-wrap gap-2 sm:col-start-4 sm:row-start-1 sm:mt-0 sm:justify-end">
                          {task.status !== "completed" &&
                          !isActive &&
                          task.estimatedMinutes > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                interactionPending || Boolean(activeTask)
                              }
                              onClick={() => void startTask(task)}
                            >
                              <PlayIcon
                                data-icon="inline-start"
                                aria-hidden="true"
                              />
                              {task.status === "in_progress"
                                ? "Reanudar"
                                : "Iniciar"}
                            </Button>
                          ) : null}
                          {isActive && timer?.running ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={interactionPending}
                              onClick={() => void pauseTimer()}
                            >
                              <PauseIcon
                                data-icon="inline-start"
                                aria-hidden="true"
                              />
                              Pausar
                            </Button>
                          ) : null}
                          {isActive && !timer?.running ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={interactionPending}
                              onClick={() => void continueTimer()}
                            >
                              <PlayIcon
                                data-icon="inline-start"
                                aria-hidden="true"
                              />
                              Continuar
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="focus-card">
            <CardHeader>
              <Badge variant="secondary">
                {activeTask
                  ? remainingSeconds === 0
                    ? autoCompleteEnabled
                      ? "Tiempo completado"
                      : "Tiempo excedente"
                    : timer?.running
                      ? "Sesión activa"
                      : "Sesión pausada"
                  : "Sin sesión activa"}
              </Badge>
              <CardTitle className="mt-3 font-heading text-2xl">
                {activeTask?.title ??
                  nextTask?.title ??
                  "Tu agenda está completa"}
              </CardTitle>
              <CardDescription>
                {activeTask?.goalTitle ??
                  nextTask?.goalTitle ??
                  "Disfruta el espacio que recuperaste"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <p
                className="font-heading text-5xl font-semibold tabular-nums"
                role="timer"
                aria-label={
                  activeTask
                    ? overtimeSeconds > 0
                      ? `${formatTimer(overtimeSeconds)} excedentes`
                      : `${formatTimer(remainingSeconds)} restantes`
                    : undefined
                }
              >
                {activeTask && overtimeSeconds > 0 ? "+" : ""}
                {formatTimer(
                  activeTask && overtimeSeconds > 0
                    ? overtimeSeconds
                    : activeTask
                      ? remainingSeconds
                      : 0,
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeTask
                  ? `${formatMinutes(activeTask.estimatedMinutes)} establecidos · inicio programado ${activeTask.startTime}`
                  : nextTask
                    ? `Siguiente a las ${nextTask.startTime}`
                    : "No quedan tareas pendientes"}
              </p>
              <Progress
                value={
                  activeTask
                    ? Math.min(100, (elapsedSeconds / targetSeconds) * 100)
                    : completionRate
                }
                aria-label="Progreso de la sesión"
              >
                <ProgressLabel>Progreso</ProgressLabel>
                <ProgressValue>
                  {(_, value) => `${Math.round(value ?? 0)}%`}
                </ProgressValue>
              </Progress>
              {activeTask ? (
                <Field orientation="horizontal">
                  <div className="flex-1">
                    <FieldLabel htmlFor={`auto-complete-${activeTask.id}`}>
                      Completar automáticamente
                    </FieldLabel>
                    <FieldDescription>
                      {autoCompleteEnabled
                        ? `Al llegar a cero se registrarán exactamente ${activeTask.estimatedMinutes} minutos.`
                        : "Al llegar a cero el temporizador seguirá registrando el tiempo excedente."}
                    </FieldDescription>
                  </div>
                  <Switch
                    id={`auto-complete-${activeTask.id}`}
                    checked={autoCompleteEnabled}
                    disabled={!autoCompleteReady || interactionPending}
                    onCheckedChange={(checked) =>
                      setTaskAutoComplete(activeTask.id, checked)
                    }
                  />
                </Field>
              ) : null}
            </CardContent>
            <CardFooter className="gap-2 border-t">
              {activeTask ? (
                <>
                  <Button
                    className="flex-1"
                    disabled={interactionPending}
                    onClick={() => {
                      if (timer?.running) void pauseTimer();
                      else void continueTimer();
                    }}
                  >
                    {timer?.running ? (
                      <PauseIcon data-icon="inline-start" aria-hidden="true" />
                    ) : (
                      <PlayIcon data-icon="inline-start" aria-hidden="true" />
                    )}
                    {timer?.running ? "Pausar" : "Continuar"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={interactionPending}
                    onClick={() => void completeTask(activeTask)}
                  >
                    Finalizar
                  </Button>
                </>
              ) : nextTask ? (
                <Button
                  className="w-full"
                  disabled={interactionPending}
                  onClick={() => void startTask(nextTask)}
                >
                  <PlayIcon data-icon="inline-start" aria-hidden="true" />
                  Iniciar siguiente
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
