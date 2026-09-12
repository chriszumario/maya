"use client";

import {
  Form,
  Field as FormischField,
  reset,
  type SubmitHandler,
  setErrors,
  setInput,
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { createTaskFn, updateTaskFn } from "../actions";
import {
  type GoalTask,
  type TaskFormInput,
  TaskFormSchema,
  type TaskFrequency,
} from "../schemas";

const frequencies: Array<{ label: string; value: TaskFrequency }> = [
  { label: "Diaria", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensual", value: "monthly" },
  { label: "Una vez", value: "once" },
];
const weekDays = [
  { label: "L", longLabel: "Lunes", value: 1 },
  { label: "M", longLabel: "Martes", value: 2 },
  { label: "X", longLabel: "Miércoles", value: 4 },
  { label: "J", longLabel: "Jueves", value: 8 },
  { label: "V", longLabel: "Viernes", value: 16 },
  { label: "S", longLabel: "Sábado", value: 32 },
  { label: "D", longLabel: "Domingo", value: 64 },
] as const;

function scheduleInput(task?: GoalTask) {
  if (!task || task.frequency === "daily") return "";
  if (task.frequency !== "once") return String(task.recurrenceMask);
  const date = String(task.recurrenceMask);
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`;
}

function taskFormInput(task?: GoalTask): TaskFormInput {
  return {
    title: task?.title ?? "",
    frequency: task?.frequency ?? "daily",
    estimatedMinutes: String(task?.estimatedMinutes ?? 30),
    startTime: task?.startTime ?? "08:00",
    schedule: scheduleInput(task),
  };
}

type TaskFormDialogProps = {
  goalId: number;
  trigger: React.ReactElement;
  task?: GoalTask;
};

export function TaskFormDialog({ goalId, trigger, task }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);
  const taskForm = useForm({
    schema: TaskFormSchema,
    initialInput: taskFormInput(task),
    validate: "submit",
    revalidate: "input",
  });
  const saveTask = useMutation({
    mutationFn: async (output: {
      title: string;
      frequency: TaskFrequency;
      estimatedMinutes: number;
      startTime: string;
      recurrenceMask: number;
    }) =>
      task
        ? updateTaskFn({ data: { taskId: task.id, ...output } })
        : createTaskFn({ data: { goalId, ...output } }),
  });

  const handleSubmit: SubmitHandler<typeof TaskFormSchema> = async (output) => {
    setErrors(taskForm, { errors: null });
    const result = await saveTask.mutateAsync(output);
    if (!result.ok) {
      setErrors(taskForm, { errors: [result.error.message] });
      return;
    }
    setOpen(false);
  };

  function changeFrequency(frequency: TaskFrequency) {
    setInput(taskForm, { path: ["frequency"], input: frequency });
    setInput(taskForm, { path: ["schedule"], input: "" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (saveTask.isPending) return;
        reset(taskForm, { initialInput: taskFormInput(task) });
        saveTask.reset();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            Programa una acción concreta y elige cuándo debe aparecer.
          </DialogDescription>
        </DialogHeader>
        <Form of={taskForm} onSubmit={handleSubmit}>
          <FieldGroup>
            <FormischField of={taskForm} path={["title"]}>
              {(field) => (
                <Field data-invalid={Boolean(field.errors)}>
                  <FieldLabel htmlFor="task-title">Tarea</FieldLabel>
                  <Input
                    {...field.props}
                    id="task-title"
                    value={field.input ?? ""}
                    maxLength={200}
                    placeholder="Ej. Entrenar fuerza"
                    aria-invalid={Boolean(field.errors)}
                  />
                  <FieldError>{field.errors?.[0]}</FieldError>
                </Field>
              )}
            </FormischField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormischField of={taskForm} path={["frequency"]}>
                {(field) => (
                  <Field className="sm:col-span-1">
                    <FieldLabel>Frecuencia</FieldLabel>
                    <Select
                      items={frequencies}
                      value={field.input}
                      onValueChange={(value) =>
                        changeFrequency(value as TaskFrequency)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {frequencies.map((item) => (
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
              <FormischField of={taskForm} path={["estimatedMinutes"]}>
                {(field) => (
                  <Field data-invalid={Boolean(field.errors)}>
                    <FieldLabel htmlFor="task-minutes">Minutos</FieldLabel>
                    <Input
                      {...field.props}
                      id="task-minutes"
                      type="number"
                      min={0}
                      max={1_440}
                      value={field.input ?? ""}
                      aria-invalid={Boolean(field.errors)}
                    />
                    <FieldError>{field.errors?.[0]}</FieldError>
                  </Field>
                )}
              </FormischField>
              <FormischField of={taskForm} path={["startTime"]}>
                {(field) => (
                  <Field data-invalid={Boolean(field.errors)}>
                    <FieldLabel htmlFor="task-time">Hora</FieldLabel>
                    <Input
                      {...field.props}
                      id="task-time"
                      type="time"
                      value={field.input ?? ""}
                      aria-invalid={Boolean(field.errors)}
                    />
                    <FieldError>{field.errors?.[0]}</FieldError>
                  </Field>
                )}
              </FormischField>
            </div>
            <FormischField of={taskForm} path={["frequency"]}>
              {(frequencyField) =>
                frequencyField.input === "weekly" ? (
                  <FormischField of={taskForm} path={["schedule"]}>
                    {(field) => {
                      const selectedMask = Number(field.input || 0);
                      return (
                        <Field data-invalid={Boolean(field.errors)}>
                          <FieldLabel>Días de la semana</FieldLabel>
                          <div className="grid grid-cols-7 gap-2">
                            {weekDays.map((day) => (
                              <Button
                                key={day.value}
                                type="button"
                                size="icon-sm"
                                variant={
                                  (selectedMask & day.value) !== 0
                                    ? "default"
                                    : "outline"
                                }
                                aria-label={day.longLabel}
                                aria-pressed={(selectedMask & day.value) !== 0}
                                onClick={() => {
                                  const nextMask = selectedMask ^ day.value;
                                  field.onChange(
                                    nextMask ? String(nextMask) : "",
                                  );
                                }}
                              >
                                {day.label}
                              </Button>
                            ))}
                          </div>
                          <FieldError>{field.errors?.[0]}</FieldError>
                        </Field>
                      );
                    }}
                  </FormischField>
                ) : frequencyField.input === "monthly" ? (
                  <FormischField of={taskForm} path={["schedule"]}>
                    {(field) => (
                      <Field data-invalid={Boolean(field.errors)}>
                        <FieldLabel htmlFor="task-day">Día del mes</FieldLabel>
                        <Input
                          {...field.props}
                          id="task-day"
                          type="number"
                          min={1}
                          max={31}
                          value={field.input ?? ""}
                        />
                        <FieldDescription>
                          Elige un valor entre 1 y 31.
                        </FieldDescription>
                        <FieldError>{field.errors?.[0]}</FieldError>
                      </Field>
                    )}
                  </FormischField>
                ) : frequencyField.input === "once" ? (
                  <FormischField of={taskForm} path={["schedule"]}>
                    {(field) => (
                      <Field data-invalid={Boolean(field.errors)}>
                        <FieldLabel htmlFor="task-date">Fecha</FieldLabel>
                        <Input
                          {...field.props}
                          id="task-date"
                          type="date"
                          value={field.input ?? ""}
                        />
                        <FieldError>{field.errors?.[0]}</FieldError>
                      </Field>
                    )}
                  </FormischField>
                ) : (
                  <span hidden />
                )
              }
            </FormischField>
            <FieldError>{taskForm.errors?.[0]}</FieldError>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset(taskForm, { initialInput: taskFormInput(task) });
                saveTask.reset();
                setOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saveTask.isPending}>
              {saveTask.isPending ? <Spinner /> : null}
              {saveTask.isPending
                ? "Guardando…"
                : task
                  ? "Guardar tarea"
                  : "Crear tarea"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
