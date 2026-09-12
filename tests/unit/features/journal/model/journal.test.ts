import { describe, expect, test } from "vitest";

import {
  energyLevels,
  formatJournalDate,
  moods,
} from "@/features/journal/model/journal";

describe("journal model", () => {
  test("provides every mood and energy option", () => {
    expect(moods.map(({ value }) => value)).toEqual([
      "excellent",
      "good",
      "neutral",
      "bad",
      "terrible",
    ]);
    expect(energyLevels.at(-1)).toEqual({ label: "5 de 5", value: "5" });
  });

  test("formats a calendar date independently of the local time zone", () => {
    expect(formatJournalDate("2026-01-05")).toBe("5 de enero de 2026");
  });
});
