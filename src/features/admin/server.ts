import "server-only";
import * as v from "valibot";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { ApiClientError } from "@/lib/api-client.server";
import { IdSchema } from "@/lib/schemas/maya.schema";
import { toPublicError } from "@/lib/server-error.server";
import { validatedOperation } from "@/lib/validated-operation";
import {
  ActiveSessionSchema,
  AdminStatsSchema,
  AdminUserIdInputSchema,
  AdminUserSchema,
  AdminUsersInputSchema,
  AdminUsersPageSchema,
  SetAdminInputSchema,
} from "./schemas";

const DeletedIdSchema = v.object({ id: IdSchema });
const SessionsRevokedSchema = v.object({
  status: v.literal("sessions_revoked"),
});

async function adminOperation<T>(operation: () => Promise<T>, message: string) {
  try {
    const user = await readSessionUser();
    if (!user?.isAdmin) {
      throw new ApiClientError({
        code: "FORBIDDEN",
        message: "No tienes permisos para realizar esta operación.",
        status: 403,
      });
    }
    return { ok: true as const, data: await operation() };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error, message) };
  }
}

export function getAdminStatsFn() {
  return adminOperation(async () => {
    const response = await authenticatedApiFetch("/admin/stats");
    return v.parse(AdminStatsSchema, response);
  }, "No se pudo obtener el estado administrativo.");
}

export const getAdminUsersFn = validatedOperation(
  AdminUsersInputSchema,
  (data) =>
    adminOperation(async () => {
      const search = new URLSearchParams({ limit: String(data.limit) });
      if (data.cursor) search.set("cursor", data.cursor);
      const response = await authenticatedApiFetch(`/admin/users?${search}`);
      return v.parse(AdminUsersPageSchema, response);
    }, "No se pudieron obtener los usuarios."),
);

export const getPendingUsersFn = validatedOperation(
  AdminUsersInputSchema,
  (data) =>
    adminOperation(async () => {
      const search = new URLSearchParams({ limit: String(data.limit) });
      if (data.cursor) search.set("cursor", data.cursor);
      const response = await authenticatedApiFetch(
        `/admin/users/pending?${search}`,
      );
      return v.parse(AdminUsersPageSchema, response);
    }, "No se pudieron obtener las solicitudes pendientes."),
);

export const getUserSessionsFn = validatedOperation(
  AdminUserIdInputSchema,
  (data) =>
    adminOperation(async () => {
      const response = await authenticatedApiFetch(
        `/admin/users/${data.userId}/sessions`,
      );
      return v.parse(v.array(ActiveSessionSchema), response);
    }, "No se pudieron obtener las sesiones."),
);

export const approveUserFn = validatedOperation(
  AdminUserIdInputSchema,
  (data) =>
    adminOperation(async () => {
      const response = await authenticatedApiFetch(
        `/admin/users/${data.userId}/approve`,
        { method: "POST" },
      );
      return v.parse(AdminUserSchema, response);
    }, "No se pudo aprobar el usuario."),
);

export const rejectUserFn = validatedOperation(AdminUserIdInputSchema, (data) =>
  adminOperation(async () => {
    const response = await authenticatedApiFetch(
      `/admin/users/${data.userId}/reject`,
      { method: "POST" },
    );
    return v.parse(DeletedIdSchema, response);
  }, "No se pudo rechazar el usuario."),
);

export const setAdminFn = validatedOperation(SetAdminInputSchema, (data) =>
  adminOperation(async () => {
    const response = await authenticatedApiFetch(
      `/admin/users/${data.userId}/admin`,
      { method: "PATCH", body: JSON.stringify({ isAdmin: data.isAdmin }) },
    );
    return v.parse(AdminUserSchema, response);
  }, "No se pudo cambiar el rol del usuario."),
);

export const revokeUserSessionsFn = validatedOperation(
  AdminUserIdInputSchema,
  (data) =>
    adminOperation(async () => {
      const response = await authenticatedApiFetch(
        `/admin/users/${data.userId}/sessions`,
        { method: "DELETE" },
      );
      return v.parse(SessionsRevokedSchema, response);
    }, "No se pudieron revocar las sesiones."),
);
