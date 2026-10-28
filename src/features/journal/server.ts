import * as v from "valibot";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { toPublicError } from "@/lib/server-error.server";
import { validatedOperation } from "@/lib/validated-operation";
import {
  CreateJournalInputSchema,
  DeletedJournalSchema,
  ImproveJournalInputSchema,
  ImproveJournalResponseSchema,
  JournalEntrySchema,
  JournalIdInputSchema,
  JournalListInputSchema,
  JournalPageSchema,
  UpdateJournalInputSchema,
} from "./schemas";

async function journalOperation<T>(
  operation: () => Promise<T>,
  message: string,
) {
  try {
    return { ok: true as const, data: await operation() };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error, message) };
  }
}

export const getJournalEntriesFn = validatedOperation(
  JournalListInputSchema,
  (data) =>
    journalOperation(async () => {
      const search = new URLSearchParams({ limit: String(data.limit) });
      if (data.cursor) search.set("cursor", data.cursor);
      const response = await authenticatedApiFetch(`/journal?${search}`);
      return v.parse(JournalPageSchema, response);
    }, "No se pudieron obtener las entradas del diario."),
);

export const createJournalEntryFn = validatedOperation(
  CreateJournalInputSchema,
  (data) =>
    journalOperation(async () => {
      const response = await authenticatedApiFetch("/journal", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return v.parse(JournalEntrySchema, response);
    }, "No se pudo guardar la entrada del diario."),
);

export const updateJournalEntryFn = validatedOperation(
  UpdateJournalInputSchema,
  (data) =>
    journalOperation(async () => {
      const { id, ...body } = data;
      const response = await authenticatedApiFetch(`/journal/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return v.parse(JournalEntrySchema, response);
    }, "No se pudo actualizar la entrada del diario."),
);

export const deleteJournalEntryFn = validatedOperation(
  JournalIdInputSchema,
  (data) =>
    journalOperation(async () => {
      const response = await authenticatedApiFetch(`/journal/${data.id}`, {
        method: "DELETE",
      });
      return v.parse(DeletedJournalSchema, response);
    }, "No se pudo eliminar la entrada del diario."),
);

export const improveJournalFieldFn = validatedOperation(
  ImproveJournalInputSchema,
  (data) =>
    journalOperation(async () => {
      const response = await authenticatedApiFetch("/ai/improve-journal", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const improved = v.parse(ImproveJournalResponseSchema, response);
      if (improved.field !== data.field) throw new Error("Unexpected AI field");
      return improved;
    }, "No se pudo mejorar el texto con IA."),
);
