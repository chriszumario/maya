import * as v from "valibot";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { toPublicError } from "@/lib/server-error.server";
import { validatedOperation } from "@/lib/validated-operation";
import {
  DashboardTrendsSchema,
  InsightsSchema,
  TrendsInputSchema,
} from "../schemas/insights.schema";

export async function getInsightsFn() {
  try {
    const insights = await authenticatedApiFetch("/dashboard/insights");
    return {
      ok: true as const,
      data: v.parse(InsightsSchema, insights),
    };
  } catch (error) {
    return {
      ok: false as const,
      error: toPublicError(error, "No se pudieron obtener los insights."),
    };
  }
}

export const getDashboardTrendsFn = validatedOperation(
  TrendsInputSchema,
  async (data) => {
    try {
      const search = new URLSearchParams({ days: String(data.days) });
      if (data.endDate) search.set("endDate", data.endDate);
      const trends = await authenticatedApiFetch(`/dashboard/trends?${search}`);
      return {
        ok: true as const,
        data: v.parse(DashboardTrendsSchema, trends),
      };
    } catch (error) {
      return {
        ok: false as const,
        error: toPublicError(error, "No se pudieron obtener las tendencias."),
      };
    }
  },
);
