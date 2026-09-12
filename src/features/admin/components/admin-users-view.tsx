"use client";

import {
  CircleAlertIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SearchXIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { setAdminFn } from "../actions";
import type { AdminUser } from "../schemas";

const statusFilters = [
  { label: "Todos", value: "all" },
  { label: "Activos", value: "active" },
  { label: "Pendientes", value: "pending" },
  { label: "Administradores", value: "admin" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["value"];

function matchesStatus(user: AdminUser, status: StatusFilter) {
  switch (status) {
    case "active":
      return user.isActive;
    case "pending":
      return !user.isActive;
    case "admin":
      return user.isAdmin;
    default:
      return true;
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function AdminUsersView({
  adminUsers,
  currentUserId,
  nextCursor,
}: {
  adminUsers: AdminUser[];
  currentUserId: number;
  nextCursor: string | null;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const normalizedSearch = search.trim().toLocaleLowerCase("es-BO");
  const visibleUsers = adminUsers.filter(
    (user) =>
      matchesStatus(user, status) &&
      (normalizedSearch.length === 0 ||
        user.name.toLocaleLowerCase("es-BO").includes(normalizedSearch) ||
        user.email.toLocaleLowerCase("es-BO").includes(normalizedSearch)),
  );
  const filtersApplied = normalizedSearch.length > 0 || status !== "all";

  const changeRole = useMutation({
    mutationFn: async ({
      userId,
      isAdmin,
    }: {
      userId: number;
      isAdmin: boolean;
    }) => {
      const result = await setAdminFn({ data: { userId, isAdmin } });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onSuccess: async () => {
      setRoleTarget(null);
    },
  });

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
  };

  const openRoleDialog = (user: AdminUser) => {
    changeRole.reset();
    setRoleTarget(user);
  };

  return (
    <>
      <PageHeader
        title="Usuarios y permisos"
        description="Consulta las cuentas registradas, revisa su estado, administra permisos y accede a sus sesiones."
      />
      <Card>
        <CardHeader>
          <CardTitle>Directorio</CardTitle>
          <CardDescription>
            Mostrando {visibleUsers.length} de {adminUsers.length} usuarios en
            esta página.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar usuario"
                placeholder="Buscar en esta página"
              />
            </InputGroup>
            <Select
              items={statusFilters}
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
            >
              <SelectTrigger className="w-full" aria-label="Filtrar usuarios">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {statusFilters.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <SearchXIcon />
                        </EmptyMedia>
                        <EmptyTitle>
                          {filtersApplied
                            ? "No encontramos coincidencias"
                            : "No hay usuarios registrados"}
                        </EmptyTitle>
                        <EmptyDescription>
                          {filtersApplied
                            ? "Prueba otra búsqueda o restablece los filtros."
                            : "Las cuentas aparecerán aquí cuando se registren."}
                        </EmptyDescription>
                      </EmptyHeader>
                      {filtersApplied ? (
                        <EmptyContent>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                          >
                            Restablecer filtros
                          </Button>
                        </EmptyContent>
                      ) : null}
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                visibleUsers.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {initials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "secondary" : "outline"}
                        >
                          {user.isActive ? "Activo" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge>
                            <ShieldCheckIcon aria-hidden="true" />
                            Admin
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Usuario
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("es-BO")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button size="icon-sm" variant="ghost" />}
                          >
                            <MoreHorizontalIcon />
                            <span className="sr-only">
                              Acciones para {user.name}
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                render={
                                  <Link href={`/admin/users/${user.id}`} />
                                }
                              >
                                <UserRoundIcon />
                                Ver sesiones
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isCurrentUser || changeRole.isPending}
                                onClick={() => openRoleDialog(user)}
                              >
                                {user.isAdmin ? (
                                  <ShieldOffIcon />
                                ) : (
                                  <ShieldCheckIcon />
                                )}
                                {isCurrentUser
                                  ? "Tu rol no se puede modificar"
                                  : user.isAdmin
                                    ? "Quitar rol admin"
                                    : "Hacer administrador"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CursorPagination nextCursor={nextCursor} />
      <AlertDialog
        open={roleTarget !== null}
        onOpenChange={(open) => {
          if (!open && !changeRole.isPending) setRoleTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              {roleTarget?.isAdmin ? <ShieldOffIcon /> : <ShieldCheckIcon />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {roleTarget?.isAdmin
                ? "Quitar permisos administrativos"
                : "Conceder permisos administrativos"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleTarget?.isAdmin
                ? `${roleTarget.name} perderá el acceso a la administración y sus sesiones activas serán revocadas.`
                : `${roleTarget?.name ?? "Este usuario"} podrá administrar cuentas y sus sesiones activas serán revocadas.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {changeRole.error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>No se pudo cambiar el rol</AlertTitle>
              <AlertDescription>
                {changeRole.error instanceof Error
                  ? changeRole.error.message
                  : "Inténtalo nuevamente."}
              </AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changeRole.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!roleTarget || changeRole.isPending}
              onClick={() => {
                if (!roleTarget) return;
                changeRole.mutate({
                  userId: roleTarget.id,
                  isAdmin: !roleTarget.isAdmin,
                });
              }}
            >
              {changeRole.isPending ? <Spinner /> : null}
              {changeRole.isPending
                ? "Guardando…"
                : roleTarget?.isAdmin
                  ? "Quitar permisos"
                  : "Conceder permisos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
