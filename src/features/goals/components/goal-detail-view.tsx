"use client";

import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useServerMutation as useMutation } from "@/hooks/use-server-mutation";
import { throwActionError } from "@/lib/action-error";
import {
  deleteGoalFn,
  deleteTaskFn,
  setTaskActiveFn,
  updateGoalStatusFn,
} from "../actions";
import { priorityLabels, statusLabels } from "../model/goals";
import type {
  GoalDetail,
  GoalStatus,
  GoalTask,
  TaskFrequency,
} from "../schemas";
import { GoalFormDialog } from "./goal-form-dialog";
import { GoalReviewDialog } from "./goal-review-dialog";
import { GoalReviewsDialog } from "./goal-reviews-dialog";
import { TaskFormDialog } from "./task-form-dialog";

const frequencyLabels: Record<TaskFrequency, string> = {
  daily: "Diaria",
  weekly: "Semanal",
  monthly: "Mensual",
  once: "Una vez",
};
const weekDays = [
  { label: "Lun", bit: 1 },
  { label: "Mar", bit: 2 },
  { label: "Mié", bit: 4 },
  { label: "Jue", bit: 8 },
  { label: "Vie", bit: 16 },
  { label: "Sáb", bit: 32 },
  { label: "Dom", bit: 64 },
] as const;

