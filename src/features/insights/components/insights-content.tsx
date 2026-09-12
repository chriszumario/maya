import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CircleMinusIcon,
  Clock3Icon,
  LightbulbIcon,
  TargetIcon,
  TrendingUpIcon,
  UtensilsIcon,
} from "lucide-react";
import Link from "next/link";

import { IntentPrefetchLink } from "@/components/shared/intent-prefetch-link";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  formatMinutes,
  formatShortDate,
  goalStatusLabels,
  priorityLabels,
  severityLabels,
  sumSeries,
} from "../model/insights";
import type { DashboardTrends, Insights } from "../schemas/insights.schema";
import { RetryTrendsButton } from "./retry-trends-button";

const severityRank = { info: 1, warning: 2, critical: 3 } as const;

function TrendIcon({ direction }: { direction: "up" | "down" | "stable" }) {
  if (direction === "up") return <ArrowUpIcon aria-hidden="true" />;
  if (direction === "down") return <ArrowDownIcon aria-hidden="true" />;
  return <CircleMinusIcon aria-hidden="true" />;
}

function Interpretation({ insights }: { insights: Insights }) {
  const sortedAlerts = [...insights.alerts].sort(
    (a, b) => severityRank[b.severity] - severityRank[a.severity],
  );

  return (
    <>
      <section
        aria-label="Indicadores interpretativos"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Metas prioritarias"
          value={String(insights.priorities.length)}
          detail="Máximo tres metas activas"
          icon={TargetIcon}
        />
        <StatCard
          label="Alertas"
          value={String(insights.alerts.length)}
          detail={
            insights.alerts.length === 0
              ? "Sin señales de riesgo"
              : "Ordenadas por severidad"
          }
          icon={AlertTriangleIcon}
        />
        <StatCard
          label="Tendencia"
          value={
            insights.trends[0] ? `${Math.abs(insights.trends[0].change)}%` : "—"
          }
          detail={insights.trends[0]?.message ?? "Sin comparación disponible"}
          icon={TrendingUpIcon}
        />
        <StatCard
          label="Recomendaciones"
          value={String(insights.recommendations.length)}
          detail={`Ventana analizada: ${insights.periodDays} días`}
          icon={LightbulbIcon}
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Prioridades activas</CardTitle>
            <CardDescription>
              Metas ordenadas por prioridad y estado por la API.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {insights.priorities.length === 0 ? (
              <Alert>
                <CheckCircle2Icon aria-hidden="true" />
                <AlertTitle>Sin prioridades pendientes</AlertTitle>
                <AlertDescription>
                  No hay metas activas que requieran atención inmediata.
                </AlertDescription>
              </Alert>
            ) : (
              insights.priorities.map((priority) => (
                <IntentPrefetchLink
                  key={priority.goalId}
                  href={`/goals/${priority.goalId}`}
                  className="flex items-start gap-3 rounded-2xl border p-4 transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                    <TargetIcon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong>{priority.title}</strong>
                      <Badge variant="outline">
                        {priorityLabels[priority.priority]}
                      </Badge>
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {priority.reason}
                    </span>
                  </span>
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="mt-2 size-4 shrink-0 text-muted-foreground"
                  />
                </IntentPrefetchLink>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas y recomendaciones</CardTitle>
            <CardDescription>
              Las alertas se muestran antes que las acciones sugeridas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {sortedAlerts.length === 0 ? (
              <Alert>
                <CheckCircle2Icon aria-hidden="true" />
                <AlertTitle>Sin alertas activas</AlertTitle>
                <AlertDescription>
                  No se detectaron señales negativas en el período.
                </AlertDescription>
              </Alert>
            ) : (
              sortedAlerts.map((alert) => (
                <Alert
                  key={alert.code}
                  variant={
                    alert.severity === "critical" ? "destructive" : "default"
                  }
                >
                  <AlertTriangleIcon aria-hidden="true" />
                  <AlertTitle>{severityLabels[alert.severity]}</AlertTitle>
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))
            )}
            {insights.recommendations.map((recommendation) => (
              <Alert key={recommendation.code}>
                <LightbulbIcon aria-hidden="true" />
                <AlertTitle>Acción sugerida</AlertTitle>
                <AlertDescription>{recommendation.message}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      </div>

      {insights.trends.length > 0 ? (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Cambio reciente</CardTitle>
            <CardDescription>
              Los últimos siete días frente a los siete anteriores.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {insights.trends.map((trend) => (
              <div
                key={trend.code}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4",
                  trend.direction === "up" && "text-primary",
                  trend.direction === "down" && "text-destructive",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <TrendIcon direction={trend.direction} />
                </span>
                <div>
                  <p className="font-heading text-2xl font-semibold">
                    {Math.abs(trend.change)}%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {trend.message}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function barHeight(value: number, maxValue: number) {
  return value === 0 ? "0%" : `${Math.max(3, (value / maxValue) * 100)}%`;
}

function DailyTaskChart({ trends }: { trends: DashboardTrends }) {
  const maxValue = Math.max(
    ...trends.tasks.planned.map((point) => point.value),
    ...trends.tasks.pending.map((point) => point.value),
    ...trends.tasks.inProgress.map((point) => point.value),
    ...trends.tasks.completed.map((point) => point.value),
    1,
  );
  const labelStep = Math.max(1, Math.ceil(trends.period.days / 8));
  const hasData = sumSeries(trends.tasks.planned) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento diario de tareas</CardTitle>
        <CardDescription>
          Planificación y estado diario materializados por Today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <Alert>
            <CalendarDaysIcon aria-hidden="true" />
            <AlertTitle>Sin actividad de tareas</AlertTitle>
            <AlertDescription>
              No hay tareas planificadas en este rango.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex h-52 min-w-0 items-end gap-1">
              {trends.tasks.planned.map((point, index) => {
                const pending = trends.tasks.pending[index]?.value ?? 0;
                const inProgress = trends.tasks.inProgress[index]?.value ?? 0;
                const completed = trends.tasks.completed[index]?.value ?? 0;
                const rate = trends.tasks.completionRate[index];
                return (
                  <Tooltip key={point.date}>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          className="h-full min-w-0 flex-1 items-end gap-px px-0"
                          aria-label={`${point.date}: ${point.value} planificadas, ${pending} pendientes, ${inProgress} en progreso, ${completed} completadas, ${rate?.value ?? 0}% de cumplimiento`}
                        />
                      }
                    >
                      <span
                        className="w-1/5 rounded-t-sm bg-muted-foreground/30"
                        style={{
                          height: barHeight(point.value, maxValue),
                        }}
                      />
                      <span
                        className="w-1/5 rounded-t-sm bg-chart-2"
                        style={{
                          height: barHeight(pending, maxValue),
                        }}
                      />
                      <span
                        className="w-1/5 rounded-t-sm bg-chart-3"
                        style={{
                          height: barHeight(inProgress, maxValue),
                        }}
                      />
                      <span
                        className="w-1/5 rounded-t-sm bg-primary"
                        style={{
                          height: barHeight(completed, maxValue),
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatShortDate(point.date)} · {point.value} planificadas
                      · {pending} pendientes · {inProgress} en progreso ·{" "}
                      {completed} completadas · {rate?.value ?? 0}%
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <div className="mt-2 flex gap-1">
              {trends.tasks.planned.map((point, index) => (
                <span
                  key={point.date}
                  className="min-w-0 flex-1 truncate text-center text-[0.6rem] text-muted-foreground"
                >
                  {index % labelStep === 0 ? formatShortDate(point.date) : ""}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                Planificadas
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-chart-2" /> Pendientes
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-chart-3" /> En progreso
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary" /> Completadas
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function WorkloadChart({ trends }: { trends: DashboardTrends }) {
  const planned = sumSeries(trends.tasks.plannedMinutes);
  const completed = sumSeries(trends.tasks.completedMinutes);
  const maxValue = Math.max(
    ...trends.tasks.plannedMinutes.map((point) => point.value),
    ...trends.tasks.completedMinutes.map((point) => point.value),
    1,
  );
  const hasData = planned + completed > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga planificada frente a ejecutada</CardTitle>
        <CardDescription>
          Comparación diaria en minutos sobre la misma escala.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">
            {planned === 0 ? 0 : Math.round((completed / planned) * 100)}%
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Planificado</p>
            <p className="mt-1 font-heading text-2xl font-semibold">
              {formatMinutes(planned)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completado</p>
            <p className="mt-1 font-heading text-2xl font-semibold">
              {formatMinutes(completed)}
            </p>
          </div>
        </div>
        {hasData ? (
          <>
            <div className="flex h-40 items-end gap-1">
              {trends.tasks.plannedMinutes.map((point, index) => (
                <Tooltip key={point.date}>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        className="h-full min-w-0 flex-1 items-end gap-px px-0"
                        aria-label={`${point.date}: ${point.value} minutos planificados y ${trends.tasks.completedMinutes[index]?.value ?? 0} completados`}
                      />
                    }
                  >
                    <span
                      className="w-2/5 rounded-t-sm bg-muted-foreground/30"
                      style={{
                        height: barHeight(point.value, maxValue),
                      }}
                    />
                    <span
                      className="w-2/5 rounded-t-sm bg-chart-2"
                      style={{
                        height: barHeight(
                          trends.tasks.completedMinutes[index]?.value ?? 0,
                          maxValue,
                        ),
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatShortDate(point.date)} · {formatMinutes(point.value)}{" "}
                    /{" "}
                    {formatMinutes(
                      trends.tasks.completedMinutes[index]?.value ?? 0,
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="flex justify-end gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                Planificado
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-chart-2" />
                Completado
              </span>
            </div>
          </>
        ) : (
          <Alert>
            <Clock3Icon aria-hidden="true" />
            <AlertTitle>Sin minutos registrados</AlertTitle>
            <AlertDescription>
              No hay carga planificada o ejecutada en este rango.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function GoalDistribution({ trends }: { trends: DashboardTrends }) {
  const total = trends.goals.statusDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución actual de objetivos</CardTitle>
        <CardDescription>
          Estado actual; no representa el historial diario.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">{total} metas</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {trends.goals.statusDistribution.map((item) => (
          <div key={item.status}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{goalStatusLabels[item.status]}</span>
              <strong>{item.value}</strong>
            </div>
            <Progress value={total === 0 ? 0 : (item.value / total) * 100} />
          </div>
        ))}
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay objetivos para distribuir.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ActivitySummary({ trends }: { trends: DashboardTrends }) {
  const journals = sumSeries(trends.activity.journalEntries);
  const meals = sumSeries(trends.activity.mealsLogged);
  const calories = sumSeries(trends.activity.caloriesLogged);
  const goalsCompleted = sumSeries(trends.goals.completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad personal</CardTitle>
        <CardDescription>
          Totales del rango {formatShortDate(trends.period.from)} al{" "}
          {formatShortDate(trends.period.to)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border p-4">
          <BookOpenSummary value={journals} />
        </div>
        <div className="rounded-2xl border p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <UtensilsIcon aria-hidden="true" className="size-4" />
            Comidas registradas
          </p>
          <p className="mt-2 font-heading text-2xl font-semibold">{meals}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Calorías registradas</p>
          <p className="mt-2 font-heading text-2xl font-semibold">
            {calories.toLocaleString("es-BO")}
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Metas completadas</p>
          <p className="mt-2 font-heading text-2xl font-semibold">
            {goalsCompleted}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BookOpenSummary({ value }: { value: number }) {
  return (
    <>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDaysIcon aria-hidden="true" className="size-4" />
        Entradas de diario
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold">{value}</p>
    </>
  );
}

function TrendsSection({ trends }: { trends?: DashboardTrends }) {
  if (!trends) {
    return (
      <Alert variant="destructive" className="mt-5">
        <AlertTriangleIcon aria-hidden="true" />
        <AlertTitle>No se pudieron cargar las gráficas</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>Las tendencias no están disponibles.</span>
          <RetryTrendsButton />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="mt-5" aria-label="Tendencias agregadas">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            Tendencias de {trends.period.days} días
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Series agregadas por la API, incluidos los días sin registros.
          </p>
        </div>
        <Badge variant="outline">
          {trends.period.from} — {trends.period.to}
        </Badge>
      </div>
      {!trends.dataComplete ? (
        <Alert className="mb-5">
          <CalendarDaysIcon aria-hidden="true" />
          <AlertTitle>Hay fechas sin snapshot</AlertTitle>
          <AlertDescription>
            {trends.missingDates.length} fechas no tienen métricas históricas;
            sus valores cero representan datos ausentes.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <DailyTaskChart trends={trends} />
        <WorkloadChart trends={trends} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <GoalDistribution trends={trends} />
        <ActivitySummary trends={trends} />
      </div>
    </section>
  );
}

export function InsightsContent({
  insights,
  trends,
}: {
  insights: Insights;
  trends?: DashboardTrends;
}) {
  return (
    <>
      <PageHeader
        eyebrow={`Últimos ${insights.periodDays} días`}
        title="Patrones para decidir mejor"
        description="Primero señales accionables; después, series agregadas para observar tendencias."
        actions={
          <Link
            href="/goals"
            className={buttonVariants({ variant: "outline" })}
          >
            Revisar metas
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        }
      />
      {!insights.dataComplete ? (
        <Alert className="mb-5">
          <CalendarDaysIcon aria-hidden="true" />
          <AlertTitle>Período con datos incompletos</AlertTitle>
          <AlertDescription>
            Faltan snapshots para {insights.missingDates.length} fechas. Los
            puntos en cero no deben interpretarse como inactividad confirmada.
          </AlertDescription>
        </Alert>
      ) : null}
      <Interpretation insights={insights} />
      <TrendsSection trends={trends} />
    </>
  );
}
