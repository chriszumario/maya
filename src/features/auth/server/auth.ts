import "server-only";
import * as v from "valibot";
import { ApiClientError, apiFetch } from "@/lib/api-client.server";
import { validatedOperation } from "@/lib/validated-operation";
import type { AuthActionResult } from "../model/auth";
import {
  type AuthSession,
  AuthSessionSchema,
  type AuthUser,
  LoginSchema,
  RegisterSchema,
} from "../schemas/auth.schema";
import { getAppSession } from "./auth-session.server";

const RegisterResponseSchema = v.object({
  status: v.literal("pending_approval"),
});

function toAuthError(error: unknown) {
  if (error instanceof ApiClientError) {
    return { code: error.code, message: error.message };
  }
  return {
    code: "UNEXPECTED_ERROR",
    message: "Ocurrió un error inesperado. Intenta nuevamente.",
  };
}

export const loginFn = validatedOperation(
  LoginSchema,
  async (data): Promise<AuthActionResult<AuthUser>> => {
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        cache: "no-store",
        body: JSON.stringify(data),
      });
      const authSession: AuthSession = v.parse(AuthSessionSchema, response);
      const session = await getAppSession();
      await session.update(authSession);
      return { ok: true, data: authSession.user };
    } catch (error) {
      return { ok: false, error: toAuthError(error) };
    }
  },
);

export const registerFn = validatedOperation(
  RegisterSchema,
  async (data): Promise<AuthActionResult<{ status: "pending_approval" }>> => {
    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { ok: true, data: v.parse(RegisterResponseSchema, response) };
    } catch (error) {
      return { ok: false, error: toAuthError(error) };
    }
  },
);

export async function logoutFn() {
  const session = await getAppSession();
  const { refreshToken } = session.data;

  try {
    if (refreshToken) {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // El cierre local siempre debe completarse aunque la API no esté disponible.
  } finally {
    await session.clear();
  }

  return { status: "logged_out" as const };
}
