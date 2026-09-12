"use client";

import {
  Form,
  Field as FormischField,
  type FormStore,
  getInput,
  reset,
  type SubmitHandler,
  setErrors,
  setInput,
  submit,
  useForm,
} from "@formisch/react";
import {
  BookOpenIcon,
  ChevronRightIcon,
  FilePlus2Icon,
  SaveIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { CursorPagination } from "@/components/shared/cursor-pagination";
import { PageHeader } from "@/components/shared/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import {
  createJournalEntryFn,
  deleteJournalEntryFn,
  improveJournalFieldFn,
  updateJournalEntryFn,
} from "../actions";
import { energyLevels, formatJournalDate, moods } from "../model/journal";
import {
  type JournalAiField,
  type JournalEntry,
  type JournalFormInput,
  JournalFormSchema,
  type Mood,
} from "../schemas";

const aiFieldLabels: Record<JournalAiField, string> = {
  title: "Título",
  gratitude: "Agradezco",
  wins: "Logros",
  lessons: "Aprendizajes",
  problems: "Problemas",
  ideas: "Ideas",
  content: "Nota libre",
};

const aiFieldPlaceholders: Record<JournalAiField, string> = {
  title: "Dale un nombre a este día",
  gratitude: "Algo concreto que valoras hoy",
  wins: "Qué salió bien, aunque haya sido pequeño",
  lessons: "Qué quieres recordar mañana",
  problems: "Tensiones o preguntas que necesitas ordenar",
  ideas: "Ideas que quieres explorar más adelante",
  content: "Escribe sin estructura...",
};

function journalFormInput(
  entry?: JournalEntry | null,
  date?: string,
): JournalFormInput {
  return {
    localDate: entry?.localDate ?? date ?? "",
    title: entry?.title ?? "",
    content: entry?.content ?? "",
    mood: entry?.mood ?? "",
    energyLevel:
      entry?.energyLevel === null || entry?.energyLevel === undefined
        ? ""
        : (String(entry.energyLevel) as JournalFormInput["energyLevel"]),
    gratitude: entry?.gratitude ?? "",
    wins: entry?.wins ?? "",
    lessons: entry?.lessons ?? "",
    problems: entry?.problems ?? "",
    ideas: entry?.ideas ?? "",
  };
}

type AiTextareaFieldProps = {
  form: FormStore<typeof JournalFormSchema>;
  name: JournalAiField;
  busyField?: JournalAiField;
  error?: string;
  onImprove: (field: JournalAiField, value: string) => void;
};

