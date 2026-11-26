-- DRAFT — for review; apply by hand in the SQL editor. Rollback: supabase/drafts/238_rollback.sql
--
-- 238_impact_communications.sql
-- Communications: newsletters with per-recipient results, two-way threads,
-- automations, the AI usage log behind the per-org daily cap, and the scheduler.
--
--   1. impact_campaigns (from 222, unused until now) gains subject, preheader, sections,
--      kind and created_by, and the statuses a send goes through. A browser may only
--      write a draft, schedule it or cancel it; sending, sent and failed are set by the
--      server. A guard trigger enforces that.
--   2. impact_campaign_recipients: one row per family per channel per campaign —
--      queued → sent → delivered / opened / bounced / complained / unsubscribed, or
--      skipped with the reason. The HQ reads them; only the server writes them.
--   3. tp_families: email_bounced_at and email_bounce_reason — "needs a new email".
--      Cleared when the family's email changes.
--   4. Threads: impact_messages gains read_at, external_id (inbound de-duplication),
--      from_address and campaign_id; impact_threads holds a thread's assignment and
--      when HQ last read it. Parents reply in the app through impact_parent_reply
--      (20 an hour per family). A coach reads only the threads assigned to them.
--   5. impact_automations (one per org per kind, off until switched on) and
--      impact_automation_sends — the record that makes each step send once, and the
--      per-family cap: one automated message per family per day (a unique index).
--   6. impact_ai_usage: every /api/ai/impact call, by org, feature, model and tokens,
--      for the daily cap and the Settings usage line. Written by the server only.
--   7. The scheduler: impact_scheduler_leases (one runner at a time; a lease expires
--      so a crashed run can't block the next) and impact_scheduler_runs (what each
--      five-minute run did). Server only.
--   8. impact_provider_events: Resend / Twilio webhook ids already handled, so a
--      retried webhook changes nothing twice. Server only.
--
-- Additive. No existing data is changed. One transaction. Safe to run twice.

begin;

-- ── 1. Campaigns ────────────────────────────────────────────────────────────
alter table impact_campaigns add column if not exists kind text not null default 'newsletter' check (kind in ('newsletter', 'message', 'automation'));
alter table impact_campaigns add column if not exists subject text check (char_length(subject) <= 200);
alter table impact_campaigns add column if not exists preheader text check (char_length(preheader) <= 200);
-- [{ type: 'headline'|'text'|'image'|'button', text?, image_path?, href?, label? }]
alter table impact_campaigns add column if not exists sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array');
alter table impact_campaigns add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null;
alter table impact_campaigns add column if not exists error text;
alter table impact_campaigns drop constraint if exists impact_campaigns_status_check;
alter table impact_campaigns add constraint impact_campaigns_status_check
  check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'));
create index if not exists idx_impact_campaigns_due on impact_campaigns (scheduled_at) where status = 'scheduled';

create or replace function impact_campaign_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- The server (no signed-in user) may do anything. A signed-in user may draft,
  -- schedule or cancel, and only while nothing has been sent.
  if auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'scheduled') then raise exception 'A new campaign starts as a draft or scheduled.'; end if;
    new.sent_at := null; new.counts := '{}'::jsonb; new.error := null;
  else
    if old.status not in ('draft', 'scheduled') then raise exception 'This campaign has already been sent or is sending, so it can’t be changed.'; end if;
    if new.status not in ('draft', 'scheduled', 'cancelled') then raise exception 'Only Lumio can mark a campaign as sending or sent.'; end if;
    if new.sent_at is distinct from old.sent_at or new.counts is distinct from old.counts or new.error is distinct from old.error then
      raise exception 'Send results are written by Lumio.';
    end if;
    new.updated_at := now();
  end if;
  if new.status = 'scheduled' and (new.scheduled_at is null or new.scheduled_at < now() - interval '5 minutes') then
    raise exception 'Choose a time in the future to schedule this.';
  end if;
  return new;
