-- HR leave requests table
-- Stores records created by the Leave Request quick action

create table if not exists hr_leave_requests (
  id                  uuid        primary key default gen_random_uuid(),
  employee_name       text        not null,
  leave_type          text        not null,
  start_date          date        not null,
  end_date            date        not null,
  total_days          integer     not null default 1,
  covering_colleague  text,
  notes               text,
  status              text        not null default 'Pending',
  created_at          timestamptz not null default now()
);

alter table hr_leave_requests enable row level security;

create policy "hr_leave_requests_insert" on hr_leave_requests
  for insert to authenticated with check (true);

create policy "hr_leave_requests_select" on hr_leave_requests
  for select to authenticated using (true);
