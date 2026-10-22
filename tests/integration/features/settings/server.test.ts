import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ api: vi.fn(), update: vi.fn() }));
const user = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  isAdmin: false,
  timezone: "UTC",
};

vi.mock("@/features/auth/server/auth-session.server", () => ({
  getAppSession: async () => ({ data: { user }, update: mocks.update }),
}));
vi.mock("@/features/auth/server/authenticated-api.server", () => ({
  authenticatedApiFetch: mocks.api,
}));

import { updatePasswordFn, updateProfileFn } from "@/features/settings/server";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.api.mockResolvedValue(user);
});

describe("profile API contract", () => {
  test("does not resend an unchanged email when changing the name", async () => {
    const result = await updateProfileFn({
      data: {
        name: "New Name",
        email: user.email,
        timezone: "UTC",
        currentPassword: "",
      },
    });
    expect(result.ok).toBe(true);
    expect(JSON.parse(mocks.api.mock.calls[0][1].body)).toEqual({
      name: "New Name",
    });
  });

  test("sends timezone updates without requiring a password", async () => {
    mocks.api.mockResolvedValue({ ...user, timezone: "America/La_Paz" });
    const result = await updateProfileFn({
      data: {
        name: user.name,
        email: user.email,
        timezone: "America/La_Paz",
        currentPassword: "",
      },
    });
    expect(result.ok).toBe(true);
    expect(JSON.parse(mocks.api.mock.calls[0][1].body)).toEqual({
      timezone: "America/La_Paz",
    });
    expect(mocks.update).toHaveBeenCalledWith({
      user: { ...user, timezone: "America/La_Paz" },
    });
  });

  test("requires the current password for an email change", async () => {
    const result = await updateProfileFn({
      data: {
        name: user.name,
        email: "new@example.com",
        timezone: "UTC",
        currentPassword: "",
      },
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "CURRENT_PASSWORD_REQUIRED" },
    });
    expect(mocks.api).not.toHaveBeenCalled();
  });

  test("sends the password only with the changed email", async () => {
    await updateProfileFn({
      data: {
        name: user.name,
        email: "new@example.com",
        timezone: "UTC",
        currentPassword: "current-password",
      },
    });
    expect(JSON.parse(mocks.api.mock.calls[0][1].body)).toEqual({
      email: "new@example.com",
      currentPassword: "current-password",
    });
  });

  test("does not send an empty PATCH", async () => {
    await updateProfileFn({
      data: {
        name: user.name,
        email: user.email,
        timezone: "UTC",
        currentPassword: "",
      },
    });
    expect(mocks.api).not.toHaveBeenCalled();
  });

  test("rejects an unchanged password before calling the API", async () => {
    const result = await updatePasswordFn({
      data: {
        currentPassword: "same-password-123",
        newPassword: "same-password-123",
        confirmPassword: "same-password-123",
      },
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR" },
    });
    expect(mocks.api).not.toHaveBeenCalled();
  });
});
