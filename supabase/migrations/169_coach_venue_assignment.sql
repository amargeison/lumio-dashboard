-- ─────────────────────────────────────────────────────────────────────────────
-- Which venues a coach works at — and therefore which courts they see.
--
-- Two problems with what was there:
--
--   1. coach_staff.home_venue is a single TEXT holding a venue NAME. The Court
--      Planner matches it with lower(trim(...)) against coach_venues.name. That
--      is the same name-string coupling migration 146 removed from bookings and
--      165 removed from player assignment: rename the venue and every coach
--      silently detaches from it.
--
--   2. It is singular. A coach who works Tuesdays at one club and Thursdays at
--      another has no way to say so, and picking one abandons the other.
--
-- So assignment becomes a real many-to-many on ids. One of them can be flagged
-- primary — that is what "home venue" meant and it is still worth showing on a
-- staff card — but it is now a property of one assignment rather than the only
-- assignment there can be.
--
-- WHY VENUE AND NOT COURT: courts are assigned by inheriting their venue's
-- assignment. Nobody staffs a club by handing a coach court 3 but not court 4 —
-- they are at the club or they are not. Per-court rows would be a table of
-- near-duplicates for every academy, and a new court would default to invisible
-- until somebody remembered to grant it. Venue-level assignment means adding a
-- court at a site a coach already works at just works.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists coach_staff_venues (
  id         uuid default gen_random_uuid() primary key,
  coach_id   uuid not null references auth.users(id) on delete cascade,
  staff_id   uuid not null references coach_staff(id) on delete cascade,
  venue_id   uuid not null references coach_venues(id) on delete cascade,
  is_primary boolean default false,
  created_at timestamptz default now()
);

-- One row per coach per venue. Without this a double-click on the picker leaves
-- a duplicate that shows the venue twice on their card.
create unique index if not exists uq_coach_staff_venue on coach_staff_venues (staff_id, venue_id);
create index if not exists idx_coach_staff_venues_venue on coach_staff_venues (coach_id, venue_id);

-- ── Backfill from the name string ───────────────────────────────────────────
-- Unambiguous matches only, as in phases 1 and 2. Two venues sharing a name
-- leaves the coach unassigned rather than guessing — an unassigned coach sees a
-- clear "ask your head coach" state, a wrongly assigned one sees another site's
-- courts and has no way to know it is wrong.
insert into coach_staff_venues (coach_id, staff_id, venue_id, is_primary)
select s.coach_id, s.id, v.id, true
from coach_staff s
join coach_venues v
  on v.coach_id = s.coach_id
 and lower(trim(v.name)) = lower(trim(s.home_venue))
where s.home_venue is not null
  and trim(s.home_venue) <> ''
  and (select count(*) from coach_venues v2
       where v2.coach_id = s.coach_id and lower(trim(v2.name)) = lower(trim(s.home_venue))) = 1
on conflict (staff_id, venue_id) do nothing;

-- ── Keep home_venue true while the UI catches up ────────────────────────────
-- The Court Planner and the coach_staff_directory view (migration 167) still
-- read home_venue. Rather than change both in the same breath, it is now DERIVED
-- from the primary assignment, so the two can never disagree. It goes when the
-- last reader moves to the join table.
create or replace function sync_staff_home_venue() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_staff uuid := coalesce(new.staff_id, old.staff_id);
  v_name  text;
begin
  select v.name into v_name
  from coach_staff_venues sv
  join coach_venues v on v.id = sv.venue_id
  where sv.staff_id = v_staff
  order by sv.is_primary desc, sv.created_at asc
  limit 1;

  update coach_staff set home_venue = v_name where id = v_staff;
  return null;
end $$;

drop trigger if exists trg_staff_venues_sync on coach_staff_venues;
create trigger trg_staff_venues_sync after insert or update or delete on coach_staff_venues
  for each row execute function sync_staff_home_venue();

-- Renaming a venue must move every coach's displayed home venue with it. This is
-- the failure the join table exists to prevent, and it stays possible for as long
-- as anything reads the name column.
create or replace function sync_home_venue_on_rename() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.name is distinct from old.name then
    update coach_staff s set home_venue = new.name
    where s.coach_id = new.coach_id
      and exists (
        select 1 from coach_staff_venues sv
        where sv.staff_id = s.id and sv.venue_id = new.id
      );
  end if;
  return new;
end $$;

drop trigger if exists trg_venue_rename_sync on coach_venues;
create trigger trg_venue_rename_sync after update on coach_venues
  for each row execute function sync_home_venue_on_rename();

-- ── Access ──────────────────────────────────────────────────────────────────
alter table coach_staff_venues enable row level security;

drop policy if exists lumio_staff_venues_head on coach_staff_venues;
create policy lumio_staff_venues_head on coach_staff_venues for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- A coach can see where they are assigned. They cannot assign themselves — that
-- is the head coach's call, so no `for all`.
drop policy if exists lumio_staff_venues_own on coach_staff_venues;
create policy lumio_staff_venues_own on coach_staff_venues for select to authenticated
  using (lumio_can_see(coach_id, staff_id));

-- Is the signed-in user assigned to this venue? Security definer so the policy
-- below does not re-enter RLS on coach_staff_venues and recurse.
create or replace function lumio_at_venue(p_academy uuid, p_venue uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    p_academy = auth.uid()
    or (
      p_venue is not null
      and exists (
        select 1
        from coach_staff_venues sv
        join coach_members m on m.staff_id = sv.staff_id
        where sv.venue_id       = p_venue
          and sv.coach_id       = p_academy
          and m.member_user_id  = auth.uid()
          and m.academy_id      = p_academy
          and m.role            = 'coach'
          and m.status          = 'active'
      )
    )
$$;

revoke all on function lumio_at_venue(uuid, uuid) from public;
grant execute on function lumio_at_venue(uuid, uuid) to authenticated;

-- Courts stop being academy-wide. Migration 166 gave every coach every court;
-- they now see the courts at the venues they actually work at.
--
-- venue_id is null is deliberately still visible to everyone. Those are courts
-- created before venues existed (migration 113 predates 129) — they belong
-- nowhere, so they are the shared pool. Hiding them would empty the Court
-- Planner for every academy that has not yet moved its courts under a venue.
-- This tightens on its own as courts get venues; nothing further to run.
drop policy if exists lumio_coach_reads_shared on coach_courts;
create policy lumio_coach_reads_shared on coach_courts for select to authenticated
  using (
    lumio_in_academy(coach_id)
    and (venue_id is null or lumio_at_venue(coach_id, venue_id))
  );

-- coach_venues is deliberately NOT narrowed: a coach can look up any site's
-- address, contact and access notes. That is a phone number and a gate code, not
-- personal data, and needing it for a one-off cover session is common.
