import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { ImproveGoalResponseSchema } from "@/features/goals/schemas";
import { ImproveJournalResponseSchema } from "@/features/journal/schemas";

describe("AI response schemas", () => {
  test("rejects text beyond the goal limit", () => {
    expect(
      v.safeParse(ImproveGoalResponseSchema, {
        field: "title",
        text: "x".repeat(201),
      }).success,
    ).toBe(false);
  });

  test("rejects text beyond the journal limit", () => {
    expect(
      v.safeParse(ImproveJournalResponseSchema, {
        field: "content",
        text: "x".repeat(10_001),
      }).success,
    ).toBe(false);
  });
});
