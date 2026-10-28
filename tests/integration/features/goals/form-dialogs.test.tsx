// @vitest-environment happy-dom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createGoalFn: vi.fn(),
  updateGoalFn: vi.fn(),
  improveGoalFn: vi.fn(),
  createTaskFn: vi.fn(),
  updateTaskFn: vi.fn(),
  createGoalReviewFn: vi.fn(),
}));
vi.mock("@/features/goals/actions", () => mocks);

import { GoalFormDialog } from "@/features/goals/components/goal-form-dialog";
import { GoalReviewDialog } from "@/features/goals/components/goal-review-dialog";
import { TaskFormDialog } from "@/features/goals/components/task-form-dialog";

beforeEach(() => vi.clearAllMocks());

test.each([
  {
    name: "goal",
    form: <GoalFormDialog trigger={<button type="button">Abrir</button>} />,
    action: mocks.createGoalFn,
    submit: "Crear meta",
    fields: [
      ["Título", "Aprender a cocinar"],
      ["Motivación", "Preparar comidas saludables"],
    ],
  },
  {
    name: "task",
    form: (
      <TaskFormDialog
        goalId={1}
        trigger={<button type="button">Abrir</button>}
      />
    ),
    action: mocks.createTaskFn,
    submit: "Crear tarea",
    fields: [["Tarea", "Leer un capítulo"]],
  },
  {
    name: "review",
    form: (
      <GoalReviewDialog
        goalId={1}
        trigger={<button type="button">Abrir</button>}
      />
    ),
    action: mocks.createGoalReviewFn,
    submit: "Guardar revisión",
    fields: [
      ["Qué funcionó", "La constancia"],
      ["Qué no funcionó", "El horario"],
      ["Siguientes acciones", "Empezar antes"],
    ],
  },
])(
  "$name preserves input after a failed save and prevents cancellation while pending",
  async ({ form, action, submit, fields }) => {
    let finish!: (result: { ok: false; error: { message: string } }) => void;
    action.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(form);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await screen.findByRole("dialog");
    for (const [label, value] of fields) {
      fireEvent.input(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: submit }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    expect(
      (screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: /Guardando…/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.getByRole("dialog")).toBeDefined();

    await act(async () => {
      finish({ ok: false, error: { message: "Intenta nuevamente" } });
    });
    expect(await screen.findByText("Intenta nuevamente")).toBeDefined();
    for (const [label, value] of fields) {
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe(
        value,
      );
    }
    action.mockResolvedValueOnce({ ok: true, data: {} });
    fireEvent.click(screen.getByRole("button", { name: submit }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(action).toHaveBeenCalledTimes(2);
  },
);
