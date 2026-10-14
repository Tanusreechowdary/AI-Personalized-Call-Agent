import { HttpError } from "@/lib/http";

export interface SpeechProvider {
  transcribe(audio: File): Promise<string>;
  synthesize(text: string, voice: string): Promise<Response>;
}

class OpenAiCompatibleSpeechProvider implements SpeechProvider {
  private readonly baseUrl =
    process.env.SPEECH_API_BASE_URL ?? "https://api.openai.com/v1";

  constructor(private readonly apiKey: string) {}

  async transcribe(audio: File): Promise<string> {
    const form = new FormData();
    form.append("file", audio, audio.name || "call-audio");
    form.append("model", process.env.STT_MODEL ?? "whisper-1");

    const response = await this.post(`${this.baseUrl}/audio/transcriptions`, form);
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new HttpError("The speech provider returned invalid JSON.", 502);
    }
    if (
      typeof body !== "object" ||
      body === null ||
      !("text" in body) ||
      typeof body.text !== "string" ||
      !body.text.trim()
    ) {
      throw new HttpError("The speech provider returned an invalid transcript.", 502);
    }
    return body.text.trim();
  }

  async synthesize(text: string, voice: string): Promise<Response> {
    const response = await this.post(
      `${this.baseUrl}/audio/speech`,
      JSON.stringify({
        model: process.env.TTS_MODEL ?? "tts-1",
        voice,
        input: text,
        response_format: "mp3",
      }),
      "application/json",
    );
    return new Response(await response.arrayBuffer(), {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  }

  private async post(
    url: string,
    body: BodyInit,
    contentType?: string,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...(contentType ? { "Content-Type": contentType } : {}),
        },
        body,
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      console.error("Speech provider request failed", error);
      throw new HttpError("The speech provider is unavailable.", 502);
    }
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      console.error(`Speech provider returned ${response.status}: ${message.slice(0, 500)}`);
      throw new HttpError("The speech provider rejected the request.", 502);
    }
    return response;
  }
}

export function getSpeechProvider(): SpeechProvider {
  const apiKey = process.env.SPEECH_API_KEY ?? process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new HttpError(
      "Server-side speech is not configured. Use browser speech APIs or configure SPEECH_API_KEY.",
      503,
    );
  }
  return new OpenAiCompatibleSpeechProvider(apiKey);
}
