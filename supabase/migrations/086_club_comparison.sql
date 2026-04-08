-- 086: Club comparison — division benchmarks + saved comparisons

create table if not exists football_comparison_benchmarks (
  id uuid primary key default gen_random_uuid(),
  league_id integer not null,
  season integer not null,
  division_name text,
  avg_goals_scored numeric,
  avg_goals_conceded numeric,
  avg_points_per_game numeric,
  avg_home_wins_pct numeric,
  avg_away_wins_pct numeric,
  avg_possession_pct numeric,
  avg_shots_per_game numeric,
  avg_pass_accuracy_pct numeric,
  top_scorer_goals integer,
  relegation_cutoff_points integer,
  playoff_cutoff_points integer,
  promotion_cutoff_points integer,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists football_comparison_benchmarks_league_season_uniq
  on football_comparison_benchmarks (league_id, season);

create table if not exists football_club_comparison_data (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  compared_team_id integer not null,
  compared_team_name text not null,
  compared_team_logo text,
  season integer not null,
  league_id integer not null,
  rank integer,
  points integer,
  played integer,
  won integer,
  drawn integer,
  lost integer,
  goals_for integer,
  goals_against integer,
  goal_difference integer,
  form text,
  home_won integer,
  away_won integer,
  clean_sheets integer,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists football_club_comparison_data_club_team_uniq
  on football_club_comparison_data (club_id, compared_team_id);

-- Seed League One benchmarks
insert into football_comparison_benchmarks
  (league_id, season, division_name, avg_goals_scored, avg_goals_conceded, avg_points_per_game,
   avg_home_wins_pct, avg_away_wins_pct, avg_possession_pct, avg_shots_per_game,
   playoff_cutoff_points, promotion_cutoff_points, relegation_cutoff_points)
values (40, 2024, 'EFL League One', 1.4, 1.4, 1.35, 42.0, 28.0, 50.0, 11.5, 72, 87, 52)
on conflict (league_id, season) do nothing;

-- Seed comparison data for lumio-dev-afc
do $$
declare
  afc uuid;
begin
  select id into afc from football_clubs where slug = 'lumio-dev-afc';
  if afc is null then return; end if;

  insert into football_club_comparison_data
    (club_id, compared_team_id, compared_team_name, compared_team_logo, season, league_id,
     rank, points, played, won, drawn, lost, goals_for, goals_against, goal_difference,
     form, home_won, away_won, clean_sheets)
  values
    (afc, 355, 'Stockport County', null, 2024, 40, 3, 76, 38, 22, 10, 6, 64, 38, 26, 'WWDWL', 13, 9, 14),
    (afc, 2656, 'Huddersfield Town', null, 2024, 40, 11, 56, 38, 15, 11, 12, 52, 48, 4, 'LDWLW', 9, 6, 9),
    (afc, 2742, 'Wigan Athletic', null, 2024, 40, 19, 41, 38, 10, 11, 17, 38, 56, -18, 'LLDLW', 6, 4, 6)
  on conflict (club_id, compared_team_id) do nothing;
end $$;
