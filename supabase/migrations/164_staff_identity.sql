-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 1 of the coach identity work: give staff a real identity.
--
-- Today a sub-coach's access is a NAME STRING. coach_members.scope_coach_name is
-- matched against coach_staff.name and against the assigned_coach text on players
-- and bookings. That has two consequences, and both are live right now:
--
--   1. Rename a coach in the staff list and their portal access silently
--      detaches. They keep signing in and keep seeing an empty portal, with no
--      error anywhere to explain it.
--   2. Two staff with the same name are the same person as far as scoping is
--      concerned.
--
-- This migration adds the real link (coach_members.staff_id -> coach_staff.id)
-- and, until the code is cut over, keeps the old name column true automatically.
-- Nothing here requires a deploy: existing code reads scope_coach_name and keeps
-- working, because the triggers below maintain it.
--
-- IMPORTANT NAMING NOTE, because it is the thing most likely to be misread later:
--   coach_id  on every coach_* table means WHICH ACADEMY OWNS THIS ROW.
--   staff_id  (added here, and to the domain tables in phase 2) means WHICH
--             COACH IT IS FOR.
-- They are not the same question. Confusing them reads the wrong rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Room for the head coach to become a real person ─────────────────────────
-- The head coach currently has no coach_staff row at all — the staff list
-- invents one client-side with the id '__head__'. That fiction is why nothing
-- can be assigned to the head coach and why they cannot appear in a dropdown
-- alongside their own team.
--
-- The column lands here; the ROW is created in phase 2, deliberately. Inserting
-- it now would put a second head coach in the staff list for everyone running
-- this migration before the next deploy, because LiveStaff renders
-- [synthesised head, ...staff.rows] and would show both. Column now, row with
-- the UI change that consumes it.
alter table coach_staff add column if not exists is_head boolean default false;
create index if not exists idx_coach_staff_head on coach_staff (coach_id) where is_head;

-- ── The link that should always have existed ────────────────────────────────
alter table coach_members add column if not exists staff_id uuid references coach_staff(id) on delete set null;
create index if not exists idx_coach_members_staff on coach_members (staff_id);

-- Backfill from the name we have been relying on. Done once, case-insensitively,
-- and only where exactly one staff row matches — an ambiguous name is left null
-- rather than guessed at, because guessing here grants somebody access to the
-- wrong coach's players.
update coach_members m
set staff_id = s.id
from coach_staff s
where m.role = 'coach'
  and m.staff_id is null
  and m.scope_coach_name is not null
  and s.coach_id = m.academy_id
  and lower(trim(s.name)) = lower(trim(m.scope_coach_name))
  and (select count(*) from coach_staff s2
       where s2.coach_id = m.academy_id
         and lower(trim(s2.name)) = lower(trim(m.scope_coach_name))) = 1;

-- ── Keep the old column true while the code catches up ──────────────────────
-- Expand/contract: new code writes staff_id, old code reads scope_coach_name,
-- and both stay correct until scope_coach_name is dropped in a later migration.
create or replace function coach_members_sync_scope() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- staff_id is the source of truth when it is set.
  if new.staff_id is not null then
    select s.name into new.scope_coach_name from coach_staff s where s.id = new.staff_id;

  -- Otherwise resolve the name to an id, so an invite written by old code still
  -- ends up properly linked. Ambiguous names stay unresolved, as above.
  elsif new.scope_coach_name is not null and new.role = 'coach' then
    select s.id into new.staff_id
    from coach_staff s
    where s.coach_id = new.academy_id
      and lower(trim(s.name)) = lower(trim(new.scope_coach_name))
    limit 1;
  end if;
  return new;
end $$;

drop trigger if exists trg_coach_members_sync_scope on coach_members;
create trigger trg_coach_members_sync_scope
  before insert or update on coach_members
  for each row execute function coach_members_sync_scope();

-- ── The actual bug fix: a rename no longer breaks access ────────────────────
-- Renaming a coach used to orphan their membership and unassign every player and
-- booking held against the old spelling. Now the new name cascades to everything
-- that still refers to them by name. This becomes unnecessary once phase 2
-- replaces assigned_coach with a foreign key, and is dropped at that point.
create or replace function coach_staff_cascade_rename() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.name is distinct from old.name then
    update coach_members
       set scope_coach_name = new.name
     where academy_id = new.coach_id and staff_id = new.id;

    update coach_players
       set assigned_coach = new.name
     where coach_id = new.coach_id
       and lower(trim(assigned_coach)) = lower(trim(old.name));

    update coach_bookings
       set assigned_coach = new.name
     where coach_id = new.coach_id
       and lower(trim(assigned_coach)) = lower(trim(old.name));
  end if;
  return new;
end $$;

drop trigger if exists trg_coach_staff_cascade_rename on coach_staff;
create trigger trg_coach_staff_cascade_rename
  after update of name on coach_staff
  for each row execute function coach_staff_cascade_rename();
