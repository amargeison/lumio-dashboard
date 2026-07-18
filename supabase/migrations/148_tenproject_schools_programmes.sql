-- Ten Project Portal — Phase 1 data model (1 of 4): Schools & Programmes.
-- See Ten_Project_Portal_Scoping_v2.docx §9. The organising backbone Lumio
-- lacked: Borough → School → Programme (10-week instance) → Cohort → Child.
-- All tables are scoped to an owning HQ user (hq_id), mirroring the coach_*
-- academy_id/coach_id pattern. Additive + idempotent; nothing existing is
-- altered destructively. NOT applied automatically — run via the normal
-- migration flow.

-- ── Schools ────────────────────────────────────────────────────────────────
create table if not exists tp_schools (
  id                uuid primary key default gen_random_uuid(),
  hq_id             uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  borough           text,
  address           text,
  head_name         text,            -- headteacher (the buyer/champion)
  pe_lead_name      text,
  safeguarding_lead text,
  contact_email     text,
  contact_phone     text,
  funding_source    text,            -- e.g. 'school budget' | 'borough' | 'trust' | 'fundraising'
  status            text not null default 'enquiry'
                    check (status in ('enquiry','fundraising','confirmed','running','complete','renewal')),
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_tp_schools_hq on tp_schools(hq_id);
create index if not exists idx_tp_schools_status on tp_schools(hq_id, status);

-- ── Programmes (a 10-week instance at one school) ──────────────────────────
create table if not exists tp_programmes (
  id              uuid primary key default gen_random_uuid(),
  hq_id           uuid not null references auth.users(id) on delete cascade,
  school_id       uuid not null references tp_schools(id) on delete cascade,
  term_label      text not null,     -- e.g. 'Autumn 2026'
  start_date      date,
  end_date        date,
  year_groups     text,              -- e.g. 'Y2–Y4'
  current_week    int default 0 check (current_week between 0 and 10),
  status          text not null default 'planned'
                  check (status in ('planned','fundraising','confirmed','running','complete')),
  coach_staff_id  uuid references coach_staff(id) on delete set null,   -- assigned coach
  weekend_venue_id uuid references coach_venues(id) on delete set null, -- linked family-session venue
  cost_pence      int,               -- programme cost — the fundraising target when unfunded
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_tp_programmes_hq on tp_programmes(hq_id);
create index if not exists idx_tp_programmes_school on tp_programmes(school_id);

-- ── Extensions to existing coach_* tables (additive, nullable) ─────────────
-- Children gain school/programme/cohort scoping ('player' → 'child').
alter table coach_players add column if not exists tp_school_id    uuid references tp_schools(id) on delete set null;
alter table coach_players add column if not exists tp_programme_id uuid references tp_programmes(id) on delete set null;
alter table coach_players add column if not exists year_group      text;

-- Parents/guardians gain family grouping + TENOR volunteer flag.
alter table coach_members add column if not exists family_label text;   -- e.g. 'Whitfield family'
alter table coach_members add column if not exists is_tenor     boolean default false;

-- Venues gain the linked-venue hand-off (books via partner platform) and
-- the inclusive-sessions flag used by the venue finder.
alter table coach_venues add column if not exists external_booking_url text;
alter table coach_venues add column if not exists inclusive_sessions   boolean default false;

-- Attendance gains capture source + programme attribution.
alter table coach_attendance add column if not exists source text default 'coach'
  check (source in ('coach','qr','tenor'));
alter table coach_attendance add column if not exists tp_programme_id uuid references tp_programmes(id) on delete set null;
alter table coach_attendance add column if not exists venue_id        uuid references coach_venues(id) on delete set null;

-- ── RLS — HQ owner only (public/parent access flows through server routes) ─
alter table tp_schools enable row level security;
alter table tp_programmes enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tp_schools' and policyname='tp_schools_hq') then
    create policy tp_schools_hq on tp_schools using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='tp_programmes' and policyname='tp_programmes_hq') then
    create policy tp_programmes_hq on tp_programmes using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
end $$;
