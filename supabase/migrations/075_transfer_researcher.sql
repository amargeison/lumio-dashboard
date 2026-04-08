-- 075: AI Transfer Researcher — search history + targets

create table if not exists football_transfer_searches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  created_at timestamptz not null default now(),
  criteria jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  results_count integer not null default 0
);

create index if not exists football_transfer_searches_club_idx
  on football_transfer_searches (club_id, created_at desc);

create table if not exists football_transfer_targets (
  id uuid primary key default gen_random_uuid(),
  search_id uuid references football_transfer_searches(id) on delete cascade,
  club_id uuid references football_clubs(id) on delete cascade,
  name text not null,
  age integer,
  nationality text,
  current_club text,
  current_league text,
  position text not null,
  estimated_value text,
  weekly_wage_estimate text,
  contract_expires text,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  lumio_fit_score integer not null default 0,
  recommendation text,
  source text not null default 'claude-ai',
  created_at timestamptz not null default now()
);

create index if not exists football_transfer_targets_search_idx
  on football_transfer_targets (search_id);

create index if not exists football_transfer_targets_club_idx
  on football_transfer_targets (club_id, created_at desc);
