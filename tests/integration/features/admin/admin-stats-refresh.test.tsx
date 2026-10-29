// @vitest-environment happy-dom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ refreshAdminStatsFn: vi.fn() }));
vi.mock("@/features/admin/actions", () => mocks);

import { AdminStatsRefresh } from "@/features/admin/components/admin-stats-refresh";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("AdminStatsRefresh", () => {
  test("disables refresh while the update is pending", async () => {
    let resolve!: (result: { ok: true }) => void;
    mocks.refreshAdminStatsFn.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<AdminStatsRefresh />);

    fireEvent.click(screen.getByRole("button", { name: "Actualizar estado" }));
    const button = await screen.findByRole("button", { name: "Actualizando…" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(mocks.refreshAdminStatsFn).toHaveBeenCalledOnce();

    resolve({ ok: true });
    await waitFor(() => {
      expect(
        screen
          .getByRole("button", { name: "Actualizar estado" })
          .hasAttribute("disabled"),
      ).toBe(false);
    });
  });

  test("shows the action error and lets the user retry", async () => {
    mocks.refreshAdminStatsFn
      .mockResolvedValueOnce({
        ok: false,
        error: { message: "No tienes permisos para realizar esta operación." },
      })
      .mockResolvedValueOnce({ ok: true });
    render(<AdminStatsRefresh />);

    fireEvent.click(screen.getByRole("button", { name: "Actualizar estado" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "No tienes permisos",
    );
    fireEvent.click(screen.getByRole("button", { name: "Actualizar estado" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  test("handles a network failure without exposing internal details", async () => {
    mocks.refreshAdminStatsFn.mockRejectedValue(new Error("private error"));
    render(<AdminStatsRefresh />);

    fireEvent.click(screen.getByRole("button", { name: "Actualizar estado" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "No se pudo actualizar. Inténtalo nuevamente.",
    );
  });
});
