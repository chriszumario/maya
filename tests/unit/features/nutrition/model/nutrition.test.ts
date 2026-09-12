import { describe, expect, test } from "vitest";

import {
  getLocalDate,
  shiftLocalDate,
} from "@/features/nutrition/model/nutrition";

describe("nutrition dates", () => {
  test("formats a local calendar date", () => {
    expect(getLocalDate(new Date(2026, 0, 5, 23))).toBe("2026-01-05");
  });

  test("moves across month boundaries", () => {
    expect(shiftLocalDate("2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftLocalDate("2026-03-01", -1)).toBe("2026-02-28");
  });
});
