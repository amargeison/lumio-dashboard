-- Safeguarding Concerns — immutable audit trail
-- Records cannot be updated after insert (enforced by RLS + no update policy)

create table if not exists school_safeguarding (
  id               uuid primary key default gen_random_uuid(),
  ref_number       text unique not null,           -- SG-YYYY-NNN
  pupil_name       text not null,
  year_group       text not null,
  incident_at      timestamptz not null,
  concern_type     text not null,
  description      text not null,
  reported_by      text not null,
  witnessed        boolean not null default false,
  action_taken     text,
  is_urgent        boolean not null default false,
  status           text not null default 'Open',   -- Open | Under Review | Closed
  created_at       timestamptz not null default now(),
  -- No updated_at — records are immutable
  constraint concern_type_check check (
    concern_type in (
      'Physical', 'Emotional', 'Sexual', 'Neglect',
      'Peer-on-Peer', 'Online Safety', 'Radicalisation', 'Other'
    )
  )
);

-- Sequence for auto-incrementing SG reference numbers
create sequence if not exists school_safeguarding_seq start 1;

alter table school_safeguarding enable row level security;

-- Only authenticated users can insert
drop policy if exists "safeguarding_insert" on school_safeguarding;
create policy "safeguarding_insert"
  on school_safeguarding for insert to authenticated with check (true);

-- Select: all authenticated (in production, restrict to DSL role)
drop policy if exists "safeguarding_select" on school_safeguarding;
create policy "safeguarding_select"
  on school_safeguarding for select to authenticated using (true);

-- No update or delete policies — records are locked after submission

-- Index for open concerns dashboard
create index if not exists school_safeguarding_status_idx
  on school_safeguarding (status, created_at desc);

-- Index for urgent SLT banner query
create index if not exists school_safeguarding_urgent_idx
  on school_safeguarding (is_urgent, status);
