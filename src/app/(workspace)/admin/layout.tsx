import { redirect } from "next/navigation";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await readSessionUser();
  if (!user?.isAdmin) redirect("/");
  return children;
}
