import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  AlertSchema,
  type AgentSettings,
  type Alert,
  type CallRecord,
  CallerSchema,
  type Contact,
  ContactSchema,
  DecisionSchema,
  DEFAULT_CONTACTS,
  DEFAULT_SCHEDULES,
  DEFAULT_SETTINGS,
  type Schedule,
  ScheduleSchema,
  SettingsSchema,
} from "@/lib/domain";

type StoreState = {
  settings: AgentSettings;
  contacts: Contact[];
  schedules: Schedule[];
  calls: CallRecord[];
  alerts: Alert[];
};

export interface Store {
  getSettings(): Promise<AgentSettings>;
  updateSettings(patch: Partial<AgentSettings>): Promise<AgentSettings>;
  listContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: Omit<Contact, "id"> & { id?: string }): Promise<Contact>;
  updateContact(id: string, patch: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;
  listSchedules(): Promise<Schedule[]>;
  getSchedule(id: string): Promise<Schedule | undefined>;
  createSchedule(schedule: Omit<Schedule, "id"> & { id?: string }): Promise<Schedule>;
  updateSchedule(id: string, patch: Partial<Schedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: string): Promise<boolean>;
  listCalls(): Promise<CallRecord[]>;
  createCall(call: CallRecord): Promise<CallRecord>;
  createAlert(alert: Alert): Promise<Alert>;
  listAlerts(unreadOnly?: boolean): Promise<Alert[]>;
  updateAlert(id: string, read: boolean): Promise<Alert | undefined>;
  markAllAlertsRead(): Promise<number>;
}

function seedState(): StoreState {
  return {
    settings: { ...DEFAULT_SETTINGS },
    contacts: [...DEFAULT_CONTACTS],
    schedules: [...DEFAULT_SCHEDULES],
    calls: [],
    alerts: [],
  };
}

function parseStoredSettings(value: unknown): AgentSettings {
  if (
    typeof value === "object" &&
    value !== null &&
    "voice" in value &&
    value.voice === "default"
  ) {
    return SettingsSchema.parse({ ...value, voice: "alloy" });
  }
  return SettingsSchema.parse(value);
}

class LocalJsonStore implements Store {
  private queue: Promise<unknown> = Promise.resolve();

  private get filePath(): string {
    if (process.env.LOCAL_STORE_PATH) return path.resolve(process.env.LOCAL_STORE_PATH);
    const baseDirectory = process.env.VERCEL ? tmpdir() : process.cwd();
    return process.env.VERCEL
      ? path.join(baseDirectory, "relay-agent.json")
      : path.join(baseDirectory, ".data", "relay-agent.json");
  }

