import {
  ActivityIcon,
  ArrowRightIcon,
  BotIcon,
  Clock3Icon,
  ListChecksIcon,
  NotebookPenIcon,
  ServerIcon,
  ShieldCheckIcon,
  TargetIcon,
  UserCheckIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { AdminStats } from "../schemas";

const numberFormatter = new Intl.NumberFormat("es-BO");

function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  return [
    days > 0 ? `${days} d` : null,
    hours > 0 ? `${hours} h` : null,
    `${minutes} min`,
  ]
    .filter(Boolean)
    .join(" ");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function AdminDashboardView({ stats }: { stats: AdminStats }) {
  const activePercentage =
    stats.users.total > 0
      ? Math.round((stats.users.active / stats.users.total) * 100)
      : 0;
  const activityMetrics = [
    { label: "Metas creadas", value: stats.activity.goals, icon: TargetIcon },
    {
      label: "Tareas creadas",
      value: stats.activity.tasks,
      icon: ListChecksIcon,
    },
    {
      label: "Entradas de diario",
      value: stats.activity.journalEntries,
      icon: NotebookPenIcon,
    },
    {
      label: "Registros de nutrición",
      value: stats.activity.nutritionEntries,
      icon: UtensilsIcon,
    },
  ];
  const taskExecutionMetrics = [
    {
      label: "Planificadas",
      value: stats.activity.taskExecution.planned,
      icon: ListChecksIcon,
    },
    {
      label: "Pendientes",
      value: stats.activity.taskExecution.pending,
      icon: Clock3Icon,
    },
    {
      label: "En progreso",
      value: stats.activity.taskExecution.inProgress,
      icon: ActivityIcon,
    },
    {
      label: "Completadas",
      value: stats.activity.taskExecution.completed,
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <>
      <PageHeader
        title="Estado general de Maya"
        description="Usuarios, actividad y estado del sistema con información actualizada por la API."
        actions={
          <Link href="/admin/pending" className={buttonVariants()}>
            Revisar {stats.users.pending}{" "}
            {stats.users.pending === 1 ? "solicitud" : "solicitudes"}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        }
      />
      <Alert className="mb-5">
        <ShieldCheckIcon />
        <AlertTitle>Estás en el espacio administrativo</AlertTitle>
        <AlertDescription>
          Los cambios de rol, aprobaciones y revocaciones afectan el acceso de
          otras personas.
        </AlertDescription>
      </Alert>
      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Estadísticas administrativas"
      >
        <StatCard
          label="Usuarios totales"
          value={numberFormatter.format(stats.users.total)}
          detail={`${numberFormatter.format(stats.users.admins)} administradores`}
          icon={UsersIcon}
        />
        <StatCard
          label="Usuarios activos"
          value={numberFormatter.format(stats.users.active)}
          detail={`${activePercentage}% del total`}
          icon={ActivityIcon}
        />
        <StatCard
          label="Pendientes"
          value={numberFormatter.format(stats.users.pending)}
          detail={
            stats.users.pending === 0
              ? "Sin solicitudes por revisar"
              : "Requieren una decisión"
          }
          icon={UserCheckIcon}
        />
        <StatCard
          label="Sesiones activas"
          value={numberFormatter.format(stats.system.activeSessions)}
          detail="En todas las cuentas"
          icon={Clock3Icon}
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Actividad de 30 días</CardTitle>
            <CardDescription>
              Volumen registrado por cada área del producto.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">Últimos 30 días</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {activityMetrics.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border p-4"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-primary">
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-heading text-2xl font-semibold">
                      {numberFormatter.format(value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <section className="border-t pt-5" aria-label="Ejecución de tareas">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Ejecución de tareas</h3>
                  <p className="text-xs text-muted-foreground">
                    Métricas diarias consolidadas por Today.
                  </p>
                </div>
                <Badge variant="outline">
                  {numberFormatter.format(
                    stats.activity.taskExecution.completedMinutes,
                  )}{" "}
                  de{" "}
                  {numberFormatter.format(
                    stats.activity.taskExecution.plannedMinutes,
                  )}{" "}
                  min
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {taskExecutionMetrics.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-2xl border p-4"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-primary">
                      <Icon aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-heading text-2xl font-semibold">
                        {numberFormatter.format(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios destacados</CardTitle>
            <CardDescription>
              Mayor actividad combinada en metas, diario y nutrición.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.topUsers.length === 0 ? (
              <Empty className="p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ActivityIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin actividad registrada</EmptyTitle>
                  <EmptyDescription>
                    El ranking aparecerá cuando existan registros recientes.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              stats.topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <Avatar>
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {numberFormatter.format(user.activityCount)} registros
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon aria-hidden="true" />
            Estado del sistema
          </CardTitle>
          <CardDescription>
            Información operativa reportada por la API.
          </CardDescription>
          <CardAction>
            <Badge>Conectada</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Servicio</p>
            <p className="mt-1 font-semibold">Maya API</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Versión</p>
            <p className="mt-1 font-semibold">{stats.system.version}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tiempo activa</p>
            <p className="mt-1 font-semibold">
              {formatUptime(stats.system.uptimeSeconds)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <BotIcon aria-hidden="true" />
              Inteligencia artificial
            </p>
            <Badge
              className="mt-1"
              variant={stats.system.aiConfigured ? "secondary" : "outline"}
            >
              {stats.system.aiConfigured ? "Configurada" : "No configurada"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