function formatSchedule(task: GoalTask) {
  let schedule = "Todos los días";
  if (task.frequency === "weekly")
    schedule = weekDays
      .filter(({ bit }) => (task.recurrenceMask & bit) !== 0)
      .map(({ label }) => label)
      .join(", ");
  else if (task.frequency === "monthly")
    schedule = `Día ${task.recurrenceMask} de cada mes`;
  else if (task.frequency === "once") {
    const date = String(task.recurrenceMask);
    schedule = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`;
  }
  return `${schedule} · ${task.startTime} · ${task.estimatedMinutes} min`;
}

export function GoalDetailView({
  goalId,
  goal,
}: {
  goalId: number;
  goal: GoalDetail;
}) {
  const router = useRouter();
  const [deleteGoalOpen, setDeleteGoalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<GoalTask | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const terminal = goal.status === "completed" || goal.status === "cancelled";

  const changeStatus = useMutation({
    mutationFn: async (status: GoalStatus) => {
      const result = await updateGoalStatusFn({ data: { id: goalId, status } });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onError: (error) => setActionError(error.message),
  });
  const toggleTask = useMutation({
    mutationFn: async ({
      taskId,
      isActive,
    }: {
      taskId: number;
      isActive: boolean;
    }) => {
      const result = await setTaskActiveFn({ data: { taskId, isActive } });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onError: (error) => setActionError(error.message),
  });
  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      const result = await deleteTaskFn({ data: { taskId, goalId } });
      if (!result.ok) throwActionError(result.error);
    },
    onSuccess: async () => {
      setTaskToDelete(null);
    },
    onError: (error) => setActionError(error.message),
  });
  const deleteGoal = useMutation({
    mutationFn: async () => {
      const result = await deleteGoalFn({ data: { id: goalId } });
      if (!result.ok) throwActionError(result.error);
    },
    onSuccess: async () => {
      router.replace("/goals");
    },
    onError: (error) => setActionError(error.message),
  });

  function updateStatus(status: GoalStatus) {
    setActionError(null);
    changeStatus.mutate(status);
  }

  return (
    <>
      <Link
        href="/goals"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-5",
        })}
      >
        <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
        Volver a metas
      </Link>
      <header className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge>{statusLabels[goal.status]}</Badge>
            <Badge variant="outline">
              Prioridad {priorityLabels[goal.priority].toLowerCase()}
            </Badge>
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {goal.title}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {goal.motivation}
          </p>
          {actionError ? (
            <p className="mt-3 text-sm text-destructive">{actionError}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!terminal ? (
            <Button
              disabled={changeStatus.isPending}
              onClick={() =>
                updateStatus(
                  goal.status === "pending" ? "in_progress" : "completed",
                )
              }
            >
              {changeStatus.isPending ? (
                <Spinner />
              ) : goal.status === "pending" ? (
                <PlayIcon />
              ) : (
                <CheckIcon />
              )}
              {goal.status === "pending" ? "Iniciar meta" : "Completar meta"}
            </Button>
          ) : null}
          <GoalFormDialog
            goal={goal}
            trigger={<Button variant="outline">Editar meta</Button>}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon" variant="ghost" />}
            >
              <MoreHorizontalIcon />
              <span className="sr-only">Más acciones</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!terminal ? (
                <>
                  <DropdownMenuItem onClick={() => updateStatus("completed")}>
                    Marcar como completada
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus("cancelled")}>
                    Cancelar meta
                  </DropdownMenuItem>
                </>
              ) : null}
              {!terminal ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteGoalOpen(true)}
              >
                <Trash2Icon />
                Eliminar meta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Tareas de la meta</CardTitle>
              <CardDescription>
                Crea y programa las acciones que sostienen esta meta.
              </CardDescription>
              <CardAction>
                <TaskFormDialog
                  goalId={goalId}
                  trigger={
                    <Button size="sm" disabled={terminal}>
                      <PlusIcon data-icon="inline-start" />
                      Nueva tarea
                    </Button>
                  }
                />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col">
              {goal.tasks.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Todavía no agregaste tareas a esta meta.
                </p>
              ) : (
                goal.tasks.map((task, index) => (
                  <div key={task.id}>
                    <div className="flex items-center gap-3 py-4">
                      <Switch
                        checked={task.isActive}
                        disabled={terminal || toggleTask.isPending}
                        onCheckedChange={(isActive) =>
                          toggleTask.mutate({ taskId: task.id, isActive })
                        }
                        aria-label={`${task.isActive ? "Desactivar" : "Activar"} ${task.title}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{task.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatSchedule(task)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="hidden sm:inline-flex"
                      >
                        {frequencyLabels[task.frequency]}
                      </Badge>
                      <TaskFormDialog
                        goalId={goalId}
                        task={task}
                        trigger={
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            disabled={terminal}
                            aria-label={`Editar ${task.title}`}
                          >
                            <PencilIcon />
                          </Button>
                        }
                      />
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={terminal}
                        aria-label={`Eliminar ${task.title}`}
                        onClick={() => setTaskToDelete(task)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                    {index < goal.tasks.length - 1 ? <Separator /> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revisiones</CardTitle>
              <CardDescription>
                Qué funcionó, qué no y cuáles son las siguientes acciones.
              </CardDescription>
              <CardAction className="flex gap-2">
                <GoalReviewsDialog
                  goalId={goalId}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Ver historial
                    </Button>
                  }
                />
                <GoalReviewDialog
                  goalId={goalId}
                  trigger={
                    <Button variant="outline" size="sm">
                      <PlusIcon data-icon="inline-start" />
                      Nueva revisión
                    </Button>
                  }
                />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {goal.reviews.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Todavía no hay revisiones.
                </p>
              ) : (
                goal.reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <CalendarIcon aria-hidden="true" className="size-4" />
                        {review.localDate}
                      </p>
                    </div>
                    <p className="mt-3 text-sm">{review.whatWorked}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Siguiente: {review.nextActions}
                    </p>
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <aside className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Tareas</CardTitle>
              <CardDescription>
                Resumen de la programación actual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl font-semibold">
                {goal.tasks.filter((task) => task.isActive).length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                activas de {goal.tasks.length} tareas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
                Revisa el rumbo
              </CardTitle>
              <CardDescription>
                Registra aprendizajes y ajusta las siguientes acciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoalReviewDialog
                goalId={goalId}
                trigger={<Button className="w-full">Revisar ahora</Button>}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
      <AlertDialog open={deleteGoalOpen} onOpenChange={setDeleteGoalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la meta y no podrás recuperarla desde esta pantalla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGoal.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteGoal.isPending}
              onClick={() => deleteGoal.mutate()}
            >
              {deleteGoal.isPending ? <Spinner /> : null}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteTask.isPending) setTaskToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              {taskToDelete
                ? `Se eliminará “${taskToDelete.title}”.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTask.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteTask.isPending}
              onClick={() => taskToDelete && deleteTask.mutate(taskToDelete.id)}
            >
              {deleteTask.isPending ? <Spinner /> : null}Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
