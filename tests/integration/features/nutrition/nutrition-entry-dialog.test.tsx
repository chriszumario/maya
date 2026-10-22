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
  estimateCaloriesFn: vi.fn(),
  createNutritionEntryFn: vi.fn(),
  updateNutritionEntryFn: vi.fn(),
}));
vi.mock("@/features/nutrition/actions", () => mocks);

import { NutritionEntryDialog } from "@/features/nutrition/components/nutrition-entry-dialog";

beforeEach(() => vi.clearAllMocks());

async function openFilledForm() {
  render(<NutritionEntryDialog />);
  fireEvent.click(screen.getByRole("button", { name: "Registrar alimento" }));
  await screen.findByRole("dialog");
  fireEvent.input(screen.getByLabelText("Alimento o preparación"), {
    target: { value: "Arroz cocido" },
  });
  fireEvent.input(screen.getByLabelText("Cantidad"), {
    target: { value: "150" },
  });
  fireEvent.input(screen.getByLabelText("Unidad"), { target: { value: "g" } });
}

test("estimates with empty calories, previews the total and requires explicit acceptance", async () => {
  mocks.estimateCaloriesFn.mockResolvedValue({
    ok: true,
    data: { calories: 195 },
  });
  await openFilledForm();
  fireEvent.click(
    screen.getByRole("button", { name: "Estimar calorías con IA" }),
  );
  await screen.findByText("195 kcal totales (estimación aproximada)");
  expect(mocks.estimateCaloriesFn).toHaveBeenCalledWith({
    data: { name: "Arroz cocido", quantity: 150, unit: "g", mealType: "lunch" },
  });
  expect((screen.getByLabelText("Calorías") as HTMLInputElement).value).toBe(
    "",
  );
  expect(mocks.createNutritionEntryFn).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Aplicar sugerencia" }));
  expect((screen.getByLabelText("Calorías") as HTMLInputElement).value).toBe(
    "195",
  );
});

test("discards a late calorie response after the amount changes", async () => {
  let resolve!: (value: { ok: true; data: { calories: number } }) => void;
  mocks.estimateCaloriesFn.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await openFilledForm();
  fireEvent.click(
    screen.getByRole("button", { name: "Estimar calorías con IA" }),
  );
  await waitFor(() => expect(mocks.estimateCaloriesFn).toHaveBeenCalledOnce());
  fireEvent.input(screen.getByLabelText("Cantidad"), {
    target: { value: "300" },
  });
  await act(async () => {
    resolve({ ok: true, data: { calories: 195 } });
  });
  expect(
    screen.queryByText("195 kcal totales (estimación aproximada)"),
  ).toBeNull();
  expect((screen.getByLabelText("Calorías") as HTMLInputElement).value).toBe(
    "",
  );
});
