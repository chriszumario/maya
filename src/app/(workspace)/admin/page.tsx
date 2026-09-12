import type { Metadata } from "next";
import { AdminDashboardView } from "@/features/admin/components/admin-dashboard-view";
import { getAdminStats } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Administración" };

async function AdminDashboard() {
  return <AdminDashboardView stats={await getAdminStats()} />;
}

export default function AdminPage() {
  return <AdminDashboard />;
}
