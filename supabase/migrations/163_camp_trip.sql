-- Lumio Tennis Coach — the trip hub.
--
-- A camp knows what happens on court. This is the other half: the hotel, the
-- transfers, what time to be in the lobby, and who to ring when a flight is
-- late. Coaches currently send that as a PDF in February and then answer the
-- same six questions on WhatsApp until August.
--
-- One shared link per camp, so everything on it is true for everyone on it.
-- Personal detail — a player's own targets, their outstanding balance — stays
-- off it deliberately and waits for the player app, where there is an identity
-- to attach it to.

-- The content. jsonb rather than twenty columns because the shape is still
-- moving and a coach's "anything else" section is genuinely free-form.
-- See src/lib/coach/trip.ts for the type.
alter table coach_camps add column if not exists trip jsonb;

-- The share link. Readable enough that a coach recognises it in his own message
-- history, random enough that it is not guessable from the camp name — the page
-- carries a hotel address and a mobile number.
alter table coach_camps add column if not exists trip_slug text;

-- Closed until the coach opens it, exactly like signup_open. No existing camp
-- becomes visible on the internet as a side effect of this migration.
alter table coach_camps add column if not exists trip_open boolean default false;

create unique index if not exists idx_coach_camps_trip_slug
  on coach_camps (lower(trip_slug)) where trip_slug is not null;
