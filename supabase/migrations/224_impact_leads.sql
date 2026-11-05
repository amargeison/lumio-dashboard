-- DRAFT — for review; apply by hand in the SQL editor.
--
-- 224_impact_leads.sql
-- Leads for Lumio Impact: schools and funders, from first contact to partnered
-- or funded. A copy of Coach's leads (213_leads.sql), not a share of it: nothing
-- here references a coach_* table, so either product can be sold without the
-- other. Additive: nothing is dropped and no existing table is altered.
--
--   impact_leads        one row per person at a school or funder, in a pipeline
--   impact_lead_events  what happened to a lead and when, and the points behind
--                       the weekly score
--   impact_lead_hooks   the org's private address for leads sent in by an
--                       automation (Meta lead ads via Zapier, Make, …)
--
-- Differences from coach_leads:
--   coach_id          → hq_id
--   staff_id          dropped: an Impact org has one HQ login, no per-coach seats
--   google_review     dropped: means nothing for a school or funder
--   player_id         → school_id, set when a lead is closed as Partnered
--   org_name          new: the school or funder. name is the person there.
--   for_name          kept, now the contact's role
--   amount_pence      new: what a funder might give
--   campaign_id       new: the fundraising campaign a Funded lead's donation went to
--
-- A foreign key doesn't check that the row belongs to this HQ, so school_id,
-- campaign_id and lead_id are not proof of ownership (as in 222). Always match
-- hq_id as well when reading across tables.
-- Safe to run twice.

create table if not exists impact_leads (
  id               uuid primary key default gen_random_uuid(),
  hq_id            uuid not null references auth.users(id) on delete cascade,
  pipeline         text not null default 'schools',
  stage            text not null default 'Enquired',
  name             text not null,            -- the person; the org's name if no contact is known yet
  org_name         text,                     -- the school or funder organisation
  for_name         text,                     -- the contact's role
  email            text,
  phone            text,
  source           text,
  campaign         text,
  message          text,
  notes            text,
  contact_method   text,                     -- WhatsApp | Email | Phone | In person
  list             text,                     -- a waiting list or "contact next term"
  next_action_at   date,
  next_action      text,
  amount_pence     integer,
  school_id        uuid references tp_schools(id) on delete set null,
  campaign_id      uuid references tp_fundraising_campaigns(id) on delete set null,
  stage_changed_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'impact_leads_pipeline_ok') then
    alter table impact_leads add constraint impact_leads_pipeline_ok check (pipeline in ('schools', 'funders'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'impact_leads_name_ok') then
    alter table impact_leads add constraint impact_leads_name_ok check (char_length(btrim(name)) between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'impact_leads_amount_ok') then
    alter table impact_leads add constraint impact_leads_amount_ok check (amount_pence is null or amount_pence >= 0);
  end if;
end $$;
create index if not exists idx_impact_leads_hq on impact_leads (hq_id, pipeline, stage);
create index if not exists idx_impact_leads_email on impact_leads (hq_id, lower(email)) where email is not null;
create index if not exists idx_impact_leads_school on impact_leads (school_id);
create index if not exists idx_impact_leads_campaign on impact_leads (campaign_id);

create table if not exists impact_lead_events (
  id          uuid primary key default gen_random_uuid(),
  hq_id       uuid not null references auth.users(id) on delete cascade,
  lead_id     uuid not null references impact_leads(id) on delete cascade,
  kind        text not null,               -- created | stage | note | followup
  from_stage  text,
  to_stage    text,
  text        text,
  points      integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_impact_lead_events_lead on impact_lead_events (lead_id, created_at desc);
create index if not exists idx_impact_lead_events_hq on impact_lead_events (hq_id, created_at desc);

-- ── RLS: each org's HQ sees and writes only its own rows (as 222) ───────────
do $$
declare t text;
begin
  foreach t in array array['impact_leads','impact_lead_events'] loop
    execute format('alter table %I enable row level security', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_hq') then
      execute format('create policy %I on %I for all to authenticated using (hq_id = auth.uid()) with check (hq_id = auth.uid())', t || '_hq', t);
    end if;
  end loop;
end $$;

-- ── The private address: one per org, server-only writes ────────────────────
-- HQ can read its own token. Making or rotating one goes through the server with
-- the service key, so a browser session can't set a token of its own choosing.
create table if not exists impact_lead_hooks (
  hq_id        uuid primary key references auth.users(id) on delete cascade,
  token        text not null unique,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);
alter table impact_lead_hooks enable row level security;
revoke insert, update, delete, truncate on impact_lead_hooks from public, anon, authenticated;
drop policy if exists impact_lead_hooks_hq_reads on impact_lead_hooks;
create policy impact_lead_hooks_hq_reads on impact_lead_hooks for select to authenticated using (hq_id = auth.uid());

notify pgrst, 'reload schema';
