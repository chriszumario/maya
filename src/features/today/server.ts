import * as v from "valibot";
import { readSessionUser } from "@/features/auth/server/auth-session.server";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { localDateInTimeZone } from "@/lib/local-date";
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
      const { expectedDate, ...body } = data;
      const user = await readSessionUser();
      if (user && expectedDate !== localDateInTimeZone(user.timezone)) {
        return {
          ok: false as const,
          error: {
            code: "AGENDA_DATE_CHANGED",
            message:
              "El día cambió. Recarga la agenda antes de registrar actividad.",
          },
        };
      }
      const response = await authenticatedApiFetch("/task-logs", {
        method: "POST",
        body: JSON.stringify(body),
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
