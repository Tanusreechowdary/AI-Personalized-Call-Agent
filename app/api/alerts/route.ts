import { withApiErrors, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/storage";
import { PatchAlertsSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = withApiErrors(async (request) => {
  const unreadOnly = new URL(request.url).searchParams.get("unread") === "true";
  const alerts = await getStore().listAlerts(unreadOnly);
  return Response.json({ alerts, unreadCount: alerts.filter((alert) => !alert.read).length });
});

export const PATCH = withApiErrors(async (request) => {
  const input = PatchAlertsSchema.parse(await readJson(request));
  if (input.markAllRead) {
    return Response.json({ updated: await getStore().markAllAlertsRead() });
  }
  const alert = await getStore().updateAlert(input.id!, input.read!);
  if (!alert) throw new HttpError("Alert not found.", 404);
  return Response.json({ alert });
});
