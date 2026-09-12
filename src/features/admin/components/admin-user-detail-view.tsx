"use client";

import {
  ArrowLeftIcon,
  CircleAlertIcon,
  Clock3Icon,
  KeyRoundIcon,
  ShieldAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServerMutation as useMutation } from "@/hooks/use-server-mutation";
import { throwActionError } from "@/lib/action-error";
import { revokeUserSessionsFn } from "../actions";
import type { ActiveSession, AdminUser } from "../schemas";

export function AdminUserDetailView({
  userId,
  user,
  activeSessions,
}: {
  userId: number;
  user: AdminUser;
  activeSessions: ActiveSession[];
}) {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const revokeSessions = useMutation({
    mutationFn: async () => {
      const result = await revokeUserSessionsFn({ data: { userId } });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onSuccess: async () => {
      setRevokeDialogOpen(false);
    },
  });
  const hasActiveSessions = activeSessions.length > 0;
  return (
    <>
      <Link
        href="/admin/users"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-5",
        })}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Volver a usuarios
      </Link>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-3xl font-semibold">
                {user.name}
              </h1>
              {user.isAdmin ? <Badge>Admin</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.email} · Usuario #{user.id}
            </p>
          </div>
        </div>
        <Badge variant={user.isActive ? "secondary" : "outline"}>
          {user.isActive ? "Cuenta activa" : "Pendiente"}
        </Badge>
      </div>
      <Alert className="mb-5">
        <ShieldAlertIcon />
        <AlertTitle>Las sesiones contienen credenciales revocables</AlertTitle>
        <AlertDescription>
          No se muestra el token. Sólo el identificador de familia y sus fechas
          operativas.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Sesiones activas</CardTitle>
          <CardDescription>
            Refresh token families asociadas a esta cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Familia</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-mono text-xs">
                    {session.familyId}
                  </TableCell>
                  <TableCell>
                    {new Date(session.createdAt).toLocaleString("es-BO")}
                  </TableCell>
                  <TableCell>
                    {new Date(session.expiresAt).toLocaleDateString("es-BO")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Clock3Icon />
                      Activa
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AlertDialog
            open={revokeDialogOpen}
            onOpenChange={(open) => {
              if (revokeSessions.isPending) return;
              if (open) revokeSessions.reset();
              setRevokeDialogOpen(open);
            }}
          >
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  className="mt-5"
                  disabled={!hasActiveSessions || revokeSessions.isPending}
                >
                  <KeyRoundIcon data-icon="inline-start" />
                  {hasActiveSessions
                    ? "Revocar todas las sesiones"
                    : "No hay sesiones activas"}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <KeyRoundIcon />
                </AlertDialogMedia>
                <AlertDialogTitle>Revocar todas las sesiones</AlertDialogTitle>
                <AlertDialogDescription>
                  {user.name} deberá iniciar sesión nuevamente en todos sus
                  dispositivos. La cuenta no será eliminada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {revokeSessions.error ? (
                <Alert variant="destructive">
                  <CircleAlertIcon />
                  <AlertTitle>No se pudieron revocar las sesiones</AlertTitle>
                  <AlertDescription>
                    {revokeSessions.error instanceof Error
                      ? revokeSessions.error.message
                      : "Inténtalo nuevamente."}
                  </AlertDescription>
                </Alert>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={revokeSessions.isPending}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={!hasActiveSessions || revokeSessions.isPending}
                  onClick={() => revokeSessions.mutate()}
                >
                  {revokeSessions.isPending ? <Spinner /> : null}
                  {revokeSessions.isPending ? "Revocando…" : "Revocar sesiones"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