end $$;
revoke all on function impact_campaign_guard() from public, anon, authenticated;
drop trigger if exists impact_campaign_guard on impact_campaigns;
create trigger impact_campaign_guard before insert or update on impact_campaigns for each row execute function impact_campaign_guard();
-- A sent campaign is history: the browser can't delete one that has gone.
drop policy if exists impact_campaigns_hq on impact_campaigns;
drop policy if exists impact_campaigns_hq_reads on impact_campaigns;
create policy impact_campaigns_hq_reads on impact_campaigns for select to authenticated using (hq_id in (select impact_hqs_for('hq')));
drop policy if exists impact_campaigns_hq_adds on impact_campaigns;
create policy impact_campaigns_hq_adds on impact_campaigns for insert to authenticated with check (hq_id in (select impact_hqs_for('hq')));
drop policy if exists impact_campaigns_hq_edits on impact_campaigns;
create policy impact_campaigns_hq_edits on impact_campaigns for update to authenticated using (hq_id in (select impact_hqs_for('hq'))) with check (hq_id in (select impact_hqs_for('hq')));
drop policy if exists impact_campaigns_hq_drops on impact_campaigns;
create policy impact_campaigns_hq_drops on impact_campaigns for delete to authenticated using (hq_id in (select impact_hqs_for('hq')) and status in ('draft', 'scheduled', 'cancelled'));

-- ── 2. Per-recipient results ────────────────────────────────────────────────
create table if not exists impact_campaign_recipients (
  id            uuid primary key default gen_random_uuid(),
  hq_id         uuid not null references auth.users(id) on delete cascade,
  campaign_id   uuid not null references impact_campaigns(id) on delete cascade,
  family_id     uuid references tp_families(id) on delete set null,
  channel       text not null check (channel in ('email', 'sms', 'app')),
  status        text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'opened', 'bounced', 'complained', 'unsubscribed', 'failed', 'skipped')),
  skip_reason   text,                         -- 'no consent', 'unsubscribed', 'no email', 'bounced before'…
  provider_id   text,
  error         text,
  sent_at       timestamptz,
  delivered_at  timestamptz,
  opened_at     timestamptz,
  bounced_at    timestamptz,
  unsubscribed_at timestamptz,
  updated_at    timestamptz not null default now(),
  unique (campaign_id, family_id, channel)
);
create index if not exists idx_impact_campaign_recipients_campaign on impact_campaign_recipients (campaign_id, status);
create unique index if not exists impact_campaign_recipients_provider_key on impact_campaign_recipients (provider_id) where provider_id is not null;
create index if not exists idx_impact_campaign_recipients_family on impact_campaign_recipients (family_id);
alter table impact_campaign_recipients enable row level security;
drop policy if exists impact_campaign_recipients_hq_reads on impact_campaign_recipients;
create policy impact_campaign_recipients_hq_reads on impact_campaign_recipients for select to authenticated using (hq_id in (select impact_hqs_for('hq')));
revoke all on impact_campaign_recipients from public, anon, authenticated;
grant select on impact_campaign_recipients to authenticated;

-- ── 3. Bounced email ────────────────────────────────────────────────────────
alter table tp_families add column if not exists email_bounced_at timestamptz;
alter table tp_families add column if not exists email_bounce_reason text check (char_length(email_bounce_reason) <= 300);
create or replace function impact_family_email_changed() returns trigger
language plpgsql set search_path = public as $$
begin
  -- A new address gets a fresh start.
  if new.email is distinct from old.email then new.email_bounced_at := null; new.email_bounce_reason := null; end if;
  return new;
end $$;
drop trigger if exists impact_family_email_changed on tp_families;
create trigger impact_family_email_changed before update of email on tp_families for each row execute function impact_family_email_changed();

-- ── 4. Threads ──────────────────────────────────────────────────────────────
alter table impact_messages add column if not exists read_at timestamptz;          -- an inbound message HQ has read
alter table impact_messages add column if not exists external_id text;             -- inbound email / SMS id, for de-duplication
alter table impact_messages add column if not exists from_address text check (char_length(from_address) <= 320);
alter table impact_messages add column if not exists campaign_id uuid references impact_campaigns(id) on delete set null;
create unique index if not exists impact_messages_external_key on impact_messages (hq_id, external_id) where external_id is not null;
create index if not exists idx_impact_messages_unread on impact_messages (hq_id) where direction = 'in' and read_at is null;

