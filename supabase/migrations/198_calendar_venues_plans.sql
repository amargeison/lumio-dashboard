-- ─────────────────────────────────────────────────────────────────────────────
-- Calendar, venues and session plans: four rules the screens were each trying
-- (and failing) to keep on their own, moved into the database, and one field
-- separated out of another.
--
--   1. A booking records WHICH court it is on, by id — not only by the court's
--      name, which two venues can share.
--   2. An academy has at most one home venue.
--   3. A venue's courts go when the venue goes.
--   4. A booking has at most one session plan.
--   5. A lesson's note TO the player is its own field (`playerNote`), separate
--      from the coach's private note (`coachNote`).
--
-- Safe to run twice. Nothing is deleted: where existing rows break a rule, the
-- extra rows are un-flagged or un-linked, never removed.
--
-- DEPLOY ORDER: run this BEFORE the code that goes with it. The booking form
-- now sends `court_id`, and a database without that column refuses the booking.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1. Which court a booking is on ═══════════════════════════════════════════
-- `court` is free text ("Court 1") and stays: it is what emails and the diary
-- print, and a coach can still type a court that is not on their list. But the
-- Court Planner matched bookings to courts by that text alone, so one lesson on
-- "Court 1" showed on every court called "Court 1" at every venue. The id says
-- which one. Null = typed by hand, or booked before this column existed.
alter table coach_bookings add column if not exists court_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coach_bookings_court_id_fkey') then
    alter table coach_bookings
      add constraint coach_bookings_court_id_fkey
      foreign key (court_id) references coach_courts(id) on delete set null;
  end if;
end $$;

comment on column coach_bookings.court_id is
  'coach_courts.id this booking is on, when the court was picked from the list. `court` keeps the name as text.';


-- ══ 2. One home venue ════════════════════════════════════════════════════════
-- "Set as home" and the venue form both wrote is_home = true and never cleared
-- the previous home, so an academy could have three. Emails and the Court
-- Planner then used whichever the database happened to return first.
--
-- Existing academies with more than one: the OLDEST home stays (it is the one
-- set at sign-up, and the one emails have been using); the others are simply
-- un-flagged. The coach can move it with one click.
update coach_venues v
   set is_home = false
 where v.is_home
   and exists (
     select 1 from coach_venues o
      where o.coach_id = v.coach_id and o.is_home and o.id <> v.id
        and (o.created_at, o.id) < (v.created_at, v.id));

-- From now on, making a venue the home un-flags the academy's other venues in
-- the same write — whichever screen, import or route did it.
create or replace function lumio_one_home_venue() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_home then
    update coach_venues set is_home = false
     where coach_id = new.coach_id and id <> new.id and is_home;
  end if;
  return new;
end $$;
revoke all on function lumio_one_home_venue() from public, anon, authenticated;

drop trigger if exists trg_one_home_venue on coach_venues;
create trigger trg_one_home_venue before insert or update of is_home on coach_venues
  for each row execute function lumio_one_home_venue();

create unique index if not exists uniq_coach_venues_home on coach_venues (coach_id) where is_home;


-- ══ 3. A venue's courts go with it ═══════════════════════════════════════════
-- Deleting a venue set its courts' venue_id to null. A court with no venue is
-- shown on no screen, so the coach could neither see nor remove it — but it was
-- still counted. The courts now go with the venue. (Courts that are ALREADY
-- without a venue are left alone: some date from before venues existed.)
do $$
begin
  if exists (select 1 from pg_constraint
              where conname = 'coach_courts_venue_id_fkey' and confdeltype <> 'c') then
    alter table coach_courts drop constraint coach_courts_venue_id_fkey;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_courts_venue_id_fkey') then
    alter table coach_courts
      add constraint coach_courts_venue_id_fkey
      foreign key (venue_id) references coach_venues(id) on delete cascade;
  end if;
end $$;


-- ══ 4. One plan per booking ══════════════════════════════════════════════════
-- "Assign to booking…" would attach a second plan to a booking that already had
-- one, including one already finished; the planner then showed whichever it
-- found first. Where a booking has several today, the finished one wins, then
-- the newest; the rest go back to "Needs a booking" with their work intact.
update coach_session_plans p
   set booking_id = null, updated_at = now()
 where p.booking_id is not null
   and exists (
     select 1 from coach_session_plans o
      where o.booking_id = p.booking_id and o.id <> p.id
        and (o.completed_at is not null, o.created_at, o.id)
          > (p.completed_at is not null, p.created_at, p.id));

create unique index if not exists uniq_session_plans_booking
  on coach_session_plans (booking_id) where booking_id is not null;


-- ══ 5. The note to the player is not the private note ════════════════════════
-- review_json.coachNote held two different things. On a summary typed into the
-- lesson form it is the coach's PRIVATE note ("for your eyes only"). On a
-- summary written by Lumio Coach — from a recording, or from "Finish session" —
-- it is a friendly note TO the player. They could not be told apart, so the
-- family's page now shows neither.
--
-- New summaries keep them apart: `playerNote` is shared, `coachNote` is private.
-- This moves the note on the rows Lumio Coach wrote and nobody has since edited.
-- Those are recognisable with certainty: the lesson form always writes
-- `duration`, `time` and `skillsWorked` into review_json and the two AI routes
-- never do, so a row with none of the three has never been through the form.
-- Anything the form has touched is left exactly as it is — if in doubt, private.
update coach_sessions
   set review_json = (review_json - 'coachNote') || jsonb_build_object('playerNote', review_json -> 'coachNote')
 where jsonb_typeof(review_json) = 'object'
   and review_json ? 'coachNote'
   and not review_json ? 'playerNote'
   and not review_json ? 'duration'
   and not review_json ? 'time'
   and not review_json ? 'skillsWorked';
