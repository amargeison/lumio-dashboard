-- 222_impact_comms.sql
-- Impact-owned messaging, mirroring coach_messages (112): content tables only,
-- every row RLS-scoped to the org's HQ login (hq_id = auth.uid()). Additive:
-- nothing is dropped and no existing table is touched. No tokens or secrets
-- belong here; the sender address and provider keys live in the server env.

-- ── Message log: one row per family per channel ─────────────────────────────
-- Written by POST /api/impact/message/send. Every attempt is logged, including
-- those refused on consent or that failed at the provider, so `status` must be
-- checked by anything showing these to a family:
--   sent     handed to the provider (email / sms)
--   filed    saved for the family app (channel = 'app')
--   failed   tried, or could not be tried; `detail` says why
--   refused  stopped by a consent rule; body is left empty
--   received an inbound reply (direction = 'in')
--
-- A future family app must read only status in ('sent','filed','received') AND
-- match hq_id as well as family_id: a foreign key does not check that the family
-- belongs to this HQ, so family_id alone is not proof of whose message it is.
create table if not exists impact_messages (
  id           uuid primary key default gen_random_uuid(),
  hq_id        uuid not null references auth.users(id) on delete cascade,
  thread_key   text not null,                                         -- 'family:<id>'
  family_id    uuid references tp_families(id) on delete set null,    -- the recipient
  child_id     uuid references tp_children(id) on delete set null,    -- optional "about"
  channel      text not null check (channel in ('email','sms','app')),
  direction    text not null default 'out' check (direction in ('out','in')),
  subject      text,
  body         text not null default '',
  status       text not null check (status in ('sent','filed','failed','refused','received')),
  detail       text,                                                  -- the per-recipient outcome
  provider_id  text,                                                  -- Resend / Twilio message id
  created_at   timestamptz not null default now()
);
create index if not exists idx_impact_messages_hq on impact_messages(hq_id, created_at desc);
create index if not exists idx_impact_messages_thread on impact_messages(hq_id, thread_key, created_at);
create index if not exists idx_impact_messages_family on impact_messages(family_id);
create index if not exists idx_impact_messages_child on impact_messages(child_id);

-- ── Campaigns: a message to an audience, drafted or scheduled ───────────────
-- Not used by the send route yet.
create table if not exists impact_campaigns (
  id            uuid primary key default gen_random_uuid(),
  hq_id         uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  channels      text[] not null default '{}',
  audience      jsonb not null default '{}'::jsonb,
  body          text not null default '',
  status        text not null default 'draft' check (status in ('draft','scheduled','sent')),
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  counts        jsonb not null default '{}'::jsonb,                   -- e.g. {"sent":120,"refused":4}
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_impact_campaigns_hq on impact_campaigns(hq_id, created_at desc);

-- ── RLS: each org's HQ sees and writes only its own rows ────────────────────
do $$
declare t text;
begin
  foreach t in array array['impact_messages','impact_campaigns'] loop
    execute format('alter table %I enable row level security', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_hq') then
      execute format('create policy %I on %I for all to authenticated using (hq_id = auth.uid()) with check (hq_id = auth.uid())', t || '_hq', t);
    end if;
  end loop;
end $$;
