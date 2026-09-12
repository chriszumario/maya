import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { JournalEntrySchema } from "@/features/journal/schemas";

describe("journal schemas", () => {
  test("does not allow a null mood", () => {
    const entry = {
      id: 1,
      userId: 2,
      localDate: "2026-09-01",
      title: "Día",
      content: "",
      mood: null,
      energyLevel: 4,
      gratitude: "",
      wins: "",
      lessons: "",
      problems: "",
      ideas: "",
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };

    expect(v.safeParse(JournalEntrySchema, entry).success).toBe(false);
  });
});
