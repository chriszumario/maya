"use client";

import {
  AppleIcon,
  BookOpenIcon,
  CheckIcon,
  CircleGaugeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SunIcon,
  TargetIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useState,
  useTransition,
} from "react";

import { MayaMark } from "@/components/maya-mark";
import { IntentPrefetchLink as Link } from "@/components/shared/intent-prefetch-link";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { logoutAction } from "@/features/auth/actions";
import type { AuthUser } from "@/features/auth/model/auth";
import { cn } from "@/lib/utils";

type NavigationItem = {
  label: string;
  to: Route;
  icon: ComponentType;
};

const personalNavigation: NavigationItem[] = [
  { label: "Inicio", icon: LayoutDashboardIcon, to: "/" },
  { label: "Mi día", icon: CircleGaugeIcon, to: "/today" },
  { label: "Metas", icon: TargetIcon, to: "/goals" },
  { label: "Diario", icon: BookOpenIcon, to: "/journal" },
  { label: "Nutrición", icon: AppleIcon, to: "/nutrition" },
  { label: "Insights", icon: TrendingUpIcon, to: "/insights" },
];

const adminNavigation: NavigationItem[] = [
  { label: "Resumen", icon: ShieldCheckIcon, to: "/admin" },
  { label: "Usuarios", icon: UsersIcon, to: "/admin/users" },
  {
    label: "Aprobaciones",
    icon: UserCheckIcon,
    to: "/admin/pending",
  },
];

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Maya, ir al inicio"
      className={cn(
        "flex items-center gap-3 rounded-xl p-1 outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/30",
        collapsed && "p-0",
      )}
    >
      <MayaMark className={collapsed ? "size-8" : undefined} />
      <span className={collapsed ? "hidden" : undefined}>
        <span className="block font-heading text-xl leading-none font-semibold">
          Maya
        </span>
        <span className="mt-1 block text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Vive con intención
        </span>
      </span>
    </Link>
  );
}

