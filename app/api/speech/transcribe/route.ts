import { HttpError, withApiErrors } from "@/lib/http";
import { getSpeechProvider } from "@/lib/speech";

export const runtime = "nodejs";

const maxAudioBytes = 25 * 1024 * 1024;

export const POST = withApiErrors(async (request) => {
  const form = await request.formData();
  const audio = form.get("file");
  if (!(audio instanceof File)) {
    throw new HttpError("Provide an audio file in the 'file' field.", 400);
  }
  if (audio.size === 0 || audio.size > maxAudioBytes) {
    throw new HttpError("Audio must be between 1 byte and 25 MB.", 413);
  }
  if (!audio.type.startsWith("audio/")) {
    throw new HttpError("The uploaded file must have an audio content type.", 415);
  }
  const transcript = await getSpeechProvider().transcribe(audio);
  return Response.json({ transcript });
});
