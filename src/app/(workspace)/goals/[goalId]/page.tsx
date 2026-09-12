import { notFound } from "next/navigation";
import { GoalDetailView } from "@/features/goals/components/goal-detail-view";
import { getGoal } from "@/features/goals/queries";

async function GoalContent({ params }: PageProps<"/goals/[goalId]">) {
  const id = Number((await params).goalId);
  if (!Number.isInteger(id) || id < 1) notFound();
  return <GoalDetailView goalId={id} goal={await getGoal(id)} />;
}

export default function GoalPage(props: PageProps<"/goals/[goalId]">) {
  return <GoalContent {...props} />;
}
