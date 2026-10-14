import { saveCall } from "@/lib/call-service";
import { withApiErrors, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/storage";
import { CreateCallRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = withApiErrors(async (request) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const risk = url.searchParams.get("risk");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const allowedActions = ["HANDLE", "MESSAGE", "CLARIFY", "REFUSE_ALERT", "ESCALATE"];
  const allowedRisks = ["low", "medium", "high"];

  if (action && !allowedActions.includes(action)) {
    throw new HttpError("Unsupported action filter.", 400);
  }
  if (risk && !allowedRisks.includes(risk)) {
    throw new HttpError("Unsupported risk filter.", 400);
  }
  if (from && Number.isNaN(Date.parse(from))) {
    throw new HttpError("The from filter must be an ISO date.", 400);
  }
  if (to && Number.isNaN(Date.parse(to))) {
    throw new HttpError("The to filter must be an ISO date.", 400);
  }

  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? 100 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new HttpError("The limit must be an integer from 1 to 500.", 400);
  }

  const calls = await getStore().listCalls();
  const filtered = calls
    .filter((call) => !action || call.decision.action === action)
    .filter((call) => !risk || call.decision.risk === risk)
    .filter((call) => !from || call.createdAt >= new Date(from).toISOString())
    .filter((call) => !to || call.createdAt <= new Date(to).toISOString())
    .slice(0, limit);
  return Response.json({ calls: filtered });
});

export const POST = withApiErrors(async (request) => {
  const input = CreateCallRequestSchema.parse(await readJson(request));
  const call = await saveCall(input.caller, input.transcript, input.decision);
  return Response.json({ call }, { status: 201 });
});
