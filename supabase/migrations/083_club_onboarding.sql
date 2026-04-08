-- 083: Club onboarding wizard

create table if not exists football_onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  current_step integer not null default 1,
  steps_completed text[] not null default '{}',
  squad_import_count integer not null default 0,
  contracts_import_count integer not null default 0,
  fixtures_import_count integer not null default 0,
  import_method text,
  created_at timestamptz not null default now()
);

create index if not exists football_onboarding_sessions_club_idx
  on football_onboarding_sessions (club_id, created_at desc);

create table if not exists football_import_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  onboarding_id uuid references football_onboarding_sessions(id) on delete cascade,
  import_type text not null check (import_type in ('squad','contracts','fixtures','club_info')),
  method text not null check (method in ('csv','manual')),
  rows_attempted integer not null default 0,
  rows_succeeded integer not null default 0,
  rows_failed integer not null default 0,
  errors jsonb,
  created_at timestamptz not null default now()
);

create index if not exists football_import_logs_session_idx
  on football_import_logs (onboarding_id);

alter table football_onboarding_sessions enable row level security;
alter table football_import_logs enable row level security;
