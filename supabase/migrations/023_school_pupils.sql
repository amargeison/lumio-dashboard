-- New Pupil Admissions
create table if not exists school_pupils (
  id                  uuid primary key default gen_random_uuid(),

  -- Personal details
  first_name          text not null,
  last_name           text not null,
  preferred_name      text,
  date_of_birth       date not null,
  gender              text,                       -- 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'
  ethnicity           text,
  home_language       text,
  nationality         text,

  -- School placement
  year_group          text not null,
  class_name          text,
  start_date          date not null,
  previous_school     text,
  admission_number    text unique,

  -- Address
  address_line1       text,
  address_line2       text,
  town_city           text,
  postcode            text,

  -- Primary contact 1
  contact1_name       text not null,
  contact1_relation   text,                       -- 'Mother' | 'Father' | 'Guardian' | 'Carer' | 'Other'
  contact1_phone      text,
  contact1_email      text,
  contact1_parental_responsibility boolean not null default true,

  -- Primary contact 2
  contact2_name       text,
  contact2_relation   text,
  contact2_phone      text,
  contact2_email      text,
  contact2_parental_responsibility boolean not null default false,

  -- Medical / dietary
  medical_conditions  text,
  medications         text,
  dietary_requirements text[],                    -- array: 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Nut-free', 'Gluten-free'
  allergies           text,
  gp_name             text,
  gp_phone            text,

  -- Additional needs / flags
  has_send            boolean not null default false,
  send_details        text,
  is_lac              boolean not null default false,  -- Looked After Child
  lac_details         text,
  has_eal             boolean not null default false,  -- English as Additional Language
  eal_language        text,
  eligible_fsm        boolean not null default false,  -- Free School Meals
  pupil_premium       boolean not null default false,

  -- Status
  status              text not null default 'Pending',  -- Pending | Active | Withdrawn
  n8n_fired           boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table school_pupils enable row level security;

drop policy if exists "pupils_insert" on school_pupils;
drop policy if exists "pupils_select" on school_pupils;
drop policy if exists "pupils_update" on school_pupils;

create policy "pupils_insert"
  on school_pupils for insert to authenticated with check (true);

create policy "pupils_select"
  on school_pupils for select to authenticated using (true);

create policy "pupils_update"
  on school_pupils for update to authenticated using (true);

-- Admission number sequence (SY-YYYY-NNN)
create index if not exists school_pupils_start_date_idx on school_pupils (start_date);
create index if not exists school_pupils_year_group_idx on school_pupils (year_group);
create index if not exists school_pupils_status_idx     on school_pupils (status);
