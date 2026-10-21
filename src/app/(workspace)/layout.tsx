import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  LoadingHeader,
  LoadingRows,
  PageLoading,
} from "@/components/shared/page-loading";
import { readSessionUser } from "@/features/auth/server/auth-session.server";

type WorkspaceLayoutProps = { children: ReactNode };

async function AuthenticatedWorkspace({ children }: WorkspaceLayoutProps) {
  const user = await readSessionUser();
  if (!user) redirect("/login");
  return <AppShell user={user}>{children}</AppShell>;
}

function WorkspaceShellFallback() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-360 px-4 py-8 sm:px-7">
      <PageLoading label="tu espacio">
        <LoadingHeader />
        <LoadingRows />
      </PageLoading>
    </div>
  );
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <AuthenticatedWorkspace>{children}</AuthenticatedWorkspace>
    </Suspense>
  );
}
