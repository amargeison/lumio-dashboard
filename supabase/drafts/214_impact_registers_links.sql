-- DRAFT — for review; apply by hand after 213.
--
-- 214_impact_registers_links.sql
-- Registers (sessions + attendance) as Impact-owned tables, and Impact-owned
-- replacements for every link the original tp_* tables made into Tennis
-- Coach's tables. Additive and non-destructive:
--   • the OLD coach_* link columns stay where they are (unused by Impact from
--     now on) — nothing is dropped, no coach_* table is altered;
--   • one relaxation: tp_fundraising_campaigns.school_id becomes optional so an
--     organisation can fundraise as a whole (not only per school), and
--     tp_pathway_referrals.player_id becomes optional so a referral can point
--     at an Impact child instead of a Coach player.

-- ── Sessions and attendance (registers) ─────────────────────────────────────
create table if not exists tp_sessions (
  id             uuid primary key default gen_random_uuid(),
  hq_id          uuid not null references auth.users(id) on delete cascade,
  kind           text not null default 'school' check (kind in ('school','weekend')),
  programme_id   uuid references tp_programmes(id) on delete set null,
  venue_id       uuid references tp_venues(id) on delete set null,
  session_date   date not null,
  week_number    int check (week_number is null or week_number between 0 and 10),
  lead_staff_id  uuid references tp_staff(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_tp_sessions_hq on tp_sessions(hq_id);
create index if not exists idx_tp_sessions_date on tp_sessions(hq_id, session_date);

create table if not exists tp_attendance (
  id              uuid primary key default gen_random_uuid(),
  hq_id           uuid not null references auth.users(id) on delete cascade,
  session_id      uuid not null references tp_sessions(id) on delete cascade,
  child_id        uuid not null references tp_children(id) on delete cascade,
  present         boolean not null default true,
  via             text not null default 'register' check (via in ('register','qr','volunteer','import')),
  skill_recorded  text,
  recorded_at     timestamptz not null default now(),
  unique (session_id, child_id)
);
create index if not exists idx_tp_attendance_hq on tp_attendance(hq_id);
create index if not exists idx_tp_attendance_child on tp_attendance(child_id);

do $$
declare t text;
begin
  foreach t in array array['tp_sessions','tp_attendance'] loop
    execute format('alter table %I enable row level security', t);
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_hq') then
      execute format('create policy %I on %I using (hq_id = auth.uid()) with check (hq_id = auth.uid())', t || '_hq', t);
    end if;
  end loop;
end $$;

-- ── Impact-owned links (replace the coach_* ones; old columns left as-is) ───
alter table tp_programmes          add column if not exists lead_staff_id uuid references tp_staff(id)    on delete set null;
alter table tp_programmes          add column if not exists venue_id      uuid references tp_venues(id)   on delete set null;
alter table tp_qr_checkins         add column if not exists tp_venue_id   uuid references tp_venues(id)   on delete set null;
alter table tp_qr_checkins         add column if not exists family_id     uuid references tp_families(id) on delete set null;
alter table tp_impact_responses    add column if not exists tp_venue_id   uuid references tp_venues(id)   on delete set null;
alter table tp_impact_responses    add column if not exists family_id     uuid references tp_families(id) on delete set null;
alter table tp_impact_responses    add column if not exists child_id      uuid references tp_children(id) on delete set null;
alter table tp_fundraising_pledges add column if not exists child_id      uuid references tp_children(id) on delete set null;
alter table tp_pathway_referrals   add column if not exists child_id      uuid references tp_children(id) on delete cascade;

-- Donations: who gave and when, for imported history (Stripe fills these too).
alter table tp_donations add column if not exists donated_on date;
alter table tp_donations add column if not exists purpose    text;

-- ── Relaxations (approved) ───────────────────────────────────────────────────
alter table tp_fundraising_campaigns alter column school_id drop not null;
alter table tp_pathway_referrals     alter column player_id drop not null;
