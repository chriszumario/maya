"use server";

import { refresh, updateTag } from "next/cache";
import * as v from "valibot";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { ApiClientError } from "@/lib/api-client.server";
import { cacheTags } from "@/lib/cache-tags";
import { toPublicError } from "@/lib/server-error.server";
import { AdminUserIdInputSchema } from "./schemas";
import * as operations from "./server";

function updateAdminTags(userId?: number) {
  updateTag(cacheTags.admin);
  updateTag(cacheTags.adminUsers);
  updateTag(cacheTags.adminPending);
  if (userId) updateTag(cacheTags.adminUser(userId));
}

export async function refreshAdminStatsFn() {
  try {
    const user = await readSessionUser();
    if (!user?.isAdmin) {
      throw new ApiClientError({
        code: "FORBIDDEN",
        message: "No tienes permisos para realizar esta operación.",
        status: 403,
      });
    }
    updateTag(cacheTags.admin);
    refresh();
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: toPublicError(
        error,
        "No se pudo actualizar el estado del sistema.",
      ),
    };
  }
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
