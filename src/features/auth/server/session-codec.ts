import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import * as v from "valibot";

import type { AuthTokens, AuthUser } from "../model/auth";
import { AuthSessionSchema } from "../schemas/auth.schema";

export type AppSessionData = Partial<AuthTokens> & {
  user?: AuthUser;
  refreshBlocked?: boolean;
};

export const SESSION_COOKIE_NAME = "maya_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const MAX_SESSION_COOKIE_LENGTH = 3_800;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SessionEnvelopeSchema = v.object({
  expiresAt: v.pipe(v.number(), v.integer()),
  session: v.object({
    ...AuthSessionSchema.entries,
    refreshBlocked: v.optional(v.boolean()),
  }),
});

const DEVELOPMENT_SECRET = "maya-local-development-secret-change-me-2026";
const EXAMPLE_SECRET = "replace-with-a-random-secret-of-at-least-32-characters";

function encryptionKey() {
  const secret =
    process.env.SESSION_SECRET ??
    (process.env.NODE_ENV !== "production" ? DEVELOPMENT_SECRET : undefined);
  if (!secret) {
    throw new Error("SESSION_SECRET debe estar configurado en producción.");
  }
  if (
    process.env.NODE_ENV === "production" &&
    (secret.length < 32 ||
      secret === DEVELOPMENT_SECRET ||
      secret === EXAMPLE_SECRET)
  ) {
    throw new Error(
      "SESSION_SECRET debe tener al menos 32 caracteres y no ser un valor de ejemplo.",
    );
  }
  return createHash("sha256").update(secret).digest();
}

export function encodeSession(data: AppSessionData) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(
      JSON.stringify({
        expiresAt: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
        session: data,
      }),
      "utf8",
    ),
    cipher.final(),
  ]);

  const encoded = [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
  if (encoded.length > MAX_SESSION_COOKIE_LENGTH) {
    throw new Error("La sesión supera el tamaño seguro de una cookie.");
  }
  return encoded;
}

export function decodeSession(value?: string): AppSessionData {
  if (!value || value.length > MAX_SESSION_COOKIE_LENGTH) return {};

  let envelope: v.InferOutput<typeof SessionEnvelopeSchema>;
  try {
    const parts = value.split(".");
    if (
      parts.length !== 3 ||
      parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))
    )
      return {};
    const [iv, tag, encrypted] = parts.map((part) =>
      Buffer.from(part, "base64url"),
    );
    if (
      iv?.length !== IV_LENGTH ||
      tag?.length !== AUTH_TAG_LENGTH ||
      !encrypted?.length
    )
      return {};

    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(tag);
    const decoded: unknown = JSON.parse(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
        "utf8",
      ),
    );
    const parsed = v.safeParse(SessionEnvelopeSchema, decoded);
    if (!parsed.success) return {};
    envelope = parsed.output;
  } catch {
    return {};
  }

  // Keep the clock read outside malformed-cookie handling so framework
  // prerendering interrupts cannot be mistaken for an invalid session.
  return envelope.expiresAt > Math.floor(Date.now() / 1000)
    ? envelope.session
    : {};
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
