import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { getTodayTasksFn } from "./server";

export async function getTodayTasks() {
  "use cache: private";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(cacheTags.today);
  const result = await getTodayTasksFn();
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
