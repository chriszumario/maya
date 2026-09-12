import { describe, expect, test } from "vitest";

import { formatMinutes, sumSeries } from "@/features/insights/model/insights";

describe("insights model", () => {
  test("adds every point in a series", () => {
    expect(sumSeries([{ value: 1.5 }, { value: 2 }, { value: -0.5 }])).toBe(3);
  });

  test.each([
    [30.4, "30 min"],
    [90, "1 h 30 min"],
  ])("formats %s minutes as %s", (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });
});
