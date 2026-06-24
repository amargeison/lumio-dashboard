-- Lumio Tennis Coach — calendar sync links.
-- Maps a Lumio booking to the event id created in each connected external calendar
-- (Google / Microsoft / iCloud), so the booking can be updated or deleted there too.
-- Service-role only, like coach_oauth_connections.

create table if not exists coach_calendar_links (
  id                uuid primary key default gen_random_uuid(),
  coach_id          uuid not null references sports_profiles(id) on delete cascade,
  booking_id        text not null,            -- Lumio booking id (coach_bookings.id)
  provider          text not null,            -- google | microsoft | icloud
  external_event_id text not null,            -- the event id in the provider's calendar
  created_at        timestamptz not null default now(),
  unique (coach_id, booking_id, provider)
);

create index if not exists idx_coach_cal_links_lookup on coach_calendar_links (coach_id, booking_id);

alter table coach_calendar_links enable row level security;
-- No policies: service-role access only (the calendar sync routes).
