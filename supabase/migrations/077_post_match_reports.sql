-- 077: AI post-match reports

create table if not exists football_match_reports (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  fixture_id uuid,
  match_date date,
  opponent text,
  venue text,
  competition text,
  our_score integer,
  opponent_score integer,
  our_formation text,
  opponent_formation text,
  report_data jsonb not null default '{}'::jsonb,
  approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists football_match_reports_club_idx
  on football_match_reports (club_id, created_at desc);
