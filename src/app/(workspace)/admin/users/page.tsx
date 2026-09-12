import type { Metadata } from "next";
import { AdminUsersView } from "@/features/admin/components/admin-users-view";
import { getAdminUsers } from "@/features/admin/queries";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { readCursorHistory } from "@/lib/cursor-navigation";

export const metadata: Metadata = { title: "Usuarios | Administración" };

async function AdminUsersContent({ searchParams }: PageProps<"/admin/users">) {
  const cursor = readCursorHistory((await searchParams).cursor).at(-1);
  const [users, currentUser] = await Promise.all([
    getAdminUsers(cursor),
    readSessionUser(),
  ]);
  return (
    <AdminUsersView
      adminUsers={users.items}
      currentUserId={currentUser?.id ?? 0}
      nextCursor={users.nextCursor}
    />
  );
}

export default function AdminUsersPage(props: PageProps<"/admin/users">) {
  return <AdminUsersContent {...props} />;
}
