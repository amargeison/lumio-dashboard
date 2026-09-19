-- ─────────────────────────────────────────────────────────────────────────────
-- One site? Then everybody coaches there.
--
-- Migration 169 made venue assignment explicit, which is right for an academy
-- working across several clubs — but wrong as a chore for the overwhelming
-- majority, who have exactly one site. Those academies were being asked to tick
-- a box whose answer could not be anything else, and the cost of forgetting was
-- silent: the coach signed in to an empty Court Planner and had no way to know
-- why.
--
-- So while an academy has exactly ONE venue, assignment is automatic. It stops
-- the moment a second venue exists, because then the question is real and only
-- the head coach can answer it. Nothing here ever reassigns or overwrites: it
-- only fills in a coach who has no assignment at all, so unticking a venue
-- stays a decision the database respects.
--
-- Two triggers, because the two halves arrive in either order. Onboarding
-- writes the coaching staff BEFORE it creates the home venue, so a staff-side
-- trigger alone would fire when there was no venue to point at and quietly do
-- nothing — which is exactly the bug this migration exists to end.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── A coach is added to an academy that has exactly one venue ───────────────
create or replace function lumio_autoassign_staff_venue() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_venue uuid;
begin
  select count(*) into v_count from coach_venues where coach_id = new.coach_id;
  if v_count <> 1 then return null; end if;

  select id into v_venue from coach_venues where coach_id = new.coach_id limit 1;

  insert into coach_staff_venues (coach_id, staff_id, venue_id, is_primary)
  values (new.coach_id, new.id, v_venue, true)
  on conflict (staff_id, venue_id) do nothing;

  return null;
end $$;

drop trigger if exists trg_staff_autovenue on coach_staff;
create trigger trg_staff_autovenue after insert on coach_staff
  for each row execute function lumio_autoassign_staff_venue();

-- ── The academy's FIRST venue is created, and staff already exist ───────────
-- Only staff with no assignment at all are touched. A coach deliberately left
-- off a site keeps that state.
create or replace function lumio_autoassign_venue_staff() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from coach_venues where coach_id = new.coach_id) <> 1 then
    return null;
  end if;

  insert into coach_staff_venues (coach_id, staff_id, venue_id, is_primary)
  select new.coach_id, s.id, new.id, true
  from coach_staff s
  where s.coach_id = new.coach_id
    and not exists (select 1 from coach_staff_venues sv where sv.staff_id = s.id)
  on conflict (staff_id, venue_id) do nothing;

  return null;
end $$;

drop trigger if exists trg_venue_autostaff on coach_venues;
create trigger trg_venue_autostaff after insert on coach_venues
  for each row execute function lumio_autoassign_venue_staff();

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Every academy that has exactly one venue and staff hanging off nothing. This
-- is what fixes the portals already set up, including the head coach's own row.
insert into coach_staff_venues (coach_id, staff_id, venue_id, is_primary)
select v.coach_id, s.id, v.id, true
from coach_staff s
join coach_venues v on v.coach_id = s.coach_id
where not exists (select 1 from coach_staff_venues sv where sv.staff_id = s.id)
  and (select count(*) from coach_venues v2 where v2.coach_id = s.coach_id) = 1
on conflict (staff_id, venue_id) do nothing;
