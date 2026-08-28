-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 2 of the coach identity work: say which coach a row is for.
--
-- Phase 1 gave a membership a real staff_id. This gives the DATA one, so the
-- access rules in phase 3 have something true to filter on.
--
-- Reminder of the two questions, because they are easy to conflate:
--   coach_id  = which academy owns this row
--   staff_id  = which coach it is for  (null = the academy's, nobody's in particular)
--
-- Ships WITH its deploy, unlike phase 1 — it creates the head coach's staff row,
-- and the staff list has to stop inventing one in the same breath or you get two
-- head coaches.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── The head coach becomes a real row ───────────────────────────────────────
-- Named from their profile. Idempotent — an academy that already has a head row
-- is left alone, so re-running this is harmless.
insert into coach_staff (coach_id, name, role, is_head, email)
select p.id,
       coalesce(nullif(trim(p.display_name), ''), 'Head Coach'),
       'Head Coach',
       true,
       p.contact_email
from sports_profiles p
where exists (
        -- Only academies that actually use the coach portal, so this does not
        -- create a staff row for every account across every Lumio sport.
        select 1 from coach_players   cp where cp.coach_id = p.id
        union all select 1 from coach_staff    cs where cs.coach_id = p.id
        union all select 1 from coach_camps    cc where cc.coach_id = p.id
        union all select 1 from coach_bookings cb where cb.coach_id = p.id
      )
  and not exists (select 1 from coach_staff s where s.coach_id = p.id and s.is_head);

-- ── staff_id on the tables where assignment is a real idea ──────────────────
-- Deliberately NOT on: payments, charges, packages, stripe, settings, venues,
-- courts, equipment, kit, resources. Those are academy-level — a sub-coach does
-- not have "their own" price list — and inventing an owner for them would be a
-- column nobody could answer honestly.
do $$
declare t text;
begin
  foreach t in array array[
    'coach_players', 'coach_bookings', 'coach_sessions', 'coach_session_plans',
    'coach_camps', 'coach_development', 'coach_attendance'
  ] loop
    execute format('alter table %I add column if not exists staff_id uuid references coach_staff(id) on delete set null', t);
    execute format('create index if not exists idx_%s_staff on %I (coach_id, staff_id)', t, t);
  end loop;
end $$;

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Players and bookings carry the name string we have been scoping on. As in
-- phase 1, only an unambiguous match is taken — two staff sharing a name leaves
-- the row unassigned rather than handing it to the wrong coach.
update coach_players p
set staff_id = s.id
from coach_staff s
where p.staff_id is null
  and p.assigned_coach is not null
  and s.coach_id = p.coach_id
  and lower(trim(s.name)) = lower(trim(p.assigned_coach))
  and (select count(*) from coach_staff s2
       where s2.coach_id = p.coach_id and lower(trim(s2.name)) = lower(trim(p.assigned_coach))) = 1;

update coach_bookings b
set staff_id = s.id
from coach_staff s
where b.staff_id is null
  and b.assigned_coach is not null
  and s.coach_id = b.coach_id
  and lower(trim(s.name)) = lower(trim(b.assigned_coach))
  and (select count(*) from coach_staff s2
       where s2.coach_id = b.coach_id and lower(trim(s2.name)) = lower(trim(b.assigned_coach))) = 1;

-- Sessions, development and attendance have no assignment of their own. They
-- inherit the player's, which is how the portal already scopes them (it filters
-- sessions by the coach's players). Inheriting makes that explicit and survives
-- a player later moving to a different coach.
update coach_sessions x
set staff_id = p.staff_id
from coach_players p
where x.staff_id is null and x.player_id = p.id and p.staff_id is not null;

-- coach_development never got a player_id — it still matches players by name,
-- which is the exact bug migration 146 fixed for sessions and bookings. Adding
-- it here rather than backfilling assignment off a name string and inheriting
-- the problem we are trying to remove.
alter table coach_development add column if not exists player_id uuid references coach_players(id) on delete set null;
create index if not exists idx_coach_development_player on coach_development (player_id) where player_id is not null;

update coach_development d
set player_id = p.id
from coach_players p
where d.player_id is null
  and p.coach_id = d.coach_id
  and lower(trim(p.name)) = lower(trim(d.player_name))
  and (select count(*) from coach_players p2
       where p2.coach_id = d.coach_id and lower(trim(p2.name)) = lower(trim(d.player_name))) = 1;

update coach_development x
set staff_id = p.staff_id
from coach_players p
where x.staff_id is null and x.player_id = p.id and p.staff_id is not null;

update coach_attendance x
set staff_id = p.staff_id
from coach_players p
where x.staff_id is null and x.player_id = p.id and p.staff_id is not null;

-- ── Keep assigned_coach true while the code catches up ──────────────────────
-- The portal still reads `.eq('assigned_coach', name)`. Until it moves to
-- staff_id, the name column is derived from the id on every write, so the two
-- can never disagree — which is the failure phase 1 was fixing by hand.
create or replace function sync_assigned_coach() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.staff_id is not null then
    select s.name into new.assigned_coach from coach_staff s where s.id = new.staff_id;
  elsif new.assigned_coach is not null then
    select s.id into new.staff_id
    from coach_staff s
    where s.coach_id = new.coach_id
      and lower(trim(s.name)) = lower(trim(new.assigned_coach))
    limit 1;
  end if;
  return new;
end $$;

drop trigger if exists trg_players_sync_assigned on coach_players;
create trigger trg_players_sync_assigned before insert or update on coach_players
  for each row execute function sync_assigned_coach();

drop trigger if exists trg_bookings_sync_assigned on coach_bookings;
create trigger trg_bookings_sync_assigned before insert or update on coach_bookings
  for each row execute function sync_assigned_coach();

-- ── The phase 1 rename cascade is now redundant for players and bookings ────
-- Their name column is derived from staff_id on every write, so a rename cannot
-- orphan them any more. The trigger stays only to keep coach_members in step,
-- and goes entirely when scope_coach_name is dropped.
create or replace function coach_staff_cascade_rename() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.name is distinct from old.name then
    update coach_members
       set scope_coach_name = new.name
     where academy_id = new.coach_id and staff_id = new.id;

    -- Rows still holding the old name because they were never linked to a staff
    -- row (an ambiguous name at backfill time). Without this they would keep the
    -- stale spelling forever.
    update coach_players set assigned_coach = new.name
     where coach_id = new.coach_id and staff_id is null
       and lower(trim(assigned_coach)) = lower(trim(old.name));

    update coach_bookings set assigned_coach = new.name
     where coach_id = new.coach_id and staff_id is null
       and lower(trim(assigned_coach)) = lower(trim(old.name));
  end if;
  return new;
end $$;
