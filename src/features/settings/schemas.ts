import * as v from "valibot";
import { TimezoneSchema } from "@/features/auth/schemas/auth.schema";

const PasswordSchema = v.pipe(
  v.string(),
  v.nonEmpty("Ingresa tu contraseña actual."),
  v.maxLength(128, "La contraseña no puede superar 128 caracteres."),
);

export const ProfileFormSchema = v.object({
  timezone: TimezoneSchema,
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(2, "El nombre debe tener al menos 2 caracteres."),
    v.maxLength(100, "El nombre no puede superar 100 caracteres."),
  ),
  email: v.pipe(
    v.string(),
    v.trim(),
    v.email("Ingresa un correo electrónico válido."),
    v.maxLength(254, "El correo no puede superar 254 caracteres."),
    v.toLowerCase(),
  ),
  currentPassword: v.pipe(
    v.string(),
    v.maxLength(128, "La contraseña no puede superar 128 caracteres."),
  ),
});

export const PasswordFormSchema = v.pipe(
  v.object({
    currentPassword: PasswordSchema,
    newPassword: v.pipe(
      v.string(),
      v.minLength(12, "La nueva contraseña debe tener al menos 12 caracteres."),
      v.maxLength(128, "La nueva contraseña no puede superar 128 caracteres."),
    ),
    confirmPassword: v.pipe(
      v.string(),
      v.nonEmpty("Confirma la nueva contraseña."),
      v.maxLength(128, "La contraseña no puede superar 128 caracteres."),
    ),
  }),
  v.forward(
    v.partialCheck(
      [["currentPassword"], ["newPassword"]],
      (input) => input.currentPassword !== input.newPassword,
      "La nueva contraseña debe ser diferente de la actual.",
    ),
    ["newPassword"],
  ),
  v.forward(
    v.partialCheck(
      [["newPassword"], ["confirmPassword"]],
      (input) => input.newPassword === input.confirmPassword,
      "Las contraseñas no coinciden.",
    ),
    ["confirmPassword"],
  ),
);
