-- ═══════════════════════════════════════════════════════════════════════════════
-- 070: Football live-data tables
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists football_clubs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_name text,
  logo_url text,
  primary_colour text,
  secondary_colour text,
  league text,
  team_id_api_football integer,
  created_at timestamptz default now()
);

create table if not exists football_players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  name text not null,
  position text not null check (position in ('GK','DEF','MID','FWD')),
  squad_number integer,
  nationality text,
  date_of_birth date,
  photo_url text,
  status text check (status in ('fit','injured','suspended','doubt')) default 'fit',
  injury_details text,
  return_date date,
  created_at timestamptz default now()
);

create table if not exists football_contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references football_players(id) on delete cascade,
  club_id uuid references football_clubs(id) on delete cascade,
  start_date date,
  end_date date,
  weekly_wage integer,
  release_clause integer,
  option_to_extend boolean default false,
  created_at timestamptz default now()
);

create table if not exists football_fixtures (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  opponent text not null,
  venue text check (venue in ('Home','Away')),
  competition text,
  kickoff_time timestamptz,
  result_home integer,
  result_away integer,
  created_at timestamptz default now()
);

create table if not exists football_finance (
  id uuid primary key references football_clubs(id) on delete cascade,
  wage_budget_total integer default 0,
  wage_budget_used integer default 0,
  transfer_budget integer default 0,
  transfer_budget_used integer default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_football_players_club on football_players(club_id);
create index if not exists idx_football_contracts_player on football_contracts(player_id);
create index if not exists idx_football_contracts_club on football_contracts(club_id);
create index if not exists idx_football_fixtures_club on football_fixtures(club_id);
create index if not exists idx_football_fixtures_kickoff on football_fixtures(kickoff_time);
