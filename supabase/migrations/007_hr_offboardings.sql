-- HR offboardings table
-- Stores records created by the Offboarding quick action

create table if not exists hr_offboardings (
  id               uuid        primary key default gen_random_uuid(),
  employee_name    text        not null,
  job_title        text        not null,
  department       text        not null,
  last_working_day date        not null,
  reason           text        not null,
  exit_interview   boolean     not null default true,
  equipment_return text[]      default '{}',
  systems_revoke   text[]      default '{}',
  handover_to      text,
  notes            text,
  status           text        not null default 'In Progress',
  created_at       timestamptz not null default now()
);

alter table hr_offboardings enable row level security;

create policy "hr_offboardings_insert" on hr_offboardings
  for insert to authenticated with check (true);

create policy "hr_offboardings_select" on hr_offboardings
  for select to authenticated using (true);
