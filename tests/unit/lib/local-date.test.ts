import { expect, test } from "vitest";

import { localDateInTimeZone } from "@/lib/local-date";

test("returns the calendar date in the requested time zone", () => {
  const instant = new Date("2026-01-01T02:00:00Z");

  expect(localDateInTimeZone("America/La_Paz", instant)).toBe("2025-12-31");
  expect(localDateInTimeZone("UTC", instant)).toBe("2026-01-01");
});
