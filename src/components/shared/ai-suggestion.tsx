"use client";

import { Button } from "@/components/ui/button";

export function AiSuggestion({
  text,
  onAccept,
  onDismiss,
}: {
  text: string;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="my-3 rounded-xl border p-4" role="status">
      <p className="text-sm font-semibold">
        Sugerencia de IA · revisa antes de aplicar
      </p>
      <p className="my-3 whitespace-pre-wrap text-sm">{text}</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onAccept}>
          Aplicar sugerencia
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          Descartar
        </Button>
      </div>
    </div>
  );
}
