import type { MealType } from "../schemas";

export const mealLabels: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
  drink: "Bebida",
};

export const meals = Object.entries(mealLabels).map(([value, label]) => ({
  value: value as MealType,
  label,
}));

export function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftLocalDate(localDate: string, days: number) {
  const date = new Date(`${localDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDate(date);
}

export function formatNutritionDate(localDate: string) {
  return new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${localDate}T12:00:00`));
}
