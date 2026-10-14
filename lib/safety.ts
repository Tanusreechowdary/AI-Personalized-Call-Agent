import type { Decision } from "@/lib/domain";

const sensitiveRequestPatterns: RegExp[] = [
  /\b(?:one[\s-]?time|verification|authentication|security)\s+(?:pass[\s-]?code|code|token|otp)\b/i,
  /\b(?:otp|passcode|password|pin|security code|verification code)\b/i,
  /\b(?:credit|debit)\s+card\b/i,
  /\b(?:credit|debit|bank|card)\s+(?:card\s+)?(?:number|details|information|info|cvv|cvc)\b/i,
  /\b(?:bank\s+account|account)\s+(?:number|details|information|info)\b/i,
  /\b(?:social security|ssn|date of birth|driver'?s license|passport)\b/i,
  /\b(?:cvv|cvc)\b/i,
  /\b(?:tell|give|share|send|read|confirm|repeat|provide|disclose|what(?:'s| is))\b.{0,60}\b(?:password|passcode|otp|pin|bank details|card number|security code|verification code|phone number|email address|social security|ssn)\b/i,
  /\b(?:what(?:'s| is)|provide|tell me|give me|share)\b.{0,45}\b(?:(?:home|street|current|personal)\s+)?address\b/i,
  /\b(?:where (?:do you|does .{1,50}) live|what is your home address|share your location|reveal your location)\b/i,
];

export function isSensitiveRequest(transcript: string): boolean {
  return sensitiveRequestPatterns.some((pattern) => pattern.test(transcript));
}

export function safetyRefusal(transcript: string): Decision | null {
  if (!isSensitiveRequest(transcript)) return null;
  return {
    intent: "Request for sensitive personal or financial information",
    urgency: "high",
    risk: "high",
    confidence: 1,
    action: "REFUSE_ALERT",
    reply:
      "I can’t share private or financial information. I’ll let them know you called.",
    summary:
      "Caller requested sensitive personal or financial information. The request was refused and flagged for review.",
    callbackDetails: {},
  };
}

export function isUnsafeReply(reply: string): boolean {
  return (
    /\b(?:the|your|their)\s+(?:password|passcode|otp|pin|one[\s-]?time code)\s+is\b/i.test(
      reply,
    ) ||
    /\b(?:your|their)\s+(?:home|street|current)\s+address\s+is\b/i.test(reply) ||
    /\b(?:card|account)\s+number\s+is\s+\d{4,}\b/i.test(reply) ||
    /\b(?:card|account)\s+number\s+is\s+[\d -]{4,}\b/i.test(reply) ||
    /\b\d{13,19}\b/.test(reply)
  );
}

export function isCommitmentRequest(transcript: string): boolean {
  return (
    /\b(?:agree to pay|pay on my behalf|authorize (?:a )?payment|accept (?:the )?(?:offer|terms|contract)|sign (?:the )?(?:contract|agreement)|make (?:a )?(?:legal|financial) commitment|commit me to|transfer (?:the )?money)\b/i.test(
      transcript,
    ) ||
    /\b(?:tell|say|promise|agree|authorize|approve|accept|sign|commit|confirm)\b.{0,80}\b(?:pay|payment|money|contract|legal|terms|offer|loan|purchase|transfer|settlement)\b/i.test(
      transcript,
    )
  );
}

export function isUnsafeCommitmentReply(reply: string): boolean {
  return /\b(?:i|we)(?:'ll| will| agree to| accept| authorize| promise| commit to)\b.{0,80}\b(?:pay|payment|money|contract|legal|terms|offer|loan|purchase|transfer|settlement)\b/i.test(
    reply,
  );
}

export function enforceDecisionPolicy(decision: Decision): Decision {
  if (
    decision.action !== "REFUSE_ALERT" &&
    (decision.confidence < 0.6 ||
      decision.urgency === "high" ||
      decision.risk === "high")
  ) {
    return {
      ...decision,
      action: "ESCALATE",
      reply:
        "I want to make sure this is handled correctly. I’ll pass this along right away.",
    };
  }
  return decision;
}
