"use server";

import { updateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import * as operations from "./server";

async function mutate<T extends { ok: boolean }>(operation: () => Promise<T>) {
  const result = await operation();
  if (result.ok) {
    updateTag(cacheTags.nutrition);
    updateTag(cacheTags.dashboard);
    updateTag(cacheTags.trends);
  }
  return result;
}

export async function estimateCaloriesFn(
  input: Parameters<typeof operations.estimateCaloriesFn>[0],
) {
  return operations.estimateCaloriesFn(input);
}
export async function createNutritionEntryFn(
  input: Parameters<typeof operations.createNutritionEntryFn>[0],
) {
  return mutate(() => operations.createNutritionEntryFn(input));
}
export async function updateNutritionEntryFn(
  input: Parameters<typeof operations.updateNutritionEntryFn>[0],
) {
  return mutate(() => operations.updateNutritionEntryFn(input));
}
export async function deleteNutritionEntryFn(
  input: Parameters<typeof operations.deleteNutritionEntryFn>[0],
) {
  return mutate(() => operations.deleteNutritionEntryFn(input));
}
