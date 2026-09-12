import { unstable_rethrow } from "next/navigation";
import { ApiClientError } from "./api-client.server";

export function toPublicError(error: unknown, fallbackMessage: string) {
  unstable_rethrow(error);
  if (error instanceof ApiClientError) {
    return { code: error.code, message: error.message };
  }

  console.error("BFF operation failed", {
    cause: error instanceof Error ? error.name : "UnknownError",
  });
  return { code: "INVALID_UPSTREAM_RESPONSE", message: fallbackMessage };
}
