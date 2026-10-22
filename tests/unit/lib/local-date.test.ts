import { expect, test } from "vitest";

import { localDateInTimeZone, parseApiTimestamp } from "@/lib/local-date";

test("returns the calendar date in the requested time zone", () => {
  const instant = new Date("2026-01-01T02:00:00Z");

  expect(localDateInTimeZone("America/La_Paz", instant)).toBe("2025-12-31");
  expect(localDateInTimeZone("UTC", instant)).toBe("2026-01-01");
});

test("interprets SQL timestamps as UTC rather than device time", () => {
  expect(parseApiTimestamp("2026-10-20 23:30:00").toISOString()).toBe(
    "2026-10-20T23:30:00.000Z",
  );
  expect(parseApiTimestamp("2026-10-20T23:30:00Z").toISOString()).toBe(
    "2026-10-20T23:30:00.000Z",
  );
});
