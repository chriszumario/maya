"use client";

import {
  CalendarClockIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleCheckBigIcon,
  MailIcon,
  UserRoundXIcon,
  XIcon,
} from "lucide-react";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useServerMutation as useMutation } from "@/hooks/use-server-mutation";
import { throwActionError } from "@/lib/action-error";
import { parseApiTimestamp } from "@/lib/local-date";
import { approveUserFn, rejectUserFn } from "../actions";
import type { AdminUser } from "../schemas";

function RejectUserDialog({
  name,
  onReject,
  disabled,
  isPending,
}: {
  name: string;
  onReject: () => void;
  disabled: boolean;
  isPending: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" className="flex-1" disabled={disabled}>
            <XIcon data-icon="inline-start" />
            Rechazar
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <UserRoundXIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Rechazar solicitud</AlertDialogTitle>
          <AlertDialogDescription>
            La cuenta de {name} será eliminada. Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onReject}
            disabled={disabled}
          >
            {isPending ? <Spinner /> : null}
            {isPending ? "Rechazando…" : "Rechazar cuenta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminPendingView({
  pendingUsers,
  nextCursor,
}: {
  pendingUsers: AdminUser[];
  nextCursor: string | null;
}) {
  const pendingAction = useMutation({
    mutationFn: async ({
      action,
      userId,
    }: {
      action: "approve" | "reject";
      userId: number;
    }) => {
      const result =
        action === "approve"
          ? await approveUserFn({ data: { userId } })
          : await rejectUserFn({ data: { userId } });

      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
  });
  const activeAction = pendingAction.isPending
    ? pendingAction.variables
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Administración / Aprobaciones"
        title="Solicitudes pendientes"
        description="Verifica la identidad antes de habilitar el acceso. Aprobar activa la cuenta; rechazar elimina la solicitud."
      />
      <div className="mb-5 rounded-2xl border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">
            {pendingUsers.length}{" "}
            {pendingUsers.length === 1 ? "solicitud" : "solicitudes"}
          </strong>{" "}
          {pendingUsers.length === 1 ? "espera" : "esperan"} una decisión en
          esta página.
        </p>
      </div>
      {pendingAction.error ? (
        <Alert variant="destructive" className="mb-5">
          <CircleAlertIcon />
          <AlertTitle>No se pudo completar la acción</AlertTitle>
          <AlertDescription>
            {pendingAction.error instanceof Error
              ? pendingAction.error.message
              : "Inténtalo nuevamente."}
          </AlertDescription>
        </Alert>
      ) : null}
      {pendingUsers.length === 0 ? (
        <Card className="items-center py-12 text-center">
          <CardContent className="flex max-w-md flex-col items-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CircleCheckBigIcon className="size-6" aria-hidden="true" />
            </div>
            <CardTitle>No hay solicitudes pendientes</CardTitle>
            <CardDescription className="mt-2">
              Las nuevas cuentas que requieran aprobación aparecerán aquí.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <section
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Usuarios pendientes"
        >
          {pendingUsers.map((user) => (
            <Card key={user.id} aria-busy={activeAction?.userId === user.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant="outline">Pendiente</Badge>
                </div>
                <CardTitle className="mt-4">{user.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MailIcon aria-hidden="true" className="size-3" />
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClockIcon aria-hidden="true" className="size-4" />
                  Solicitó acceso el{" "}
                  {parseApiTimestamp(user.createdAt).toLocaleDateString(
                    "es-BO",
                  )}
                </p>
              </CardContent>
              <CardFooter className="gap-2 border-t">
                <RejectUserDialog
                  name={user.name}
                  disabled={pendingAction.isPending}
                  isPending={
                    activeAction?.userId === user.id &&
                    activeAction.action === "reject"
                  }
                  onReject={() =>
                    pendingAction.mutate({
                      action: "reject",
                      userId: user.id,
                    })
                  }
                />
                <Button
                  className="flex-1"
                  disabled={pendingAction.isPending}
                  onClick={() =>
                    pendingAction.mutate({
                      action: "approve",
                      userId: user.id,
                    })
                  }
                >
                  {activeAction?.userId === user.id &&
                  activeAction.action === "approve" ? (
                    <Spinner />
                  ) : (
                    <CheckIcon data-icon="inline-start" />
                  )}
                  {activeAction?.userId === user.id &&
                  activeAction.action === "approve"
                    ? "Aprobando…"
                    : "Aprobar"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      )}
      <CursorPagination nextCursor={nextCursor} />
    </>
  );
}
