import type { Metadata } from "next";
import { AdminPendingView } from "@/features/admin/components/admin-pending-view";
import { getPendingUsers } from "@/features/admin/queries";
import { readCursorHistory } from "@/lib/cursor-navigation";

export const metadata: Metadata = { title: "Aprobaciones | Administración" };

async function PendingUsersContent({
  searchParams,
}: PageProps<"/admin/pending">) {
  const cursor = readCursorHistory((await searchParams).cursor).at(-1);
  const page = await getPendingUsers(cursor);
  return (
    <AdminPendingView pendingUsers={page.items} nextCursor={page.nextCursor} />
  );
}

export default function PendingUsersPage(props: PageProps<"/admin/pending">) {
  return <PendingUsersContent {...props} />;
}
