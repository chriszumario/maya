import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { getNutritionEntriesFn } from "./server";

export async function getNutritionEntries(date: string, cursor?: string) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.nutrition, cacheTags.nutritionDate(date));
  const result = await getNutritionEntriesFn({
    data: { date, limit: 100, cursor },
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
