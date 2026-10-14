import { withApiErrors, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/storage";
import { UpdateScheduleSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    const schedule = await getStore().getSchedule(id);
    if (!schedule) throw new HttpError("Schedule not found.", 404);
    return Response.json({ schedule });
  })(request);
}

export async function PUT(request: Request, context: RouteContext) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    const patch = UpdateScheduleSchema.parse(await readJson(request));
    const schedule = await getStore().updateSchedule(id, patch);
    if (!schedule) throw new HttpError("Schedule not found.", 404);
    return Response.json({ schedule });
  })(request);
}

export async function DELETE(request: Request, context: RouteContext) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    const deleted = await getStore().deleteSchedule(id);
    if (!deleted) throw new HttpError("Schedule not found.", 404);
    return Response.json({ deleted: true });
  })(request);
}
