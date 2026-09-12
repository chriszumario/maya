// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AuthFormError } from "@/features/auth/components/auth-form-error";

describe("AuthFormError", () => {
  test("renders nothing without errors", () => {
    render(<AuthFormError errors={null} />);

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("shows the first error accessibly", () => {
    render(<AuthFormError errors={["La cuenta está pendiente.", "Extra"]} />);

    expect(screen.getByRole("alert").textContent).toContain(
      "La cuenta está pendiente.",
    );
  });
});
