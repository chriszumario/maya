"use client";

import {
  Form,
  Field as FormischField,
  reset,
  type SubmitHandler,
  setErrors,
  useForm,
} from "@formisch/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createGoalReviewFn } from "../actions";
import { GoalReviewFormSchema } from "../schemas";

const initialInput = {
  whatWorked: "",
  whatDidNotWork: "",
  nextActions: "",
};

export function GoalReviewDialog({
  goalId,
  trigger,
}: {
  goalId: number;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [continueGoal, setContinueGoal] = useState(true);
  const reviewForm = useForm({
    schema: GoalReviewFormSchema,
    initialInput,
    validate: "submit",
    revalidate: "input",
  });
  const handleSubmit: SubmitHandler<typeof GoalReviewFormSchema> = async (
    output,
  ) => {
    setErrors(reviewForm, { errors: null });
    const result = await createGoalReviewFn({
      data: { goalId, ...output, continueGoal },
    });
    if (!result.ok) {
      setErrors(reviewForm, { errors: [result.error.message] });
      return;
    }
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (reviewForm.isSubmitting) return;
        reset(reviewForm, { initialInput });
        setContinueGoal(true);
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva revisión</DialogTitle>
          <DialogDescription>
            Registra lo aprendido y decide si continuar con esta meta.
          </DialogDescription>
        </DialogHeader>
        <Form of={reviewForm} onSubmit={handleSubmit}>
          <FieldGroup>
            {(
              [
                ["whatWorked", "Qué funcionó"],
                ["whatDidNotWork", "Qué no funcionó"],
                ["nextActions", "Siguientes acciones"],
              ] as const
            ).map(([path, label]) => (
              <FormischField key={path} of={reviewForm} path={[path]}>
                {(field) => (
                  <Field data-invalid={Boolean(field.errors)}>
                    <FieldLabel htmlFor={`review-${path}`}>{label}</FieldLabel>
                    <Textarea
                      {...field.props}
                      id={`review-${path}`}
                      aria-describedby={`review-${path}-error`}
                      value={field.input ?? ""}
                      aria-invalid={Boolean(field.errors)}
                    />
                    <FieldError id={`review-${path}-error`}>
                      {field.errors?.[0]}
                    </FieldError>
                  </Field>
                )}
              </FormischField>
            ))}
            <Field className="flex-row items-center justify-between rounded-2xl border p-4">
              <div>
                <FieldLabel htmlFor="review-continue">
                  Continuar con esta meta
                </FieldLabel>
                <p
                  id="review-continue-description"
                  className="text-sm text-muted-foreground"
                >
                  Desactívalo si la revisión indica que debes cerrarla.
                </p>
              </div>
              <Switch
                id="review-continue"
                aria-describedby="review-continue-description"
                checked={continueGoal}
                onCheckedChange={setContinueGoal}
              />
            </Field>
            <FieldError>{reviewForm.errors?.[0]}</FieldError>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={reviewForm.isSubmitting}
              onClick={() => {
                reset(reviewForm, { initialInput });
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={reviewForm.isSubmitting}>
              {reviewForm.isSubmitting ? <Spinner /> : null}
              {reviewForm.isSubmitting ? "Guardando…" : "Guardar revisión"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
