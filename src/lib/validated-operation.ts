import * as v from "valibot";

export type ValidationFailure = {
  ok: false;
  error: { code: "VALIDATION_ERROR"; message: string };
};

export function validatedOperation<TSchema extends v.GenericSchema, TResult>(
  schema: TSchema,
  operation: (data: v.InferOutput<TSchema>) => TResult,
) {
  const InputSchema = v.object({ data: schema });

  return async (input: {
    data: v.InferInput<TSchema>;
  }): Promise<Awaited<TResult> | ValidationFailure> => {
    const parsed = v.safeParse(InputSchema, input);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.issues[0]?.message ?? "La solicitud no es válida.",
        },
      };
    }
    return await operation(parsed.output.data);
  };
}
