import { notFound } from "next/navigation";
import { AdminUserDetailView } from "@/features/admin/components/admin-user-detail-view";
import { getAdminUser, getUserSessions } from "@/features/admin/queries";

async function AdminUserContent({
  params,
}: PageProps<"/admin/users/[userId]">) {
  const userId = Number((await params).userId);
  if (!Number.isInteger(userId) || userId < 1) notFound();
  const [user, activeSessions] = await Promise.all([
    getAdminUser(userId),
    getUserSessions(userId),
  ]);
  if (!user) notFound();
  return (
    <AdminUserDetailView
      userId={userId}
      user={user}
      activeSessions={activeSessions}
    />
  );
}

export default function AdminUserPage(
  props: PageProps<"/admin/users/[userId]">,
) {
  return <AdminUserContent {...props} />;
}
