import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  readSessionUser: vi.fn(),
  updateTag: vi.fn(),
  approveUserFn: vi.fn(),
  revokeUserSessionsFn: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: mocks.updateTag,
  refresh: mocks.refresh,
}));
vi.mock("@/features/auth/server/auth-session.server", () => ({
  readSessionUser: mocks.readSessionUser,
}));
vi.mock("@/features/admin/server", () => ({
  approveUserFn: mocks.approveUserFn,
  revokeUserSessionsFn: mocks.revokeUserSessionsFn,
}));

import {
  approveUserFn,
  refreshAdminStatsFn,
  revokeUserSessionsFn,
} from "@/features/admin/actions";

beforeEach(() => vi.clearAllMocks());

describe("admin actions", () => {
  test("expires only the stats cache and refreshes the dashboard for admins", async () => {
    mocks.readSessionUser.mockResolvedValue({ id: 1, isAdmin: true });

    expect(await refreshAdminStatsFn()).toEqual({ ok: true });
    expect(mocks.updateTag.mock.calls).toEqual([["admin"]]);
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  test.each([null, { id: 1, isAdmin: false }])(
    "blocks stats refresh for %j",
    async (user) => {
      mocks.readSessionUser.mockResolvedValue(user);

      expect(await refreshAdminStatsFn()).toMatchObject({
        ok: false,
        error: { code: "FORBIDDEN" },
      });
      expect(mocks.updateTag).not.toHaveBeenCalled();
      expect(mocks.refresh).not.toHaveBeenCalled();
    },
  );

  test("uses the trusted response ID when invalidating an approved user", async () => {
    mocks.approveUserFn.mockResolvedValue({ ok: true, data: { id: 9 } });

    await approveUserFn({ data: { userId: 7 } });

    expect(mocks.updateTag.mock.calls.map(([tag]) => tag)).toEqual([
      "admin",
      "admin-users",
      "admin-pending",
      "admin-user-9",
    ]);
  });

  test("does not invalidate caches after a failed mutation", async () => {
    mocks.approveUserFn.mockResolvedValue({
      ok: false,
      error: { code: "FAILED", message: "failed" },
    });

    await approveUserFn({ data: { userId: 7 } });

    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  test("invalidates the target session list after revocation", async () => {
    mocks.revokeUserSessionsFn.mockResolvedValue({
      ok: true,
      data: { status: "sessions_revoked" },
    });

    await revokeUserSessionsFn({ data: { userId: 7 } });

    expect(mocks.updateTag.mock.calls.map(([tag]) => tag)).toContain(
      "admin-user-7",
    );
  });
});
