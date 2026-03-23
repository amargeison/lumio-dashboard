-- HR recruitment table
-- Stores records created by the Recruitment quick action

create table if not exists hr_recruitment (
  id                  uuid        primary key default gen_random_uuid(),
  job_title           text        not null,
  department          text        not null,
  employment_type     text        not null,
  location            text        not null,
  office_location     text,
  salary_min          text,
  salary_max          text,
  target_start_date   date,
  hiring_manager      text,
  positions           integer     not null default 1,
  responsibilities    text,
  requirements        text,
  desirable           text,
  job_boards          text[]      default '{}',
  notes               text,
  status              text        not null default 'Recruiting',
  created_at          timestamptz not null default now()
);

alter table hr_recruitment enable row level security;

create policy "hr_recruitment_insert" on hr_recruitment
  for insert to authenticated with check (true);

create policy "hr_recruitment_select" on hr_recruitment
  for select to authenticated using (true);
