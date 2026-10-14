import { describe, expect, it } from "vitest";
import { DecisionSchema } from "@/lib/domain";

const validDecision = {
  intent: "Appointment confirmation",
  urgency: "low",
  risk: "low",
  confidence: 0.9,
  action: "HANDLE",
  reply: "What time works best for you?",
  summary: "Caller wants to schedule an appointment.",
  callbackDetails: { preferredTime: "Friday afternoon" },
};

describe("decision validation", () => {
  it("accepts a complete valid decision", () => {
    expect(DecisionSchema.parse(validDecision)).toEqual(validDecision);
  });

  it("rejects unsupported actions", () => {
    expect(
      DecisionSchema.safeParse({ ...validDecision, action: "TRANSFER_MONEY" }).success,
    ).toBe(false);
  });

  it("rejects confidence outside the 0-1 range", () => {
    expect(
      DecisionSchema.safeParse({ ...validDecision, confidence: 1.1 }).success,
    ).toBe(false);
  });

  it("rejects extra model output fields", () => {
    expect(
      DecisionSchema.safeParse({ ...validDecision, privateData: "leak" }).success,
    ).toBe(false);
  });
});
