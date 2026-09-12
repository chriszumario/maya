import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFormFallback } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";
import { readSessionUser } from "@/features/auth/server/auth-session.server";

export const metadata: Metadata = { title: "Iniciar sesión" };

async function LoginWithRedirect({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  if (await readSessionUser()) redirect("/");
  const value = (await searchParams).redirect;
  return (
    <LoginForm redirectTo={typeof value === "string" ? value : undefined} />
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthFormFallback title="Bienvenido de nuevo" />}>
      <LoginWithRedirect searchParams={searchParams} />
    </Suspense>
  );
}
