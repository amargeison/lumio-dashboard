-- 079: Player profile — extend football_players + stats history + injuries

-- 1. Extend football_players
alter table football_players add column if not exists agent_name text;
alter table football_players add column if not exists agent_email text;
alter table football_players add column if not exists agent_phone text;
alter table football_players add column if not exists preferred_foot text check (preferred_foot in ('Left', 'Right', 'Both'));
alter table football_players add column if not exists height_cm integer;
alter table football_players add column if not exists weight_kg integer;
alter table football_players add column if not exists market_value text;
alter table football_players add column if not exists previous_clubs text[];
alter table football_players add column if not exists international_caps integer default 0;
alter table football_players add column if not exists international_team text;
alter table football_players add column if not exists social_instagram text;
alter table football_players add column if not exists social_twitter text;
alter table football_players add column if not exists notes text;

-- 2. Stats history
create table if not exists football_player_stats_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references football_players(id) on delete cascade,
  club_id uuid references football_clubs(id) on delete cascade,
  season text not null,
  competition text,
  appearances integer not null default 0,
  goals integer not null default 0,
  assists integer not null default 0,
  yellow_cards integer not null default 0,
  red_cards integer not null default 0,
  avg_rating numeric,
  minutes_played integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists football_player_stats_history_player_idx
  on football_player_stats_history (player_id, season desc);

-- 3. Injuries
create table if not exists football_player_injuries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references football_players(id) on delete cascade,
  club_id uuid references football_clubs(id) on delete cascade,
  injury_type text not null,
  body_part text not null,
  occurred_date date not null,
  return_date date,
  matches_missed integer not null default 0,
  severity text not null check (severity in ('Minor', 'Moderate', 'Severe')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists football_player_injuries_player_idx
  on football_player_injuries (player_id, occurred_date desc);

-- 4. Minimal demo seed for lumio-dev-afc
do $$
declare
  afc_club uuid;
begin
  select id into afc_club from football_clubs where slug = 'lumio-dev-afc';
  if afc_club is null then return; end if;

  -- Agent details + physical attributes on first 5 players (by squad number)
  with picks as (
    select id, row_number() over (order by squad_number nulls last, name) as rn
    from football_players where club_id = afc_club
  )
  update football_players p set
    agent_name = case picks.rn
      when 1 then 'James Whittaker'
      when 2 then 'Sarah Blake'
      when 3 then 'Marco Rossi'
      when 4 then 'David Chen'
      when 5 then 'Liam OConnor'
    end,
    agent_email = case picks.rn
      when 1 then 'james@whittakersports.com'
      when 2 then 'sarah@blakemanagement.co.uk'
      when 3 then 'marco@rossiagency.it'
      when 4 then 'david@chensports.com'
      when 5 then 'liam@oconnorfa.com'
    end,
    agent_phone = case picks.rn
      when 1 then '+44 20 7946 0101'
      when 2 then '+44 20 7946 0202'
      when 3 then '+39 02 1234 5678'
      when 4 then '+44 20 7946 0303'
      when 5 then '+353 1 234 5678'
    end,
    preferred_foot = case (picks.rn % 3) when 0 then 'Right' when 1 then 'Left' else 'Both' end,
    height_cm = 175 + (picks.rn * 3),
    weight_kg = 72 + picks.rn,
    market_value = case picks.rn
      when 1 then '£850k' when 2 then '£1.2m' when 3 then '£600k' when 4 then '£950k' when 5 then '£420k'
    end,
    previous_clubs = case picks.rn
      when 1 then array['Wycombe Wanderers','Reading U23']
      when 2 then array['Charlton Athletic','Millwall U21']
      when 3 then array['Sampdoria Primavera','Genoa']
      when 4 then array['Fulham U23','Brentford B']
      when 5 then array['Cork City','Bohemians']
    end,
    international_caps = case picks.rn when 1 then 4 when 3 then 2 else 0 end,
    international_team = case picks.rn when 1 then 'England U21' when 3 then 'Italy U21' end,
    social_instagram = '@player_' || picks.rn,
    social_twitter = '@player_' || picks.rn,
    notes = 'Key player — pitch demo seed'
  from picks
  where p.id = picks.id and picks.rn <= 5;

  -- Stats history: 3 seasons for first 3 players
  insert into football_player_stats_history (player_id, club_id, season, competition, appearances, goals, assists, yellow_cards, red_cards, avg_rating, minutes_played)
  select pl.id, afc_club, s.season, 'League One', s.apps, s.goals, s.ass, s.yc, 0, s.rating, s.mins
  from (
    select id, row_number() over (order by squad_number nulls last, name) as rn
    from football_players where club_id = afc_club
  ) pl
  cross join (values
    ('2022/23', 28, 4, 3, 5, 7.1::numeric, 2310),
    ('2023/24', 34, 7, 5, 4, 7.4::numeric, 2890),
    ('2024/25', 21, 5, 4, 3, 7.6::numeric, 1820)
  ) as s(season, apps, goals, ass, yc, rating, mins)
  where pl.rn <= 3;

  -- 3 injury records on 3 different players
  insert into football_player_injuries (player_id, club_id, injury_type, body_part, occurred_date, return_date, matches_missed, severity, notes)
  select pl.id, afc_club,
    case pl.rn when 1 then 'Hamstring strain' when 2 then 'Ankle sprain' when 3 then 'Concussion' end,
    case pl.rn when 1 then 'Hamstring' when 2 then 'Ankle' when 3 then 'Head' end,
    case pl.rn when 1 then date '2024-10-12' when 2 then date '2024-11-03' when 3 then date '2025-01-18' end,
    case pl.rn when 1 then date '2024-11-09' when 2 then date '2024-11-24' end,
    case pl.rn when 1 then 4 when 2 then 3 when 3 then 1 end,
    case pl.rn when 1 then 'Moderate' when 2 then 'Minor' when 3 then 'Minor' end,
    'Auto-generated demo record'
  from (
    select id, row_number() over (order by squad_number nulls last, name) as rn
    from football_players where club_id = afc_club
  ) pl
  where pl.rn <= 3;
end $$;
