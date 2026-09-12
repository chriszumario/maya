import * as v from "valibot";

import {
  CursorPageSchema,
  CursorSchema,
  IdSchema,
  LocalDateSchema,
  MealTypeSchema,
} from "@/lib/schemas/maya.schema";

const QuantitySchema = v.pipe(v.number(), v.gtValue(0), v.maxValue(1_000_000));
const UnitSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Indica la unidad."),
  v.maxLength(50),
);
const CaloriesSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(0),
  v.maxValue(100_000),
);
const RequiredNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Escribe el alimento o la preparación."),
  v.maxLength(200, "El nombre no puede superar 200 caracteres."),
);
const NutritionFieldsSchema = v.object({
  mealType: MealTypeSchema,
  name: RequiredNameSchema,
  quantity: QuantitySchema,
  unit: UnitSchema,
  calories: CaloriesSchema,
});

const RequiredQuantityInputSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Indica la cantidad."),
  v.toNumber("La cantidad debe ser un número."),
  v.finite("La cantidad debe ser un número válido."),
  v.gtValue(0, "La cantidad debe ser mayor que cero."),
  v.maxValue(1_000_000, "La cantidad es demasiado grande."),
);
const RequiredUnitInputSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Indica la unidad."),
  v.maxLength(50, "La unidad no puede superar 50 caracteres."),
);
const CaloriesInputSchema = v.pipe(
  v.string(),
  v.regex(/^\d+$/, "Las calorías deben ser un número entero."),
  v.toNumber(),
  v.integer(),
  v.minValue(0),
  v.maxValue(100_000),
);

export const NutritionFormSchema = v.object({
  mealType: MealTypeSchema,
  name: RequiredNameSchema,
  quantity: RequiredQuantityInputSchema,
  unit: RequiredUnitInputSchema,
  calories: CaloriesInputSchema,
});

export const EstimateCaloriesInputSchema = v.object({
  name: RequiredNameSchema,
  quantity: v.pipe(v.number(), v.gtValue(0), v.maxValue(1_000_000)),
  unit: RequiredUnitInputSchema,
  mealType: v.optional(MealTypeSchema),
});
const NutrientSchema = v.pipe(v.number(), v.integer(), v.minValue(0));
export const CaloriesEstimateSchema = v.object({
  calories: NutrientSchema,
});

export const NutritionEntrySchema = v.object({
  id: IdSchema,
  userId: IdSchema,
  localDate: LocalDateSchema,
  ...NutritionFieldsSchema.entries,
  createdAt: v.string(),
  updatedAt: v.string(),
});

export const NutritionListInputSchema = v.object({
  date: LocalDateSchema,
  limit: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
    20,
  ),
  cursor: v.optional(CursorSchema),
});
export const NutritionPageSchema = CursorPageSchema(NutritionEntrySchema);
export const CreateNutritionInputSchema = v.object({
  ...NutritionFieldsSchema.entries,
});
export const UpdateNutritionInputSchema = v.pipe(
  v.object({
    id: IdSchema,
    mealType: v.optional(MealTypeSchema),
    name: v.optional(RequiredNameSchema),
    quantity: v.optional(QuantitySchema),
    unit: v.optional(UnitSchema),
    calories: v.optional(CaloriesSchema),
  }),
  v.check(
    (input) => Object.keys(input).some((key) => key !== "id"),
    "Indica al menos un campo para actualizar.",
  ),
);
export const NutritionIdInputSchema = v.object({ id: IdSchema });
export const DeletedNutritionSchema = v.object({ id: IdSchema });

export type NutritionEntry = v.InferOutput<typeof NutritionEntrySchema>;
export type MealType = v.InferOutput<typeof MealTypeSchema>;
