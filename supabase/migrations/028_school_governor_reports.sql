-- AI Governor Reports Archive
create table if not exists school_governor_reports (
  id                uuid primary key default gen_random_uuid(),

  -- Report metadata
  report_type       text not null,    -- 'Full Governors Report' | 'Finance Summary' | 'Attendance Report' | 'Safeguarding Report' | 'Pupil Progress Update'
  reporting_period  text not null,    -- 'Half term' | 'Term' | 'Full year'
  period_label      text not null,    -- human label e.g. "Spring Term 2026"
  headteacher_name  text not null,
  sections_included text[] not null default '{}',

  -- Data snapshot used to generate (JSON blob)
  data_snapshot     jsonb,

  -- Generated content
  report_text       text not null,    -- full markdown report
  word_count        int,

  -- Distribution
  emailed_to        text,
  emailed_at        timestamptz,

  -- AI metadata
  model_used        text,
  prompt_tokens     int,
  completion_tokens int,

  -- Status
  status            text not null default 'Draft',   -- Draft | Finalised | Sent
  finalised_at      timestamptz,

  created_at        timestamptz not null default now()
);

alter table school_governor_reports enable row level security;

drop policy if exists "gov_reports_insert" on school_governor_reports;
drop policy if exists "gov_reports_select" on school_governor_reports;
drop policy if exists "gov_reports_update" on school_governor_reports;

create policy "gov_reports_insert"
  on school_governor_reports for insert to authenticated with check (true);

create policy "gov_reports_select"
  on school_governor_reports for select to authenticated using (true);

create policy "gov_reports_update"
  on school_governor_reports for update to authenticated using (true);

create index if not exists gov_reports_created_idx on school_governor_reports (created_at desc);
create index if not exists gov_reports_type_idx    on school_governor_reports (report_type);
