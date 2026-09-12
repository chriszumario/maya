"use client";

import { ArrowRightIcon, PlusIcon, TargetIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { CursorPagination } from "@/components/shared/cursor-pagination";
import { IntentPrefetchLink } from "@/components/shared/intent-prefetch-link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { categoryLabels, priorityLabels, statusLabels } from "../model/goals";
import type { Goal, GoalListStatus } from "../schemas";
import { GoalFormDialog } from "./goal-form-dialog";

export function GoalsView({
  status,
  goals,
  nextCursor,
}: {
  status: GoalListStatus;
  goals: Goal[];
  nextCursor: string | null;
}) {
  const router = useRouter();
  const counts = {
    all: goals.length,
    pending: goals.filter((goal) => goal.status === "pending").length,
    in_progress: goals.filter((goal) => goal.status === "in_progress").length,
    completed: goals.filter((goal) => goal.status === "completed").length,
    cancelled: goals.filter((goal) => goal.status === "cancelled").length,
  };
  const visibleGoals =
    status === "all" ? goals : goals.filter((goal) => goal.status === status);
  const filters = [
    { label: "Activas", value: "in_progress" },
    { label: "Pendientes", value: "pending" },
    { label: "Completadas", value: "completed" },
    { label: "Canceladas", value: "cancelled" },
    { label: "Todas", value: "all" },
  ] as const;
  return (
    <>
      <PageHeader
        eyebrow="Metas"
        title="Dirección antes que velocidad"
        description="Cada meta agrupa tareas recurrentes, revisiones y el motivo que sostiene tu esfuerzo."
        actions={
          <GoalFormDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Nueva meta
              </Button>
            }
          />
        }
      />
      <fieldset className="mb-5 flex flex-wrap gap-2">
        <legend className="sr-only">Filtros de metas</legend>
        {filters.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={status === item.value ? "default" : "outline"}
            aria-pressed={status === item.value}
            onClick={() => router.replace(`/goals?status=${item.value}`)}
          >
            {item.label}
            <Badge variant="secondary">{counts[item.value]}</Badge>
          </Button>
        ))}
      </fieldset>
      <p className="mb-5 text-xs text-muted-foreground">
        Los conteos y filtros corresponden a la página actual.
      </p>
      <section
        className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3"
        aria-label="Lista de metas"
      >
        {visibleGoals.map((goal) => {
          return (
            <Card
              key={goal.id}
              className={cn(goal.priority === "high" && "goal-card-featured")}
            >
              <CardHeader>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-primary">
                    <TargetIcon aria-hidden="true" />
                  </span>
                  <Badge
                    variant={
                      goal.status === "in_progress" ? "secondary" : "outline"
                    }
                  >
                    {statusLabels[goal.status]}
                  </Badge>
                </div>
                <CardTitle>{goal.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {goal.motivation}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {categoryLabels[goal.category]}
                  </Badge>
                  <Badge variant="outline">
                    Prioridad {priorityLabels[goal.priority].toLowerCase()}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="border-t">
                <IntentPrefetchLink
                  href={`/goals/${goal.id}`}
                  className={buttonVariants({
                    variant: "ghost",
                    className: "ml-auto",
                  })}
                >
                  Abrir meta
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                </IntentPrefetchLink>
              </CardFooter>
            </Card>
          );
        })}
        {visibleGoals.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed p-10 text-center">
            <TargetIcon
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 font-semibold">No hay metas en este estado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cambia el filtro o crea una nueva meta.
            </p>
          </div>
        ) : null}
      </section>
      <CursorPagination nextCursor={nextCursor} />
    </>
  );
}
