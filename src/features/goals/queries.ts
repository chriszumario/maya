import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import {
  getGoalFn,
  getGoalReviewsFn,
  getGoalsFn,
  getGoalTasksFn,
} from "./server";

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

export async function getGoalTasks(goalId: number, cursor?: string) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.goal(goalId));
  const result = await getGoalTasksFn({ data: { goalId, limit: 20, cursor } });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

export async function getGoalReviews(
  goalId: number,
  limit = 20,
  cursor?: string,
) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.goal(goalId));
  return getGoalReviewsFn({ data: { goalId, limit, cursor } });
}
