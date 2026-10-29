"use client";

import {
  Form,
  Field as FormischField,
  reset,
  type SubmitHandler,
  setErrors,
  useForm,
} from "@formisch/react";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PasswordInput } from "@/components/shared/password-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { loginAction } from "../actions";
import { safeInternalPath } from "../model/auth";
import { LoginSchema } from "../schemas/auth.schema";
import { AuthField } from "./auth-field";
import { AuthFormError } from "./auth-form-error";
import { AuthLayout, AuthPanel } from "./auth-layout";

export function LoginForm(props: { redirectTo?: string }) {
  const { bfcacheId } = useRouter();

  return <LoginFormContent key={bfcacheId} {...props} />;
}

function LoginFormContent({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const loginForm = useForm({
    schema: LoginSchema,
    initialInput: { email: "", password: "" },
    validate: "submit",
    revalidate: "input",
  });

  const handleSubmit: SubmitHandler<typeof LoginSchema> = async (output) => {
    setErrors(loginForm, { errors: null });
    const result = await loginAction({ data: output });
    if (!result.ok) {
      if (result.error.code === "PENDING_APPROVAL") {
        router.replace("/pending-approval");
        return;
      }
      setErrors(loginForm, { errors: [result.error.message] });
      return;
    }
    reset(loginForm, { initialInput: { email: "", password: "" } });
    router.replace(safeInternalPath(redirectTo) as Route);
  };

  return (
    <AuthLayout>
      <AuthPanel
        title="Bienvenido de nuevo"
        description="Continúa donde lo dejaste y vuelve a enfocarte en lo que importa."
        footer={
          <>
            ¿Aún no tienes cuenta?
            <Link
              href="/register"
              className={buttonVariants({ variant: "link", size: "sm" })}
            >
              Registrarme
            </Link>
          </>
        }
      >
        <Form of={loginForm} onSubmit={handleSubmit}>
          <FieldGroup>
            <AuthFormError errors={loginForm.errors} />
            <FormischField of={loginForm} path={["email"]}>
              {(field) => (
                <AuthField
                  id="login-email"
                  label="Correo electrónico"
                  errors={field.errors}
                >
                  <Input
                    {...field.props}
                    id="login-email"
                    type="email"
                    value={field.input ?? ""}
                    autoComplete="section-login email"
                    placeholder="tu@correo.com"
                    className="h-11 px-4"
                    aria-invalid={Boolean(field.errors)}
                    aria-describedby={
                      field.errors ? "login-email-error" : undefined
                    }
                  />
                </AuthField>
              )}
            </FormischField>
            <FormischField of={loginForm} path={["password"]}>
              {(field) => (
                <AuthField
                  id="login-password"
                  label="Contraseña"
                  errors={field.errors}
                  description="Usa las credenciales de tu cuenta aprobada."
                >
                  <PasswordInput
                    {...field.props}
                    id="login-password"
                    value={field.input ?? ""}
                    autoComplete="section-login current-password"
                    className="h-11"
                    aria-invalid={Boolean(field.errors)}
                    aria-describedby={
                      field.errors
                        ? "login-password-description login-password-error"
                        : "login-password-description"
                    }
                  />
                </AuthField>
              )}
            </FormischField>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loginForm.isSubmitting}
            >
              {loginForm.isSubmitting ? (
                <Spinner />
              ) : (
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              )}
              {loginForm.isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
            </Button>
          </FieldGroup>
        </Form>
      </AuthPanel>
    </AuthLayout>
  );
}
