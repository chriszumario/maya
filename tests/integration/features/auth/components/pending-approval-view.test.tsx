// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { PendingApprovalView } from "@/features/auth/components/pending-approval-view";

describe("PendingApprovalView", () => {
  test("explains the next step and links back to login", () => {
    render(<PendingApprovalView />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Solicitud recibida" }),
    ).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "Volver al inicio de sesión" })
        .getAttribute("href"),
    ).toBe("/login");
  });
});
