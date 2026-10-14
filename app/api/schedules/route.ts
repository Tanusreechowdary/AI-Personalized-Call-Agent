import { withApiErrors, readJson } from "@/lib/http";
import { getStore } from "@/lib/storage";
import { CreateScheduleSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = withApiErrors(async () => {
  return Response.json({ schedules: await getStore().listSchedules() });
});

export const POST = withApiErrors(async (request) => {
  const input = CreateScheduleSchema.parse(await readJson(request));
  const schedule = await getStore().createSchedule(input);
  return Response.json({ schedule }, { status: 201 });
});
