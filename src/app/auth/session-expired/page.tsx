import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logoutAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Sesión finalizada" };

export default function SessionExpiredPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            <h1>Tu sesión ha finalizado</h1>
          </CardTitle>
          <CardDescription>
            Inicia sesión nuevamente para continuar en tu espacio.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <form action={logoutAction} className="w-full">
            <Button type="submit" className="w-full">
              Volver a iniciar sesión
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
