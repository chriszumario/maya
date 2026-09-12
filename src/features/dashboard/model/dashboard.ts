export function formatLongDate(localDate: string) {
  return new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${localDate}T12:00:00`));
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
}

export const goalStatusLabels = {
  pending: "Pendientes",
  inProgress: "En progreso",
  completed: "Completadas",
  cancelled: "Canceladas",
} as const;

export const taskStatusLabels = {
  pending: "Pendientes",
  inProgress: "En curso",
  completed: "Completadas",
} as const;
