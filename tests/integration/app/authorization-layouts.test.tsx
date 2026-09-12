import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const redirectError = new Error("NEXT_REDIRECT");
const mocks = vi.hoisted(() => ({
  readSessionUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/features/auth/server/auth-session.server", () => ({
  readSessionUser: mocks.readSessionUser,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => children,
}));

import AdminLayout from "@/app/(workspace)/admin/layout";
import WorkspaceLayout from "@/app/(workspace)/layout";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation(() => {
    throw redirectError;
  });
});

describe("route authorization layouts", () => {
  test("redirects an unauthenticated workspace request", async () => {
    mocks.readSessionUser.mockResolvedValue(null);
    const layout = WorkspaceLayout({ children: "private" });
    const protectedContent = layout.props.children as {
      type: (props: { children: ReactNode }) => Promise<ReactNode>;
      props: { children: ReactNode };
    };

    await expect(protectedContent.type(protectedContent.props)).rejects.toBe(
      redirectError,
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  test("redirects a non-admin user from administration", async () => {
    mocks.readSessionUser.mockResolvedValue({ isAdmin: false });

    await expect(
      AdminLayout({ children: "admin" } as LayoutProps<"/admin">),
    ).rejects.toBe(redirectError);
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  test("renders administration for an admin user", async () => {
    mocks.readSessionUser.mockResolvedValue({ isAdmin: true });

    await expect(
      AdminLayout({ children: "admin" } as LayoutProps<"/admin">),
    ).resolves.toBe("admin");
  });
});
