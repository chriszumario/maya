"use client";

import type { ReactNode } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

type AuthFieldProps = {
  id: string;
  label: string;
  errors: [string, ...string[]] | null;
  description?: string;
  children: ReactNode;
};

export function AuthField({
  id,
  label,
  errors,
  description,
  children,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <Field data-invalid={Boolean(errors)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {description ? (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      ) : null}
      <FieldError id={errorId}>{errors?.[0]}</FieldError>
    </Field>
  );
}
