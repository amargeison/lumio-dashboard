-- 076_opposition_reports.sql
-- AI-generated opposition scouting reports

create table if not exists football_opposition_reports (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  opponent_name text not null,
  match_date date,
  competition text,
  venue text check (venue in ('Home','Away')),
  report_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists football_opposition_reports_club_idx
  on football_opposition_reports (club_id, created_at desc);

alter table football_opposition_reports enable row level security;
