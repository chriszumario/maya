export class ActionError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ActionError";
    this.code = code;
  }
}

export function throwActionError(error: {
  message: string;
  code: string;
}): never {
  throw new ActionError(error.message, error.code);
}
