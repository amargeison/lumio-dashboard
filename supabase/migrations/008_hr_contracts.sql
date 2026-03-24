create table if not exists hr_contracts (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null,
  job_title text not null,
  department text not null,
  contract_type text not null,
  start_date date not null,
  end_date date,
  salary numeric,
  currency text not null default 'GBP',
  hours_per_week numeric,
  notice_period text,
  probation_period text,
  benefits text,
  notes text,
  status text not null default 'Draft',
  created_at timestamptz not null default now()
);

alter table hr_contracts enable row level security;

drop policy if exists "hr_contracts_insert" on hr_contracts;
drop policy if exists "hr_contracts_select" on hr_contracts;

create policy "hr_contracts_insert" on hr_contracts
  for insert to authenticated with check (true);

create policy "hr_contracts_select" on hr_contracts
  for select to authenticated using (true);
