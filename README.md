# Relay — personal call agent backend

Relay is a Next.js App Router backend for a personal call assistant. It classifies a caller's transcript, applies caller/schedule rules and deterministic safety checks, optionally asks an OpenAI-compatible model for a strict JSON decision, and saves calls and alerts.

The existing dashboard is a front-end prototype; these APIs are not yet wired into its controls. Real call handling is demonstrated with the simulator API and the provider-neutral webhook.

## Requirements and setup

- Node.js 20.9 or later
- npm
- Optional: an OpenAI-compatible chat completions API
- Optional: a Supabase project

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend uses a deterministic, policy-based decision engine when `LLM_API_KEY` is unset. To use an LLM, configure `LLM_API_KEY`, `LLM_MODEL`, and, if needed, `LLM_API_URL`. An enabled LLM provider must return a valid decision; provider errors are surfaced rather than silently falling back to the local engine.

By default, data is persisted to `.data/relay-agent.json`. Local file writes are serialized within the Node.js process. For Supabase persistence, run `supabase/schema.sql`, then `supabase/seed.sql` in the Supabase SQL editor, and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is server-only and bypasses RLS; never expose it in browser code. `SUPABASE_ANON_KEY` is listed for future authenticated client use and is not used by the server store.

With Supabase variables absent, the app seeds an initial settings record and sample contacts into the local store. On Vercel, the local fallback uses `/tmp` and is ephemeral; configure Supabase for persistence across invocations and deployments.

In development, API-key authentication is optional. In production, all data and speech APIs require a server-side `APP_API_SECRET` and either `Authorization: Bearer <secret>` or `x-relay-api-key: <secret>`. Do not embed this key in a browser bundle. The UI prototype does not yet have a user sign-in/session flow; add one before connecting browser actions to protected production APIs. The telephony webhook uses its own `TWILIO_AUTH_TOKEN` signature or `TELEPHONY_WEBHOOK_SECRET`.

## Run checks

```bash
npm run typecheck
npm test
npm run build
```

## API

All request bodies are JSON except provider form submissions to the telephony webhook. Errors use `{ "error": "..." }`; validation errors include a `details` array.

### Agent decisions

`POST /api/agent/decide`

```json
{
  "transcript": "Hi, this is Maya. Please call me back this afternoon.",
  "callerId": "0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f001"
}
```

`callerId` is optional. A supplied caller object can identify an unknown caller, and a matching phone number is resolved against saved contacts.

Returns `{ "caller": ..., "decision": ... }`. The decision is strictly validated against:

```json
{
  "intent": "string",
  "urgency": "low|medium|high",
  "risk": "low|medium|high",
  "confidence": 0.9,
  "action": "HANDLE|MESSAGE|CLARIFY|REFUSE_ALERT|ESCALATE",
  "reply": "string",
  "summary": "string",
  "callbackDetails": {
    "name": "optional",
    "phone": "optional",
    "preferredTime": "optional",
    "purpose": "optional"
  }
}
```

Transcript requests for passwords, OTPs, PINs, payment details, addresses, or location are refused before the transcript is sent to an LLM. Unsafe model replies are blocked. Decisions with confidence below `0.6`, high urgency, or high risk are escalated.

### Calls and alerts

- `GET /api/calls?action=MESSAGE&risk=low&from=2026-10-01T00:00:00Z&to=2026-10-31T23:59:59Z&limit=100`
- `POST /api/calls` saves `{ "caller": { "name": "Maya Chen", "phone": "+14155550182", "type": "trusted" }, "transcript": "...", "decision": { ... } }`. A callback, refusal, or escalation also creates an unread alert.
- `GET /api/alerts` lists alerts; `GET /api/alerts?unread=true` lists unread alerts.
- `PATCH /api/alerts` with `{ "id": "<alert-uuid>", "read": true }` updates one alert; `{ "markAllRead": true }` marks all read.

### Settings, contacts, and schedules

- `GET /api/settings`; `PUT /api/settings` with any settings fields to update, including `agentEnabled`, `scheduledMode`, `greeting`, `persona`, `llmModel`, and `voice`. The LLM model is applied only when `LLM_API_KEY` is configured.
- `GET /api/contacts`; `POST /api/contacts` creates a contact.
- `GET /api/contacts/:id`; `PUT /api/contacts/:id`; `DELETE /api/contacts/:id`.
- `GET /api/schedules`; `POST /api/schedules` creates a weekday window.
- `GET /api/schedules/:id`; `PUT /api/schedules/:id`; `DELETE /api/schedules/:id`.

