"use client";

import { useState } from "react";

type MutationOptions<TData, TVariables, TContext> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context?: TContext,
  ) => unknown;
  onError?: (
    error: Error,
    variables: TVariables,
    context?: TContext,
  ) => unknown;
  onSettled?: (
    data?: TData,
    error?: Error | null,
    variables?: TVariables,
    context?: TContext,
  ) => unknown;
};

export function useServerMutation<TData, TVariables = void, TContext = unknown>(
  options: MutationOptions<TData, TVariables, TContext>,
) {
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [variables, setVariables] = useState<TVariables>();
  async function mutateAsync(variables: TVariables) {
    setVariables(variables);
    setPendingCount((count) => count + 1);
    setError(null);
    let context: TContext | undefined;
    let data: TData | undefined;
    let caught: Error | null = null;
    try {
      context = await options.onMutate?.(variables);
      data = await options.mutationFn(variables);
      await options.onSuccess?.(data, variables, context);
      return data;
    } catch (cause) {
      caught =
        cause instanceof Error
          ? cause
          : new Error("No se pudo completar la operación.");
      setError(caught);
      await options.onError?.(caught, variables, context);
      throw caught;
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
      try {
        await options.onSettled?.(data, caught, variables, context);
      } catch {
        // Settlement cleanup must not replace the mutation's result or error.
      }
    }
  }
  return {
    mutate: (variables: TVariables) =>
      void mutateAsync(variables).catch(() => undefined),
    mutateAsync,
    isPending: pendingCount > 0,
    error,
    variables,
    reset: () => setError(null),
  };
}
