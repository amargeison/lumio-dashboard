-- School Absences table
create table if not exists school_absences (
  id                  uuid primary key default gen_random_uuid(),
  pupil_name          text not null,
  year_group          text not null,
  absence_date        date not null default current_date,
  absence_type        text not null,
  reported_by         text not null,
  notes               text,
  -- computed flags set server-side / by trigger
  no_contact          boolean not null default false,
  persistent_concern  boolean not null default false,
  term                text,        -- e.g. 'Spring 2026'
  created_at          timestamptz not null default now()
);

alter table school_absences enable row level security;

drop policy if exists "school_absences_insert" on school_absences;
drop policy if exists "school_absences_select" on school_absences;

create policy "school_absences_insert"
  on school_absences for insert to authenticated with check (true);

create policy "school_absences_select"
  on school_absences for select to authenticated using (true);

-- Index for fast term + pupil lookups (persistent absence check)
create index if not exists school_absences_pupil_term_idx
  on school_absences (pupil_name, term);

-- Index for today's absence count stat card
create index if not exists school_absences_date_idx
  on school_absences (absence_date);
