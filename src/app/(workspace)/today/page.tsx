import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { TodayView } from "@/features/today/components/today-view";
import { getTodayTasks } from "@/features/today/queries";

export const metadata: Metadata = { title: "Mi día" };

async function TodayContent() {
  const user = await readSessionUser();
  if (!user) redirect("/login");
  return (
    <TodayView
      userId={user.id}
      timezone={user.timezone}
      initialData={await getTodayTasks()}
    />
  );
}

export default function TodayPage() {
  return <TodayContent />;
}
