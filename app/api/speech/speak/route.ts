import { z } from "zod";
import { SpeechVoiceSchema } from "@/lib/domain";
import { withApiErrors, readJson } from "@/lib/http";
import { getSpeechProvider } from "@/lib/speech";

export const runtime = "nodejs";

const SpeakRequestSchema = z
  .object({
    text: z.string().trim().min(1).max(4000),
    voice: SpeechVoiceSchema.default("alloy"),
  })
  .strict();

export const POST = withApiErrors(async (request) => {
  const input = SpeakRequestSchema.parse(await readJson(request));
  return getSpeechProvider().synthesize(input.text, input.voice);
});
