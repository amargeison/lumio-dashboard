-- 073: API-Football cache table + club API metadata columns

create table if not exists football_api_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,
  data jsonb not null,
  fetched_at timestamptz not null default now(),
  ttl_seconds integer not null default 3600,
  created_at timestamptz not null default now()
);

create index if not exists football_api_cache_key_idx on football_api_cache (cache_key);

alter table football_clubs
  add column if not exists api_season integer default 2024;

alter table football_clubs
  add column if not exists api_league_id integer;

update football_clubs
   set team_id_api_football = 663,
       api_league_id = 40,
       api_season = 2024
 where slug = 'lumio-dev-afc';
