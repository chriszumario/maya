import * as v from "valibot";
import { authenticatedApiFetch } from "@/features/auth/server/authenticated-api.server";
import { toPublicError } from "@/lib/server-error.server";
import { validatedOperation } from "@/lib/validated-operation";
import {
  CreateGoalReviewInputSchema,
  CreateGoalSchema,
  CreateTaskInputSchema,
  DeletedIdSchema,
  GoalDetailSchema,
  GoalIdInputSchema,
  GoalListInputSchema,
  GoalPageSchema,
  GoalReviewSchema,
  GoalReviewsInputSchema,
  GoalReviewsPageSchema,
  GoalSchema,
  GoalTaskSchema,
  ImproveGoalInputSchema,
  SetTaskActiveInputSchema,
  TaskIdInputSchema,
  UpdateGoalInputSchema,
  UpdateGoalStatusInputSchema,
  UpdateTaskInputSchema,
  ValidatedImproveGoalResponseSchema,
} from "./schemas";

async function goalOperation<T>(operation: () => Promise<T>, message: string) {
  try {
    return { ok: true as const, data: await operation() };
  } catch (error) {
    return { ok: false as const, error: toPublicError(error, message) };
  }
}

export const getGoalsFn = validatedOperation(
  GoalListInputSchema,
  async (data) => {
    try {
      const search = new URLSearchParams({ limit: String(data.limit) });
      if (data.cursor) search.set("cursor", data.cursor);
      const response = await authenticatedApiFetch(`/goals?${search}`);
      return { ok: true as const, data: v.parse(GoalPageSchema, response) };
    } catch (error) {
      return {
        ok: false as const,
        error: toPublicError(error, "No se pudieron obtener las metas."),
      };
    }
  },
);

export const getGoalFn = validatedOperation(GoalIdInputSchema, async (data) => {
  try {
    const response = await authenticatedApiFetch(`/goals/${data.id}`);
    return { ok: true as const, data: v.parse(GoalDetailSchema, response) };
  } catch (error) {
    return {
      ok: false as const,
      error: toPublicError(error, "No se pudo obtener la meta."),
    };
  }
});

export const createGoalFn = validatedOperation(
  CreateGoalSchema,
  async (data) => {
    try {
      const response = await authenticatedApiFetch("/goals", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { ok: true as const, data: v.parse(GoalSchema, response) };
    } catch (error) {
      return {
        ok: false as const,
        error: toPublicError(error, "No se pudo crear la meta."),
      };
    }
  },
);

export const updateGoalFn = validatedOperation(UpdateGoalInputSchema, (data) =>
  goalOperation(async () => {
    const { id, ...body } = data;
    const response = await authenticatedApiFetch(`/goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return v.parse(GoalSchema, response);
  }, "No se pudo actualizar la meta."),
);

export const updateGoalStatusFn = validatedOperation(
  UpdateGoalStatusInputSchema,
  (data) =>
    goalOperation(async () => {
      const response = await authenticatedApiFetch(`/goals/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      });
      return v.parse(GoalSchema, response);
    }, "No se pudo cambiar el estado de la meta."),
);

export const deleteGoalFn = validatedOperation(GoalIdInputSchema, (data) =>
  goalOperation(async () => {
    const response = await authenticatedApiFetch(`/goals/${data.id}`, {
      method: "DELETE",
    });
    return v.parse(DeletedIdSchema, response);
  }, "No se pudo eliminar la meta."),
);

export const getGoalReviewsFn = validatedOperation(
  GoalReviewsInputSchema,
  (data) =>
    goalOperation(async () => {
      const search = new URLSearchParams({ limit: String(data.limit) });
      if (data.cursor) search.set("cursor", data.cursor);
      const response = await authenticatedApiFetch(
        `/goals/${data.goalId}/reviews?${search}`,
      );
      return v.parse(GoalReviewsPageSchema, response);
    }, "No se pudo obtener el historial de revisiones."),
);

export const createGoalReviewFn = validatedOperation(
  CreateGoalReviewInputSchema,
  (data) =>
    goalOperation(async () => {
      const { goalId, ...body } = data;
      const response = await authenticatedApiFetch(`/goals/${goalId}/reviews`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return v.parse(GoalReviewSchema, response);
    }, "No se pudo guardar la revisión."),
);

export const improveGoalFn = validatedOperation(
  ImproveGoalInputSchema,
  (data) =>
    goalOperation(async () => {
      const response = await authenticatedApiFetch("/ai/improve-goal", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return v.parse(ValidatedImproveGoalResponseSchema, response);
    }, "No se pudo mejorar la redacción con IA."),
);

export const createTaskFn = validatedOperation(CreateTaskInputSchema, (data) =>
  goalOperation(async () => {
    const { goalId, ...body } = data;
    const response = await authenticatedApiFetch(`/goals/${goalId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return v.parse(GoalTaskSchema, response);
  }, "No se pudo crear la tarea."),
);

export const updateTaskFn = validatedOperation(UpdateTaskInputSchema, (data) =>
  goalOperation(async () => {
    const { taskId, ...body } = data;
    const response = await authenticatedApiFetch(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return v.parse(GoalTaskSchema, response);
  }, "No se pudo actualizar la tarea."),
);

export const setTaskActiveFn = validatedOperation(
  SetTaskActiveInputSchema,
  (data) =>
    goalOperation(async () => {
      const response = await authenticatedApiFetch(`/tasks/${data.taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: data.isActive }),
      });
      return v.parse(GoalTaskSchema, response);
    }, "No se pudo cambiar el estado de la tarea."),
);

export const deleteTaskFn = validatedOperation(TaskIdInputSchema, (data) =>
  goalOperation(async () => {
    const response = await authenticatedApiFetch(`/tasks/${data.taskId}`, {
      method: "DELETE",
    });
    return v.parse(DeletedIdSchema, response);
  }, "No se pudo eliminar la tarea."),
);
