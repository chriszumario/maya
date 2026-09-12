import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { validatedOperation } from "@/lib/validated-operation";

describe("validatedOperation", () => {
  test("returns the common validation error shape for invalid input", async () => {
    const operation = validatedOperation(
      v.object({ id: v.pipe(v.number(), v.integer(), v.minValue(1)) }),
      async (data) => ({ ok: true as const, data }),
    );

    await expect(operation({ data: { id: 0 } })).resolves.toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  test("returns a validation error for a malformed action envelope", async () => {
    const operation = validatedOperation(
      v.object({ id: v.number() }),
      async () => ({
        ok: true as const,
      }),
    );

    await expect(
      operation(null as unknown as Parameters<typeof operation>[0]),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  test("passes transformed valid data to the operation", async () => {
    const operation = validatedOperation(
      v.object({ email: v.pipe(v.string(), v.toLowerCase()) }),
      async (data) => data.email,
    );

    await expect(
      operation({ data: { email: "USER@EXAMPLE.COM" } }),
    ).resolves.toBe("user@example.com");
  });
});
