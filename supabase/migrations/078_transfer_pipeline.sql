-- 078: Transfer Pipeline (Kanban)

alter table football_transfer_targets
  add column if not exists pipeline_stage text
    default 'Identified'
    check (pipeline_stage in ('Identified','Approached','Negotiating','Done','Failed')),
  add column if not exists pipeline_added_at timestamptz,
  add column if not exists pipeline_notes text,
  add column if not exists asking_price text,
  add column if not exists agent_name text,
  add column if not exists agent_contact text,
  add column if not exists priority text
    default 'Medium'
    check (priority in ('Low','Medium','High','Critical')),
  add column if not exists deadline_date date;

create index if not exists football_transfer_targets_pipeline_idx
  on football_transfer_targets (club_id, pipeline_stage)
  where pipeline_added_at is not null;

create table if not exists football_pipeline_activities (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references football_transfer_targets(id) on delete cascade,
  club_id uuid references football_clubs(id) on delete cascade,
  activity_type text not null
    check (activity_type in ('stage_change','note_added','contact_made','bid_submitted','offer_received')),
  from_stage text,
  to_stage text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists football_pipeline_activities_club_idx
  on football_pipeline_activities (club_id, created_at desc);

create index if not exists football_pipeline_activities_target_idx
  on football_pipeline_activities (target_id, created_at desc);

-- Seed 5 demo pipeline entries for lumio-dev-afc
insert into football_transfer_targets (
  club_id, name, age, nationality, current_club, current_league, position,
  estimated_value, weekly_wage_estimate, contract_expires,
  strengths, weaknesses, lumio_fit_score, recommendation, source,
  pipeline_stage, pipeline_added_at, priority, asking_price, agent_name, deadline_date, pipeline_notes
)
select c.id, 'Marcus Webb', 23, 'England', 'Crewe Alexandra', 'EFL League Two', 'CM',
  '£450k', '£3,200', 'Jun 2026',
  array['Press resistance','Long passing range','High work rate'],
  array['Aerial duels'], 84,
  'Box-to-box engine, fits high-press identity. Realistic L2 → L1 step up.',
  'demo-seed', 'Identified', now(), 'Medium', '£600k', 'Stellar Group', null,
  'Watching weekend fixture vs Bradford.'
from football_clubs c where c.slug = 'lumio-dev-afc'
on conflict do nothing;

insert into football_transfer_targets (
  club_id, name, age, nationality, current_club, current_league, position,
  estimated_value, weekly_wage_estimate, contract_expires,
  strengths, weaknesses, lumio_fit_score, recommendation, source,
  pipeline_stage, pipeline_added_at, priority, asking_price, agent_name, deadline_date, pipeline_notes
)
select c.id, 'Jamie Cole', 21, 'Scotland', 'Forest Green Rovers', 'EFL League Two', 'LB',
  '£300k', '£2,400', 'Jun 2025',
  array['Pace','Crossing accuracy','Stamina'],
  array['Defensive positioning'], 76,
  'Modern overlapping LB, contract expiring — possible bargain.',
  'demo-seed', 'Identified', now(), 'Low', '£350k', 'Base Soccer', null,
  'Contract expires summer — monitor.'
from football_clubs c where c.slug = 'lumio-dev-afc'
on conflict do nothing;

insert into football_transfer_targets (
  club_id, name, age, nationality, current_club, current_league, position,
  estimated_value, weekly_wage_estimate, contract_expires,
  strengths, weaknesses, lumio_fit_score, recommendation, source,
  pipeline_stage, pipeline_added_at, priority, asking_price, agent_name, agent_contact, deadline_date, pipeline_notes
)
select c.id, 'Ade Okonkwo', 25, 'Nigeria', 'Stockport County', 'EFL League One', 'ST',
  '£900k', '£5,500', 'Jun 2026',
  array['Hold-up play','Aerial dominance','Clinical finishing'],
  array['Pace over distance'], 89,
  'Proven L1 No.9 — would solve our central striker problem immediately.',
  'demo-seed', 'Approached', now() - interval '3 days', 'High', '£1.2m',
  'Wasserman Football', 'agent@wasserman.example', (current_date + interval '21 days')::date,
  'Initial enquiry made via agent. Awaiting response on personal terms.'
from football_clubs c where c.slug = 'lumio-dev-afc'
on conflict do nothing;

insert into football_transfer_targets (
  club_id, name, age, nationality, current_club, current_league, position,
  estimated_value, weekly_wage_estimate, contract_expires,
  strengths, weaknesses, lumio_fit_score, recommendation, source,
  pipeline_stage, pipeline_added_at, priority, asking_price, agent_name, agent_contact, deadline_date, pipeline_notes
)
select c.id, 'Tomáš Krejčí', 24, 'Czech Republic', 'Slavia Prague B', 'Czech 2. Liga', 'CAM',
  '£1.4m', '£7,500', 'Jun 2027',
  array['Vision','Set-piece delivery','Two-footed'],
  array['Defensive contribution','Adapting to physicality'], 91,
  'Elite creative profile. Highest fit score in current pipeline.',
  'demo-seed', 'Negotiating', now() - interval '7 days', 'Critical', '£1.8m',
  'CAA Sports', 'krejci-rep@caa.example', (current_date + interval '9 days')::date,
  'Bid £1.4m rejected. Counter at £1.6m + 10% sell-on prepared. Window closes soon.'
from football_clubs c where c.slug = 'lumio-dev-afc'
on conflict do nothing;

insert into football_transfer_targets (
  club_id, name, age, nationality, current_club, current_league, position,
  estimated_value, weekly_wage_estimate, contract_expires,
  strengths, weaknesses, lumio_fit_score, recommendation, source,
  pipeline_stage, pipeline_added_at, priority, asking_price, agent_name, deadline_date, pipeline_notes
)
select c.id, 'Daniel Reid', 27, 'Northern Ireland', 'Linfield', 'NIFL Premiership', 'GK',
  '£250k', '£3,800', 'Jun 2028',
  array['Shot stopping','Distribution','Leadership'],
  array['Untested at EFL level'], 82,
  'Signed as new No.1 — three-year deal completed.',
  'demo-seed', 'Done', now() - interval '14 days', 'High', '£250k', 'Independent', null,
  'Deal closed. Medical passed. Announcement Monday.'
from football_clubs c where c.slug = 'lumio-dev-afc'
on conflict do nothing;

alter table football_pipeline_activities enable row level security;
