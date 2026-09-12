import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import type { DashboardSummaryInput } from "./schemas/dashboard.schema";
import { getDashboardSummaryFn } from "./server/dashboard";

export async function getDashboardSummary(input: DashboardSummaryInput = {}) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.dashboard);
  const result = await getDashboardSummaryFn({ data: input });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
