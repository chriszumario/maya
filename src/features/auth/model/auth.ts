export type { AuthSession, AuthTokens, AuthUser } from "../schemas/auth.schema";

export type AuthError = {
  code: string;
  message: string;
  requestId?: string;
  retryAfter?: number;
};

export type AuthActionResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: AuthError };

export function getClientTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function safeInternalPath(value?: string) {
  if (!value?.startsWith("/")) return "/";

  try {
    const decoded = decodeURIComponent(value);
    const hasControlCharacter = Array.from(decoded).some(
      (character) => character.charCodeAt(0) < 32,
    );
    if (
      decoded.startsWith("//") ||
      decoded.includes("\\") ||
      hasControlCharacter
    ) {
      return "/";
    }
  } catch {
    return "/";
  }

  return value;
}
