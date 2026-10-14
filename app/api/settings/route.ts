import { withApiErrors, readJson } from "@/lib/http";
import { getStore } from "@/lib/storage";
import { UpdateSettingsSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = withApiErrors(async () => {
  return Response.json({ settings: await getStore().getSettings() });
});

export const PUT = withApiErrors(async (request) => {
  const patch = UpdateSettingsSchema.parse(await readJson(request));
  return Response.json({ settings: await getStore().updateSettings(patch) });
});
