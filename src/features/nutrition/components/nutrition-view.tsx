"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
  UtensilsIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { PageHeader } from "@/components/shared/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useServerMutation as useMutation } from "@/hooks/use-server-mutation";
import { throwActionError } from "@/lib/action-error";
import { deleteNutritionEntryFn } from "../actions";
import {
  formatNutritionDate,
  mealLabels,
  shiftLocalDate,
} from "../model/nutrition";
import type { NutritionEntry } from "../schemas";
import { NutritionEntryDialog } from "./nutrition-entry-dialog";

type NutritionViewProps = {
  date: string;
  today: string;
  entries: NutritionEntry[];
  nextCursor: string | null;
};

function formatQuantity(entry: NutritionEntry) {
  return `${entry.quantity.toLocaleString("es-BO")} ${entry.unit}`;
}

export function NutritionView({
  date,
  today,
  entries,
  nextCursor,
}: NutritionViewProps) {
  const router = useRouter();
  const onDateChange = (nextDate: string) =>
    router.replace(`/nutrition?date=${nextDate}`);
  const [deleteTarget, setDeleteTarget] = useState<NutritionEntry | null>(null);
  const totalCalories = entries.reduce(
    (total, entry) => total + entry.calories,
    0,
  );
  const deleteEntry = useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteNutritionEntryFn({ data: { id } });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onSuccess: async () => {
      setDeleteTarget(null);
    },
  });

  return (
    <>
      <PageHeader
        title="Nutrición"
        description="Lleva un registro sencillo de tus comidas y calorías por día."
        actions={date === today ? <NutritionEntryDialog /> : null}
      />
      <div className="mb-5 flex flex-col gap-2 rounded-2xl border bg-card p-2 sm:flex-row sm:items-center">
        <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Día anterior"
            onClick={() => onDateChange(shiftLocalDate(date, -1))}
          >
            <ChevronLeftIcon />
          </Button>
          <div className="min-w-0 px-2 text-center" aria-live="polite">
            <p className="truncate text-sm font-semibold first-letter:uppercase">
              {date === today ? "Hoy" : formatNutritionDate(date)}
            </p>
            <p className="text-xs text-muted-foreground">
              {entries.length} {entries.length === 1 ? "registro" : "registros"}{" "}
              en esta página
            </p>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Día siguiente"
            disabled={date >= today}
            onClick={() => onDateChange(shiftLocalDate(date, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        {date !== today ? (
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            size="sm"
            onClick={() => onDateChange(today)}
          >
            Hoy
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro del día</CardTitle>
          <CardDescription>
            Todas las entradas incluyen calorías.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {totalCalories.toLocaleString("es-BO")} kcal en esta página
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col">
          {entries.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UtensilsIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No hay alimentos registrados</EmptyTitle>
                <EmptyDescription>
                  {date === today
                    ? "Añade tu primera comida para comenzar el registro de hoy."
                    : "No se registraron alimentos en esta fecha."}
                </EmptyDescription>
              </EmptyHeader>
              {date === today ? (
                <EmptyContent>
                  <NutritionEntryDialog />
                </EmptyContent>
              ) : null}
            </Empty>
          ) : (
            entries.map((entry, index) => (
              <div key={entry.id}>
                <article className="flex items-center gap-3 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
                    <UtensilsIcon aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{entry.name}</h2>
                      <Badge variant="outline">
                        {mealLabels[entry.mealType]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatQuantity(entry)}
                    </p>
                  </div>
                  <p className="hidden text-sm font-semibold sm:block">
                    {entry.calories.toLocaleString("es-BO")} kcal
                  </p>
                  <NutritionEntryDialog
                    entry={entry}
                    trigger={
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Editar ${entry.name}`}
                      >
                        <PencilIcon />
                      </Button>
                    }
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Eliminar ${entry.name}`}
                    onClick={() => {
                      deleteEntry.reset();
                      setDeleteTarget(entry);
                    }}
                  >
                    <Trash2Icon />
                  </Button>
                </article>
                {index < entries.length - 1 ? <Separator /> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CursorPagination nextCursor={nextCursor} />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteEntry.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Eliminar alimento</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.name}” se eliminará del registro de este día. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteEntry.error ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteEntry.error instanceof Error
                ? deleteEntry.error.message
                : "No se pudo eliminar el alimento."}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEntry.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!deleteTarget || deleteEntry.isPending}
              onClick={() => {
                if (deleteTarget) deleteEntry.mutate(deleteTarget.id);
              }}
            >
              {deleteEntry.isPending ? <Spinner /> : null}
              {deleteEntry.isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
