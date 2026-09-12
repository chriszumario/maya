import {
  ChartNoAxesCombinedIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  TargetIcon,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { MayaMark } from "@/components/maya-mark";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function AuthBrand() {
  return (
    <Link
      href="/login"
      className="inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <MayaMark className="size-11" />
      <span>
        <span className="block font-heading text-2xl leading-none font-semibold">
          Maya
        </span>
        <span className="mt-1 block text-[0.62rem] font-bold tracking-[0.18em] uppercase opacity-65">
          Sistema personal
        </span>
      </span>
    </Link>
  );
}

type StoryFeatureProps = {
  icon: ComponentType;
  label: string;
  description: string;
};

function StoryFeature({ icon: Icon, label, description }: StoryFeatureProps) {
  return (
    <div className="flex items-start gap-3 border-t border-white/15 pt-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/8">
        <Icon aria-hidden="true" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed opacity-60">
          {description}
        </span>
      </span>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(30rem,0.95fr)]">
      <section className="auth-story relative hidden min-h-svh overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14 2xl:p-16">
        <div className="auth-orbit auth-orbit-top" aria-hidden="true" />
        <div className="auth-orbit auth-orbit-bottom" aria-hidden="true" />
        <div className="relative">
          <AuthBrand />
        </div>

        <div className="relative my-auto max-w-2xl py-12">
          <p className="text-xs font-bold tracking-[0.18em] uppercase opacity-65">
            Vive con intención
          </p>
          <h1 className="mt-6 max-w-xl font-heading text-5xl leading-[1.02] font-semibold text-balance xl:text-6xl 2xl:text-7xl">
            Haz espacio para la vida que quieres construir.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 opacity-70 xl:text-lg">
            Maya reúne tus metas, hábitos y reflexiones en un sistema sereno
            para avanzar con claridad cada día.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-5">
          <StoryFeature
            icon={TargetIcon}
            label="Enfoque"
            description="Prioriza lo que sí importa."
          />
          <StoryFeature
            icon={ChartNoAxesCombinedIcon}
            label="Progreso"
            description="Observa tus avances reales."
          />
          <StoryFeature
            icon={ShieldCheckIcon}
            label="Privacidad"
            description="Tus datos permanecen protegidos."
          />
        </div>
      </section>

      <section className="relative flex min-h-svh items-center justify-center px-5 py-7 sm:px-10 sm:py-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-116">
          <div className="mb-10 lg:hidden">
            <AuthBrand />
          </div>
          {children}
          <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-relaxed text-muted-foreground">
            <LockKeyholeIcon aria-hidden="true" className="size-3.5 shrink-0" />
            <span>Sesión cifrada y protegida en este dispositivo.</span>
          </div>
        </div>
      </section>
    </main>
  );
}

type AuthPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthPanel({
  title,
  description,
  children,
  footer,
}: AuthPanelProps) {
  return (
    <Card className="sm:[--card-spacing:--spacing(7)]">
      <CardHeader>
        <div className="mb-3">
          <Badge variant="secondary">
            <ShieldCheckIcon aria-hidden="true" />
            Acceso seguro
          </Badge>
        </div>
        <CardTitle>
          <h2 className="font-heading text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            {title}
          </h2>
        </CardTitle>
        <CardDescription className="max-w-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="flex-wrap justify-center gap-1 border-t text-sm text-muted-foreground">
        {footer}
      </CardFooter>
    </Card>
  );
}

export function AuthFormFallback({ title }: { title: string }) {
  return (
    <AuthLayout>
      <AuthPanel
        title={title}
        description="Preparando un acceso seguro…"
        footer={<span>Cargando…</span>}
      >
        <div className="flex flex-col gap-5" aria-hidden="true">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </AuthPanel>
    </AuthLayout>
  );
}
