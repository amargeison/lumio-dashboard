-- Lumio Tennis Coach — the columns dbUpdate assumes exist.
--
-- Every write through dbUpdate() sets `updated_at`. Two tables never had the
-- column, so PostgREST rejected the whole statement:
--
--   column "updated_at" of relation "coach_camp_attendees" does not exist
--
-- The visible symptom was the Finance tab's "tick when paid" checkbox doing
-- nothing at all — the update threw, the error went to the console, and the
-- controlled checkbox snapped straight back to its old value. Every other edit
-- of an attendee was failing the same way and just had no obvious tell.
alter table coach_camp_attendees add column if not exists updated_at timestamptz default now();
alter table coach_kit_items      add column if not exists updated_at timestamptz default now();

-- Backfill so the column means something for rows that already existed.
update coach_camp_attendees set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
update coach_kit_items      set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;
