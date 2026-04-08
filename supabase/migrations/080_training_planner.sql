-- 080: Training Load Planner

create table if not exists football_training_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  session_date date not null,
  session_name text not null,
  session_type text not null check (session_type in (
    'Match','Tactical','Technical','Physical','Recovery','Rest',
    'Matchday Minus 1','Matchday Minus 2','Gym'
  )),
  planned_duration_mins integer not null default 90,
  planned_intensity text not null check (planned_intensity in (
    'Very Low','Low','Medium','High','Very High'
  )),
  planned_load_au numeric,
  actual_load_au numeric,
  notes text,
  is_rest_day boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists football_training_sessions_club_date_idx
  on football_training_sessions (club_id, session_date);

create table if not exists football_training_player_plans (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references football_training_sessions(id) on delete cascade,
  player_id uuid references football_players(id) on delete set null,
  club_id uuid references football_clubs(id) on delete cascade,
  participation text not null check (participation in (
    'Full','Modified','Individual','Rest','Unavailable'
  )),
  load_cap_au numeric,
  acwr_at_planning numeric,
  risk_flag text not null default 'None' check (risk_flag in (
    'None','Monitor','Caution','High Risk'
  )),
  flag_reason text,
  created_at timestamptz not null default now()
);

create index if not exists football_training_player_plans_session_idx
  on football_training_player_plans (session_id);

create index if not exists football_training_player_plans_club_idx
  on football_training_player_plans (club_id);

alter table football_training_sessions enable row level security;
alter table football_training_player_plans enable row level security;

-- Seed 2 weeks of demo sessions for lumio-dev-afc
do $$
declare
  v_club_id uuid;
  v_monday date := date_trunc('week', current_date)::date;
  v_session_id uuid;
  rec record;
begin
  select id into v_club_id from football_clubs where slug = 'lumio-dev-afc' limit 1;
  if v_club_id is null then return; end if;

  -- Skip if already seeded
  if exists (select 1 from football_training_sessions where club_id = v_club_id and session_date >= v_monday) then
    return;
  end if;

  for rec in
    select * from (values
      (0, 'Recovery & Pool',        'Recovery',         60, 'Very Low', 180,  false),
      (1, 'Tactical Pressing',      'Tactical',         90, 'High',     520,  false),
      (2, 'Possession Patterns',    'Technical',        90, 'Medium',   400,  false),
      (3, 'Match Simulation',       'Tactical',         95, 'High',     540,  false),
      (4, 'Light Walk-through',     'Matchday Minus 1', 45, 'Low',      150,  false),
      (5, 'Matchday',               'Match',            95, 'Very High',650,  false),
      (6, 'Rest Day',               'Rest',              0, 'Very Low',   0,  true),
      (7, 'Recovery & Mobility',    'Recovery',         60, 'Very Low', 200,  false),
      (8, 'Strength & Conditioning','Gym',              75, 'Medium',   380,  false),
      (9, 'Tactical Shape',         'Tactical',         90, 'High',     510,  false),
      (10,'Technical Finishing',    'Technical',        80, 'Medium',   390,  false),
      (11,'Matchday Minus 1',       'Matchday Minus 1', 45, 'Low',      150,  false),
      (12,'Matchday',               'Match',            95, 'Very High',640,  false),
      (13,'Rest Day',               'Rest',              0, 'Very Low',   0,  true)
    ) as t(offset_days, sname, stype, dur, intensity, load_au, is_rest)
  loop
    insert into football_training_sessions
      (club_id, session_date, session_name, session_type, planned_duration_mins, planned_intensity, planned_load_au, is_rest_day)
    values
      (v_club_id, v_monday + rec.offset_days, rec.sname, rec.stype, rec.dur, rec.intensity, rec.load_au, rec.is_rest)
    returning id into v_session_id;
  end loop;
end $$;