  private async load(): Promise<StoreState> {
    try {
      const content = await readFile(this.filePath, "utf8");
      const parsed: unknown = JSON.parse(content);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("settings" in parsed) ||
        !("contacts" in parsed) ||
        !("schedules" in parsed) ||
        !("calls" in parsed) ||
        !("alerts" in parsed)
      ) {
        throw new Error("Local data file has an invalid shape.");
      }
      const state = parsed as StoreState;
      state.settings = parseStoredSettings(state.settings);
      state.contacts = state.contacts.map((entry) => ContactSchema.parse(entry) as Contact);
      state.schedules = state.schedules.map((entry) => ScheduleSchema.parse(entry) as Schedule);
      state.alerts = state.alerts.map((entry) => AlertSchema.parse(entry));
      return state;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") return seedState();
      throw error;
    }
  }

  private async save(state: StoreState): Promise<void> {
    const directory = path.dirname(this.filePath);
    await mkdir(directory, { recursive: true });
    const temporaryPath = `${this.filePath}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(state, null, 2), "utf8");
    await rename(temporaryPath, this.filePath);
  }

  private transact<T>(operation: (state: StoreState) => T | Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      const state = await this.load();
      const value = await operation(state);
      await this.save(state);
      return value;
    });
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  getSettings(): Promise<AgentSettings> {
    return this.transact((state) => ({ ...state.settings }));
  }

  updateSettings(patch: Partial<AgentSettings>): Promise<AgentSettings> {
    return this.transact((state) => {
      state.settings = SettingsSchema.parse({ ...state.settings, ...patch });
      return { ...state.settings };
    });
  }

  listContacts(): Promise<Contact[]> {
    return this.transact((state) => [...state.contacts]);
  }

  getContact(id: string): Promise<Contact | undefined> {
    return this.transact((state) => state.contacts.find((contact) => contact.id === id));
  }

  createContact(contact: Omit<Contact, "id"> & { id?: string }): Promise<Contact> {
    return this.transact((state) => {
      const created = ContactSchema.parse({ ...contact, id: contact.id ?? crypto.randomUUID() }) as Contact;
      if (state.contacts.some((entry) => entry.phone === created.phone)) {
        throw new Error("A contact with this phone number already exists.");
      }
      state.contacts.push(created);
      return created;
    });
  }

  updateContact(id: string, patch: Partial<Contact>): Promise<Contact | undefined> {
    return this.transact((state) => {
      const index = state.contacts.findIndex((entry) => entry.id === id);
      if (index === -1) return undefined;
      const updated = ContactSchema.parse({ ...state.contacts[index], ...patch, id }) as Contact;
      if (state.contacts.some((entry) => entry.id !== id && entry.phone === updated.phone)) {
        throw new Error("A contact with this phone number already exists.");
      }
      state.contacts[index] = updated;
      return updated;
    });
  }

  deleteContact(id: string): Promise<boolean> {
    return this.transact((state) => {
      const length = state.contacts.length;
      state.contacts = state.contacts.filter((entry) => entry.id !== id);
      return state.contacts.length !== length;
    });
  }

  listSchedules(): Promise<Schedule[]> {
    return this.transact((state) => [...state.schedules]);
  }

  getSchedule(id: string): Promise<Schedule | undefined> {
    return this.transact((state) => state.schedules.find((schedule) => schedule.id === id));
  }

  createSchedule(schedule: Omit<Schedule, "id"> & { id?: string }): Promise<Schedule> {
    return this.transact((state) => {
      const created = ScheduleSchema.parse({ ...schedule, id: schedule.id ?? crypto.randomUUID() }) as Schedule;
      state.schedules.push(created);
      return created;
    });
  }

  updateSchedule(id: string, patch: Partial<Schedule>): Promise<Schedule | undefined> {
    return this.transact((state) => {
      const index = state.schedules.findIndex((entry) => entry.id === id);
      if (index === -1) return undefined;
      const updated = ScheduleSchema.parse({ ...state.schedules[index], ...patch, id }) as Schedule;
      state.schedules[index] = updated;
      return updated;
    });
  }

  deleteSchedule(id: string): Promise<boolean> {
    return this.transact((state) => {
      const length = state.schedules.length;
      state.schedules = state.schedules.filter((entry) => entry.id !== id);
      return state.schedules.length !== length;
    });
  }

  listCalls(): Promise<CallRecord[]> {
    return this.transact((state) =>
      [...state.calls].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    );
  }

  createCall(call: CallRecord): Promise<CallRecord> {
    return this.transact((state) => {
      state.calls.push(call);
      return call;
    });
  }

  listAlerts(unreadOnly = false): Promise<Alert[]> {
    return this.transact((state) =>
      state.alerts
        .filter((alert) => !unreadOnly || !alert.read)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    );
  }

  createAlert(alert: Alert): Promise<Alert> {
    return this.transact((state) => {
      state.alerts.push(alert);
      return alert;
    });
  }

  updateAlert(id: string, read: boolean): Promise<Alert | undefined> {
    return this.transact((state) => {
      const alert = state.alerts.find((entry) => entry.id === id);
      if (!alert) return undefined;
      alert.read = read;
      return alert;
    });
  }

  markAllAlertsRead(): Promise<number> {
    return this.transact((state) => {
      let updated = 0;
      for (const alert of state.alerts) {
        if (!alert.read) {
          alert.read = true;
          updated += 1;
        }
      }
      return updated;
    });
  }
}

class SupabaseStore implements Store {
  private readonly client;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  private async run<T>(
    query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  ): Promise<T> {
    const { data, error } = await query;
    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    if (data === null) throw new Error("Supabase returned no data.");
    return data;
  }

  async getSettings(): Promise<AgentSettings> {
    const { data, error } = await this.client
      .from("settings")
      .select("value")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    if (!data) {
      const settings = { ...DEFAULT_SETTINGS };
      await this.run(
        this.client
          .from("settings")
          .upsert({ id: "default", value: settings })
          .select("id"),
      );
      return settings;
    }
    return parseStoredSettings(data.value);
  }

  async updateSettings(patch: Partial<AgentSettings>): Promise<AgentSettings> {
    const settings = SettingsSchema.parse({ ...(await this.getSettings()), ...patch });
    await this.run(
      this.client
        .from("settings")
        .upsert({ id: "default", value: settings })
        .select("id"),
    );
    return settings;
  }

  async listContacts(): Promise<Contact[]> {
    const data = await this.run(
      this.client.from("contacts").select("*").order("name", { ascending: true }),
    );
    return data.map(mapContactRow);
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const { data, error } = await this.client.from("contacts").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return data ? mapContactRow(data) : undefined;
  }

  async createContact(contact: Omit<Contact, "id"> & { id?: string }): Promise<Contact> {
    const value = ContactSchema.parse({ ...contact, id: contact.id ?? crypto.randomUUID() }) as Contact;
    const data = await this.run(
      this.client.from("contacts").insert(toContactRow(value)).select("*").single(),
    );
    return mapContactRow(requireRow(data));
  }

  async updateContact(id: string, patch: Partial<Contact>): Promise<Contact | undefined> {
    const current = await this.getContact(id);
    if (!current) return undefined;
    const value = ContactSchema.parse({ ...current, ...patch, id }) as Contact;
    const data = await this.run(
      this.client.from("contacts").update(toContactRow(value)).eq("id", id).select("*").single(),
    );
    return mapContactRow(requireRow(data));
  }

  async deleteContact(id: string): Promise<boolean> {
    const data = await this.run(
      this.client.from("contacts").delete().eq("id", id).select("id"),
    );
    return data.length > 0;
  }

  async listSchedules(): Promise<Schedule[]> {
    const data = await this.run(
      this.client.from("schedules").select("*").order("weekday").order("start_time"),
    );
    return data.map(mapScheduleRow);
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    const { data, error } = await this.client.from("schedules").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return data ? mapScheduleRow(data) : undefined;
  }

  async createSchedule(schedule: Omit<Schedule, "id"> & { id?: string }): Promise<Schedule> {
    const value = ScheduleSchema.parse({ ...schedule, id: schedule.id ?? crypto.randomUUID() }) as Schedule;
    const data = await this.run(
      this.client.from("schedules").insert(toScheduleRow(value)).select("*").single(),
    );
    return mapScheduleRow(requireRow(data));
  }

  async updateSchedule(id: string, patch: Partial<Schedule>): Promise<Schedule | undefined> {
    const current = await this.getSchedule(id);
    if (!current) return undefined;
    const value = ScheduleSchema.parse({ ...current, ...patch, id }) as Schedule;
    const data = await this.run(
      this.client.from("schedules").update(toScheduleRow(value)).eq("id", id).select("*").single(),
    );
    return mapScheduleRow(requireRow(data));
  }

  async deleteSchedule(id: string): Promise<boolean> {
    const data = await this.run(
      this.client.from("schedules").delete().eq("id", id).select("id"),
    );
    return data.length > 0;
  }

  async listCalls(): Promise<CallRecord[]> {
    const data = await this.run(
      this.client.from("calls").select("*").order("created_at", { ascending: false }),
    );
    return data.map(mapCallRow);
  }

  async createCall(call: CallRecord): Promise<CallRecord> {
    const data = await this.run(
      this.client
        .from("calls")
        .insert(toCallRow(call))
        .select("*")
        .single(),
    );
    return mapCallRow(requireRow(data));
  }

  async listAlerts(unreadOnly = false): Promise<Alert[]> {
    let query = this.client.from("alerts").select("*").order("created_at", { ascending: false });
    if (unreadOnly) query = query.eq("read", false);
    const data = await this.run(query);
    return data.map(mapAlertRow);
  }

  async createAlert(alert: Alert): Promise<Alert> {
    const data = await this.run(
      this.client.from("alerts").insert(toAlertRow(alert)).select("*").single(),
    );
    return mapAlertRow(requireRow(data));
  }

  async updateAlert(id: string, read: boolean): Promise<Alert | undefined> {
    const { data, error } = await this.client
      .from("alerts")
      .update({ read })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Supabase request failed: ${error.message}`);
    return data ? mapAlertRow(data) : undefined;
  }

  async markAllAlertsRead(): Promise<number> {
    const data = await this.run(
      this.client.from("alerts").update({ read: true }).eq("read", false).select("id"),
    );
    return data.length;
  }
}

