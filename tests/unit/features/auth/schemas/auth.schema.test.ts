import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { RegisterSchema } from "@/features/auth/schemas/auth.schema";

describe("auth schemas", () => {
  const validInput = {
    name: "Christian",
    email: "CHRIS@MAIL.COM",
    password: "clave-segura-12",
    timezone: "America/La_Paz",
  };

  test("normalizes a valid registration", () => {
    expect(v.parse(RegisterSchema, validInput)).toMatchObject({
      email: "chris@mail.com",
    });
  });

  test.each([
    ["short password", { password: "corta" }],
    ["invalid timezone", { timezone: "not/a-zone" }],
  ])("rejects %s", (_name, override) => {
    expect(
      v.safeParse(RegisterSchema, { ...validInput, ...override }).success,
    ).toBe(false);
  });
});
