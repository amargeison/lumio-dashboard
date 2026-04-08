-- 074: Extend existing GPS tables with RPE/training_load + add ACWR scores table.

alter table gps_sessions add column if not exists session_rpe integer;
alter table gps_sessions add column if not exists session_type text;

alter table gps_player_data add column if not exists training_load numeric;
alter table gps_player_data add column if not exists high_speed_distance_m numeric;
alter table gps_player_data add column if not exists sprint_distance_m numeric;

create table if not exists football_acwr_scores (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  player_id uuid references football_players(id) on delete set null,
  player_name text not null,
  calculated_at timestamptz not null default now(),
  acute_load numeric not null default 0,
  chronic_load numeric not null default 0,
  acwr_ratio numeric not null default 0,
  risk_level text not null default 'Low',
  flagged boolean not null default false
);

create unique index if not exists football_acwr_scores_club_player_uniq
  on football_acwr_scores (club_id, player_name);

create index if not exists football_acwr_scores_club_idx
  on football_acwr_scores (club_id);