create table if not exists impact_threads (
  hq_id             uuid not null references auth.users(id) on delete cascade,
  thread_key        text not null check (thread_key ~ '^family:[0-9a-f-]{36}$'),
  family_id         uuid references tp_families(id) on delete cascade,
  assigned_staff_id uuid references tp_staff(id) on delete set null,
  closed_at         timestamptz,
  updated_at        timestamptz not null default now(),
  primary key (hq_id, thread_key)
);
create index if not exists idx_impact_threads_staff on impact_threads (assigned_staff_id) where assigned_staff_id is not null;
alter table impact_threads enable row level security;
drop policy if exists impact_threads_hq on impact_threads;
create policy impact_threads_hq on impact_threads for all to authenticated
  using (hq_id in (select impact_hqs_for('hq')))
  with check (hq_id in (select impact_hqs_for('hq'))
    and (family_id is null or exists (select 1 from tp_families f where f.id = family_id and f.hq_id = impact_threads.hq_id))
    and (assigned_staff_id is null or exists (select 1 from tp_staff s where s.id = assigned_staff_id and s.hq_id = impact_threads.hq_id)));
drop policy if exists impact_threads_coach_reads on impact_threads;
create policy impact_threads_coach_reads on impact_threads for select to authenticated using (assigned_staff_id in (select impact_my_staff()));
revoke all on impact_threads from public, anon;
grant select, insert, update, delete on impact_threads to authenticated;

-- A coach reads the messages of threads assigned to them (and nothing else).
drop policy if exists impact_messages_coach_reads on impact_messages;
create policy impact_messages_coach_reads on impact_messages for select to authenticated
  using (exists (select 1 from impact_threads t where t.hq_id = impact_messages.hq_id and t.thread_key = impact_messages.thread_key and t.assigned_staff_id in (select impact_my_staff())));

