import { createHmac, timingSafeEqual } from "node:crypto";
import { decideCall } from "@/lib/decision";
import { saveCall } from "@/lib/call-service";
import { HttpError, withApiErrors } from "@/lib/http";
import { getStore } from "@/lib/storage";

export const runtime = "nodejs";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twilioSignatureMatches(
  request: Request,
  params: Record<string, string>,
  authToken: string,
): boolean {
  const baseUrl =
    process.env.APP_BASE_URL ??
    `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host") ?? new URL(request.url).host}`;
  const requestUrl = new URL(request.url);
  const signedUrl = `${baseUrl.replace(/\/$/, "")}${requestUrl.pathname}${requestUrl.search}`;
  const signedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");
  const expected = createHmac("sha1", authToken)
    .update(`${signedUrl}${signedParams}`)
    .digest("base64");
  const received = request.headers.get("x-twilio-signature") ?? "";
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export const POST = withApiErrors(async (request) => {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.TWILIO_AUTH_TOKEN &&
    !process.env.TELEPHONY_WEBHOOK_SECRET
  ) {
    throw new HttpError(
      "Configure telephony webhook signature verification before production use.",
      503,
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");
  const values: Record<string, string> = {};

  if (isForm) {
    // Twilio posts SpeechResult to Gather's action URL; other providers can post JSON.
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") values[key] = value;
    }
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    if (twilioToken && !twilioSignatureMatches(request, values, twilioToken)) {
      throw new HttpError("Telephony provider signature is invalid.", 401);
    }
    if (!twilioToken && process.env.TELEPHONY_WEBHOOK_SECRET) {
      const expected = Buffer.from(process.env.TELEPHONY_WEBHOOK_SECRET);
      const received = Buffer.from(
        request.headers.get("x-telephony-webhook-secret") ?? "",
      );
      if (
        expected.length !== received.length ||
        !timingSafeEqual(expected, received)
      ) {
        throw new HttpError("Telephony webhook authentication failed.", 401);
      }
    }
  } else {
    const configuredSecret = process.env.TELEPHONY_WEBHOOK_SECRET;
    if (configuredSecret) {
      const received = request.headers.get("x-telephony-webhook-secret") ?? "";
      const expectedBuffer = Buffer.from(configuredSecret);
      const receivedBuffer = Buffer.from(received);
      if (
        expectedBuffer.length !== receivedBuffer.length ||
        !timingSafeEqual(expectedBuffer, receivedBuffer)
      ) {
        throw new HttpError("Telephony webhook authentication failed.", 401);
      }
    } else if (process.env.TWILIO_AUTH_TOKEN) {
      throw new HttpError(
        "A Twilio form webhook must include a valid provider signature.",
        401,
      );
    }

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new HttpError("Webhook body must be a JSON object.", 400);
    }
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") values[key] = value;
    }
  }

  const transcript = values.transcript ?? values.SpeechResult ?? "";
  const wantsXml =
    isForm ||
    request.headers.get("accept")?.includes("application/xml") ||
    request.headers.get("accept")?.includes("text/xml");

  if (!transcript.trim()) {
    if (!wantsXml) {
      throw new HttpError("Webhook transcript is required.", 400);
    }
    const settings = await getStore().getSettings();
    const webhookUrl = `${process.env.APP_BASE_URL ?? new URL(request.url).origin}/api/telephony/webhook`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="speech" action="${escapeXml(webhookUrl)}" method="POST" timeout="5" speechTimeout="auto"><Say>${escapeXml(settings.greeting)}</Say></Gather><Say>We didn't receive a message. Goodbye.</Say><Hangup/></Response>`;
    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  const callerPhone = values.From ?? values.from ?? values.phone;
  const suppliedCallerId = values.callerId;
  const caller = {
    name: values.callerName ?? values.name ?? callerPhone ?? "Unknown caller",
    ...(callerPhone ? { phone: callerPhone } : {}),
    type: "unknown" as const,
  };
  const result = await decideCall({
    transcript,
    ...(suppliedCallerId ? { callerId: suppliedCallerId } : {}),
    caller,
  });
  const call = await saveCall(result.caller, transcript, result.decision);

  if (wantsXml) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${escapeXml(result.decision.reply)}</Say><Hangup/></Response>`;
    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
  return Response.json({ call, decision: result.decision });
}, { requireApiKey: false });
