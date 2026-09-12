import * as v from "valibot";

import { AuthUserSchema } from "@/features/auth/schemas/auth.schema";
import { getAppSession } from "@/features/auth/server/auth-session.server";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { toPublicError } from "@/lib/server-error.server";
import { validatedOperation } from "@/lib/validated-operation";
import { PasswordFormSchema, ProfileFormSchema } from "./schemas";

const PasswordUpdatedSchema = v.object({
  status: v.literal("password_updated"),
});

async function settingsOperation<T>(
  operation: () => Promise<T>,
  message: string,
) {
  try {
    return { ok: true as const, data: await operation() };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error, message) };
  }
}

export const updateProfileFn = validatedOperation(
  ProfileFormSchema,
  async (data) => {
    const session = await getAppSession();
    const currentUser = session.data.user;
    if (!currentUser) {
      return {
        ok: false as const,
        error: {
          code: "UNAUTHENTICATED",
          message: "Tu sesión ha finalizado. Inicia sesión nuevamente.",
        },
      };
    }

    const emailChanged = data.email !== currentUser.email;
    if (emailChanged && !data.currentPassword) {
      return {
        ok: false as const,
        error: {
          code: "CURRENT_PASSWORD_REQUIRED",
          message: "Ingresa tu contraseña actual para cambiar el correo.",
        },
      };
    }
    if (data.name === currentUser.name && !emailChanged) {
      return { ok: true as const, data: currentUser };
    }

    return settingsOperation(async () => {
      const response = await authenticatedApiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          ...(emailChanged ? { currentPassword: data.currentPassword } : {}),
        }),
      });
      const user = v.parse(AuthUserSchema, response);
      await session.update({ user });
      return user;
    }, "No se pudo actualizar el perfil.");
  },
);

export const updatePasswordFn = validatedOperation(PasswordFormSchema, (data) =>
  settingsOperation(async () => {
    const response = await authenticatedApiFetch("/auth/password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });
    return v.parse(PasswordUpdatedSchema, response);
  }, "No se pudo actualizar la contraseña."),
);
