import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateTag: vi.fn(),
  approveUserFn: vi.fn(),
  revokeUserSessionsFn: vi.fn(),
}));

vi.mock("next/cache", () => ({ updateTag: mocks.updateTag }));
vi.mock("@/features/admin/server", () => ({
  approveUserFn: mocks.approveUserFn,
  revokeUserSessionsFn: mocks.revokeUserSessionsFn,
}));

import { approveUserFn, revokeUserSessionsFn } from "@/features/admin/actions";

beforeEach(() => vi.clearAllMocks());

describe("admin actions", () => {
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
