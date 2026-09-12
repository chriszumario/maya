import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { readSessionUser } from "@/features/auth/server/auth-session.server";

type WorkspaceLayoutProps = { children: ReactNode };

async function AuthenticatedWorkspace({ children }: WorkspaceLayoutProps) {
  const user = await readSessionUser();
  if (!user) redirect("/login");
  return <AppShell user={user}>{children}</AppShell>;
}

function WorkspaceShellFallback() {
  return (
    <div
      className="min-h-screen bg-background"
      aria-label="Preparando tu espacio"
      role="status"
    />
  );
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}
