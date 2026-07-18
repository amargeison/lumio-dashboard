-- Ten Project Portal — Phase 1 data model (4 of 4): Impact & Pathways.
-- See Ten_Project_Portal_Scoping_v2.docx §5.5 + §5.8. Turns registers and
-- family feedback into funder evidence, and closes the talent-pathway loop.
-- The impact-area taxonomy is Ten Project's own published list (Health,
-- Family, Exercise, Confidence, Focus, Self-Esteem, Socialising, Academic
-- Attainment, Well-Being, Concentration) — validated app-side, stored as
-- text[] so HQ can extend it without a migration.

-- ── Family/school feedback responses ───────────────────────────────────────
create table if not exists tp_impact_responses (
  id              uuid primary key default gen_random_uuid(),
  hq_id           uuid not null references auth.users(id) on delete cascade,
  programme_id    uuid references tp_programmes(id) on delete set null,
  school_id       uuid references tp_schools(id) on delete set null,
  venue_id        uuid references coach_venues(id) on delete set null,
  respondent      text not null default 'parent'
                  check (respondent in ('parent','school','tenor','coach')),
  member_id       uuid references coach_members(id) on delete set null,
  areas_helped    text[],          -- subset of the ten impact areas
  would_recommend boolean,
  quality_of_life boolean,        -- 'has Ten Project helped improve your family's quality of life?'
  satisfaction    int check (satisfaction between 1 and 5),
  comment         text,           -- testimonial candidate (publish only with consent)
  consent_publish boolean default false,
  created_at      timestamptz default now()
);

create index if not exists idx_tp_impact_hq on tp_impact_responses(hq_id);
create index if not exists idx_tp_impact_programme on tp_impact_responses(programme_id);

-- ── Generated funder reports (snapshots) ───────────────────────────────────
create table if not exists tp_funder_reports (
  id            uuid primary key default gen_random_uuid(),
  hq_id         uuid not null references auth.users(id) on delete cascade,
  partner_name  text not null,    -- trust / borough / school the report is for
  scope         text not null default 'programme'
                check (scope in ('school','borough','programme','term','whole')),
  period_label  text,             -- e.g. 'Autumn 2026'
  payload       jsonb,            -- the numbers + AI narrative at generation time
  pdf_url       text,             -- branded export in storage
  created_at    timestamptz default now()
);

create index if not exists idx_tp_reports_hq on tp_funder_reports(hq_id);

-- ── Talent pathway referrals ───────────────────────────────────────────────
create table if not exists tp_pathway_referrals (
  id           uuid primary key default gen_random_uuid(),
  hq_id        uuid not null references auth.users(id) on delete cascade,
  player_id    uuid not null references coach_players(id) on delete cascade,
  programme_id uuid references tp_programmes(id) on delete set null,
  kind         text not null default 'club_intro'
               check (kind in ('club_intro','continue_ten_project','weekend_sessions','competition')),
  destination  text,              -- club/scheme/competition name
  status       text not null default 'suggested'
               check (status in ('suggested','family_interested','contacted','joined','declined')),
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_tp_pathways_hq on tp_pathway_referrals(hq_id);
create index if not exists idx_tp_pathways_player on tp_pathway_referrals(player_id);

-- ── RLS — HQ owner only; survey submissions arrive via server routes ───────
alter table tp_impact_responses enable row level security;
alter table tp_funder_reports enable row level security;
alter table tp_pathway_referrals enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='tp_impact_responses' and policyname='tp_impact_hq') then
    create policy tp_impact_hq on tp_impact_responses using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='tp_funder_reports' and policyname='tp_reports_hq') then
    create policy tp_reports_hq on tp_funder_reports using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename='tp_pathway_referrals' and policyname='tp_pathways_hq') then
    create policy tp_pathways_hq on tp_pathway_referrals using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
end $$;
