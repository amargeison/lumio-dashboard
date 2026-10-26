-- 211 — reminders, summaries sent for the coach, and the weather.
--
--   coach_notices      one row per message Lumio sends on its own about a lesson
--                      (the day-before reminder, a rain-off). The unique key is
--                      what stops two runs of the timer sending the same thing.
--   coach_sessions     a lesson summary can be sent to the family by Lumio, now
--                      or at the coach's chosen time, and says when it went.
--   coach_bookings     cancelled_by: 'coach' when the coach called it off (rain,
--                      illness), so it is never treated as a late cancellation.
--   coach_venues       where the venue is, worked out once from its postcode.
--   coach_weather      the last forecast fetched for a venue, so the free
--                      allowance of forecast requests is not spent twice.
--
-- Safe to run twice.

create table if not exists coach_notices (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  booking_id  uuid not null references coach_bookings(id) on delete cascade,
  kind        text not null,            -- 'reminder' | 'rain_off'
  status      text not null default 'sending',  -- sending | sent | failed | skipped
  sent_to     text,
  detail      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (booking_id, kind)
);
create index if not exists idx_coach_notices_coach on coach_notices (coach_id, created_at desc);

create table if not exists coach_weather (
  venue_id    uuid primary key references coach_venues(id) on delete cascade,
  coach_id    uuid not null references auth.users(id) on delete cascade,
  fetched_at  timestamptz not null default now(),
  series      jsonb not null default '[]'::jsonb
);

-- Both written only by the server; the academy's owner may read their own.
do $$
declare t text;
begin
  foreach t in array array['coach_notices', 'coach_weather'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from public, anon, authenticated', t);
    execute format('drop policy if exists lumio_owner_reads on public.%I', t);
    execute format('create policy lumio_owner_reads on public.%I for select to authenticated using (coach_id = auth.uid())', t);
  end loop;
end $$;

alter table coach_sessions
  add column if not exists shared_at    timestamptz,
  add column if not exists shared_to    text,
  add column if not exists share_due_at timestamptz,
  add column if not exists share_error  text;

create index if not exists idx_coach_sessions_share_due on coach_sessions (share_due_at)
  where share_due_at is not null and shared_at is null;

alter table coach_bookings add column if not exists cancelled_by text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_bookings_cancelled_by_ok') then
    alter table coach_bookings add constraint coach_bookings_cancelled_by_ok
      check (cancelled_by is null or cancelled_by in ('coach', 'client'));
  end if;
end $$;

-- Un-cancelling a booking forgets who cancelled it, like cancelled_at (210).
create or replace function lumio_booking_cancelled_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'cancelled' and (tg_op = 'INSERT' or old.status is distinct from 'cancelled') then
    new.cancelled_at := coalesce(new.cancelled_at, now());
  elsif new.status is distinct from 'cancelled' then
    new.cancelled_at := null;
    new.cancelled_by := null;
  end if;
  return new;
end $$;

alter table coach_venues
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists geocoded_at timestamptz;

notify pgrst, 'reload schema';
