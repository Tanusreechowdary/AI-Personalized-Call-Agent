import { decideCall } from "@/lib/decision";
import { withApiErrors, readJson } from "@/lib/http";
import { DecideRequestSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = withApiErrors(async (request) => {
  const input = DecideRequestSchema.parse(await readJson(request));
  return Response.json(await decideCall(input));
});
