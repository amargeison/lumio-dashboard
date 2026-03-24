-- AI-generated Cover Work documents
create table if not exists school_cover_work (
  id               uuid primary key default gen_random_uuid(),

  -- Source
  teacher_name     text not null,
  absence_id       uuid,                          -- FK to school_absences if triggered from absence log
  year_group       text not null,
  subject          text not null,
  topic            text not null,
  duration         text not null default '1 lesson',   -- '1 lesson' | 'Half day' | 'Full day'
  instructions     text,                          -- any special instructions from teacher

  -- Generated content (from Claude)
  generated_doc    text,                          -- full formatted cover work document
  cover_teacher_instructions text,
  pupil_task_sheet text,
  extension_activities text,
  marking_guide    text,

  -- Status
  sent_to_cover_teacher boolean not null default false,
  sent_to_email    text,
  pdf_generated    boolean not null default false,

  -- Metadata
  model_used       text,                          -- which Claude model generated this
  prompt_tokens    int,
  completion_tokens int,

  created_at       timestamptz not null default now()
);

alter table school_cover_work enable row level security;

drop policy if exists "cover_work_insert" on school_cover_work;
drop policy if exists "cover_work_select" on school_cover_work;
drop policy if exists "cover_work_update" on school_cover_work;

create policy "cover_work_insert"
  on school_cover_work for insert to authenticated with check (true);

create policy "cover_work_select"
  on school_cover_work for select to authenticated using (true);

create policy "cover_work_update"
  on school_cover_work for update to authenticated using (true);

create index if not exists school_cover_work_teacher_idx on school_cover_work (teacher_name);
create index if not exists school_cover_work_created_idx on school_cover_work (created_at desc);
