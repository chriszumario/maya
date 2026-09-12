import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { LocalDateSchema } from "@/lib/schemas/maya.schema";

describe("Maya schemas", () => {
  test("accepts real local dates", () => {
    expect(v.safeParse(LocalDateSchema, "2026-02-28").success).toBe(true);
    expect(v.safeParse(LocalDateSchema, "2026-02-29").success).toBe(false);
  });
});
