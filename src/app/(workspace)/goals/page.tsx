import type { Metadata } from "next";
import { GoalsView } from "@/features/goals/components/goals-view";
import { getGoals } from "@/features/goals/queries";
import type { GoalListStatus } from "@/features/goals/schemas";
import { readCursorHistory } from "@/lib/cursor-navigation";

export const metadata: Metadata = { title: "Metas" };

const statuses = new Set([
  "all",
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

async function GoalsContent({ searchParams }: PageProps<"/goals">) {
  const search = await searchParams;
  const status =
    typeof search.status === "string" && statuses.has(search.status)
      ? (search.status as GoalListStatus)
      : "in_progress";
  const cursor = readCursorHistory(search.cursor).at(-1);
  const page = await getGoals(cursor);
  return (
    <GoalsView
      goals={page.items}
      nextCursor={page.nextCursor}
      status={status}
    />
  );
}

export default function GoalsPage(props: PageProps<"/goals">) {
  return <GoalsContent {...props} />;
}
