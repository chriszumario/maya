"use server";

import { updateTag } from "next/cache";
import * as v from "valibot";
import { cacheTags } from "@/lib/cache-tags";
import { AdminUserIdInputSchema } from "./schemas";
import * as operations from "./server";

function updateAdminTags(userId?: number) {
  updateTag(cacheTags.admin);
  updateTag(cacheTags.adminUsers);
  updateTag(cacheTags.adminPending);
  if (userId) updateTag(cacheTags.adminUser(userId));
}

export async function approveUserFn(
  input: Parameters<typeof operations.approveUserFn>[0],
) {
  const result = await operations.approveUserFn(input);
  if (result.ok) updateAdminTags(result.data.id);
  return result;
}
export async function rejectUserFn(
  input: Parameters<typeof operations.rejectUserFn>[0],
) {
  const result = await operations.rejectUserFn(input);
  if (result.ok) updateAdminTags(result.data.id);
  return result;
}
export async function setAdminFn(
  input: Parameters<typeof operations.setAdminFn>[0],
) {
  const result = await operations.setAdminFn(input);
  if (result.ok) updateAdminTags(result.data.id);
  return result;
}
export async function revokeUserSessionsFn(
  input: Parameters<typeof operations.revokeUserSessionsFn>[0],
) {
  const result = await operations.revokeUserSessionsFn(input);
  if (result.ok) {
    const parsed = v.safeParse(
      v.object({ data: AdminUserIdInputSchema }),
      input,
    );
    updateAdminTags(parsed.success ? parsed.output.data.userId : undefined);
  }
  return result;
}
