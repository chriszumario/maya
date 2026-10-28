import "server-only";
import * as v from "valibot";

const ServerEnvironmentSchema = v.object({
  API_URL: v.optional(
    v.pipe(v.string(), v.trim(), v.url("API_URL debe ser una URL válida.")),
    "http://localhost:4000",
  ),
});

const ApiErrorSchema = v.object({
  error: v.object({
    code: v.string(),
    message: v.string(),
  }),
});

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly retryAfter?: number;

  constructor({
    code,
    message,
    status,
    requestId,
    retryAfter,
  }: {
    code: string;
    message: string;
    status: number;
    requestId?: string;
    retryAfter?: number;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }
}

function getApiBaseUrl() {
  const apiUrl = v
    .parse(ServerEnvironmentSchema, process.env)
    .API_URL.replace(/\/$/, "");
  const url = new URL(apiUrl);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "API_URL debe ser un origen HTTP sin prefijos de ruta, credenciales, query ni fragmento.",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  ) {
    throw new Error("API_URL debe usar HTTPS en producción.");
  }
  return apiUrl;
}

const safeMessagesByStatus: Record<number, string> = {
  400: "La solicitud no es válida.",
  401: "Tu sesión ha finalizado. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta operación.",
  404: "No se encontró el recurso solicitado.",
  409: "La operación entra en conflicto con el estado actual.",
  422: "La solicitud contiene datos no válidos.",
  429: "Se alcanzó el límite de solicitudes. Intenta más tarde.",
};

const safeMessagesByCode: Record<string, string> = {
  EMAIL_IN_USE: "Ya existe una cuenta con ese correo electrónico.",
  INVALID_CREDENTIALS: "El correo o la contraseña no son correctos.",
  PENDING_APPROVAL: "Tu cuenta todavía está pendiente de aprobación.",
  INVALID_PASSWORD: "La contraseña actual no es correcta.",
  PASSWORD_CHANGED:
    "La contraseña cambió en otra sesión. Vuelve a iniciar sesión.",
  GOAL_TERMINAL: "La meta ya está completada o cancelada. Recarga sus datos.",
  TASK_UPDATE_CONFLICT:
    "La tarea cambió en otra sesión. Recarga antes de volver a guardar.",
  TASK_LOG_UPDATE_CONFLICT:
    "La ejecución cambió en otra sesión. Recarga la agenda.",
  TASK_NOT_ACTIVE: "La tarea ya no está activa. Recarga la agenda.",
  GOAL_NOT_IN_PROGRESS: "La meta ya no está en curso. Recarga la agenda.",
  TASK_NOT_SCHEDULED:
    "La tarea no está programada para hoy. Recarga la agenda.",
  AI_NOT_CONFIGURED: "La asistencia de IA no está disponible temporalmente.",
  AI_EMPTY_RESPONSE: "La IA no devolvió una sugerencia. Conservamos tu texto.",
  AI_INVALID_RESPONSE:
    "La sugerencia de IA no es válida. Conservamos tu texto.",
  AI_PROVIDER_ERROR:
    "No se pudo consultar la IA. Intenta nuevamente más tarde.",
  RATE_LIMIT_UNAVAILABLE:
    "El servicio no está disponible temporalmente. Conservamos tu sesión.",
};

function safeApiMessage(status: number, code: string) {
  return (
    safeMessagesByCode[code] ??
    safeMessagesByStatus[status] ??
    (status >= 500
      ? "El servicio no está disponible temporalmente."
      : "No se pudo completar la solicitud.")
  );
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch (error) {
    // Invalid JSON is validated by the caller; a failed body stream is a
    // transport failure, including when headers arrived before the timeout.
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<unknown> {
  const { token, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set("Accept", "application/json");

  if (requestOptions.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  let body: unknown;
  try {
    const timeoutSignal = AbortSignal.timeout(
      path.startsWith("/ai/") ? 20_000 : 15_000,
    );
    const signal = requestOptions.signal
      ? AbortSignal.any([requestOptions.signal, timeoutSignal])
      : timeoutSignal;
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...requestOptions,
      cache: "no-store",
      redirect: "error",
      headers,
      signal,
    });
    body = ["HEAD", "OPTIONS"].includes(
      requestOptions.method?.toUpperCase() ?? "GET",
    )
      ? null
      : await readJson(response);
  } catch (error) {
    console.error("Maya API request failed", {
      path,
      method: requestOptions.method ?? "GET",
      cause: error instanceof Error ? error.name : "UnknownError",
    });
    throw new ApiClientError({
      code: "NETWORK_ERROR",
      message: "El servicio no está disponible temporalmente.",
      status: 503,
    });
  }

  if (!response.ok) {
    const result = v.safeParse(ApiErrorSchema, body);
    const code = result.success ? result.output.error.code : "HTTP_ERROR";
    console.error("Maya API returned an error", {
      path,
      method: requestOptions.method ?? "GET",
      status: response.status,
      code,
    });
    throw new ApiClientError({
      code,
      message: safeApiMessage(response.status, code),
      status: response.status,
      requestId: response.headers.get("X-Request-Id") ?? undefined,
      retryAfter: /^\d+$/.test(response.headers.get("Retry-After") ?? "")
        ? Number(response.headers.get("Retry-After"))
        : undefined,
    });
  }

  return body;
}
