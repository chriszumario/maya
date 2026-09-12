import { describe, expect, test } from "vitest";

import { safeInternalPath } from "@/features/auth/model/auth";

describe("post-login redirect", () => {
  test.each([
    undefined,
    "https://evil.example/",
    "//evil.example/",
    "/\\evil.example/",
    "/%5cevil.example/",
    "/%E0%A4%A",
  ])("rejects an unsafe destination: %s", (destination) => {
    expect(safeInternalPath(destination)).toBe("/");
  });

  test("preserves a local path with query and hash", () => {
    expect(safeInternalPath("/goals?status=active#today")).toBe(
      "/goals?status=active#today",
    );
  });
});
