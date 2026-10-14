import { withApiErrors, readJson } from "@/lib/http";
import { getStore } from "@/lib/storage";
import { CreateContactSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = withApiErrors(async () => {
  return Response.json({ contacts: await getStore().listContacts() });
});

export const POST = withApiErrors(async (request) => {
  const input = CreateContactSchema.parse(await readJson(request));
  const contact = await getStore().createContact(input);
  return Response.json({ contact }, { status: 201 });
});
