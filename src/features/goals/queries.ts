import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { getGoalFn, getGoalReviewsFn, getGoalsFn } from "./server";

export async function getGoals(cursor?: string) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.goals);
  const result = await getGoalsFn({ data: { limit: 100, cursor } });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export async function getGoal(id: number) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.goal(id));
  const result = await getGoalFn({ data: { id } });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export async function getGoalReviews(goalId: number, limit = 100) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.goal(goalId));
  const items = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const result = await getGoalReviewsFn({
      data: { goalId, limit: Math.min(limit, 100), cursor },
    });
    if (!result.ok) return result;
    items.push(...result.data.items);
    const nextCursor = result.data.nextCursor ?? undefined;
    if (nextCursor && seenCursors.has(nextCursor)) {
      return {
        ok: false as const,
        error: {
          code: "INVALID_PAGINATION",
          message: "No se pudo completar el historial de revisiones.",
        },
      };
    }
    if (nextCursor) seenCursors.add(nextCursor);
    cursor = nextCursor;
  } while (cursor && items.length < limit);
  return { ok: true as const, data: items.slice(0, limit) };
}
