import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  Clock3Icon,
  LightbulbIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  UtensilsIcon,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Insights } from "@/features/insights/schemas/insights.schema";
import { cn } from "@/lib/utils";
import {
  formatLongDate,
  formatMinutes,
  goalStatusLabels,
  taskStatusLabels,
} from "../model/dashboard";
import type { DashboardSummary } from "../schemas/dashboard.schema";

const statusColors = [
  "bg-muted-foreground/35",
  "bg-chart-2",
  "bg-primary",
  "bg-destructive/55",
];

function AggregateDistribution({
  title,
  description,
  total,
  items,
}: {
  title: string;
  description: string;
  total: number;
  items: Array<{ label: string; value: number }>;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Badge variant="outline">{total} en total</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {total === 0 ? (
          <Alert>
            <CheckCircle2Icon aria-hidden="true" />
            <AlertTitle>No hay datos para este día</AlertTitle>
            <AlertDescription>
              La API no encontró elementos que incluir en este resumen.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div
              className="flex h-3 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Distribución de ${title.toLowerCase()}`}
            >
              {items.map((item, index) =>
                item.value > 0 ? (
                  <span
                    key={item.label}
                    className={cn("h-full min-w-1", statusColors[index])}
                    style={{ width: `${(item.value / total) * 100}%` }}
                    title={`${item.label}: ${item.value}`}
                  />
                ) : null,
              )}
            </div>
            <div className="grid gap-x-5 gap-y-1 sm:grid-cols-2">
              {items.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 border-b py-3 last:border-b-0 sm:nth-last-2:border-b-0"
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      statusColors[index],
                    )}
                  />
                  <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <strong className="text-sm tabular-nums">{item.value}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InsightsPreview({ insights }: { insights?: Insights }) {
  if (!insights) return null;
  const highestAlert = [...insights.alerts].sort(
    (a, b) =>
      ({ critical: 3, warning: 2, info: 1 })[b.severity] -
      { critical: 3, warning: 2, info: 1 }[a.severity],
  )[0];

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <SparklesIcon aria-hidden="true" />
        </div>
        <CardTitle>Tu lectura de {insights.periodDays} días</CardTitle>
        <CardDescription>
          Señales útiles para avanzar con intención, sin ruido.
        </CardDescription>
        <CardAction>
          <Link
            href="/insights"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver insights
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        {highestAlert ? (
          <Alert
            variant={
              highestAlert.severity === "critical" ? "destructive" : "default"
            }
          >
            <TrendingUpIcon aria-hidden="true" />
            <AlertTitle>
              {highestAlert.severity === "critical"
                ? "Requiere atención"
                : "Señal reciente"}
            </AlertTitle>
            <AlertDescription>{highestAlert.message}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle2Icon aria-hidden="true" />
            <AlertTitle>Sin alertas activas</AlertTitle>
            <AlertDescription>
              No se detectaron señales que requieran atención.
            </AlertDescription>
          </Alert>
        )}
        {insights.recommendations[0] ? (
          <Alert>
            <LightbulbIcon aria-hidden="true" />
            <AlertTitle>Siguiente paso sugerido</AlertTitle>
            <AlertDescription>
              {insights.recommendations[0].message}
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType;
}) {
  return (
    <Card size="sm" className="h-full shadow-sm">
      <CardHeader className="grid grid-cols-[1fr_auto] items-start">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-2 font-heading text-3xl font-semibold tracking-tight">
            {value}
          </CardTitle>
        </div>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-muted text-primary">
          <Icon aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

function DailyCheckIn({ summary }: { summary: DashboardSummary }) {
  const items = [
    {
      label: "Diario",
      detail: summary.checkIn.journalRecorded
        ? "Tu reflexión de hoy está registrada."
        : "Dedica un momento a registrar cómo estás.",
      to: "/journal" as const,
      action: summary.checkIn.journalRecorded ? "Ver entrada" : "Escribir",
      icon: BookOpenIcon,
      complete: summary.checkIn.journalRecorded,
    },
    {
      label: "Nutrición",
      detail: `${summary.checkIn.mealsLogged} registros · ${summary.checkIn.caloriesLogged.toLocaleString("es-BO")} kcal`,
      to: "/nutrition" as const,
      action: "Completar",
      icon: UtensilsIcon,
      complete: summary.checkIn.mealsLogged > 0,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Check-in del día</CardTitle>
        <CardDescription>
          Pequeños registros para cuidar el panorama completo.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="grid gap-3 rounded-3xl border bg-muted/20 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-2xl",
                item.complete
                  ? "bg-primary/12 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <item.icon aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{item.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </div>
            <Link
              href={item.to}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "justify-self-start sm:justify-self-auto",
              })}
            >
              {item.action}
            </Link>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardContent({
  summary,
  insights,
  userName,
}: {
  summary: DashboardSummary;
  insights?: Insights;
  userName: string;
}) {
  const activeGoals = summary.goals.pending + summary.goals.inProgress;
  const taskItems = [
    { label: taskStatusLabels.pending, value: summary.tasks.pending },
    { label: taskStatusLabels.inProgress, value: summary.tasks.inProgress },
    { label: taskStatusLabels.completed, value: summary.tasks.completed },
  ];
  const goalItems = [
    { label: goalStatusLabels.pending, value: summary.goals.pending },
    { label: goalStatusLabels.inProgress, value: summary.goals.inProgress },
    { label: goalStatusLabels.completed, value: summary.goals.completed },
    { label: goalStatusLabels.cancelled, value: summary.goals.cancelled },
  ];

  return (
    <>
      <PageHeader
        eyebrow={formatLongDate(summary.date)}
        title={`Hola, ${userName}`}
        description="Aquí tienes lo esencial para decidir dónde poner tu energía hoy."
        actions={
          <Link href="/today" className={buttonVariants()}>
            Abrir mi día
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        }
      />
      {!summary.metricsAvailable ? (
        <Alert className="mb-5">
          <Clock3Icon aria-hidden="true" />
          <AlertTitle>Datos históricos no disponibles</AlertTitle>
          <AlertDescription>
            La API no tiene un snapshot de tareas para esta fecha. Los ceros no
            representan necesariamente inactividad.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Card className="dashboard-hero min-h-80 text-hero-foreground shadow-lg ring-0">
          <CardContent className="grid h-full gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="flex h-full max-w-2xl flex-col">
              <Badge className="w-fit border-hero-foreground/15 bg-hero-foreground/10 text-hero-foreground">
                <CheckCircle2Icon data-icon="inline-start" aria-hidden="true" />
                Ritmo de hoy
              </Badge>
              <p className="mt-8 font-heading text-6xl leading-none font-semibold tracking-tight sm:text-7xl">
                {summary.tasks.completionRate}%
              </p>
              <h2 className="mt-3 text-xl font-semibold">
                {summary.tasks.completed} de {summary.tasks.total} tareas
                completadas
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-hero-foreground/72">
                Avanza a un ritmo sostenible. Tu siguiente acción está a un
                clic.
              </p>
              <div className="mt-auto pt-8">
                <div className="h-2 overflow-hidden rounded-full bg-hero-foreground/15">
                  <div
                    className="h-full rounded-full bg-hero-foreground transition-[width] duration-500"
                    style={{ width: `${summary.tasks.completionRate}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-hero-foreground/65">
                  {summary.tasks.pending} pendientes ·{" "}
                  {summary.tasks.inProgress} en curso
                </p>
              </div>
            </div>
            <Link
              href="/today"
              className={buttonVariants({
                variant: "secondary",
                className: "w-full md:w-auto",
              })}
            >
              Continuar mi día
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <section
          aria-label="Indicadores principales"
          className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1"
        >
          <MetricCard
            label="Objetivos activos"
            value={String(activeGoals)}
            detail={`${summary.goals.completionRate}% de tus metas ya están completadas`}
            icon={TargetIcon}
          />
          <MetricCard
            label="Tiempo enfocado"
            value={formatMinutes(summary.tasks.completedMinutes)}
            detail={`de ${formatMinutes(summary.tasks.plannedMinutes)} planificados`}
            icon={Clock3Icon}
          />
          <MetricCard
            label="Nutrición"
            value={`${summary.checkIn.caloriesLogged.toLocaleString("es-BO")} kcal`}
            detail={`${summary.checkIn.mealsLogged} registros realizados hoy`}
            icon={UtensilsIcon}
          />
        </section>
      </div>

      <section className="mt-8" aria-labelledby="panorama-title">
        <div className="mb-4">
          <h2
            id="panorama-title"
            className="font-heading text-2xl font-semibold tracking-tight"
          >
            Panorama
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Una vista rápida del estado de tus tareas y metas.
          </p>
        </div>
        <div className="grid items-stretch gap-4 xl:grid-cols-2">
          <AggregateDistribution
            title="Estado de las tareas"
            description="Lo que está pendiente, en curso o ya resuelto."
            total={summary.tasks.total}
            items={taskItems}
          />
          <AggregateDistribution
            title="Estado de las metas"
            description="Cómo se distribuyen tus objetivos actuales."
            total={summary.goals.total}
            items={goalItems}
          />
        </div>
      </section>

      <div className="mt-8 grid items-stretch gap-4 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.2fr)]">
        <DailyCheckIn summary={summary} />
        <InsightsPreview insights={insights} />
      </div>
    </>
  );
}
