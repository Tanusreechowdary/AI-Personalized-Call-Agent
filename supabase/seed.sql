insert into public.settings (id, value)
values (
  'default',
  '{
    "agentEnabled": true,
    "scheduledMode": false,
    "greeting": "Hi, this is Relay, Jordan''s call assistant. How can I help?",
    "persona": "Warm, concise, and professional",
    "llmModel": "gpt-4o-mini",
    "voice": "alloy"
  }'::jsonb
)
on conflict (id) do nothing;

insert into public.contacts (
  id, name, phone, type, preferences, escalation, privacy_rules
)
values
  (
    '0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f001',
    'Maya Chen',
    '+14155550182',
    'trusted',
    '{"canLeaveMessage":true,"autoHandleAppointments":true}'::jsonb,
    '{"urgent":true,"lowConfidence":true}'::jsonb,
    '{"mayShareAvailability":false,"mayShareLocation":false}'::jsonb
  ),
  (
    '0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f002',
    'Dr. Patel''s Office',
    '+14155550136',
    'trusted',
    '{"canLeaveMessage":true,"autoHandleAppointments":true}'::jsonb,
    '{"urgent":true,"lowConfidence":true}'::jsonb,
    '{"mayShareAvailability":false,"mayShareLocation":false}'::jsonb
  ),
  (
    '0cc3e5d8-5d8e-4b61-9ab2-8e3d7c90f003',
    'Alex Rivera',
    '+15105550114',
    'trusted',
    '{"canLeaveMessage":true,"autoHandleAppointments":true}'::jsonb,
    '{"urgent":true,"lowConfidence":true}'::jsonb,
    '{"mayShareAvailability":false,"mayShareLocation":false}'::jsonb
  )
on conflict (id) do nothing;
