-- Who is actually going on the trip.
--
-- A camp recorded its attendees, its kit, its itinerary and its money, and said
-- nothing about the STAFF. For a head coach running a week abroad with eight
-- coaches that is the first question, not an afterthought: who is on it, and
-- when I message "the camp", who does that reach?
--
-- Stored as staff ids rather than names, because a name is not a person: two
-- coaches can share one, and a coach who changes their name should not silently
-- fall off the trip.
alter table coach_camps add column if not exists coach_ids jsonb;

comment on column coach_camps.coach_ids is
  'coach_staff ids working this camp. Drives the Coaches tab and the "Camp" audience in Send Message.';
