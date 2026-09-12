import * as v from "valibot";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { toPublicError } from "@/lib/server-error.server";
import { validatedOperation } from "@/lib/validated-operation";
import {
  DashboardSummaryInputSchema,
  DashboardSummarySchema,
} from "../schemas/dashboard.schema";

export const getDashboardSummaryFn = validatedOperation(
  DashboardSummaryInputSchema,
  async (data) => {
    try {
      const search = data.date
        ? `?${new URLSearchParams({ date: data.date })}`
        : "";
      const summary = await authenticatedApiFetch(
        `/dashboard/summary${search}`,
      );
      return {
        ok: true as const,
        data: v.parse(DashboardSummarySchema, summary),
      };
    } catch (error) {
      return {
        ok: false as const,
        error: toPublicError(error, "No se pudo obtener el resumen diario."),
      };
    }
  },
);