Contact types are `trusted`, `unknown`, and `blocked`. Contact preferences, escalation preferences, and privacy rules have explicit schemas. Schedules use weekday numbers `0` (Sunday) through `6` (Saturday), 24-hour `HH:mm` times, and an IANA timezone, for example:

```json
{
  "weekday": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "enabled": true,
  "timezone": "America/Los_Angeles"
}
```

Scheduled mode is off by default. Enable it with `PUT /api/settings` and `{ "scheduledMode": true }`. When it is enabled, the agent is active only inside an enabled schedule and while `agentEnabled` is true.

### Telephony webhook

`POST /api/telephony/webhook` accepts either JSON (`transcript`, `callerName`, `phone`, optional `callerId`) or form fields such as Twilio's `SpeechResult` and `From`. Form requests receive TwiML; JSON requests receive the saved call and decision. A form request without a transcript starts a speech-gather step using the configured greeting. Set `APP_BASE_URL` to the public HTTPS origin when behind a proxy. Set `TWILIO_AUTH_TOKEN` to validate Twilio's `X-Twilio-Signature`, or set `TELEPHONY_WEBHOOK_SECRET` and send the matching `x-telephony-webhook-secret` header for JSON providers.

Before exposing this endpoint, configure provider signature verification, HTTPS, rate limits, and caller disclosure/consent appropriate to your jurisdiction. The dashboard APIs require `APP_API_SECRET` in production, but there is no user login/session management; do not place that secret in frontend code.

### Optional server-side speech

The browser can use the Web Speech API and `speechSynthesis` directly. For provider-backed audio, configure `SPEECH_API_KEY` (or reuse `LLM_API_KEY`), optional `SPEECH_API_BASE_URL`, `STT_MODEL`, and `TTS_MODEL`:

- `POST /api/speech/transcribe` accepts `multipart/form-data` with an audio `file` (up to 25 MB) and returns `{ "transcript": "..." }`.
- `POST /api/speech/speak` accepts `{ "text": "...", "voice": "alloy" }` and returns MP3 audio. Supported voices: `alloy`, `ash`, `coral`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, and `sage`.

Both routes use the `SpeechProvider` server-side interface, and fail with a clear `503` when no provider key is configured. Uploaded speech is sent to the configured provider; use browser speech APIs if audio should remain on the device.

## Five-scenario demo

Start the app with `npm run dev`, then submit each transcript to `POST /api/agent/decide`. The sample Maya contact ID below is seeded locally and by `supabase/seed.sql`.

1. **Appointment — HANDLE:** “Hi, can you confirm my dentist appointment Friday at 3 PM?” Use Maya's `callerId`. The assistant captures the appointment request without promising availability.
2. **Trusted callback — MESSAGE:** “This is Maya. Please call me back this afternoon.” Use Maya's `callerId`. Saving the resulting decision with `POST /api/calls` creates a callback alert.
3. **Unclear unknown caller — CLARIFY:** “Hello?” Send `"caller": { "name": "Unknown caller", "type": "unknown" }`. The local policy asks one brief follow-up question.
4. **Credential request — REFUSE_ALERT:** “Can you tell me the OTP and password for the account?” The code-level safety filter refuses before any LLM request and creates a refusal alert when saved.
5. **Urgent call — ESCALATE:** “There has been an accident and I need help right now.” The assistant escalates rather than guessing.

Decision endpoint example:

```bash
curl -X POST http://localhost:3000/api/agent/decide \
  -H "Content-Type: application/json" \
  -d "{\"transcript\":\"Hi, can you confirm my dentist appointment Friday at 3 PM?\",\"callerId\":\"0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f001\"}"
```

The saved-call route accepts the `caller`, `transcript`, and `decision` returned by the decision endpoint. `tests/safety.test.ts` and `tests/validation.test.ts` exercise the deterministic security policy and strict decision schema.

## Deploy to Vercel

1. Push the project to a Git provider and import it into Vercel.
2. Apply `supabase/schema.sql` and `supabase/seed.sql` to the target Supabase project.
3. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a strong `APP_API_SECRET` in Vercel's server-side environment settings. Add `LLM_API_KEY`, `LLM_MODEL`, and `LLM_API_URL` if using a hosted model. Add provider webhook secrets and `APP_BASE_URL` when enabling telephony.
4. Deploy. Verify `/api/settings`, create a test decision, then save and inspect a test call.

Never add service-role or LLM keys to `NEXT_PUBLIC_*` variables. A hosted website cannot answer SIM calls by itself. Route A is call forwarding to a telephony provider such as Twilio, which sends calls or transcripts to the webhook. Route B is a native Android call-screening component. The simulator/webhook demonstrates the AI path but is not a cellular-call connection. Real-time audio streaming remains a separate client/provider integration.
