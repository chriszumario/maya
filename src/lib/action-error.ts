export class ActionError extends Error {
  readonly code: string;
  readonly requestId?: string;
  readonly retryAfter?: number;

  constructor(
    message: string,
    code: string,
    details: { requestId?: string; retryAfter?: number } = {},
  ) {
    super(message);
    this.name = "ActionError";
    this.code = code;
    this.requestId = details.requestId;
    this.retryAfter = details.retryAfter;
  }
}

export function throwActionError(error: {
  message: string;
  code: string;
  requestId?: string;
  retryAfter?: number;
}): never {
  throw new ActionError(error.message, error.code, error);
}
