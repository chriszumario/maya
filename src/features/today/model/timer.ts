export type TaskTimerState = {
  version: 2;
  taskId: number;
  accumulatedSeconds: number;
  startedAt: number | null;
  running: boolean;
  warningIssued: boolean;
  completionSignaled: boolean;
};

export function getElapsedSeconds(timer: TaskTimerState, now: number) {
  const runningSeconds =
    timer.running && timer.startedAt !== null
      ? Math.max(0, Math.floor((now - timer.startedAt) / 1_000))
      : 0;
  return Math.max(0, timer.accumulatedSeconds + runningSeconds);
}

export function getRecordableSeconds(
  elapsedSeconds: number,
  targetSeconds: number,
  autoCompleteEnabled: boolean,
) {
  const elapsed = Math.max(0, elapsedSeconds);
  return autoCompleteEnabled
    ? Math.min(elapsed, Math.max(0, targetSeconds))
    : elapsed;
}

export function createTaskTimer(
  taskId: number,
  elapsedSeconds: number,
  now: number,
): TaskTimerState {
  return {
    version: 2,
    taskId,
    accumulatedSeconds: finiteNonNegativeSeconds(elapsedSeconds),
    startedAt: now,
    running: true,
    warningIssued: false,
    completionSignaled: false,
  };
}

export function pauseTaskTimer(
  timer: TaskTimerState,
  now: number,
): TaskTimerState {
  return {
    ...timer,
    accumulatedSeconds: getElapsedSeconds(timer, now),
    startedAt: null,
    running: false,
  };
}

export function resumeTaskTimer(
  timer: TaskTimerState,
  now: number,
  minimumElapsedSeconds = 0,
): TaskTimerState {
  const accumulatedSeconds = Math.max(
    getElapsedSeconds(timer, now),
    finiteNonNegativeSeconds(minimumElapsedSeconds),
  );
  return {
    ...timer,
    accumulatedSeconds,
    startedAt: now,
    running: true,
  };
}

export function finishTaskTimer(
  timer: TaskTimerState,
  limitSeconds: number,
): TaskTimerState {
  return {
    ...timer,
    accumulatedSeconds: finiteNonNegativeSeconds(limitSeconds),
    startedAt: null,
    running: false,
    completionSignaled: true,
  };
}

export function restoreTaskTimer(
  value: unknown,
  activeTaskIds: readonly number[],
): TaskTimerState | null {
  if (!value || typeof value !== "object") return null;
  const stored = value as Partial<TaskTimerState> & {
    elapsedSeconds?: unknown;
  };
  if (
    typeof stored.taskId !== "number" ||
    !Number.isInteger(stored.taskId) ||
    !activeTaskIds.includes(stored.taskId)
  ) {
    return null;
  }
  const taskId = stored.taskId;

  if (
    stored.version === 2 &&
    isFiniteNonNegativeNumber(stored.accumulatedSeconds) &&
    typeof stored.running === "boolean"
  ) {
    return {
      version: 2,
      taskId,
      accumulatedSeconds: Math.max(0, stored.accumulatedSeconds),
      startedAt:
        stored.running && typeof stored.startedAt === "number"
          ? Number.isFinite(stored.startedAt)
            ? stored.startedAt
            : null
          : null,
      running:
        stored.running &&
        typeof stored.startedAt === "number" &&
        Number.isFinite(stored.startedAt),
      warningIssued: stored.warningIssued === true,
      completionSignaled: stored.completionSignaled === true,
    };
  }

  if (isFiniteNonNegativeNumber(stored.elapsedSeconds)) {
    return {
      version: 2,
      taskId,
      accumulatedSeconds: Math.max(0, stored.elapsedSeconds),
      startedAt: null,
      running: false,
      warningIssued: false,
      completionSignaled: false,
    };
  }

  return null;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function finiteNonNegativeSeconds(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
