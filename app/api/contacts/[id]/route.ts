import { withApiErrors, HttpError, readJson } from "@/lib/http";
import { getStore } from "@/lib/storage";
import { UpdateContactSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    const contact = await getStore().getContact(id);
    if (!contact) throw new HttpError("Contact not found.", 404);
    return Response.json({ contact });
  })(request);
}

export async function PUT(request: Request, context: RouteContext) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    const patch = UpdateContactSchema.parse(await readJson(request));
    const contact = await getStore().updateContact(id, patch);
    if (!contact) throw new HttpError("Contact not found.", 404);
    return Response.json({ contact });
  })(request);
}

export async function DELETE(request: Request, context: RouteContext) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    const deleted = await getStore().deleteContact(id);
    if (!deleted) throw new HttpError("Contact not found.", 404);
    return Response.json({ deleted: true });
  })(request);
}
