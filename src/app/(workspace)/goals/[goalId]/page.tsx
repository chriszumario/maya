import { notFound } from "next/navigation";
import { GoalDetailView } from "@/features/goals/components/goal-detail-view";
import { getGoal, getGoalTasks } from "@/features/goals/queries";
import { readCursorHistory } from "@/lib/cursor-navigation";

async function GoalContent({
  params,
  searchParams,
}: PageProps<"/goals/[goalId]">) {
  const id = Number((await params).goalId);
  if (!Number.isInteger(id) || id < 1) notFound();
  const cursor = readCursorHistory((await searchParams).cursor).at(-1);
  const [goal, tasksPage] = await Promise.all([
    getGoal(id),
    getGoalTasks(id, cursor),
  ]);
  const { tasks: _embeddedTasks, ...details } = goal;
  return <GoalDetailView goal={details} tasksPage={tasksPage} />;
}

export default function GoalPage(props: PageProps<"/goals/[goalId]">) {
  return <GoalContent {...props} />;
}
