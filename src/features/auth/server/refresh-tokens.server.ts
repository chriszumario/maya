import "server-only";

import { createHash } from "node:crypto";
import * as v from "valibot";

import { ApiClientError, apiFetch } from "@/lib/api-client.server";
import type { AuthTokens } from "../model/auth";
import { AuthTokensSchema } from "../schemas/auth.schema";

type RefreshEntry = {
  promise: Promise<AuthTokens>;
  expiresAt: number;
};

const REFRESH_RESULT_TTL_MS = 10_000;
const REFRESH_RETRY_DELAY_MS = 250;
const REFRESH_REQUEST_TIMEOUT_MS = 7_000;
const REFRESH_RETRY_DEADLINE_MS = 9_500;
const refreshes = new Map<string, RefreshEntry>();

function uncertainRefresh() {
  return new ApiClientError({
    code: "REFRESH_OUTCOME_UNCERTAIN",
    message:
      "No se pudo confirmar la renovación. Inicia sesión nuevamente por seguridad.",
    status: 503,
  });
}

function idempotencyKey(refreshToken: string) {
  return createHash("sha256").update(refreshToken, "utf8").digest("base64url");
}

async function requestTokens(refreshToken: string, key: string) {
  const deadline = Date.now() + REFRESH_RETRY_DEADLINE_MS;
  const request = () => {
    const remainingMs = deadline - Date.now();
    return apiFetch("/auth/refresh", {
      method: "POST",
      cache: "no-store",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(
        Math.min(REFRESH_REQUEST_TIMEOUT_MS, remainingMs),
      ),
    }).then((response) => {
      const parsed = v.safeParse(AuthTokensSchema, response);
      if (!parsed.success) throw uncertainRefresh();
      return parsed.output;
    });
  };

  try {
    return await request();
  } catch (error) {
    if (
      !(error instanceof ApiClientError) ||
      !["NETWORK_ERROR", "REFRESH_ROTATION_IN_PROGRESS"].includes(error.code)
    ) {
      throw error;
    }
    if (Date.now() + REFRESH_RETRY_DELAY_MS >= deadline)
      throw uncertainRefresh();
    await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
    try {
      return await request();
    } catch (retryError) {
      // Once a response may have been lost, never replay this token later from
      // a new request after the server's ten-second recovery window.
      if (
        retryError instanceof ApiClientError &&
        ["INVALID_REFRESH_TOKEN", "REFRESH_TOKEN_REUSE"].includes(
          retryError.code,
        )
      )
        throw retryError;
      throw uncertainRefresh();
    }
  }
}

function removeExpiredRefreshes(now: number) {
  for (const [token, entry] of refreshes) {
    if (entry.expiresAt <= now) refreshes.delete(token);
  }
}

export async function refreshTokens(
  refreshToken: string,
  revalidate = false,
): Promise<AuthTokens> {
  const now = Date.now();
  removeExpiredRefreshes(now);
  const key = idempotencyKey(refreshToken);
  // A security-version change can invalidate a cached access JWT. Ask the API
  // to reissue it through its replay contract, while still sharing in-flight work.
  if (revalidate && refreshes.get(key)?.expiresAt !== Number.POSITIVE_INFINITY)
    refreshes.delete(key);

  let entry = refreshes.get(key);
  if (!entry) {
    const newEntry: RefreshEntry = {
      promise: requestTokens(refreshToken, key),
      expiresAt: Number.POSITIVE_INFINITY,
    };
    entry = newEntry;
    refreshes.set(key, newEntry);

    newEntry.promise.then(
      () => {
        if (refreshes.get(key) === newEntry) {
          newEntry.expiresAt = now + REFRESH_RETRY_DEADLINE_MS;
          setTimeout(() => {
            if (refreshes.get(key) === newEntry) {
              refreshes.delete(key);
            }
          }, REFRESH_RESULT_TTL_MS);
        }
      },
      (error) => {
        if (refreshes.get(key) === newEntry) {
          if (
            error instanceof ApiClientError &&
            [
              "INVALID_REFRESH_TOKEN",
              "REFRESH_TOKEN_REUSE",
              "REFRESH_OUTCOME_UNCERTAIN",
            ].includes(error.code)
          ) {
            newEntry.expiresAt = Date.now() + REFRESH_RESULT_TTL_MS;
            setTimeout(() => {
              if (refreshes.get(key) === newEntry) {
                refreshes.delete(key);
              }
            }, REFRESH_RESULT_TTL_MS);
          } else {
            refreshes.delete(key);
          }
        }
      },
    );
  }

  return entry.promise;
}
