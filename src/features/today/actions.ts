"use server";

import { updateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { toPublicError } from "@/lib/server-error.server";
import { getTodayTasks as readTodayTasks } from "./queries";
import type { TodayTasks } from "./schemas";
import {
  getTodayTasksFn as getTodayTasks,
  updateTodayTaskFn as updateTask,
} from "./server";

export async function refreshTodayTasksFn() {
  return getTodayTasks();
}

export async function updateTodayTaskFn(
  input: Parameters<typeof updateTask>[0],
) {
  const result = await updateTask(input);
  if (!result.ok) return result;

  updateTag(cacheTags.today);
  updateTag(cacheTags.dashboard);
  updateTag(cacheTags.insights);
  updateTag(cacheTags.trends);
  let today: TodayTasks | null = null;
  let syncError: string | null = null;
  try {
    // Share this read with the route render included in the action response.
    today = await readTodayTasks();
  } catch (error) {
    syncError = toPublicError(
      error,
      "No se pudo actualizar la agenda.",
    ).message;
  }

  return {
    ok: true as const,
    data: {
      taskLog: result.data,
      today,
      syncError,
    },
  };
}
