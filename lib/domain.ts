import { z } from "zod";

export const ActionSchema = z.enum([
  "HANDLE",
  "MESSAGE",
  "CLARIFY",
  "REFUSE_ALERT",
  "ESCALATE",
]);
export const LevelSchema = z.enum(["low", "medium", "high"]);
export const SpeechVoiceSchema = z.enum([
  "alloy",
  "ash",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "shimmer",
  "sage",
]);

export const CallbackDetailsSchema = z
  .object({
    name: z.string().max(200).optional(),
    phone: z.string().max(50).optional(),
    preferredTime: z.string().max(200).optional(),
    purpose: z.string().max(500).optional(),
  })
  .strict();

export const DecisionSchema = z
  .object({
    intent: z.string().min(1).max(300),
    urgency: LevelSchema,
    risk: LevelSchema,
    confidence: z.number().min(0).max(1),
    action: ActionSchema,
    reply: z.string().min(1).max(1000),
    summary: z.string().min(1).max(1000),
    callbackDetails: CallbackDetailsSchema,
  })
  .strict();

export type Decision = z.infer<typeof DecisionSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Level = z.infer<typeof LevelSchema>;

export const ContactSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(1).max(40),
    type: z.enum(["trusted", "unknown", "blocked"]),
    preferences: z
      .object({
        canLeaveMessage: z.boolean(),
        autoHandleAppointments: z.boolean(),
      })
      .default({ canLeaveMessage: true, autoHandleAppointments: true }),
    escalation: z
      .object({
        urgent: z.boolean(),
        lowConfidence: z.boolean(),
      })
      .default({ urgent: true, lowConfidence: true }),
    privacyRules: z
      .object({
        mayShareAvailability: z.boolean(),
        mayShareLocation: z.boolean(),
      })
      .default({ mayShareAvailability: false, mayShareLocation: false }),
  })
  .strict();
export type Contact = z.infer<typeof ContactSchema> & { id: string };

export const ScheduleSchema = z
  .object({
    id: z.string().uuid().optional(),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
    enabled: z.boolean().default(true),
    timezone: z.string().min(1).max(100).default("UTC"),
  })
  .strict();
export type Schedule = z.infer<typeof ScheduleSchema> & { id: string };

export const SettingsSchema = z
  .object({
    agentEnabled: z.boolean(),
    scheduledMode: z.boolean(),
    greeting: z.string().trim().min(1).max(500),
    persona: z.string().trim().min(1).max(120),
    llmModel: z.string().trim().min(1).max(120).default("gpt-4o-mini"),
    voice: SpeechVoiceSchema.default("alloy"),
  })
  .strict();
export type AgentSettings = z.infer<typeof SettingsSchema>;

export const CallerSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().max(40).optional(),
    type: z.enum(["trusted", "unknown", "blocked"]).default("unknown"),
  })
  .strict();
export type Caller = z.infer<typeof CallerSchema>;

export const CallRecordSchema = z
  .object({
    id: z.string().uuid().optional(),
    caller: CallerSchema,
    transcript: z.string().min(1).max(10000),
    decision: DecisionSchema,
    createdAt: z.string().datetime().optional(),
  })
  .strict();
export type CallRecord = z.infer<typeof CallRecordSchema> & {
  id: string;
  createdAt: string;
};

export const AlertSchema = z
  .object({
    id: z.string().uuid(),
    callId: z.string().uuid(),
    type: z.enum(["escalation", "callback", "refusal"]),
    read: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .strict();
export type Alert = z.infer<typeof AlertSchema>;

export const DEFAULT_SETTINGS: AgentSettings = {
  agentEnabled: true,
  scheduledMode: false,
  greeting: "Hi, this is Relay, Jordan's call assistant. How can I help?",
  persona: "Warm, concise, and professional",
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
  voice: "alloy",
};

export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: "0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f001",
    name: "Maya Chen",
    phone: "+14155550182",
    type: "trusted",
    preferences: { canLeaveMessage: true, autoHandleAppointments: true },
    escalation: { urgent: true, lowConfidence: true },
    privacyRules: { mayShareAvailability: false, mayShareLocation: false },
  },
  {
    id: "0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f002",
    name: "Dr. Patel's Office",
    phone: "+14155550136",
    type: "trusted",
    preferences: { canLeaveMessage: true, autoHandleAppointments: true },
    escalation: { urgent: true, lowConfidence: true },
    privacyRules: { mayShareAvailability: false, mayShareLocation: false },
  },
  {
    id: "0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f003",
    name: "Alex Rivera",
    phone: "+15105550114",
    type: "trusted",
    preferences: { canLeaveMessage: true, autoHandleAppointments: true },
    escalation: { urgent: true, lowConfidence: true },
    privacyRules: { mayShareAvailability: false, mayShareLocation: false },
  },
];

export const DEFAULT_SCHEDULES: Schedule[] = [];
