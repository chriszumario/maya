import * as v from "valibot";

const ServerEnvironmentSchema = v.object({
  API_URL: v.optional(
    v.pipe(v.string(), v.trim(), v.url("API_URL debe ser una URL válida.")),
    "http://localhost:3001/api",
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

  constructor({
    code,
    message,
    status,
  }: { code: string; message: string; status: number }) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

function getApiBaseUrl() {
  const apiUrl = v
    .parse(ServerEnvironmentSchema, process.env)
    .API_URL.replace(/\/$/, "");
  const url = new URL(apiUrl);
  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
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
  return response.json().catch(() => null);
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
  try {
    const timeoutSignal = AbortSignal.timeout(15_000);
    const signal = requestOptions.signal
      ? AbortSignal.any([requestOptions.signal, timeoutSignal])
      : timeoutSignal;
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...requestOptions,
      headers,
      signal,
    });
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

  const body = await readJson(response);
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
    });
  }

  return body;
}
