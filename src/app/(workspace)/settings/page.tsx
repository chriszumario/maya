import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { SettingsView } from "@/features/settings/components/settings-view";
export const metadata: Metadata = { title: "Configuración" };
export default async function SettingsPage() {
  const user = await readSessionUser();
  if (!user) redirect("/login");
  return <SettingsView user={user} />;
}
