import * as v from "valibot";

const EmailSchema = v.pipe(
  v.string("Ingresa tu correo electrónico."),
  v.trim(),
  v.nonEmpty("Ingresa tu correo electrónico."),
  v.email("Ingresa un correo electrónico válido."),
  v.maxLength(254, "El correo no puede superar 254 caracteres."),
  v.toLowerCase(),
);

export const LoginSchema = v.object({
  email: EmailSchema,
  password: v.pipe(
    v.string("Ingresa tu contraseña."),
    v.nonEmpty("Ingresa tu contraseña."),
    v.maxLength(128, "La contraseña no puede superar 128 caracteres."),
  ),
});

export const RegisterFormSchema = v.object({
  name: v.pipe(
    v.string("Ingresa tu nombre."),
    v.trim(),
    v.minLength(2, "El nombre debe tener al menos 2 caracteres."),
    v.maxLength(100, "El nombre no puede superar 100 caracteres."),
  ),
  email: EmailSchema,
  password: v.pipe(
    v.string("Crea una contraseña."),
    v.minLength(12, "La contraseña debe tener al menos 12 caracteres."),
    v.maxLength(128, "La contraseña no puede superar 128 caracteres."),
  ),
});

export const TimezoneSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("No se pudo detectar tu zona horaria."),
  v.check((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "La zona horaria no es válida."),
);

export const RegisterSchema = v.object({
  ...RegisterFormSchema.entries,
  timezone: TimezoneSchema,
});

export const AuthUserSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  email: v.pipe(v.string(), v.email(), v.maxLength(254)),
  isAdmin: v.boolean(),
  timezone: TimezoneSchema,
});

export const AuthTokensSchema = v.object({
  accessToken: v.pipe(
    v.string(),
    v.maxLength(3_072),
    v.regex(
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
      "El access token no tiene formato JWT.",
    ),
  ),
  refreshToken: v.pipe(v.string(), v.minLength(32), v.maxLength(128)),
});

export const AuthSessionSchema = v.object({
  ...AuthTokensSchema.entries,
  user: AuthUserSchema,
});

export type LoginInput = v.InferInput<typeof LoginSchema>;
export type LoginOutput = v.InferOutput<typeof LoginSchema>;
export type RegisterFormOutput = v.InferOutput<typeof RegisterFormSchema>;
export type RegisterInput = v.InferInput<typeof RegisterSchema>;
export type RegisterOutput = v.InferOutput<typeof RegisterSchema>;
export type AuthUser = v.InferOutput<typeof AuthUserSchema>;
export type AuthTokens = v.InferOutput<typeof AuthTokensSchema>;
export type AuthSession = v.InferOutput<typeof AuthSessionSchema>;
