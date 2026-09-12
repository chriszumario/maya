import { describe, expect, test } from "vitest";

import { formatMinutes } from "@/features/dashboard/model/dashboard";

describe("dashboard formatting", () => {
  test.each([
    [29.6, "30 min"],
    [60, "1 h"],
    [89.6, "1 h 30 min"],
  ])("formats %s minutes as %s", (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });
});
