import { CheckCircle2Icon, MailCheckIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PendingApprovalView() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-primary">
            <MailCheckIcon aria-hidden="true" />
          </span>
          <CardTitle className="mt-4 font-heading text-3xl">
            <h1>Solicitud recibida</h1>
          </CardTitle>
          <CardDescription>
            Tu cuenta fue creada correctamente y está pendiente de aprobación
            administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2Icon aria-hidden="true" />
            <AlertTitle>No necesitas registrarte otra vez</AlertTitle>
            <AlertDescription>
              Cuando un administrador active tu cuenta podrás iniciar sesión con
              el mismo correo y contraseña.
            </AlertDescription>
          </Alert>
          <ol className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">1.</strong> El administrador
              revisa tu solicitud.
            </li>
            <li>
              <strong className="text-foreground">2.</strong> Tu cuenta se
              activa.
            </li>
            <li>
              <strong className="text-foreground">3.</strong> Inicias sesión
              normalmente.
            </li>
          </ol>
        </CardContent>
        <CardFooter className="justify-center border-t">
          <Link href="/login" className={buttonVariants()}>
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
