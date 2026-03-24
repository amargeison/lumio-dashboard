-- Persistent Absence Escalation Tracker
create table if not exists school_attendance_concerns (
  id                  uuid primary key default gen_random_uuid(),

  -- Pupil
  pupil_name          text not null,
  year_group          text not null,
  class_name          text,

  -- Attendance stats (updated by daily n8n check)
  attendance_pct      numeric not null default 100,   -- e.g. 87.5
  absences_count      int not null default 0,
  total_sessions      int not null default 0,         -- total school sessions in term
  term                text not null,                  -- e.g. 'Spring 2026'

  -- Escalation stage
  -- 1 = Informal letter (≤90%), 2 = Formal warning + meeting (≤85%), 3 = EWO referral (≤80%)
  escalation_stage    int not null default 1,
  stage_triggered_at  timestamptz not null default now(),

  -- Contact log (JSON array of {at, method, outcome} objects)
  contact_log         jsonb not null default '[]',

  -- Status
  status              text not null default 'Open',   -- 'Open' | 'Resolved' | 'Referred'
  resolved_at         timestamptz,
  resolution_notes    text,

  -- Generated AI letter (stored after generation)
  generated_letter    text,
  letter_sent_at      timestamptz,
  letter_sent_to      text,

  -- n8n automation tracking
  n8n_notified        boolean not null default false,
  ewo_referred        boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table school_attendance_concerns enable row level security;

drop policy if exists "concerns_insert" on school_attendance_concerns;
drop policy if exists "concerns_select" on school_attendance_concerns;
drop policy if exists "concerns_update" on school_attendance_concerns;

create policy "concerns_insert"
  on school_attendance_concerns for insert to authenticated with check (true);

create policy "concerns_select"
  on school_attendance_concerns for select to authenticated using (true);

create policy "concerns_update"
  on school_attendance_concerns for update to authenticated using (true);

create index if not exists concerns_pupil_idx         on school_attendance_concerns (pupil_name, term);
create index if not exists concerns_stage_idx         on school_attendance_concerns (escalation_stage);
create index if not exists concerns_attendance_pct_idx on school_attendance_concerns (attendance_pct);
create index if not exists concerns_status_idx        on school_attendance_concerns (status);

-- Daily attendance snapshot (used to detect pupils crossing thresholds)
create table if not exists school_attendance_snapshots (
  id              uuid primary key default gen_random_uuid(),
  pupil_name      text not null,
  year_group      text not null,
  term            text not null,
  attendance_pct  numeric not null,
  absences_count  int not null default 0,
  snapshot_date   date not null default current_date,
  created_at      timestamptz not null default now()
);

alter table school_attendance_snapshots enable row level security;

drop policy if exists "snapshots_insert" on school_attendance_snapshots;
drop policy if exists "snapshots_select" on school_attendance_snapshots;

create policy "snapshots_insert"
  on school_attendance_snapshots for insert to authenticated with check (true);

create policy "snapshots_select"
  on school_attendance_snapshots for select to authenticated using (true);

create index if not exists snapshots_pupil_date_idx on school_attendance_snapshots (pupil_name, snapshot_date desc);
