import * as v from "valibot";
import { describe, expect, test } from "vitest";

import {
  CaloriesEstimateSchema,
  EstimateCaloriesInputSchema,
  NutritionEntrySchema,
} from "@/features/nutrition/schemas";

describe("nutrition schemas", () => {
  test.each([-1, 100001, 12.5])(
    "rejects invalid AI calorie totals: %s",
    (calories) => {
      expect(v.safeParse(CaloriesEstimateSchema, { calories }).success).toBe(
        false,
      );
    },
  );
  test("accepts a nutrition entry", () => {
    const entry = {
      id: 1,
      userId: 2,
      localDate: "2026-09-01",
      mealType: "lunch",
      name: "Arroz",
      quantity: 1,
      unit: "porción",
      calories: 200,
      protein: null,
      carbs: null,
      fat: null,
      notes: null,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };

    expect(v.safeParse(NutritionEntrySchema, entry).success).toBe(true);
  });

  test("accepts the calorie estimation input", () => {
    expect(
      v.safeParse(EstimateCaloriesInputSchema, {
        name: "Arroz",
        quantity: 1,
        unit: "porción",
      }).success,
    ).toBe(true);
  });
});
