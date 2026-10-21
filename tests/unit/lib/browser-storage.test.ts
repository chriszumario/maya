// @vitest-environment happy-dom
import { expect, test, vi } from "vitest";
import { readStoredValue, writeStoredValue } from "@/lib/browser-storage";

test("degrades to in-memory state when browser storage is unavailable", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  expect(readStoredValue("timer")).toBeNull();
  expect(() => writeStoredValue("timer", "running")).not.toThrow();
  expect(() => writeStoredValue("timer", null)).not.toThrow();
});
