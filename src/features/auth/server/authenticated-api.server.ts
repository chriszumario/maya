import "server-only";
import { redirect } from "next/navigation";
import { ApiClientError, apiFetch } from "@/lib/api-client.server";
import { getAppSession } from "./auth-session.server";

export async function authenticatedApiFetch(
  path: string,
  options: RequestInit = {},
) {
  const session = await getAppSession();
  const { accessToken, refreshToken } = session.data;
  if (!accessToken || !refreshToken) {
    throw new ApiClientError({
      code: "UNAUTHENTICATED",
      message: "Tu sesión ha finalizado. Inicia sesión nuevamente.",
      status: 401,
    });
  }

  try {
    return await apiFetch(path, { ...options, token: accessToken });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      redirect("/auth/session-expired");
    }
    throw error;
  }
}
