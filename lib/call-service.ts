import { randomUUID } from "node:crypto";
import type { Alert, CallRecord, Decision } from "@/lib/domain";
import type { Caller } from "@/lib/domain";
import { getStore } from "@/lib/storage";

function alertTypeForDecision(decision: Decision): Alert["type"] | undefined {
  if (decision.action === "REFUSE_ALERT") return "refusal";
  if (decision.action === "ESCALATE") return "escalation";
  if (
    decision.action === "MESSAGE" &&
    /\bcallback\b|\bcall(?:ing)?\s+back\b|\breturn(?:ing)?\s+(?:the|my|your)?\s*call\b/i.test(
      decision.intent,
    )
  ) {
    return "callback";
  }
  return undefined;
}

export async function saveCall(
  caller: Caller,
  transcript: string,
  decision: Decision,
): Promise<CallRecord> {
  const store = getStore();
  const call: CallRecord = {
    id: randomUUID(),
    caller,
    transcript,
    decision,
    createdAt: new Date().toISOString(),
  };
  const saved = await store.createCall(call);
  const alertType = alertTypeForDecision(decision);
  if (alertType) {
    await store.createAlert({
      id: randomUUID(),
      callId: saved.id,
      type: alertType,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  return saved;
}