function mapContactRow(row: Record<string, unknown>): Contact {
  return ContactSchema.parse({
    id: row.id,
    name: row.name,
    phone: row.phone,
    type: row.type,
    preferences: row.preferences,
    escalation: row.escalation,
    privacyRules: row.privacy_rules,
  }) as Contact;
}

function requireRow(
  row: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!row) throw new Error("Supabase returned an empty row.");
  return row;
}

function toContactRow(contact: Contact): Record<string, unknown> {
  return {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    type: contact.type,
    preferences: contact.preferences,
    escalation: contact.escalation,
    privacy_rules: contact.privacyRules,
  };
}

function mapScheduleRow(row: Record<string, unknown>): Schedule {
  return ScheduleSchema.parse({
    id: row.id,
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    enabled: row.enabled,
    timezone: row.timezone,
  }) as Schedule;
}

function toScheduleRow(schedule: Schedule): Record<string, unknown> {
  return {
    id: schedule.id,
    weekday: schedule.weekday,
    start_time: schedule.startTime,
    end_time: schedule.endTime,
    enabled: schedule.enabled,
    timezone: schedule.timezone,
  };
}

function mapCallRow(row: Record<string, unknown>): CallRecord {
  const caller = CallerSchema.parse(row.caller);
  return {
    id: String(row.id),
    caller,
    transcript: String(row.transcript),
    decision: DecisionSchema.parse({
      intent: String(row.intent),
      urgency: row.urgency,
      risk: row.risk,
      confidence: Number(row.confidence),
      action: row.action,
      reply: String(row.reply),
      summary: String(row.summary),
      callbackDetails: row.callback_details ?? {},
    }),
    createdAt: String(row.created_at),
  };
}

function toCallRow(call: CallRecord): Record<string, unknown> {
  return {
    id: call.id,
    caller: call.caller,
    transcript: call.transcript,
    intent: call.decision.intent,
    urgency: call.decision.urgency,
    risk: call.decision.risk,
    confidence: call.decision.confidence,
    action: call.decision.action,
    reply: call.decision.reply,
    summary: call.decision.summary,
    callback_details: call.decision.callbackDetails,
    created_at: call.createdAt,
  };
}

function mapAlertRow(row: Record<string, unknown>): Alert {
  return AlertSchema.parse({
    id: row.id,
    callId: row.call_id,
    type: row.type,
    read: row.read,
    createdAt: row.created_at,
  });
}

function toAlertRow(alert: Alert): Record<string, unknown> {
  return {
    id: alert.id,
    call_id: alert.callId,
    type: alert.type,
    read: alert.read,
    created_at: alert.createdAt,
  };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

let storeInstance: Store | undefined;

export function getStore(): Store {
  if (storeInstance) return storeInstance;
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  storeInstance =
    url && serviceRoleKey
      ? new SupabaseStore(url, serviceRoleKey)
      : new LocalJsonStore();
  return storeInstance;
}

export function resetStoreForTests(): void {
  storeInstance = undefined;
}
