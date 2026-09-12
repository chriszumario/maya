import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { getDashboardSummary } from "@/features/dashboard/queries";
import { getInsights } from "@/features/insights/queries";

async function DashboardData() {
  const [user, summary, insights] = await Promise.all([
    readSessionUser(),
    getDashboardSummary(),
    getInsights().catch(() => undefined),
  ]);
  return (
    <DashboardContent
      userName={user?.name ?? ""}
      summary={summary}
      insights={insights}
    />
  );
}

export default function DashboardPage() {
  return <DashboardData />;
}
