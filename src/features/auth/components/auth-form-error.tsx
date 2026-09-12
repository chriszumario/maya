"use client";

import { CircleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AuthFormError({ errors }: { errors: string[] | null }) {
  if (!errors?.length) return null;

  return (
    <Alert variant="destructive" role="alert">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>No pudimos completar la solicitud</AlertTitle>
      <AlertDescription>{errors[0]}</AlertDescription>
    </Alert>
  );
}
