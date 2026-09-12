import type {
  TaskLogStatus,
  TodayTask,
  TodayTaskStatus,
  TodayTasks,
} from "../schemas";

export const todayTaskStatusLabels: Record<TodayTaskStatus, string> = {
  pending: "No iniciada",
  in_progress: "En curso",
  completed: "Completada",
};

export function formatTodayDate(localDate: string) {
  const formatted = new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${localDate}T12:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

export function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return hours > 0
    ? [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":")
    : [minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

export function findNextPendingTask(tasks: TodayTask[]) {
  const timedTasks = tasks.filter((task) => task.estimatedMinutes > 0);
  return (
    timedTasks.find((task) => task.status === "in_progress") ??
    timedTasks.find((task) => task.status === "pending")
  );
}

export function updateTodayTaskData(
  data: TodayTasks,
  taskId: number,
  status: TaskLogStatus,
  durationMinutes: number,
): TodayTasks {
  return {
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
            durationMinutes,
          }
        : task,
    ),
  };
}
