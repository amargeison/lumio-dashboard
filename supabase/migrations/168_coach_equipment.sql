-- ─────────────────────────────────────────────────────────────────────────────
-- Equipment a coach actually owns.
--
-- Migration 165 deliberately left staff_id off equipment, on the reasoning that
-- a sub-coach does not have "their own" price list. That was right about
-- payments and packages and wrong about kit: a coach carries their own balls,
-- cones and throwdowns in the boot of their car, and a club list they cannot
-- edit is no use to them on a Tuesday morning.
--
-- So equipment becomes one of two things, and the coach chooses which:
--
--   equipment_own = false  →  they see the ACADEMY's list, read-only. The default,
--                             and right for a club where the store cupboard is
--                             shared.
--   equipment_own = true   →  they have their own list. Either seeded from the
--                             academy's (most coaches) or started empty.
--
-- Once they own a list they stop seeing the academy's entirely, because a merged
-- view of "some of these are yours and some are the club's" is the thing nobody
-- can reason about at 8am.
-- ─────────────────────────────────────────────────────────────────────────────

-- Null means the academy's. A staff_id means that coach's own.
alter table coach_equipment add column if not exists staff_id uuid references coach_staff(id) on delete cascade;
alter table coach_kit_items add column if not exists staff_id uuid references coach_staff(id) on delete cascade;

create index if not exists idx_coach_equipment_staff on coach_equipment (coach_id, staff_id);
create index if not exists idx_coach_kit_items_staff on coach_kit_items (coach_id, staff_id);

-- Explicit rather than inferred. "I set up my own list and it is currently
-- empty" and "I have not set one up yet" are different states, and inferring
-- from a row count would show the setup wizard again every time a coach emptied
-- their list.
alter table coach_staff add column if not exists equipment_own boolean default false;

-- ── Access ──────────────────────────────────────────────────────────────────
-- Migration 166 gave coaches a blanket read on these two tables. That is now
-- split: the academy's rows stay readable (a coach who has not set up their own
-- still needs to see the club's), and a coach gets FULL access to rows carrying
-- their own staff_id.
do $$
declare t text;
begin
  foreach t in array array['coach_equipment', 'coach_kit_items'] loop
    -- The academy's shared list: still read-only for everyone in the academy.
    execute format('drop policy if exists lumio_coach_reads_shared on %I', t);
    execute format($f$
      create policy lumio_coach_reads_shared on %I for select to authenticated
        using (staff_id is null and lumio_in_academy(coach_id))
    $f$, t);

    -- Their own kit: theirs to add to, edit and throw away.
    execute format('drop policy if exists lumio_coach_owns_kit on %I', t);
    execute format($f$
      create policy lumio_coach_owns_kit on %I for all to authenticated
        using (lumio_can_see(coach_id, staff_id))
        with check (lumio_can_see(coach_id, staff_id))
    $f$, t);
  end loop;
end $$;
