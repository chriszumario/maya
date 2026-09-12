"use client";

import {
  Form,
  Field as FormischField,
  reset,
  type SubmitHandler,
  setErrors,
  setInput,
  useForm,
  validate,
} from "@formisch/react";
import { PlusIcon, SparklesIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useServerMutation as useMutation } from "@/hooks/use-server-mutation";
import { throwActionError } from "@/lib/action-error";
import {
  createNutritionEntryFn,
  estimateCaloriesFn,
  updateNutritionEntryFn,
} from "../actions";
import { meals } from "../model/nutrition";
import {
  type MealType,
  type NutritionEntry,
  NutritionFormSchema,
} from "../schemas";

type NutritionEntryDialogProps = {
  entry?: NutritionEntry;
  trigger?: React.ReactElement;
};

export function NutritionEntryDialog({
  entry,
  trigger,
}: NutritionEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const initialInput = {
    mealType: entry?.mealType ?? ("lunch" as const),
    name: entry?.name ?? "",
    quantity: entry?.quantity === null ? "" : String(entry?.quantity ?? ""),
    unit: entry?.unit ?? "",
    calories: String(entry?.calories ?? "0"),
  };
  const nutritionForm = useForm({
    schema: NutritionFormSchema,
    initialInput,
    validate: "submit",
    revalidate: "input",
  });
  const estimateCalories = useMutation({
    mutationFn: async ({
      name,
      quantity,
      unit,
      mealType,
    }: {
      name: string;
      quantity: number;
      unit: string;
      mealType?: MealType;
    }) => {
      const result = await estimateCaloriesFn({
        data: { name, quantity, unit, ...(mealType ? { mealType } : {}) },
      });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onSuccess: (result) => {
      setInput(nutritionForm, {
        path: ["calories"],
        input: String(result.calories),
      });
    },
  });

  function clearEstimate() {
    estimateCalories.reset();
    setInput(nutritionForm, { path: ["calories"], input: "" });
  }

  async function handleEstimate() {
    setErrors(nutritionForm, { errors: null });
    const result = await validate(nutritionForm, { shouldFocus: true });
    if (!result.success) return;
    estimateCalories.mutate({
      name: result.output.name,
      quantity: result.output.quantity,
      unit: result.output.unit,
      mealType: result.output.mealType,
    });
  }

  const handleSubmit: SubmitHandler<typeof NutritionFormSchema> = async (
    output,
  ) => {
    setErrors(nutritionForm, { errors: null });
    const fields = {
      mealType: output.mealType,
      name: output.name,
      quantity: output.quantity,
      unit: output.unit,
      calories: output.calories,
    };
    const result = entry
      ? await updateNutritionEntryFn({ data: { id: entry.id, ...fields } })
      : await createNutritionEntryFn({ data: fields });
    if (!result.ok) {
      setErrors(nutritionForm, { errors: [result.error.message] });
      return;
    }
    setOpen(false);
  };

  const title = entry ? "Editar alimento" : "Registrar alimento";
  const busy = nutritionForm.isSubmitting || estimateCalories.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (busy) return;
        setOpen(nextOpen);
        if (nextOpen) {
          reset(nutritionForm, { initialInput });
          estimateCalories.reset();
        }
      }}
    >
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Registrar alimento
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Indica alimento, cantidad y unidad. Maya puede estimar sus calorías
            con IA.
          </DialogDescription>
        </DialogHeader>
        <Form of={nutritionForm} onSubmit={handleSubmit}>
          <FieldGroup>
            <FormischField of={nutritionForm} path={["mealType"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel>Tipo de comida</FieldLabel>
                  <Select
                    items={meals}
                    value={field.input}
                    onValueChange={(value) => {
                      field.onChange(value as MealType);
                      clearEstimate();
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={Boolean(field.errors)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {meals.map((meal) => (
                          <SelectItem key={meal.value} value={meal.value}>
                            {meal.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{field.errors?.[0]}</FieldError>
                </Field>
              )}
            </FormischField>

            <FormischField of={nutritionForm} path={["name"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel htmlFor={`nutrition-name-${entry?.id ?? "new"}`}>
                    Alimento o preparación
                  </FieldLabel>
                  <Input
                    {...field.props}
                    id={`nutrition-name-${entry?.id ?? "new"}`}
                    value={field.input ?? ""}
                    required
                    maxLength={200}
                    placeholder="Ej. Ensalada de pollo"
                    aria-invalid={Boolean(field.errors)}
                    onChange={(event) => {
                      field.onChange(event.target.value);
                      clearEstimate();
                    }}
                  />
                  <FieldError>{field.errors?.[0]}</FieldError>
                </Field>
              )}
            </FormischField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormischField of={nutritionForm} path={["quantity"]}>
                {(field) => (
                  <Field data-invalid={Boolean(field.errors)}>
                    <FieldLabel
                      htmlFor={`nutrition-quantity-${entry?.id ?? "new"}`}
                    >
                      Cantidad
                    </FieldLabel>
                    <Input
                      {...field.props}
                      id={`nutrition-quantity-${entry?.id ?? "new"}`}
                      value={field.input ?? ""}
                      type="number"
                      required
                      min="0.000001"
                      max="1000000"
                      step="any"
                      aria-invalid={Boolean(field.errors)}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        clearEstimate();
                      }}
                    />
                    <FieldError>{field.errors?.[0]}</FieldError>
                  </Field>
                )}
              </FormischField>

              <FormischField of={nutritionForm} path={["unit"]}>
                {(field) => (
                  <Field data-invalid={Boolean(field.errors)}>
                    <FieldLabel
                      htmlFor={`nutrition-unit-${entry?.id ?? "new"}`}
                    >
                      Unidad
                    </FieldLabel>
                    <Input
                      {...field.props}
                      id={`nutrition-unit-${entry?.id ?? "new"}`}
                      value={field.input ?? ""}
                      required
                      maxLength={50}
                      placeholder="g, ml, porción"
                      aria-invalid={Boolean(field.errors)}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        clearEstimate();
                      }}
                    />
                    <FieldError>{field.errors?.[0]}</FieldError>
                  </Field>
                )}
              </FormischField>
            </div>

            <FormischField of={nutritionForm} path={["calories"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel
                    htmlFor={`nutrition-calories-${entry?.id ?? "new"}`}
                  >
                    Calorías
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field.props}
                      id={`nutrition-calories-${entry?.id ?? "new"}`}
                      value={field.input ?? ""}
                      type="number"
                      min="0"
                      max="100000"
                      step="1"
                      placeholder="0"
                      aria-invalid={Boolean(field.errors)}
                      onChange={(event) => {
                        field.onChange(event.target.value);
                        estimateCalories.reset();
                      }}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        size="icon-sm"
                        disabled={busy}
                        aria-label="Estimar calorías con IA"
                        title="Estimar calorías con IA"
                        onClick={() => void handleEstimate()}
                      >
                        {estimateCalories.isPending ? (
                          <Spinner />
                        ) : (
                          <SparklesIcon
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError>{field.errors?.[0]}</FieldError>
                  {estimateCalories.error ? (
                    <FieldError>
                      {estimateCalories.error instanceof Error
                        ? estimateCalories.error.message
                        : "No se pudieron estimar las calorías."}
                    </FieldError>
                  ) : null}
                </Field>
              )}
            </FormischField>

            <FieldError>{nutritionForm.errors?.[0]}</FieldError>
          </FieldGroup>
          <DialogFooter className="mt-5">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {nutritionForm.isSubmitting ? <Spinner /> : null}
              {nutritionForm.isSubmitting
                ? "Guardando…"
                : entry
                  ? "Guardar cambios"
                  : "Guardar alimento"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
