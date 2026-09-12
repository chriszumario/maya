"use server";

import { updateTag } from "next/cache";
import * as v from "valibot";
import { cacheTags } from "@/lib/cache-tags";
import { IdSchema } from "@/lib/schemas/maya.schema";
import { validatedOperation } from "@/lib/validated-operation";
import { getGoalReviews } from "./queries";
import { GoalReviewsInputSchema } from "./schemas";
import * as operations from "./server";

function updateTags(...tags: string[]) {
  for (const tag of tags) updateTag(tag);
}

export async function createGoalFn(
  input: Parameters<typeof operations.createGoalFn>[0],
) {
  const result = await operations.createGoalFn(input);
  if (result.ok) {
    updateTags(
      cacheTags.goals,
      cacheTags.dashboard,
      cacheTags.insights,
      cacheTags.trends,
    );
  }
  return result;
}
export async function updateGoalFn(
  input: Parameters<typeof operations.updateGoalFn>[0],
) {
  const result = await operations.updateGoalFn(input);
  if (result.ok) {
    updateTags(
      cacheTags.goals,
      cacheTags.goal(result.data.id),
      cacheTags.today,
      cacheTags.dashboard,
      cacheTags.insights,
      cacheTags.trends,
    );
  }
  return result;
}
export async function updateGoalStatusFn(
  input: Parameters<typeof operations.updateGoalStatusFn>[0],
) {
  const result = await operations.updateGoalStatusFn(input);
  if (result.ok) {
    updateTags(
      cacheTags.goals,
      cacheTags.goal(result.data.id),
      cacheTags.today,
      cacheTags.dashboard,
      cacheTags.insights,
      cacheTags.trends,
    );
  }
  return result;
}
export async function deleteGoalFn(
  input: Parameters<typeof operations.deleteGoalFn>[0],
) {
  const result = await operations.deleteGoalFn(input);
  if (result.ok) {
    updateTags(
      cacheTags.goals,
      cacheTags.goal(result.data.id),
      cacheTags.today,
      cacheTags.dashboard,
      cacheTags.insights,
      cacheTags.trends,
    );
  }
  return result;
}
export async function createGoalReviewFn(
  input: Parameters<typeof operations.createGoalReviewFn>[0],
) {
  const result = await operations.createGoalReviewFn(input);
  if (result.ok) {
    updateTags(
      cacheTags.goals,
      cacheTags.goal(result.data.goalId),
      cacheTags.today,
      cacheTags.dashboard,
      cacheTags.insights,
      cacheTags.trends,
    );
  }
  return result;
}
export async function improveGoalFn(
  input: Parameters<typeof operations.improveGoalFn>[0],
) {
  return operations.improveGoalFn(input);
}
export async function createTaskFn(
  input: Parameters<typeof operations.createTaskFn>[0],
) {
  const result = await operations.createTaskFn(input);
  if (result.ok) {
    updateTags(
      cacheTags.goal(result.data.goalId),
      cacheTags.today,
      cacheTags.dashboard,
      cacheTags.trends,
    );
  }
  return result;
}
export async function updateTaskFn(
  input: Parameters<typeof operations.updateTaskFn>[0],
) {
  const result = await operations.updateTaskFn(input);
  if (result.ok) {
    updateTags(
      cacheTags.goal(result.data.goalId),
      cacheTags.today,
      cacheTags.dashboard,
      cacheTags.trends,
    );
  }
  return result;
}
export async function setTaskActiveFn(
  input: Parameters<typeof operations.setTaskActiveFn>[0],
) {
  const result = await operations.setTaskActiveFn(input);
  if (result.ok) {
    updateTags(
      cacheTags.goal(result.data.goalId),
      cacheTags.today,
      cacheTags.dashboard,
      cacheTags.trends,
    );
  }
  return result;
}
const deleteTask = validatedOperation(
  v.object({ taskId: IdSchema, goalId: IdSchema }),
  async ({ goalId, taskId }) => {
    const result = await operations.deleteTaskFn({ data: { taskId } });
    if (result.ok) {
      updateTags(
        cacheTags.goal(goalId),
        cacheTags.today,
        cacheTags.dashboard,
        cacheTags.trends,
      );
    }
    return result;
  },
);

export async function deleteTaskFn(input: Parameters<typeof deleteTask>[0]) {
  return deleteTask(input);
}
const readGoalReviews = validatedOperation(
  GoalReviewsInputSchema,
  ({ goalId, limit }) => getGoalReviews(goalId, limit),
);

export async function getGoalReviewsFn(
  input: Parameters<typeof readGoalReviews>[0],
) {
  return readGoalReviews(input);
}
