-- DRAFT — for review; apply by hand (after 211/212).
--
-- 213_impact_people_places.sql
-- Impact-OWNED tables for the people and places a programme runs on, so Lumio
-- Impact no longer needs Tennis Coach's coach_staff / coach_venues /
-- coach_members / coach_players. Additive only: nothing is dropped, and no
-- coach_* table is touched. Every row belongs to one org's HQ login and is
-- RLS-scoped to it (hq_id = auth.uid()), like tp_schools (148).

-- ── Weekend / community venues ───────────────────────────────────────────────
create table if not exists tp_venues (
  id               uuid primary key default gen_random_uuid(),
  hq_id            uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  address          text,
  postcode         text,
  courts           text,              -- e.g. '3 courts (2 bookable)'
  surface          text,
  access_notes     text,              -- gate code, keys, booking hand-off
  storage_notes    text,
  session_day      text,              -- e.g. 'Saturday'
  session_time     text,              -- e.g. '1.30–2.30pm'
  inclusive        boolean not null default false,
  external_partner text,              -- linked venue booked via a partner platform
  external_url     text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_tp_venues_hq on tp_venues(hq_id);

-- ── Coaches / staff ──────────────────────────────────────────────────────────
create table if not exists tp_staff (
  id                 uuid primary key default gen_random_uuid(),
  hq_id              uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  role               text not null default 'coach'
                     check (role in ('lead','coach','assistant','apprentice')),
  qualification      text,            -- e.g. 'LTA Level 2'
  email              text,
  phone              text,
  availability       text,
  specialisms        text[] not null default '{}',
  dbs_status         text not null default 'missing'
                     check (dbs_status in ('valid','due-soon','expired','missing','pending')),
  dbs_number         text,
  dbs_expiry         date,
  safeguarding_date  date,
  first_aid_expiry   date,
  insurance          text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_tp_staff_hq on tp_staff(hq_id);

-- ── Families / guardians (households) ────────────────────────────────────────
create table if not exists tp_families (
  id                uuid primary key default gen_random_uuid(),
  hq_id             uuid not null references auth.users(id) on delete cascade,
  guardian_name     text not null,
  guardian2_name    text,
  email             text,
  phone             text,
  emergency_contact text,
  consent_data      boolean,          -- null = not yet recorded
  consent_photo     boolean,
  consent_at        timestamptz,
  opt_in_email      boolean not null default true,
  opt_in_sms        boolean not null default true,
  opt_in_app        boolean not null default true,
  unsubscribed_at   timestamptz,      -- set once; never re-opted-in by an import
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_tp_families_hq on tp_families(hq_id);

-- ── Volunteers (TENORs / Court Captains / session helpers) ──────────────────
create table if not exists tp_volunteers (
  id              uuid primary key default gen_random_uuid(),
  hq_id           uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  venue_id        uuid references tp_venues(id) on delete set null,
  family_id       uuid references tp_families(id) on delete set null,  -- many are parents
  inducted        boolean not null default false,
  induction_date  date,
  dbs_status      text not null default 'n/a'
                  check (dbs_status in ('valid','pending','expired','n/a')),
  dbs_expiry      date,
  since           date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_tp_volunteers_hq on tp_volunteers(hq_id);

-- ── Children ─────────────────────────────────────────────────────────────────
create table if not exists tp_children (
  id             uuid primary key default gen_random_uuid(),
  hq_id          uuid not null references auth.users(id) on delete cascade,
  family_id      uuid references tp_families(id) on delete set null,
  name           text not null,
  date_of_birth  date,
  year_group     text check (year_group is null or year_group ~ '^(N|R|Y([1-9]|1[0-3]))$'),
  school_id      uuid references tp_schools(id) on delete set null,
  programme_id   uuid references tp_programmes(id) on delete set null,  -- the cohort
  class_name     text,
  photo_consent  boolean,             -- null = unknown (never assume yes)
  medical_notes  text,
  send           boolean,             -- SEND, null = not recorded
  fee_status     text not null default 'unknown'
                 check (fee_status in ('paid','deposit','due','waived','unknown')),
  fee_pence      int,
  stickers       int not null default 0 check (stickers between 0 and 6),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_tp_children_hq on tp_children(hq_id);
create index if not exists idx_tp_children_family on tp_children(family_id);
create index if not exists idx_tp_children_programme on tp_children(programme_id);

-- ── RLS: each org's HQ sees and writes only its own rows ────────────────────
do $$
declare t text;
begin
  foreach t in array array['tp_venues','tp_staff','tp_families','tp_volunteers','tp_children'] loop
    execute format('alter table %I enable row level security', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_hq') then
      execute format('create policy %I on %I using (hq_id = auth.uid()) with check (hq_id = auth.uid())', t || '_hq', t);
    end if;
  end loop;
end $$;
