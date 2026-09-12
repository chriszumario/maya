import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import type { TrendsInput } from "./schemas/insights.schema";
import { getDashboardTrendsFn, getInsightsFn } from "./server/insights";

export async function getInsights() {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.insights);
  const result = await getInsightsFn();
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
export async function getDashboardTrends(input: TrendsInput = { days: 30 }) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.trends);
  const result = await getDashboardTrendsFn({ data: input });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
