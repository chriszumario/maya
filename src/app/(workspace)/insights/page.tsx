import type { Metadata } from "next";
import { InsightsContent } from "@/features/insights/components/insights-content";
import { getDashboardTrends, getInsights } from "@/features/insights/queries";

export const metadata: Metadata = { title: "Insights" };

async function InsightsData() {
  const [insights, trends] = await Promise.all([
    getInsights(),
    getDashboardTrends({ days: 30 }).catch(() => undefined),
  ]);
  return <InsightsContent insights={insights} trends={trends} />;
}

export default function InsightsPage() {
  return <InsightsData />;
}
