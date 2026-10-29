"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { type ComponentProps, useId, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function PasswordInput({
  id,
  disabled,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className={className} data-disabled={disabled}>
      <InputGroupInput
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        disabled={disabled}
        autoCapitalize="none"
        spellCheck={false}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-sm"
          disabled={disabled}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-controls={inputId}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOffIcon aria-hidden="true" />
          ) : (
            <EyeIcon aria-hidden="true" />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
