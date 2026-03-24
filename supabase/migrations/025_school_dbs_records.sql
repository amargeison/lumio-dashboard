-- DBS Renewal Tracker / Single Central Record
create table if not exists school_dbs_records (
  id                  uuid primary key default gen_random_uuid(),

  -- Staff
  staff_name          text not null,
  staff_email         text,
  staff_role          text,

  -- Certificate
  certificate_number  text,
  check_type          text not null default 'Enhanced',   -- 'Standard' | 'Enhanced' | 'Enhanced + Barred'
  issue_date          date not null,
  renewal_due_date    date not null,                      -- auto: issue_date + 3 years

  -- File reference (URL or storage path — populated after upload)
  certificate_url     text,

  -- Reminder tracking
  reminder_60_sent    boolean not null default false,
  reminder_30_sent    boolean not null default false,
  reminder_14_sent    boolean not null default false,

  -- Status (derived, but stored for fast querying)
  -- 'Current' | 'Due Soon' (≤60 days) | 'Urgent' (≤14 days) | 'Overdue'
  status              text not null default 'Current',

  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table school_dbs_records enable row level security;

drop policy if exists "dbs_insert" on school_dbs_records;
drop policy if exists "dbs_select" on school_dbs_records;
drop policy if exists "dbs_update" on school_dbs_records;

create policy "dbs_insert"
  on school_dbs_records for insert to authenticated with check (true);

create policy "dbs_select"
  on school_dbs_records for select to authenticated using (true);

create policy "dbs_update"
  on school_dbs_records for update to authenticated using (true);

create index if not exists school_dbs_renewal_due_idx on school_dbs_records (renewal_due_date);
create index if not exists school_dbs_status_idx      on school_dbs_records (status);

-- Seed sample data so the tracker looks populated from day one
insert into school_dbs_records (staff_name, staff_email, staff_role, certificate_number, check_type, issue_date, renewal_due_date, status) values
  ('Mrs A. Johnson',   'a.johnson@lumioschool.example',  'Class Teacher',    'DBS-001-2023', 'Enhanced',            '2023-09-01', '2026-09-01', 'Current'),
  ('Mr B. Patel',      'b.patel@lumioschool.example',    'HLTA',             'DBS-002-2022', 'Enhanced',            '2022-11-15', '2025-11-15', 'Due Soon'),
  ('Miss C. Williams', 'c.williams@lumioschool.example', 'Cover Supervisor', 'DBS-003-2022', 'Enhanced + Barred',   '2022-06-20', '2025-06-20', 'Overdue'),
  ('Mr D. Evans',      'd.evans@lumioschool.example',    'Teaching Assistant','DBS-004-2024', 'Standard',           '2024-01-10', '2027-01-10', 'Current'),
  ('Mrs E. Thompson',  'e.thompson@lumioschool.example', 'Head Teacher',     'DBS-005-2023', 'Enhanced + Barred',   '2023-03-05', '2026-03-05', 'Current'),
  ('Mr F. Clarke',     'f.clarke@lumioschool.example',   'Site Manager',     'DBS-006-2022', 'Standard',            '2022-04-01', '2025-04-01', 'Overdue'),
  ('Miss G. Roberts',  'g.roberts@lumioschool.example',  'Class Teacher',    'DBS-007-2024', 'Enhanced',            '2024-06-01', '2027-06-01', 'Current'),
  ('Mr H. Wilson',     'h.wilson@lumioschool.example',   'PE Teacher',       'DBS-008-2023', 'Enhanced',            '2023-12-01', '2026-12-01', 'Current')
on conflict do nothing;
