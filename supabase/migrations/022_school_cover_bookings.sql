-- Supply Cover Bookings
create table if not exists school_cover_bookings (
  id               uuid primary key default gen_random_uuid(),
  absent_staff     text not null,
  cover_start_date date not null,
  cover_end_date   date not null,
  classes          text[] not null default '{}',   -- array of class/year group names
  cover_type       text not null default 'Internal', -- 'Internal' | 'Supply Agency'
  agency_name      text,
  assigned_to      text,                            -- internal cover teacher name, if found
  special_reqs     text,
  estimated_cost   numeric,                         -- day rate × days
  status           text not null default 'Pending', -- Pending | Confirmed | Cancelled
  n8n_fired        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table school_cover_bookings enable row level security;

drop policy if exists "cover_bookings_insert" on school_cover_bookings;
drop policy if exists "cover_bookings_select" on school_cover_bookings;
drop policy if exists "cover_bookings_update" on school_cover_bookings;

create policy "cover_bookings_insert"
  on school_cover_bookings for insert to authenticated with check (true);

create policy "cover_bookings_select"
  on school_cover_bookings for select to authenticated using (true);

create policy "cover_bookings_update"
  on school_cover_bookings for update to authenticated using (true);

-- Index for today/upcoming cover view
create index if not exists school_cover_start_date_idx
  on school_cover_bookings (cover_start_date);

-- Internal cover pool — staff available for cover (PPA / free periods)
create table if not exists school_cover_pool (
  id           uuid primary key default gen_random_uuid(),
  staff_name   text not null unique,
  role         text,             -- e.g. 'Class Teacher', 'HLTA', 'Cover Supervisor'
  available    boolean not null default true,
  day_rate     numeric not null default 150,
  created_at   timestamptz not null default now()
);

alter table school_cover_pool enable row level security;

drop policy if exists "cover_pool_select" on school_cover_pool;
create policy "cover_pool_select"
  on school_cover_pool for select to authenticated using (true);

-- Seed a default internal pool
insert into school_cover_pool (staff_name, role, available, day_rate) values
  ('Mrs J. Collins',   'Cover Supervisor', true,  80),
  ('Mr T. Rashid',     'HLTA',             true,  95),
  ('Mrs S. Okafor',    'Class Teacher',    true, 160),
  ('Mr D. Whitmore',   'Class Teacher',    false, 160),
  ('Miss R. Khan',     'Cover Supervisor', true,   80)
on conflict (staff_name) do nothing;
