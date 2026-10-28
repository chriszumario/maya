import * as v from "valibot";

import {
  CursorPageSchema,
  CursorSchema,
  GoalStatusSchema,
  IdSchema,
  LocalDateSchema,
  LocalTimeSchema,
} from "@/lib/schemas/maya.schema";

const TimestampSchema = v.string();
const GoalTitleSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(3, "El título debe tener al menos 3 caracteres."),
  v.maxLength(200, "El título no puede superar 200 caracteres."),
);
const GoalMotivationSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(3, "La motivación debe tener al menos 3 caracteres."),
  v.maxLength(4_000, "La motivación no puede superar 4000 caracteres."),
);

export const GoalCategorySchema = v.picklist([
  "growth",
  "experience",
  "contribution",
]);
export const GoalPrioritySchema = v.picklist(["low", "medium", "high"]);
export const GoalListStatusSchema = v.picklist([
  "all",
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);
export const TaskFrequencySchema = v.picklist([
  "daily",
  "weekly",
  "monthly",
  "once",
]);

export const GoalSchema = v.object({
  id: IdSchema,
  userId: IdSchema,
  title: v.string(),
  motivation: v.string(),
  category: GoalCategorySchema,
  priority: GoalPrioritySchema,
  status: GoalStatusSchema,
  startDate: v.nullable(LocalDateSchema),
  endedAt: v.nullable(LocalDateSchema),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

const RecurrenceMaskSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

function isValidOnceMask(mask: number) {
  if (mask < 19000101 || mask > 20991231) return false;
  const value = String(mask);
  if (!/^\d{8}$/.test(value)) return false;
  const date = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
  return v.safeParse(LocalDateSchema, date).success;
}

function hasValidRecurrenceMask(
  frequency: TaskFrequency,
  recurrenceMask: number | undefined,
) {
  switch (frequency) {
    case "daily":
      return recurrenceMask === undefined || recurrenceMask === 0;
    case "weekly":
      return (
        recurrenceMask !== undefined &&
        recurrenceMask >= 1 &&
        recurrenceMask <= 127
      );
    case "monthly":
      return (
        recurrenceMask !== undefined &&
        recurrenceMask >= 1 &&
        recurrenceMask <= 31
      );
    case "once":
      return recurrenceMask !== undefined && isValidOnceMask(recurrenceMask);
  }
}

export const GoalTaskSchema = v.pipe(
  v.object({
    id: IdSchema,
    goalId: IdSchema,
    title: v.string(),
    estimatedMinutes: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(0),
      v.maxValue(1_440),
    ),
    startTime: LocalTimeSchema,
    frequency: TaskFrequencySchema,
    recurrenceMask: RecurrenceMaskSchema,
    isActive: v.boolean(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
  }),
  v.check(
    ({ frequency, recurrenceMask }) =>
      hasValidRecurrenceMask(frequency, recurrenceMask),
    "La programación de la tarea no corresponde con su frecuencia.",
  ),
);

export const GoalReviewSchema = v.object({
  id: IdSchema,
  goalId: IdSchema,
  localDate: LocalDateSchema,
  whatWorked: v.pipe(v.string(), v.maxLength(4_000)),
  whatDidNotWork: v.pipe(v.string(), v.maxLength(4_000)),
  nextActions: v.pipe(v.string(), v.maxLength(4_000)),
  continueGoal: v.boolean(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const GoalDetailSchema = v.object({
  ...GoalSchema.entries,
  tasks: v.array(GoalTaskSchema),
  reviews: v.array(GoalReviewSchema),
});

export const GoalIdInputSchema = v.object({ id: IdSchema });
export const TaskIdInputSchema = v.object({ taskId: IdSchema });
export const DeletedIdSchema = v.object({ id: IdSchema });

export const CreateGoalSchema = v.object({
  title: GoalTitleSchema,
  motivation: GoalMotivationSchema,
  category: GoalCategorySchema,
  priority: GoalPrioritySchema,
});

export const GoalListInputSchema = v.object({
  limit: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
    20,
  ),
  cursor: v.optional(CursorSchema),
});

export const GoalPageSchema = CursorPageSchema(GoalSchema);

export const UpdateGoalInputSchema = v.pipe(
  v.object({
    id: IdSchema,
    title: v.optional(GoalTitleSchema),
    motivation: v.optional(GoalMotivationSchema),
    category: v.optional(GoalCategorySchema),
    priority: v.optional(GoalPrioritySchema),
    status: v.optional(GoalStatusSchema),
  }),
  v.check(
    (input) => Object.keys(input).some((key) => key !== "id"),
    "Indica al menos un campo para actualizar.",
  ),
);

export const UpdateGoalStatusInputSchema = v.object({
  id: IdSchema,
  status: GoalStatusSchema,
});

const AiTextSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Escribe contenido antes de usar la IA."),
  v.maxLength(2_000, "La IA admite hasta 2000 caracteres por campo."),
);
export const GoalAiFieldSchema = v.picklist(["title", "motivation"]);
export const ImproveGoalInputSchema = v.object({
  field: GoalAiFieldSchema,
  text: AiTextSchema,
});
const ImproveGoalResponseBaseSchema = v.object({
  field: GoalAiFieldSchema,
  text: v.string(),
});
export const ImproveGoalResponseSchema = v.pipe(
  ImproveGoalResponseBaseSchema,
  v.check(
    ({ field, text }) =>
      text.trim().length >= 3 &&
      text.length <= (field === "title" ? 200 : 4_000),
    "La respuesta de IA supera el límite del campo.",
  ),
);

export type GoalAiField = v.InferOutput<typeof GoalAiFieldSchema>;

const TaskTitleSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(3, "El título debe tener al menos 3 caracteres."),
  v.maxLength(200, "El título no puede superar 200 caracteres."),
);
const EstimatedMinutesSchema = v.pipe(
  v.number(),
  v.integer("La duración debe ser un número entero."),
  v.minValue(0, "La duración no puede ser negativa."),
  v.maxValue(1_440, "La duración máxima es 1440 minutos."),
);
const TaskPayloadEntries = {
  title: TaskTitleSchema,
  frequency: TaskFrequencySchema,
  estimatedMinutes: EstimatedMinutesSchema,
  startTime: LocalTimeSchema,
  recurrenceMask: v.optional(RecurrenceMaskSchema),
};

export const CreateTaskInputSchema = v.pipe(
  v.object({ goalId: IdSchema, ...TaskPayloadEntries }),
  v.check(
    ({ frequency, recurrenceMask }) =>
      hasValidRecurrenceMask(frequency, recurrenceMask),
    "La programación no corresponde con la frecuencia seleccionada.",
  ),
);

export const UpdateTaskInputSchema = v.pipe(
  v.object({
    taskId: IdSchema,
    title: v.optional(TaskTitleSchema),
    frequency: v.optional(TaskFrequencySchema),
    estimatedMinutes: v.optional(EstimatedMinutesSchema),
    startTime: v.optional(LocalTimeSchema),
    recurrenceMask: v.optional(RecurrenceMaskSchema),
    isActive: v.optional(v.boolean()),
  }),
  v.check((input) => {
    const { taskId: _taskId, ...fields } = input;
    if (Object.keys(fields).length === 0) return false;
    if (input.frequency !== undefined)
      return hasValidRecurrenceMask(input.frequency, input.recurrenceMask);
    if (input.recurrenceMask === undefined) return true;
    return input.recurrenceMask <= 127 || isValidOnceMask(input.recurrenceMask);
  }, "La actualización no contiene campos válidos o la programación no corresponde."),
);

export const SetTaskActiveInputSchema = v.object({
  taskId: IdSchema,
  isActive: v.boolean(),
});

export const TaskFormSchema = v.pipe(
  v.object({
    title: TaskTitleSchema,
    frequency: TaskFrequencySchema,
    estimatedMinutes: v.pipe(
      v.string(),
      v.toNumber("La duración debe ser un número."),
      EstimatedMinutesSchema,
    ),
    startTime: LocalTimeSchema,
    schedule: v.string(),
  }),
  v.forward(
    v.check(({ frequency, schedule }) => {
      if (frequency === "daily") return schedule === "";
      if (frequency === "once")
        return (
          v.safeParse(LocalDateSchema, schedule).success &&
          hasValidRecurrenceMask(
            frequency,
            Number(schedule.replaceAll("-", "")),
          )
        );
      if (!/^\d+$/.test(schedule)) return false;
      return hasValidRecurrenceMask(frequency, Number(schedule));
    }, "Completa la programación requerida por la frecuencia."),
    ["schedule"],
  ),
  v.transform(({ schedule, ...input }) => ({
    ...input,
    recurrenceMask:
      input.frequency === "daily"
        ? 0
        : Number(
            input.frequency === "once"
              ? schedule.replaceAll("-", "")
              : schedule,
          ),
  })),
);

const ReviewTextSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Completa este campo."),
  v.maxLength(4_000, "El texto no puede superar 4000 caracteres."),
);
export const GoalReviewFormSchema = v.object({
  whatWorked: ReviewTextSchema,
  whatDidNotWork: ReviewTextSchema,
  nextActions: ReviewTextSchema,
});
export const CreateGoalReviewInputSchema = v.object({
  goalId: IdSchema,
  ...GoalReviewFormSchema.entries,
  continueGoal: v.boolean(),
});
export const GoalReviewsInputSchema = v.object({
  goalId: IdSchema,
  limit: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
    20,
  ),
  cursor: v.optional(CursorSchema),
});
export const GoalReviewsPageSchema = CursorPageSchema(GoalReviewSchema);
export const GoalTasksInputSchema = GoalReviewsInputSchema;
export const GoalTasksPageSchema = CursorPageSchema(GoalTaskSchema);

export type Goal = v.InferOutput<typeof GoalSchema>;
export type GoalDetail = v.InferOutput<typeof GoalDetailSchema>;
export type GoalTask = v.InferOutput<typeof GoalTaskSchema>;
export type GoalReview = v.InferOutput<typeof GoalReviewSchema>;
export type GoalCategory = v.InferOutput<typeof GoalCategorySchema>;
export type GoalPriority = v.InferOutput<typeof GoalPrioritySchema>;
export type GoalListStatus = v.InferOutput<typeof GoalListStatusSchema>;
export type GoalStatus = v.InferOutput<typeof GoalStatusSchema>;
export type TaskFrequency = v.InferOutput<typeof TaskFrequencySchema>;
export type TaskFormInput = v.InferInput<typeof TaskFormSchema>;
