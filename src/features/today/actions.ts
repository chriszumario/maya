"use server";

import { updateTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
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
  const refreshedToday = await getTodayTasks();

  if (refreshedToday.ok) {
    updateTag(cacheTags.dashboard);
    updateTag(cacheTags.insights);
    updateTag(cacheTags.trends);
  }

  return {
    ok: true as const,
    data: {
      taskLog: result.data,
      today: refreshedToday.ok ? refreshedToday.data : null,
      syncError: refreshedToday.ok ? null : refreshedToday.error.message,
    },
  };
}
