"use client";

import { RefreshCwIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { refreshAdminStatsFn } from "../actions";

export function AdminStatsRefresh() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    startTransition(async () => {
      setError(null);
      try {
        const result = await refreshAdminStatsFn();
        if (!result.ok) setError(result.error.message);
      } catch {
        setError("No se pudo actualizar. Inténtalo nuevamente.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={isPending}
        aria-busy={isPending}
      >
        <RefreshCwIcon
          data-icon="inline-start"
          className={
            isPending ? "animate-spin motion-reduce:animate-none" : undefined
          }
          aria-hidden="true"
        />
        {isPending ? "Actualizando…" : "Actualizar estado"}
      </Button>
      {error ? (
        <p role="alert" className="max-w-xs text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
