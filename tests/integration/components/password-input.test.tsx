// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, test, vi } from "vitest";
import { PasswordInput } from "@/components/shared/password-input";

describe("PasswordInput", () => {
  test("starts hidden and toggles without losing the input value or submitting", () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <label htmlFor="password">Contraseña</label>
        <PasswordInput
          id="password"
          name="password"
          defaultValue="test-password-12345"
          autoComplete="current-password"
          aria-invalid="true"
          aria-describedby="password-error"
        />
        <p id="password-error">Contraseña incorrecta.</p>
      </form>,
    );
    const input = screen.getByLabelText("Contraseña") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });

    expect(input.type).toBe("password");
    expect(input.name).toBe("password");
    expect(input.autocomplete).toBe("current-password");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("password-error");
    expect(toggle.getAttribute("aria-controls")).toBe(input.id);

    fireEvent.click(toggle);
    expect(input.type).toBe("text");
    expect(input.value).toBe("test-password-12345");

    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(input.type).toBe("password");
    expect(input.value).toBe("test-password-12345");
    expect(submit).not.toHaveBeenCalled();
  });

  test("keeps visibility independent for each password field", () => {
    render(
      <>
        <PasswordInput aria-label="Nueva contraseña" />
        <PasswordInput aria-label="Confirmar contraseña" />
      </>,
    );
    const first = screen.getByLabelText("Nueva contraseña");
    const second = screen.getByLabelText("Confirmar contraseña");
    fireEvent.click(
      screen.getAllByRole("button", { name: "Mostrar contraseña" })[0],
    );

    expect(first.getAttribute("type")).toBe("text");
    expect(second.getAttribute("type")).toBe("password");
    expect(first.id).not.toBe(second.id);
  });

  test("disables both the input and the visibility control", () => {
    render(<PasswordInput disabled aria-label="Contraseña" />);

    expect(screen.getByLabelText("Contraseña").hasAttribute("disabled")).toBe(
      true,
    );
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(toggle.hasAttribute("disabled")).toBe(true);
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Contraseña").getAttribute("type")).toBe(
      "password",
    );
  });

  test("accepts a ref as a prop", () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} aria-label="Contraseña" />);

    expect(ref.current).toBe(screen.getByLabelText("Contraseña"));
  });
});
