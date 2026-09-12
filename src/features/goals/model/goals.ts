import type { GoalCategory, GoalPriority, GoalStatus } from "../schemas";

export const categoryLabels: Record<GoalCategory, string> = {
  growth: "Crecimiento",
  experience: "Experiencia",
  contribution: "Contribución",
};
export const priorityLabels: Record<GoalPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};
export const statusLabels: Record<GoalStatus, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};
