-- Court Planner goes venue-centric: a coach works across several sites, each with
-- its own contact, facilities and courts. Staff are based at a home venue. Court
-- availability is NOT a live third-party feed (most clubs can't offer one) — the
-- planner simply surfaces the coach's own confirmed bookings at each venue.

create table if not exists coach_venues (
  id            uuid default gen_random_uuid() primary key,
  coach_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  address       text,
  contact_name  text,
  contact_phone text,
  contact_email text,
  facilities    text,            -- comma-separated chips (Café, Parking, Floodlights…)
  access_note   text,            -- e.g. "Coach fob entry · gate code after 6pm"
  is_home       boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Courts belong to a venue; staff are based at one.
alter table coach_courts add column if not exists venue_id uuid references coach_venues(id) on delete set null;
alter table coach_staff  add column if not exists home_venue text;

create index if not exists idx_coach_venues_coach on coach_venues(coach_id);
create index if not exists idx_coach_courts_venue on coach_courts(venue_id);

alter table coach_venues enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'coach_venues' and policyname = 'coach_venues_owner') then
    create policy coach_venues_owner on coach_venues
      for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
  end if;
end $$;
