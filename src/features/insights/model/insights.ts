import type { GoalStatus } from "@/lib/schemas/maya.schema";

export const goalStatusLabels: Record<GoalStatus, string> = {
  pending: "Pendientes",
  in_progress: "En progreso",
  completed: "Completadas",
  cancelled: "Canceladas",
};

export const priorityLabels = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
} as const;

export const severityLabels = {
  info: "Información",
  warning: "Advertencia",
  critical: "Crítica",
} as const;

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
}

export function formatShortDate(localDate: string) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${localDate}T12:00:00`));
}

export function sumSeries(series: Array<{ value: number }>) {
  return series.reduce((total, point) => total + point.value, 0);
}
