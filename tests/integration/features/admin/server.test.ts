import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  authenticatedApiFetch: vi.fn(),
}));
vi.mock("@/features/auth/server/auth-session.server", () => ({
  readSessionUser: mocks.readSessionUser,
}));
vi.mock("@/features/auth/server/authenticated-api.server", () => ({
  authenticatedApiFetch: mocks.authenticatedApiFetch,
}));

import {
  approveUserFn,
  getAdminStatsFn,
  setAdminFn,
} from "@/features/admin/server";

beforeEach(() => vi.clearAllMocks());

describe("admin authorization", () => {
  test.each([null, { id: 1, isAdmin: false }])(
    "blocks direct reads and mutations for %j",
    async (user) => {
      mocks.readSessionUser.mockResolvedValue(user);
      for (const result of [
        await getAdminStatsFn(),
        await approveUserFn({ data: { userId: 2 } }),
        await setAdminFn({ data: { userId: 1, isAdmin: true } }),
      ]) {
        expect(result).toMatchObject({
          ok: false,
          error: { code: "FORBIDDEN" },
        });
      }
      expect(mocks.authenticatedApiFetch).not.toHaveBeenCalled();
    },
  );

  test("still delegates current permissions to the API for an admin session", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: 1, isAdmin: true });
    mocks.authenticatedApiFetch.mockRejectedValue(new Error("revoked role"));
    expect(await getAdminStatsFn()).toMatchObject({ ok: false });
    expect(mocks.authenticatedApiFetch).toHaveBeenCalledWith("/admin/stats");
  });
});
