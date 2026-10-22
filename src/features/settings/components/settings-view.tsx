"use client";

import {
  Form,
  Field as FormischField,
  reset,
  type SubmitHandler,
  setErrors,
  useForm,
} from "@formisch/react";
import { KeyRoundIcon, SaveIcon, UserRoundIcon } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuthUser } from "@/features/auth/model/auth";
import { updatePasswordAction, updateProfileAction } from "../actions";
import { PasswordFormSchema, ProfileFormSchema } from "../schemas";

function ProfileForm({ user }: { user: AuthUser }) {
  const [saved, setSaved] = useState(false);
  const form = useForm({
    schema: ProfileFormSchema,
    initialInput: {
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      currentPassword: "",
    },
    validate: "submit",
    revalidate: "input",
  });

  const handleSubmit: SubmitHandler<typeof ProfileFormSchema> = async (
    output,
  ) => {
    setSaved(false);
    setErrors(form, { errors: null });
    if (output.email !== user.email && !output.currentPassword) {
      setErrors(form, {
        path: ["currentPassword"],
        errors: ["Ingresa tu contraseña actual para cambiar el correo."],
      });
      return;
    }

    const result = await updateProfileAction({ data: output });
    if (!result.ok) {
      setErrors(form, { errors: [result.error.message] });
      return;
    }
    reset(form, {
      initialInput: {
        name: result.data.name,
        email: result.data.email,
        timezone: result.data.timezone,
        currentPassword: "",
      },
    });
    setSaved(true);
  };

  return (
    <Form of={form} onSubmit={handleSubmit} onInput={() => setSaved(false)}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundIcon aria-hidden="true" className="size-4" />
            Información personal
          </CardTitle>
          <CardDescription>
            El nombre aparece en tu experiencia y el correo identifica tu
            acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FormischField of={form} path={["name"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel htmlFor="profile-name">Nombre</FieldLabel>
                  <Input
                    {...field.props}
                    id="profile-name"
                    value={field.input ?? ""}
                    autoComplete="name"
                    aria-invalid={Boolean(field.errors)}
                  />
                  <FieldError>{field.errors?.[0]}</FieldError>
                </Field>
              )}
            </FormischField>
            <FormischField of={form} path={["email"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel htmlFor="profile-email">
                    Correo electrónico
                  </FieldLabel>
                  <Input
                    {...field.props}
                    id="profile-email"
                    type="email"
                    value={field.input ?? ""}
                    autoComplete="email"
                    aria-invalid={Boolean(field.errors)}
                  />
                  <FieldError>{field.errors?.[0]}</FieldError>
                </Field>
              )}
            </FormischField>
            <FormischField of={form} path={["timezone"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel htmlFor="profile-timezone">
                    Zona horaria
                  </FieldLabel>
                  <Input
                    {...field.props}
                    id="profile-timezone"
                    value={field.input ?? ""}
                    placeholder="America/La_Paz"
                    aria-invalid={Boolean(field.errors)}
                  />
                  <FieldDescription>
                    Zona IANA usada para tu agenda y tus registros diarios.
                  </FieldDescription>
                  <FieldError>{field.errors?.[0]}</FieldError>
                </Field>
              )}
            </FormischField>
            <FormischField of={form} path={["currentPassword"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel htmlFor="profile-password">
                    Contraseña actual
                  </FieldLabel>
                  <Input
                    {...field.props}
                    id="profile-password"
                    type="password"
                    value={field.input ?? ""}
                    autoComplete="current-password"
                    aria-invalid={Boolean(field.errors)}
                  />
                  <FieldDescription>
                    Sólo es necesaria para cambiar el correo.
                  </FieldDescription>
                  <FieldError>{field.errors?.[0]}</FieldError>
                </Field>
              )}
            </FormischField>
            <FieldError>{form.errors?.[0]}</FieldError>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-wrap gap-3 border-t">
          <p role="status" className="text-sm text-primary">
            {saved ? "Perfil guardado correctamente." : ""}
          </p>
          <Button
            type="submit"
            className="ml-auto"
            disabled={form.isSubmitting}
          >
            {form.isSubmitting ? <Spinner /> : <SaveIcon aria-hidden="true" />}
            {form.isSubmitting ? "Guardando…" : "Guardar cambios"}
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}

function PasswordForm() {
  const form = useForm({
    schema: PasswordFormSchema,
    initialInput: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: "submit",
    revalidate: "input",
  });

  const handleSubmit: SubmitHandler<typeof PasswordFormSchema> = async (
    output,
  ) => {
    setErrors(form, { errors: null });
    const result = await updatePasswordAction({ data: output });
    if (result && !result.ok) {
      setErrors(form, { errors: [result.error.message] });
    }
  };

  return (
    <Form of={form} onSubmit={handleSubmit}>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon aria-hidden="true" className="size-4" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>
            Al guardar se cerrarán todas las sesiones activas por seguridad.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Alert>
            <KeyRoundIcon aria-hidden="true" />
            <AlertTitle>Se cerrarán tus sesiones</AlertTitle>
            <AlertDescription>
              Deberás iniciar sesión nuevamente con la contraseña nueva.
            </AlertDescription>
          </Alert>
          <FieldGroup>
            {(
              [
                ["currentPassword", "Contraseña actual", "current-password"],
                ["newPassword", "Nueva contraseña", "new-password"],
                ["confirmPassword", "Confirmar contraseña", "new-password"],
              ] as const
            ).map(([path, label, autoComplete]) => (
              <FormischField key={path} of={form} path={[path]}>
                {(field) => (
                  <Field data-invalid={Boolean(field.errors)}>
                    <FieldLabel htmlFor={path}>{label}</FieldLabel>
                    <Input
                      {...field.props}
                      id={path}
                      type="password"
                      value={field.input ?? ""}
                      autoComplete={autoComplete}
                      aria-invalid={Boolean(field.errors)}
                    />
                    {path === "newPassword" ? (
                      <FieldDescription>
                        Entre 12 y 128 caracteres.
                      </FieldDescription>
                    ) : null}
                    <FieldError>{field.errors?.[0]}</FieldError>
                  </Field>
                )}
              </FormischField>
            ))}
            <FieldError>{form.errors?.[0]}</FieldError>
          </FieldGroup>
        </CardContent>
        <CardFooter className="border-t">
          <Button
            type="submit"
            className="ml-auto"
            disabled={form.isSubmitting}
          >
            {form.isSubmitting ? <Spinner /> : null}
            {form.isSubmitting ? "Actualizando…" : "Actualizar contraseña"}
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}

export function SettingsView({ user }: { user: AuthUser }) {
  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        title="Cuenta y seguridad"
        description="Actualiza tus datos personales y protege el acceso a Maya."
      />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-5">
          <ProfileForm user={user} />
        </TabsContent>
        <TabsContent value="security" className="mt-5">
          <PasswordForm />
        </TabsContent>
      </Tabs>
    </>
  );
}
