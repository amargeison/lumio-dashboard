-- HR onboardings table
-- Stores records created by the New Joiner quick action

create table if not exists hr_onboardings (
  id           uuid        primary key default gen_random_uuid(),
  first_name   text        not null,
  last_name    text        not null,
  job_title    text        not null,
  department   text        not null,
  start_date   date        not null,
  manager      text,
  equipment    text[]      default '{}',
  software     text[]      default '{}',
  notes        text,
  status       text        not null default 'In Progress',
  created_at   timestamptz not null default now()
);

alter table hr_onboardings enable row level security;

-- Authenticated users can insert and read
create policy "hr_onboardings_insert" on hr_onboardings
  for insert to authenticated with check (true);

create policy "hr_onboardings_select" on hr_onboardings
  for select to authenticated using (true);
