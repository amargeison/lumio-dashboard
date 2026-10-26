-- 213 — Leads: one place for enquiries, from first contact to joined.
--
--   coach_leads        one row per person who enquired, in a pipeline
--                      ('coaching' or 'holiday') at a stage the coach moves on
--   coach_lead_events  what happened to a lead and when (created, moved, note,
--                      follow-up done) — the history on the lead, and the
--                      points behind the weekly score
--   coach_lead_hooks   the academy's private address for leads sent in by an
--                      automation (Meta lead ads via Zapier, Make, …)
--
-- Leads are the coach's own work, like players: the head coach sees all of
-- them, an invited coach sees the ones assigned to them (lumio_can_see,
-- migration 166). The private address is server-only.
-- Safe to run twice.

create table if not exists coach_leads (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references auth.users(id) on delete cascade,
  staff_id        uuid references coach_staff(id) on delete set null,
  pipeline        text not null default 'coaching',
  stage           text not null default 'Enquired',
  name            text not null,
  for_name        text,                     -- the child, when a parent enquired
  email           text,
  phone           text,
  source          text,                     -- meta | website | referral | import | manual | other
  campaign        text,
  message         text,
  notes           text,
  contact_method  text,                     -- WhatsApp | Email | Phone | In person
  google_review   boolean not null default false,
  list            text,                     -- a waiting list or "contact next term"
  next_action_at  date,
  next_action     text,
  player_id       uuid references coach_players(id) on delete set null,
  stage_changed_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_leads_pipeline_ok') then
    alter table coach_leads add constraint coach_leads_pipeline_ok check (pipeline in ('coaching', 'holiday'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_leads_name_ok') then
    alter table coach_leads add constraint coach_leads_name_ok check (char_length(btrim(name)) between 1 and 120);
  end if;
end $$;
create index if not exists idx_coach_leads_coach on coach_leads (coach_id, pipeline, stage);
create index if not exists idx_coach_leads_staff on coach_leads (coach_id, staff_id);
create index if not exists idx_coach_leads_email on coach_leads (coach_id, lower(email)) where email is not null;

create table if not exists coach_lead_events (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  staff_id    uuid references coach_staff(id) on delete set null,
  lead_id     uuid not null references coach_leads(id) on delete cascade,
  kind        text not null,               -- created | stage | note | followup
  from_stage  text,
  to_stage    text,
  text        text,
  points      integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_coach_lead_events_lead on coach_lead_events (lead_id, created_at desc);
create index if not exists idx_coach_lead_events_coach on coach_lead_events (coach_id, created_at desc);

-- The coach's own work: full access to their rows (as coach_players).
do $$
declare t text;
begin
  foreach t in array array['coach_leads', 'coach_lead_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists lumio_coach_own on public.%I', t);
    execute format($f$
      create policy lumio_coach_own on public.%I for all to authenticated
        using (lumio_can_see(coach_id, staff_id))
        with check (lumio_can_see(coach_id, staff_id))
    $f$, t);
  end loop;
end $$;

create table if not exists coach_lead_hooks (
  coach_id    uuid primary key references auth.users(id) on delete cascade,
  token       text not null unique,
  last_used_at timestamptz,
  created_at  timestamptz not null default now()
);
alter table coach_lead_hooks enable row level security;
revoke insert, update, delete, truncate on coach_lead_hooks from public, anon, authenticated;
drop policy if exists lumio_owner_reads on coach_lead_hooks;
create policy lumio_owner_reads on coach_lead_hooks for select to authenticated using (coach_id = auth.uid());

notify pgrst, 'reload schema';