-- A parent's reply from the app Messages tab. Their own family only, 20 an hour.
create or replace function impact_parent_reply(p_family uuid, p_body text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_hq uuid; v_id uuid; v_body text := btrim(coalesce(p_body, ''));
begin
  if p_family is null or p_family not in (select impact_my_families()) then raise exception 'That family could not be found.'; end if;
  if char_length(v_body) < 1 then raise exception 'Write a message first.'; end if;
  if char_length(v_body) > 4000 then raise exception 'That message is too long (4,000 characters at most).'; end if;
  select hq_id into v_hq from tp_families where id = p_family;
  if (select count(*) from impact_messages where family_id = p_family and hq_id = v_hq and direction = 'in' and channel = 'app' and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'You’ve sent a lot of messages in the last hour — please try again later.';
  end if;
  insert into impact_messages (hq_id, thread_key, family_id, channel, direction, body, status)
  values (v_hq, 'family:' || p_family, p_family, 'app', 'in', v_body, 'received') returning id into v_id;
  insert into impact_threads (hq_id, thread_key, family_id) values (v_hq, 'family:' || p_family, p_family)
  on conflict (hq_id, thread_key) do update set closed_at = null, updated_at = now();
  return v_id;
end $$;
revoke all on function impact_parent_reply(uuid, text) from public, anon;
grant execute on function impact_parent_reply(uuid, text) to authenticated;

-- ── 5. Automations ──────────────────────────────────────────────────────────
create table if not exists impact_automations (
  id          uuid primary key default gen_random_uuid(),
  hq_id       uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('welcome', 'session_reminder', 'missed_you', 'pack_issued', 'booklet_nudge')),
  enabled     boolean not null default false,
  -- The editable wording per step, e.g. { "steps": { "instant": "…", "day1": "…", "day7": "…" } }
  config      jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  updated_by  uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  unique (hq_id, kind)
);
alter table impact_automations enable row level security;
drop policy if exists impact_automations_hq on impact_automations;
create policy impact_automations_hq on impact_automations for all to authenticated using (hq_id in (select impact_hqs_for('hq'))) with check (hq_id in (select impact_hqs_for('hq')));
revoke all on impact_automations from public, anon;
grant select, insert, update on impact_automations to authenticated;

create table if not exists impact_automation_sends (
  id            uuid primary key default gen_random_uuid(),
  hq_id         uuid not null references auth.users(id) on delete cascade,
  automation_id uuid not null references impact_automations(id) on delete cascade,
  family_id     uuid not null references tp_families(id) on delete cascade,
  step          text not null check (char_length(step) <= 120),   -- 'day1', 'session:<id>', 'week:2026-11-23'…
  send_date     date not null,                                    -- the family's UK date it went
  status        text not null default 'claimed' check (status in ('claimed', 'sent', 'failed', 'skipped')),
  detail        text,
  message_id    uuid references impact_messages(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (automation_id, family_id, step)
);
-- One automated message per family per day, whatever sent it. Skipped rows don't count.
create unique index if not exists impact_automation_sends_daily_cap on impact_automation_sends (hq_id, family_id, send_date) where status <> 'skipped';
alter table impact_automation_sends enable row level security;
drop policy if exists impact_automation_sends_hq_reads on impact_automation_sends;
create policy impact_automation_sends_hq_reads on impact_automation_sends for select to authenticated using (hq_id in (select impact_hqs_for('hq')));
revoke all on impact_automation_sends from public, anon, authenticated;
grant select on impact_automation_sends to authenticated;

-- ── 6. AI usage ─────────────────────────────────────────────────────────────
create table if not exists impact_ai_usage (
  id             uuid primary key default gen_random_uuid(),
  hq_id          uuid not null references auth.users(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,
  feature        text not null check (char_length(feature) <= 60),     -- 'newsletter', 'message', 'social', 'import'…
  model          text not null check (char_length(model) <= 80),
  input_tokens   int not null default 0 check (input_tokens >= 0),
  output_tokens  int not null default 0 check (output_tokens >= 0),
  cost_pence     numeric(10, 4) not null default 0 check (cost_pence >= 0),
  refused        boolean not null default false,                       -- over the cap: logged, not sent
  created_at     timestamptz not null default now()
);
create index if not exists idx_impact_ai_usage_day on impact_ai_usage (hq_id, created_at desc);
alter table impact_ai_usage enable row level security;
drop policy if exists impact_ai_usage_hq_reads on impact_ai_usage;
create policy impact_ai_usage_hq_reads on impact_ai_usage for select to authenticated using (hq_id in (select impact_hqs_for('hq')));
revoke all on impact_ai_usage from public, anon, authenticated;
grant select on impact_ai_usage to authenticated;

-- ── 7. Scheduler ────────────────────────────────────────────────────────────
create table if not exists impact_scheduler_leases (
  job         text primary key check (char_length(job) <= 60),
  holder      uuid not null,
  expires_at  timestamptz not null
);
create table if not exists impact_scheduler_runs (
  id           uuid primary key default gen_random_uuid(),
  job          text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  counts       jsonb not null default '{}'::jsonb,
  error        text
);
create index if not exists idx_impact_scheduler_runs on impact_scheduler_runs (job, started_at desc);
alter table impact_scheduler_leases enable row level security;
alter table impact_scheduler_runs enable row level security;
revoke all on impact_scheduler_leases, impact_scheduler_runs from public, anon, authenticated;

-- Take the lease for a job if nobody holds it (or theirs has run out). → true when taken.
create or replace function impact_scheduler_claim(p_job text, p_holder uuid, p_seconds int) returns boolean
language sql security definer set search_path = public as $$
  with taken as (
    insert into impact_scheduler_leases (job, holder, expires_at) values (p_job, p_holder, now() + make_interval(secs => p_seconds))
    on conflict (job) do update set holder = excluded.holder, expires_at = excluded.expires_at
      where impact_scheduler_leases.expires_at < now() or impact_scheduler_leases.holder = excluded.holder
    returning 1)
  select exists (select 1 from taken)
$$;
create or replace function impact_scheduler_release(p_job text, p_holder uuid) returns void
language sql security definer set search_path = public as $$
  delete from impact_scheduler_leases where job = p_job and holder = p_holder
$$;
revoke all on function impact_scheduler_claim(text, uuid, int) from public, anon, authenticated;
revoke all on function impact_scheduler_release(text, uuid) from public, anon, authenticated;
grant execute on function impact_scheduler_claim(text, uuid, int) to service_role;
grant execute on function impact_scheduler_release(text, uuid) to service_role;

-- ── 8. Webhook de-duplication ───────────────────────────────────────────────
create table if not exists impact_provider_events (
  id           text primary key check (char_length(id) <= 200),   -- 'resend:<svix-id>', 'twilio:<sid>:<status>'
  received_at  timestamptz not null default now()
);
alter table impact_provider_events enable row level security;
revoke all on impact_provider_events from public, anon, authenticated;

commit;
notify pgrst, 'reload schema';
