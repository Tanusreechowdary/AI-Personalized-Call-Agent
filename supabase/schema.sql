create extension if not exists pgcrypto;

create table if not exists public.settings (
  id text primary key check (id = 'default'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null unique check (char_length(phone) between 1 and 40),
  type text not null check (type in ('trusted', 'unknown', 'blocked')),
  preferences jsonb not null default '{"canLeaveMessage":true,"autoHandleAppointments":true}'::jsonb,
  escalation jsonb not null default '{"urgent":true,"lowConfidence":true}'::jsonb,
  privacy_rules jsonb not null default '{"mayShareAvailability":false,"mayShareLocation":false}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  start_time text not null check (start_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time text not null check (end_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'),
  enabled boolean not null default true,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  caller jsonb not null,
  transcript text not null check (char_length(transcript) between 1 and 10000),
  intent text not null,
  urgency text not null check (urgency in ('low', 'medium', 'high')),
  risk text not null check (risk in ('low', 'medium', 'high')),
  confidence double precision not null check (confidence between 0 and 1),
  action text not null check (action in ('HANDLE', 'MESSAGE', 'CLARIFY', 'REFUSE_ALERT', 'ESCALATE')),
  reply text not null,
  summary text not null,
  callback_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists calls_created_at_idx on public.calls (created_at desc);
create index if not exists calls_action_risk_idx on public.calls (action, risk);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  type text not null check (type in ('escalation', 'callback', 'refusal')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists alerts_unread_created_at_idx
  on public.alerts (read, created_at desc);

alter table public.settings enable row level security;
alter table public.contacts enable row level security;
alter table public.schedules enable row level security;
alter table public.calls enable row level security;
alter table public.alerts enable row level security;

-- The backend connects with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- No anonymous access policies are created for private call data.
