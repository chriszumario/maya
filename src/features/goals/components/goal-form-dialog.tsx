"use client";

import {
  Form,
  Field as FormischField,
  getInput,
  reset,
  type SubmitHandler,
  setErrors,
  setInput,
  useForm,
} from "@formisch/react";
import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import * as v from "valibot";
import { AiSuggestion } from "@/components/shared/ai-suggestion";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
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
import { createGoalFn, improveGoalFn, updateGoalFn } from "../actions";
import {
  CreateGoalSchema,
  type Goal,
  type GoalAiField,
  type GoalCategory,
  type GoalPriority,
  ImproveGoalInputSchema,
} from "../schemas";

const categories: Array<{ label: string; value: GoalCategory }> = [
  { label: "Crecimiento", value: "growth" },
  { label: "Experiencia", value: "experience" },
  { label: "Contribución", value: "contribution" },
];
const priorities: Array<{ label: string; value: GoalPriority }> = [
  { label: "Baja", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
];

function goalFormInput(goal?: Goal) {
  return {
    title: goal?.title ?? "",
    motivation: goal?.motivation ?? "",
    category: goal?.category ?? ("growth" as const),
    priority: goal?.priority ?? ("medium" as const),
  };
}

type GoalFormDialogProps = {
  trigger: React.ReactElement;
  goal?: Goal;
};

export function GoalFormDialog({ trigger, goal }: GoalFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    field: GoalAiField;
    text: string;
  }>();
  const goalForm = useForm({
    schema: CreateGoalSchema,
    initialInput: goalFormInput(goal),
    validate: "submit",
    revalidate: "input",
  });
  const improveGoal = useMutation({
    mutationFn: async ({
      field,
      text,
    }: {
      field: GoalAiField;
      text: string;
    }) => {
      const result = await improveGoalFn({ data: { field, text } });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onSuccess: (result, request) => {
      if (
        result.field === request.field &&
        getInput(goalForm, { path: [request.field] })?.trim() === request.text
      )
        setSuggestion(result);
    },
  });

  const handleSubmit: SubmitHandler<typeof CreateGoalSchema> = async (
    output,
  ) => {
    setErrors(goalForm, { errors: null });
    const result = goal
      ? await updateGoalFn({ data: { id: goal.id, ...output } })
      : await createGoalFn({ data: output });
    if (!result.ok) {
      setErrors(goalForm, { errors: [result.error.message] });
      return;
    }
    setOpen(false);
  };

  function handleImprove(field: GoalAiField) {
    setErrors(goalForm, { errors: null });
    improveGoal.reset();
    setSuggestion(undefined);
    const text = getInput(goalForm, { path: [field] })?.trim() ?? "";
    const result = v.safeParse(ImproveGoalInputSchema, { field, text });
    if (!result.success) {
      setErrors(goalForm, {
        path: [field],
        errors: [result.issues[0].message],
      });
      return;
    }
    improveGoal.mutate(result.output);
  }

  const busy = goalForm.isSubmitting || improveGoal.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (busy) return;
        reset(goalForm, { initialInput: goalFormInput(goal) });
        improveGoal.reset();
        setSuggestion(undefined);
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nueva meta"}</DialogTitle>
          <DialogDescription>
            Define el resultado, su motivación y la prioridad que tendrá.
          </DialogDescription>
        </DialogHeader>
        <Form
          of={goalForm}
          onSubmit={handleSubmit}
          onInput={() => {
            improveGoal.reset();
            setSuggestion(undefined);
          }}
        >
          <FieldGroup>
            <FormischField of={goalForm} path={["title"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel htmlFor="goal-title">Título</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field.props}
                      id="goal-title"
                      aria-describedby="goal-title-error"
                      value={field.input ?? ""}
                      maxLength={200}
                      placeholder="Ej. Publicar la primera versión"
                      aria-invalid={Boolean(field.errors)}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        disabled={busy}
                        onClick={() => handleImprove("title")}
                        aria-label="Mejorar título con IA"
                        title="Mejorar título con IA"
                      >
                        {improveGoal.isPending &&
                        improveGoal.variables?.field === "title" ? (
                          <Spinner />
                        ) : (
                          <SparklesIcon />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError id="goal-title-error">
                    {field.errors?.[0]}
                  </FieldError>
                </Field>
              )}
            </FormischField>
            <FormischField of={goalForm} path={["motivation"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel htmlFor="goal-motivation">Motivación</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field.props}
                      id="goal-motivation"
                      aria-describedby="goal-motivation-error"
                      value={field.input ?? ""}
                      maxLength={4_000}
                      placeholder="¿Por qué esta meta importa?"
                      aria-invalid={Boolean(field.errors)}
                    />
                    <InputGroupAddon align="block-end" className="justify-end">
                      <InputGroupButton
                        size="icon-xs"
                        disabled={busy}
                        onClick={() => handleImprove("motivation")}
                        aria-label="Mejorar motivación con IA"
                        title="Mejorar motivación con IA"
                      >
                        {improveGoal.isPending &&
                        improveGoal.variables?.field === "motivation" ? (
                          <Spinner />
                        ) : (
                          <SparklesIcon />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldError id="goal-motivation-error">
                    {field.errors?.[0]}
                  </FieldError>
                </Field>
              )}
            </FormischField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormischField of={goalForm} path={["category"]}>
                {(field) => (
                  <Field>
                    <FieldLabel
                      id="goal-category-label"
                      htmlFor="goal-category"
                    >
                      Categoría
                    </FieldLabel>
                    <Select
                      items={categories}
                      value={field.input}
                      onValueChange={(value) =>
                        field.onChange(value as GoalCategory)
                      }
                    >
                      <SelectTrigger
                        id="goal-category"
                        aria-labelledby="goal-category-label"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {categories.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </FormischField>
              <FormischField of={goalForm} path={["priority"]}>
                {(field) => (
                  <Field>
                    <FieldLabel
                      id="goal-priority-label"
                      htmlFor="goal-priority"
                    >
                      Prioridad
                    </FieldLabel>
                    <Select
                      items={priorities}
                      value={field.input}
                      onValueChange={(value) =>
                        field.onChange(value as GoalPriority)
                      }
                    >
                      <SelectTrigger
                        id="goal-priority"
                        aria-labelledby="goal-priority-label"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {priorities.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </FormischField>
            </div>
            {suggestion ? (
              <AiSuggestion
                text={suggestion.text}
                onAccept={() => {
                  setInput(goalForm, {
                    path: [suggestion.field],
                    input: suggestion.text,
                  });
                  setSuggestion(undefined);
                }}
                onDismiss={() => setSuggestion(undefined)}
              />
            ) : null}
            <FieldError>
              {goalForm.errors?.[0] ??
                (improveGoal.error instanceof Error
                  ? improveGoal.error.message
                  : undefined)}
            </FieldError>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={goalForm.isSubmitting}
              onClick={() => {
                reset(goalForm, { initialInput: goalFormInput(goal) });
                improveGoal.reset();
                setSuggestion(undefined);
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {goalForm.isSubmitting ? <Spinner /> : null}
              {goalForm.isSubmitting
                ? "Guardando…"
                : goal
                  ? "Guardar cambios"
                  : "Crear meta"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
