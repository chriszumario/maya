import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthFormFallback } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
export const metadata: Metadata = { title: "Solicitar acceso" };

async function RegisterContent() {
  if (await readSessionUser()) redirect("/");
  return <RegisterForm />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthFormFallback title="Solicita tu acceso" />}>
      <RegisterContent />
    </Suspense>
  );
}
