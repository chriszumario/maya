import * as v from "valibot";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { toPublicError } from "@/lib/server-error.server";
import { validatedOperation } from "@/lib/validated-operation";
import {
  TaskLogSchema,
  TodayTasksSchema,
  UpdateTodayTaskInputSchema,
} from "./schemas";

export async function getTodayTasksFn() {
  try {
    const response = await authenticatedApiFetch("/today/tasks");
    return {
      ok: true as const,
      data: v.parse(TodayTasksSchema, response),
    };
  } catch (error) {
    return {
      ok: false as const,
      error: toPublicError(error, "No se pudo preparar la agenda de hoy."),
    };
  }
}

export const updateTodayTaskFn = validatedOperation(
  UpdateTodayTaskInputSchema,
  async (data) => {
    try {
      const response = await authenticatedApiFetch("/task-logs", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { ok: true as const, data: v.parse(TaskLogSchema, response) };
    } catch (error) {
      return {
        ok: false as const,
        error: toPublicError(error, "No se pudo actualizar la tarea."),
      };
    }
  },
);
