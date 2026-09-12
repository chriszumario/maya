import { describe, expect, test } from "vitest";

import { buildCursorHref, readCursorHistory } from "@/lib/cursor-navigation";

describe("cursor navigation", () => {
  test("uses the last valid cursor from route parameters", () => {
    expect(readCursorHistory(["first", "second"])).toEqual(["first", "second"]);
    expect(readCursorHistory(["", "x".repeat(1_025), "valid"])).toEqual([
      "valid",
    ]);
  });

  test("preserves filters while moving forward and backward", () => {
    const next = buildCursorHref(
      "/goals",
      "status=completed&cursor=first",
      "next",
      "second",
    );
    expect(next).toBe("/goals?status=completed&cursor=first&cursor=second");
    expect(
      buildCursorHref("/goals", next.split("?")[1] ?? "", "previous"),
    ).toBe("/goals?status=completed&cursor=first");
  });
});
