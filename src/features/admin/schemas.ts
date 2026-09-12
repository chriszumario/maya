import * as v from "valibot";

import { TimezoneSchema } from "@/features/auth/schemas/auth.schema";
import {
  CursorPageSchema,
  CursorSchema,
  IdSchema,
} from "@/lib/schemas/maya.schema";

export const AdminUserSchema = v.object({
  id: IdSchema,
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  isAdmin: v.boolean(),
  isActive: v.boolean(),
  timezone: TimezoneSchema,
  createdAt: v.string(),
});

export const ActiveSessionSchema = v.object({
  id: IdSchema,
  familyId: v.string(),
  createdAt: v.string(),
  expiresAt: v.string(),
});

const NonNegativeIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

export const AdminStatsSchema = v.object({
  users: v.object({
    total: NonNegativeIntegerSchema,
    active: NonNegativeIntegerSchema,
    pending: NonNegativeIntegerSchema,
    admins: NonNegativeIntegerSchema,
  }),
  activity: v.object({
    period: v.literal("last_30_days"),
    goals: NonNegativeIntegerSchema,
    tasks: NonNegativeIntegerSchema,
    taskExecution: v.object({
      planned: NonNegativeIntegerSchema,
      pending: NonNegativeIntegerSchema,
      inProgress: NonNegativeIntegerSchema,
      completed: NonNegativeIntegerSchema,
      plannedMinutes: NonNegativeIntegerSchema,
      completedMinutes: NonNegativeIntegerSchema,
    }),
    journalEntries: NonNegativeIntegerSchema,
    nutritionEntries: NonNegativeIntegerSchema,
  }),
  topUsers: v.array(
    v.object({
      id: IdSchema,
      name: v.string(),
      email: v.pipe(v.string(), v.email()),
      activityCount: NonNegativeIntegerSchema,
    }),
  ),
  system: v.object({
    version: v.string(),
    uptimeSeconds: NonNegativeIntegerSchema,
    activeSessions: NonNegativeIntegerSchema,
    aiConfigured: v.boolean(),
  }),
});

export const AdminUsersInputSchema = v.object({
  limit: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
    20,
  ),
  cursor: v.optional(CursorSchema),
});
export const AdminUsersPageSchema = CursorPageSchema(AdminUserSchema);

export const AdminUserIdInputSchema = v.object({ userId: IdSchema });
export const SetAdminInputSchema = v.object({
  userId: IdSchema,
  isAdmin: v.boolean(),
});

export type AdminUser = v.InferOutput<typeof AdminUserSchema>;
export type ActiveSession = v.InferOutput<typeof ActiveSessionSchema>;
export type AdminStats = v.InferOutput<typeof AdminStatsSchema>;
