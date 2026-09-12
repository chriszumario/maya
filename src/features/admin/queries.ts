import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import { findCursorItem } from "@/lib/cursor-pagination";
import {
  getAdminStatsFn,
  getAdminUsersFn,
  getPendingUsersFn,
  getUserSessionsFn,
} from "./server";

export async function getAdminStats() {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.admin);
  const result = await getAdminStatsFn();
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
export async function getAdminUsers(cursor?: string) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.adminUsers);
  const result = await getAdminUsersFn({ data: { limit: 100, cursor } });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
export async function getAdminUser(userId: number) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.adminUser(userId));
  return findCursorItem(
    async (cursor) => {
      const result = await getAdminUsersFn({ data: { limit: 100, cursor } });
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    (user) => user.id === userId,
  );
}
export async function getPendingUsers(cursor?: string) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.adminPending);
  const result = await getPendingUsersFn({ data: { limit: 100, cursor } });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
export async function getUserSessions(userId: number) {
  "use cache: private";
  cacheLife("minutes");
  cacheTag(cacheTags.adminUser(userId));
  const result = await getUserSessionsFn({ data: { userId } });
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
