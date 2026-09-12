import * as v from "valibot";

export const IdSchema = v.pipe(v.number(), v.integer(), v.minValue(1));
export const CountSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
export const NonNegativeNumberSchema = v.pipe(v.number(), v.minValue(0));
export const CursorSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(1_024),
);
export const LocalDateSchema = v.pipe(
  v.string(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha local inválida."),
  v.check((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    );
  }, "Fecha local inválida."),
);

export const LocalTimeSchema = v.pipe(
  v.string(),
  v.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora local inválida."),
);

export function CursorPageSchema<TSchema extends v.GenericSchema>(
  itemSchema: TSchema,
) {
  return v.object({
    items: v.array(itemSchema),
    nextCursor: v.nullable(CursorSchema),
  });
}

export const GoalStatusSchema = v.picklist([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);
export const TaskLogStatusSchema = v.picklist(["in_progress", "completed"]);
export const MoodSchema = v.picklist([
  "excellent",
  "good",
  "neutral",
  "bad",
  "terrible",
]);
export const MealTypeSchema = v.picklist([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "drink",
]);

export type GoalStatus = v.InferOutput<typeof GoalStatusSchema>;
export type TaskLogStatus = v.InferOutput<typeof TaskLogStatusSchema>;
export type Mood = v.InferOutput<typeof MoodSchema>;
export type MealType = v.InferOutput<typeof MealTypeSchema>;