function NavigationGroup({
  label,
  items,
  mobile = false,
  collapsed = false,
}: {
  label: string;
  items: NavigationItem[];
  mobile?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-2">
      <p
        className={cn(
          "px-3 text-[0.68rem] font-bold tracking-[0.14em] text-muted-foreground uppercase",
          collapsed && "sr-only",
        )}
      >
        {label}
      </p>
      <nav aria-label={label} className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive =
            item.to === "/" || item.to === "/admin"
              ? pathname === item.to
              : pathname.startsWith(item.to);

          const linkClassName = buttonVariants({
            variant: "ghost",
            className: cn(
              "h-10 w-full justify-start gap-3 rounded-xl px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive &&
                "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
              mobile && "h-12",
              collapsed && "justify-center px-0",
            ),
          });
          const linkContent = (
            <>
              <item.icon data-icon="inline-start" aria-hidden="true" />
              <span className={collapsed ? "sr-only" : undefined}>
                {item.label}
              </span>
            </>
          );

          return collapsed && !mobile ? (
            <Tooltip key={item.to}>
              <TooltipTrigger
                render={
                  <Link
                    href={item.to}
                    aria-current={isActive ? "page" : undefined}
                    className={linkClassName}
                  />
                }
              >
                {linkContent}
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : mobile ? (
            <SheetClose
              key={item.to}
              render={
                <Link
                  href={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={linkClassName}
                />
              }
            >
              {linkContent}
            </SheetClose>
          ) : (
            <Link
              key={item.to}
              href={item.to}
              aria-current={isActive ? "page" : undefined}
              className={linkClassName}
            >
              {linkContent}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type AccountProps = {
  user: AuthUser;
};

function ProfileMenu({ user }: AccountProps) {
  const [isLoggingOut, startLogout] = useTransition();
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`Abrir menú de ${user.name}`}
                />
              }
            />
          }
        >
          <Avatar size="lg">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>Cuenta</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="bottom" align="end" className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="py-3">
            <span className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="truncate">{user.name}</span>
                  {user.isAdmin ? (
                    <Badge variant="secondary">Admin</Badge>
                  ) : null}
                </span>
                <span className="block truncate font-normal">{user.email}</span>
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <SettingsIcon aria-hidden="true" />
            Configuración
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            disabled={isLoggingOut}
            onClick={() => startLogout(() => logoutAction())}
          >
            {isLoggingOut ? <Spinner /> : <LogOutIcon aria-hidden="true" />}
            {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const themes = [
    { value: "light" as const, label: "Claro", icon: SunIcon },
    { value: "dark" as const, label: "Oscuro", icon: MoonIcon },
    { value: "system" as const, label: "Usar el sistema", icon: MonitorIcon },
  ];

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Cambiar tema"
                />
              }
            />
          }
        >
          <SunIcon
            aria-hidden="true"
            className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          />
          <MoonIcon
            aria-hidden="true"
            className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          />
          <span className="sr-only">Cambiar tema</span>
        </TooltipTrigger>
        <TooltipContent>Cambiar tema</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="bottom" align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Apariencia</DropdownMenuLabel>
          {themes.map((item) => (
            <DropdownMenuItem
              key={item.value}
              onClick={() => setTheme(item.value)}
            >
              <item.icon aria-hidden="true" />
              {item.label}
              {theme === item.value ? (
                <CheckIcon aria-hidden="true" className="ml-auto" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavigationContent({
  mobile = false,
  isAdmin,
  collapsed = false,
}: {
  mobile?: boolean;
  isAdmin: boolean;
  collapsed?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-6", collapsed && "gap-4")}>
      <NavigationGroup
        label="Tu espacio"
        items={personalNavigation}
        mobile={mobile}
        collapsed={collapsed}
      />
      {isAdmin ? (
        <>
          {collapsed ? <Separator className="bg-sidebar-border" /> : null}
          <NavigationGroup
            label="Administración"
            items={adminNavigation}
            mobile={mobile}
            collapsed={collapsed}
          />
        </>
      ) : null}
    </div>
  );
}

function Sidebar({
  isAdmin,
  collapsed,
}: {
  isAdmin: boolean;
  collapsed: boolean;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 hidden bg-sidebar px-3 py-4 text-sidebar-foreground transition-[width] duration-200 lg:flex lg:flex-col",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className={cn("px-1 py-1", collapsed && "flex justify-center")}>
        <Brand collapsed={collapsed} />
      </div>
      <div className="flex-1 overflow-y-auto px-1 pt-7">
        <NavigationContent isAdmin={isAdmin} collapsed={collapsed} />
      </div>
    </aside>
  );
}

function MobileNavigation({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" />}>
        <MenuIcon aria-hidden="true" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetClose
            render={
              <Link
                href="/"
                aria-label="Maya, ir al inicio"
                className="flex items-center gap-3 rounded-xl focus-visible:ring-2"
              />
            }
          >
            <MayaMark />
            <span className="font-heading text-xl font-semibold">Maya</span>
          </SheetClose>
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SheetDescription className="sr-only">
            Accede a todas las áreas de tu espacio personal.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-5">
          <NavigationContent mobile isAdmin={isAdmin} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WorkspaceHeader({
  sidebarCollapsed,
  onSidebarToggle,
  ...props
}: AccountProps & {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-sidebar/95 text-sidebar-foreground backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-7 xl:px-10">
        <div className="hidden lg:block">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onSidebarToggle}
                  aria-label={
                    sidebarCollapsed ? "Expandir menú" : "Contraer menú"
                  }
                />
              }
            >
              {sidebarCollapsed ? (
                <PanelLeftOpenIcon aria-hidden="true" />
              ) : (
                <PanelLeftCloseIcon aria-hidden="true" />
              )}
            </TooltipTrigger>
            <TooltipContent>
              {sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="lg:hidden">
          <MobileNavigation isAdmin={props.user.isAdmin} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeMenu />
          <ProfileMenu {...props} />
        </div>
      </div>
    </header>
  );
}

type AppShellProps = AccountProps & { children: ReactNode };

export function AppShell({ children, ...account }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const validateSession = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", validateSession);
    window.addEventListener("pageshow", validateSession);
    return () => {
      document.removeEventListener("visibilitychange", validateSession);
      window.removeEventListener("pageshow", validateSession);
    };
  }, [router]);

  return (
    <>
      <a href="#contenido-principal" className="skip-link">
        Saltar al contenido
      </a>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar isAdmin={account.user.isAdmin} collapsed={sidebarCollapsed} />
        <div
          className={cn(
            "transition-[padding] duration-200",
            sidebarCollapsed ? "lg:pl-20" : "lg:pl-64",
          )}
        >
          <WorkspaceHeader
            {...account}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={() =>
              setSidebarCollapsed((currentCollapsed) => !currentCollapsed)
            }
          />
          <main
            id="contenido-principal"
            tabIndex={-1}
            className="mx-auto max-w-360 px-4 py-6 sm:px-7 sm:py-8 xl:px-10"
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
