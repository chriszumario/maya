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
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PasswordInput } from "@/components/shared/password-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { registerAction } from "../actions";
import { getClientTimezone } from "../model/auth";
import { RegisterFormSchema } from "../schemas/auth.schema";
import { AuthField } from "./auth-field";
import { AuthFormError } from "./auth-form-error";
import { AuthLayout, AuthPanel } from "./auth-layout";

export function RegisterForm() {
  const { bfcacheId } = useRouter();

  return <RegisterFormContent key={bfcacheId} />;
}

function RegisterFormContent() {
  const router = useRouter();
  const registerForm = useForm({
    schema: RegisterFormSchema,
    initialInput: { name: "", email: "", password: "" },
    validate: "submit",
    revalidate: "input",
  });

  const handleSubmit: SubmitHandler<typeof RegisterFormSchema> = async (
    output,
  ) => {
    setErrors(registerForm, { errors: null });
    setErrors(registerForm, { path: ["email"], errors: null });
    const result = await registerAction({
      data: { ...output, timezone: getClientTimezone() },
    });
    if (result.ok) {
      reset(registerForm, {
        initialInput: { name: "", email: "", password: "" },
      });
      router.replace("/pending-approval");
      return;
    }
    if (result.error.code === "EMAIL_IN_USE") {
      setErrors(registerForm, {
        path: ["email"],
        errors: [result.error.message],
      });
      return;
    }
    setErrors(registerForm, { errors: [result.error.message] });
  };

  return (
    <AuthLayout>
      <AuthPanel
        title="Crea tu cuenta"
        description="Solicita tu acceso. Un administrador revisará la cuenta antes de tu primer ingreso."
        footer={
          <>
            ¿Ya tienes una cuenta?
            <Link
              href="/login"
              className={buttonVariants({ variant: "link", size: "sm" })}
            >
              Iniciar sesión
            </Link>
          </>
        }
      >
        <Form of={registerForm} onSubmit={handleSubmit}>
          <FieldGroup>
            <AuthFormError errors={registerForm.errors} />
            <FormischField of={registerForm} path={["name"]}>
              {(field) => (
                <AuthField
                  id="register-name"
                  label="Nombre"
                  errors={field.errors}
                >
                  <Input
                    {...field.props}
                    id="register-name"
                    value={field.input ?? ""}
                    autoComplete="section-register name"
                    placeholder="Tu nombre"
                    className="h-11 px-4"
                    aria-invalid={Boolean(field.errors)}
                    aria-describedby={
                      field.errors ? "register-name-error" : undefined
                    }
                  />
                </AuthField>
              )}
            </FormischField>
            <FormischField of={registerForm} path={["email"]}>
              {(field) => (
                <AuthField
                  id="register-email"
                  label="Correo electrónico"
                  errors={field.errors}
                >
                  <Input
                    {...field.props}
                    id="register-email"
                    type="email"
                    value={field.input ?? ""}
                    autoComplete="section-register email"
                    placeholder="tu@correo.com"
                    className="h-11 px-4"
                    aria-invalid={Boolean(field.errors)}
                    aria-describedby={
                      field.errors ? "register-email-error" : undefined
                    }
                  />
                </AuthField>
              )}
            </FormischField>
            <FormischField of={registerForm} path={["password"]}>
              {(field) => (
                <AuthField
                  id="register-password"
                  label="Contraseña"
                  errors={field.errors}
                  description="Entre 12 y 128 caracteres."
                >
                  <PasswordInput
                    {...field.props}
                    id="register-password"
                    value={field.input ?? ""}
                    autoComplete="section-register new-password"
                    className="h-11"
                    aria-invalid={Boolean(field.errors)}
                    aria-describedby={
                      field.errors
                        ? "register-password-description register-password-error"
                        : "register-password-description"
                    }
                  />
                </AuthField>
              )}
            </FormischField>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={registerForm.isSubmitting}
            >
              {registerForm.isSubmitting ? (
                <Spinner />
              ) : (
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              )}
              {registerForm.isSubmitting
                ? "Enviando solicitud…"
                : "Solicitar acceso"}
            </Button>
          </FieldGroup>
        </Form>
      </AuthPanel>
    </AuthLayout>
  );
}
