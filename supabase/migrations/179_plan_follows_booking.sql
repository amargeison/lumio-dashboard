-- ─────────────────────────────────────────────────────────────────────────────
-- A session plan belongs to a BOOKING, not to a date.
--
-- The planner decided which plan went with which session by matching the
-- player's name and the date: same name, same day, must be the same session. So
-- the moment a coach moved a booking — because it clashed with a camp, because
-- a court went, because a family asked — the plan stopped matching anything.
-- It was not deleted; it was orphaned, and from the coach's side of the screen
-- that is indistinguishable from deleted. They rebuilt a plan that already
-- existed, and the original sat in the list as an unbooked plan forever.
--
-- Same failure, same cause, as the name-string coupling migrations 146, 165 and
-- 169 removed from bookings, players and venues: a name is not an identity and a
-- date is not an identity. The booking's id is.
-- ─────────────────────────────────────────────────────────────────────────────

alter table coach_session_plans add column if not exists booking_id uuid;

comment on column coach_session_plans.booking_id is
  'coach_bookings.id this plan is for. The plan moves with the booking; matching on name + date is legacy fallback only.';

create index if not exists idx_session_plans_booking on coach_session_plans (coach_id, booking_id);

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Existing plans are tied to the booking they unambiguously belong to: same
-- academy, same player name, same date, and exactly ONE booking that matches.
-- Where two sessions with the same player sit on the same day we cannot tell
-- which plan is which, so those are left alone rather than guessed at — the
-- name-and-date fallback still finds them, which is no worse than today.
update coach_session_plans p
   set booking_id = b.id
  from coach_bookings b
 where p.booking_id is null
   and b.coach_id = p.coach_id
   and b.booking_date = p.session_date
   and coalesce(b.status, '') <> 'cancelled'
   and lower(trim(coalesce(b.player_name, ''))) = lower(trim(coalesce(p.group_name, '')))
   and trim(coalesce(p.group_name, '')) <> ''
   and (select count(*) from coach_bookings b2
         where b2.coach_id = p.coach_id
           and b2.booking_date = p.session_date
           and coalesce(b2.status, '') <> 'cancelled'
           and lower(trim(coalesce(b2.player_name, ''))) = lower(trim(coalesce(p.group_name, '')))) = 1;

-- ── Keep it true ────────────────────────────────────────────────────────────
-- Moving a booking moves its plan, in the database rather than in one screen's
-- code — the planner, the calendar, the dashboard and the student app all read
-- these two tables, and only one of them was ever going to remember to do this.
create or replace function lumio_plan_follows_booking() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.booking_date is distinct from old.booking_date
     or new.start_time is distinct from old.start_time
     or new.court is distinct from old.court
     or new.type is distinct from old.type
     or new.player_name is distinct from old.player_name then
    update coach_session_plans
       set session_date = new.booking_date,
           start_time   = new.start_time,
           court        = new.court,
           session_type = coalesce(new.type, session_type),
           group_name   = coalesce(new.player_name, group_name),
           updated_at   = now()
     where booking_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_plan_follows_booking on coach_bookings;
create trigger trg_plan_follows_booking after update on coach_bookings
  for each row execute function lumio_plan_follows_booking();

-- A cancelled or deleted booking does NOT delete the plan. The work is still
-- good and the session usually comes back on another day, so the plan simply
-- goes back to being unbooked — which is the state the planner already knows
-- how to show and re-attach.
create or replace function lumio_plan_unbooked() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update coach_session_plans set booking_id = null, updated_at = now() where booking_id = old.id;
  return old;
end $$;

drop trigger if exists trg_plan_unbooked on coach_bookings;
create trigger trg_plan_unbooked before delete on coach_bookings
  for each row execute function lumio_plan_unbooked();