function AiTextareaField({
  form,
  name,
  busyField,
  error,
  onImprove,
}: AiTextareaFieldProps) {
  const inputId = `journal-${name}`;
  return (
    <FormischField of={form} path={[name] as [JournalAiField]}>
      {(field) => (
        <Field data-invalid={Boolean(field.errors || error)}>
          <FieldLabel htmlFor={inputId}>{aiFieldLabels[name]}</FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              {...field.props}
              id={inputId}
              value={field.input ?? ""}
              maxLength={10_000}
              placeholder={aiFieldPlaceholders[name]}
              aria-invalid={Boolean(field.errors || error)}
            />
            <InputGroupAddon align="block-end" className="justify-end">
              <InputGroupButton
                type="button"
                size="icon-sm"
                disabled={Boolean(busyField)}
                aria-label={`Mejorar ${aiFieldLabels[name].toLowerCase()} con IA`}
                title={`Mejorar ${aiFieldLabels[name].toLowerCase()} con IA`}
                onClick={() => onImprove(name, field.input ?? "")}
              >
                {busyField === name ? (
                  <Spinner />
                ) : (
                  <SparklesIcon aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError>{field.errors?.[0] ?? error}</FieldError>
        </Field>
      )}
    </FormischField>
  );
}

function entryMetadata(entry: JournalEntry) {
  const energy = entry.energyLevel
    ? `Energía ${entry.energyLevel}/5`
    : "Sin energía";
  const mood = moods.find((item) => item.value === entry.mood)?.label;
  return [formatJournalDate(entry.localDate), mood, energy]
    .filter(Boolean)
    .join(" · ");
}

export function JournalView({
  entries,
  today,
  nextCursor,
}: {
  entries: JournalEntry[];
  today: string;
  nextCursor: string | null;
}) {
  const todayEntry = entries.find((entry) => entry.localDate === today);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(
    () => todayEntry ?? entries[0] ?? null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const journalForm = useForm({
    schema: JournalFormSchema,
    initialInput: journalFormInput(selectedEntry, today),
    validate: "submit",
    revalidate: "input",
  });

  const improveJournal = useMutation({
    mutationFn: async ({
      field,
      text,
    }: {
      field: JournalAiField;
      text: string;
    }) => {
      const result = await improveJournalFieldFn({ data: { field, text } });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onSuccess: ({ field, text }) => {
      setInput(journalForm, {
        path: [field] as [JournalAiField],
        input: text,
      });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteJournalEntryFn({ data: { id } });
      if (!result.ok) throwActionError(result.error);
      return result.data;
    },
    onSuccess: async () => {
      setDeleteOpen(false);
      setSelectedEntry(null);
      reset(journalForm, { initialInput: journalFormInput(null, today) });
    },
  });

  const handleSubmit: SubmitHandler<typeof JournalFormSchema> = async (
    output,
  ) => {
    setErrors(journalForm, { errors: null });
    const { localDate: _localDate, ...fields } = output;
    const result = selectedEntry
      ? await updateJournalEntryFn({
          data: { id: selectedEntry.id, ...fields },
        })
      : await createJournalEntryFn({ data: fields });
    if (!result.ok) {
      setErrors(journalForm, { errors: [result.error.message] });
      return;
    }
    setSelectedEntry(result.data);
    reset(journalForm, { initialInput: journalFormInput(result.data, today) });
  };

  function selectEntry(entry: JournalEntry) {
    if (journalForm.isSubmitting || improveJournal.isPending) return;
    setSelectedEntry(entry);
    reset(journalForm, { initialInput: journalFormInput(entry, today) });
    improveJournal.reset();
  }

  function startEntry() {
    if (journalForm.isSubmitting || improveJournal.isPending) return;
    if (todayEntry) {
      selectEntry(todayEntry);
      return;
    }
    setSelectedEntry(null);
    reset(journalForm, { initialInput: journalFormInput(null, today) });
    improveJournal.reset();
  }

  function improveField(field: JournalAiField, value: string) {
    const normalized = value.trim();
    improveJournal.reset();
    setErrors(journalForm, { path: [field] as [JournalAiField], errors: null });
    if (!normalized || normalized.length > 2_000) {
      setErrors(journalForm, {
        path: [field] as [JournalAiField],
        errors: [
          normalized
            ? "La IA admite hasta 2000 caracteres por campo."
            : "Escribe algo antes de pedir una mejora.",
        ],
      });
      return;
    }
    improveJournal.mutate({ field, text: normalized });
  }

  const busy =
    journalForm.isSubmitting ||
    improveJournal.isPending ||
    deleteEntry.isPending;
  const improvingField = improveJournal.isPending
    ? improveJournal.variables?.field
    : undefined;
  const improveError =
    improveJournal.error instanceof Error
      ? improveJournal.error.message
      : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Diario"
        title="Haz visible lo que estás viviendo"
        description="Una entrada por fecha para registrar ánimo, energía, gratitud, logros, aprendizajes, problemas e ideas."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={startEntry}
            >
              <FilePlus2Icon data-icon="inline-start" aria-hidden="true" />
              Nueva entrada
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void submit(journalForm)}
            >
              {journalForm.isSubmitting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" aria-hidden="true" />
              )}
              {journalForm.isSubmitting ? "Guardando…" : "Guardar entrada"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Entradas recientes</CardTitle>
            <CardDescription>
              {entries.length === 0
                ? "Tu historial aparecerá aquí."
                : `${entries.length} ${entries.length === 1 ? "entrada" : "entradas"} en esta página.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {entries.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpenIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Tu diario está en blanco</EmptyTitle>
                  <EmptyDescription>
                    Escribe la primera entrada para comenzar tu registro.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              entries.map((entry) => (
                <Button
                  key={entry.id}
                  variant={
                    selectedEntry?.id === entry.id ? "secondary" : "ghost"
                  }
                  className="h-auto w-full justify-start gap-3 border p-3 text-left whitespace-normal"
                  onClick={() => selectEntry(entry)}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <BookOpenIcon aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {entry.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {entryMetadata(entry)}
                    </span>
                  </span>
                  <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>
                {getInput(journalForm, { path: ["localDate"] }) === today
                  ? "Hoy"
                  : "Entrada"}
              </Badge>
              <Badge variant="outline">
                {selectedEntry ? "Guardada" : "Nueva"}
              </Badge>
            </div>
            <CardTitle>
              {selectedEntry
                ? `Entrada del ${formatJournalDate(selectedEntry.localDate)}`
                : "Nueva entrada"}
            </CardTitle>
            <CardDescription>
              {selectedEntry
                ? "Los cambios se aplicarán a esta entrada."
                : "La API asignará automáticamente la fecha local de hoy."}
            </CardDescription>
            {selectedEntry ? (
              <CardAction>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={busy}
                  aria-label="Eliminar entrada"
                  onClick={() => {
                    deleteEntry.reset();
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent>
            <Form of={journalForm} onSubmit={handleSubmit}>
              <FieldGroup>
                <FormischField of={journalForm} path={["localDate"]}>
                  {(field) => (
                    <Field data-invalid={Boolean(field.errors)}>
                      <FieldLabel htmlFor="journal-date">Fecha</FieldLabel>
                      <Input
                        {...field.props}
                        id="journal-date"
                        value={field.input ?? ""}
                        type="date"
                        disabled
                        aria-invalid={Boolean(field.errors)}
                      />
                      <FieldError>{field.errors?.[0]}</FieldError>
                    </Field>
                  )}
                </FormischField>
                <FormischField of={journalForm} path={["title"]}>
                  {(field) => (
                    <Field
                      data-invalid={Boolean(
                        field.errors ||
                          (improveJournal.variables?.field === "title" &&
                            improveError),
                      )}
                    >
                      <FieldLabel htmlFor="journal-title">Título</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          {...field.props}
                          id="journal-title"
                          value={field.input ?? ""}
                          required
                          maxLength={200}
                          placeholder={aiFieldPlaceholders.title}
                          aria-invalid={Boolean(
                            field.errors ||
                              (improveJournal.variables?.field === "title" &&
                                improveError),
                          )}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            size="icon-sm"
                            disabled={Boolean(improvingField)}
                            aria-label="Mejorar título con IA"
                            title="Mejorar título con IA"
                            onClick={() =>
                              improveField("title", field.input ?? "")
                            }
                          >
                            {improvingField === "title" ? (
                              <Spinner />
                            ) : (
                              <SparklesIcon aria-hidden="true" />
                            )}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldError>
                        {field.errors?.[0] ??
                          (improveJournal.variables?.field === "title"
                            ? improveError
                            : undefined)}
                      </FieldError>
                    </Field>
                  )}
                </FormischField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormischField of={journalForm} path={["mood"]}>
                    {(field) => (
                      <Field data-invalid={Boolean(field.errors)}>
                        <FieldLabel>Estado de ánimo</FieldLabel>
                        <Select
                          items={moods}
                          value={field.input || null}
                          onValueChange={(value) =>
                            field.onChange((value ?? "") as Mood | "")
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={Boolean(field.errors)}
                          >
                            <SelectValue placeholder="Selecciona tu ánimo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {moods.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldError>{field.errors?.[0]}</FieldError>
                      </Field>
                    )}
                  </FormischField>
                  <FormischField of={journalForm} path={["energyLevel"]}>
                    {(field) => (
                      <Field data-invalid={Boolean(field.errors)}>
                        <FieldLabel>Nivel de energía</FieldLabel>
                        <Select
                          items={energyLevels}
                          value={field.input || null}
                          onValueChange={(value) => field.onChange(value ?? "")}
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={Boolean(field.errors)}
                          >
                            <SelectValue placeholder="Selecciona tu energía" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {energyLevels.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldError>{field.errors?.[0]}</FieldError>
                      </Field>
                    )}
                  </FormischField>
                </div>
                <FieldGroup>
                  <AiTextareaField
                    form={journalForm}
                    name="content"
                    busyField={improvingField}
                    error={
                      improveJournal.variables?.field === "content"
                        ? improveError
                        : undefined
                    }
                    onImprove={improveField}
                  />
                  {(
                    [
                      "gratitude",
                      "wins",
                      "lessons",
                      "problems",
                      "ideas",
                    ] as const
                  ).map((name) => (
                    <AiTextareaField
                      key={name}
                      form={journalForm}
                      name={name}
                      busyField={improvingField}
                      error={
                        improveJournal.variables?.field === name
                          ? improveError
                          : undefined
                      }
                      onImprove={improveField}
                    />
                  ))}
                </FieldGroup>
                <FieldError>{journalForm.errors?.[0]}</FieldError>
              </FieldGroup>
            </Form>
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Los iconos de destellos mejoran únicamente ese campo con IA.
            </p>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void submit(journalForm)}
            >
              {journalForm.isSubmitting ? (
                <Spinner />
              ) : (
                <SaveIcon data-icon="inline-start" aria-hidden="true" />
              )}
              {journalForm.isSubmitting ? "Guardando…" : "Guardar"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <CursorPagination nextCursor={nextCursor} />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleteEntry.isPending) setDeleteOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Eliminar entrada</AlertDialogTitle>
            <AlertDialogDescription>
              “{selectedEntry?.title}” se eliminará de tu diario. Esta acción no
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteEntry.error ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteEntry.error instanceof Error
                ? deleteEntry.error.message
                : "No se pudo eliminar la entrada."}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEntry.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!selectedEntry || deleteEntry.isPending}
              onClick={() => {
                if (selectedEntry) deleteEntry.mutate(selectedEntry.id);
              }}
            >
              {deleteEntry.isPending ? <Spinner /> : null}
              {deleteEntry.isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
