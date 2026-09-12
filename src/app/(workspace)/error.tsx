"use client";

import { CircleAlertIcon, RotateCcwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl items-center">
      <Alert variant="destructive">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>No pudimos cargar esta sección</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-4">
          <span>
            El servicio puede no estar disponible temporalmente. Intenta
            nuevamente.
          </span>
          <Button type="button" variant="outline" onClick={retry}>
            <RotateCcwIcon aria-hidden="true" />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
