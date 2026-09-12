import * as v from "valibot";

import {
  CursorPageSchema,
  CursorSchema,
  IdSchema,
  LocalDateSchema,
  MoodSchema,
} from "@/lib/schemas/maya.schema";

const JournalTextSchema = v.pipe(v.string(), v.maxLength(10_000));
const JournalFieldsSchema = v.object({
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Escribe un título para la entrada."),
    v.maxLength(200, "El título no puede superar 200 caracteres."),
  ),
  content: JournalTextSchema,
  mood: MoodSchema,
  energyLevel: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
  gratitude: JournalTextSchema,
  wins: JournalTextSchema,
  lessons: JournalTextSchema,
  problems: JournalTextSchema,
  ideas: JournalTextSchema,
});

const TextInputSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(10_000, "El texto no puede superar 10 000 caracteres."),
);
const MoodInputSchema = v.pipe(
  v.union([v.literal(""), MoodSchema]),
  v.check((value) => value !== "", "Selecciona tu estado de ánimo."),
  v.transform((value) => value as v.InferOutput<typeof MoodSchema>),
);
const EnergyInputSchema = v.pipe(
  v.union([v.literal(""), v.picklist(["1", "2", "3", "4", "5"])]),
  v.check((value) => value !== "", "Selecciona tu nivel de energía."),
  v.transform((value) => Number(value)),
);

export const JournalFormSchema = v.object({
  localDate: LocalDateSchema,
  title: JournalFieldsSchema.entries.title,
  content: TextInputSchema,
  mood: MoodInputSchema,
  energyLevel: EnergyInputSchema,
  gratitude: TextInputSchema,
  wins: TextInputSchema,
  lessons: TextInputSchema,
  problems: TextInputSchema,
  ideas: TextInputSchema,
});

export const JournalEntrySchema = v.object({
  id: IdSchema,
  userId: IdSchema,
  localDate: LocalDateSchema,
  ...JournalFieldsSchema.entries,
  createdAt: v.string(),
  updatedAt: v.string(),
});

export const JournalPageSchema = CursorPageSchema(JournalEntrySchema);

export const JournalListInputSchema = v.object({
  limit: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
    20,
  ),
  cursor: v.optional(CursorSchema),
});

export const CreateJournalInputSchema = v.object({
  ...JournalFieldsSchema.entries,
});

export const UpdateJournalInputSchema = v.pipe(
  v.object({
    id: IdSchema,
    title: v.optional(JournalFieldsSchema.entries.title),
    content: v.optional(JournalTextSchema),
    mood: v.optional(MoodSchema),
    energyLevel: v.optional(JournalFieldsSchema.entries.energyLevel),
    gratitude: v.optional(JournalTextSchema),
    wins: v.optional(JournalTextSchema),
    lessons: v.optional(JournalTextSchema),
    problems: v.optional(JournalTextSchema),
    ideas: v.optional(JournalTextSchema),
  }),
  v.check(
    (input) => Object.keys(input).some((key) => key !== "id"),
    "Indica al menos un campo para actualizar.",
  ),
);

export const JournalIdInputSchema = v.object({ id: IdSchema });
export const DeletedJournalSchema = v.object({ id: IdSchema });

export const JournalAiFieldSchema = v.picklist([
  "title",
  "gratitude",
  "wins",
  "lessons",
  "problems",
  "ideas",
  "content",
]);
export const ImproveJournalInputSchema = v.object({
  field: JournalAiFieldSchema,
  text: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Escribe algo antes de pedir una mejora."),
    v.maxLength(2_000, "La IA admite hasta 2000 caracteres por campo."),
  ),
});
const ImproveJournalResponseBaseSchema = v.object({
  field: JournalAiFieldSchema,
  text: v.string(),
});
export const ImproveJournalResponseSchema = v.pipe(
  ImproveJournalResponseBaseSchema,
  v.check(
    ({ field, text }) =>
      text.trim().length > 0 &&
      text.length <= (field === "title" ? 200 : 10_000),
    "La respuesta de IA supera el límite del campo.",
  ),
);
export const ValidatedImproveJournalResponseSchema =
  ImproveJournalResponseSchema;

export type JournalEntry = v.InferOutput<typeof JournalEntrySchema>;
export type JournalFormInput = v.InferInput<typeof JournalFormSchema>;
export type JournalAiField = v.InferOutput<typeof JournalAiFieldSchema>;
export type Mood = v.InferOutput<typeof MoodSchema>;
