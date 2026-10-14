import { z } from "zod";
import {
  CallerSchema,
  ContactSchema,
  DecisionSchema,
  ScheduleSchema,
  SettingsSchema,
} from "@/lib/domain";

export const DecideRequestSchema = z
  .object({
    transcript: z.string().trim().min(1).max(10000),
    callerId: z.string().uuid().optional(),
    caller: CallerSchema.optional(),
  })
  .strict();

export const CreateCallRequestSchema = z
  .object({
    caller: CallerSchema,
    transcript: z.string().trim().min(1).max(10000),
    decision: DecisionSchema,
  })
  .strict();

export const UpdateSettingsSchema = SettingsSchema.partial().strict();
export const CreateContactSchema = ContactSchema;
export const UpdateContactSchema = ContactSchema.partial().strict();
export const CreateScheduleSchema = ScheduleSchema;
export const UpdateScheduleSchema = ScheduleSchema.partial().strict();

export const PatchAlertsSchema = z
  .object({
    id: z.string().uuid().optional(),
    read: z.boolean().optional(),
    markAllRead: z.boolean().optional(),
  })
  .strict()
  .refine((value) => value.markAllRead === true || (value.id !== undefined && value.read !== undefined), {
    message: "Provide an alert id and read value, or set markAllRead to true.",
  });
