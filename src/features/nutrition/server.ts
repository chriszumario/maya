import * as v from "valibot";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { toPublicError } from "@/lib/server-error.server";
import { validatedOperation } from "@/lib/validated-operation";
import {
  CaloriesEstimateSchema,
  CreateNutritionInputSchema,
  DeletedNutritionSchema,
  EstimateCaloriesInputSchema,
  NutritionEntrySchema,
  NutritionIdInputSchema,
  NutritionListInputSchema,
  NutritionPageSchema,
  UpdateNutritionInputSchema,
} from "./schemas";

async function nutritionOperation<T>(
  operation: () => Promise<T>,
  message: string,
) {
  try {
    return { ok: true as const, data: await operation() };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error, message) };
  }
}

export const getNutritionEntriesFn = validatedOperation(
  NutritionListInputSchema,
  (data) =>
    nutritionOperation(async () => {
      const search = new URLSearchParams({
        date: data.date,
        limit: String(data.limit),
      });
      if (data.cursor) search.set("cursor", data.cursor);
      const response = await authenticatedApiFetch(`/nutrition?${search}`);
      return v.parse(NutritionPageSchema, response);
    }, "No se pudo obtener el registro de nutrición."),
);

export const estimateCaloriesFn = validatedOperation(
  EstimateCaloriesInputSchema,
  (data) =>
    nutritionOperation(async () => {
      const response = await authenticatedApiFetch("/ai/estimate-calories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return v.parse(CaloriesEstimateSchema, response);
    }, "No se pudieron estimar las calorías."),
);

export const createNutritionEntryFn = validatedOperation(
  CreateNutritionInputSchema,
  (data) =>
    nutritionOperation(async () => {
      const response = await authenticatedApiFetch("/nutrition", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return v.parse(NutritionEntrySchema, response);
    }, "No se pudo guardar el alimento."),
);

export const updateNutritionEntryFn = validatedOperation(
  UpdateNutritionInputSchema,
  (data) =>
    nutritionOperation(async () => {
      const { id, ...body } = data;
      const response = await authenticatedApiFetch(`/nutrition/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return v.parse(NutritionEntrySchema, response);
    }, "No se pudo actualizar el alimento."),
);

export const deleteNutritionEntryFn = validatedOperation(
  NutritionIdInputSchema,
  (data) =>
    nutritionOperation(async () => {
      const response = await authenticatedApiFetch(`/nutrition/${data.id}`, {
        method: "DELETE",
      });
      return v.parse(DeletedNutritionSchema, response);
    }, "No se pudo eliminar el alimento."),
);
