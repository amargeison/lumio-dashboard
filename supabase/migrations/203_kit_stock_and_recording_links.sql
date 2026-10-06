-- ─────────────────────────────────────────────────────────────────────────────
-- Equipment: when an item counts as "running low". Recordings: what a
-- recording's AI review created, so it can be taken back.
--
-- Two small additions, each for a fault a tester reproduced. Safe to run twice.
-- Nothing is deleted or changed: three new columns, all empty for existing rows.
--
-- DEPLOY ORDER: run this BEFORE the code that goes with it. The equipment form
-- saves `low_at`, and the review of a recording saves `session_id` and
-- `attendance_id`; a database without the columns refuses those writes.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1. Equipment: the count at which an item is running low ═════════════════
-- WHAT WAS WRONG. An item's status ("In stock", "Running low"…) was set by hand
-- and had nothing to do with its quantity, so an item with 0 left showed a green
-- "In stock" and the dashboard said "All stocked up".
--
-- THE RULE NOW (applied by the portal, from the row): a quantity of 0 is out of
-- stock; a quantity at or below `low_at` is running low; otherwise the status
-- the coach chose stands. `low_at` is per item because "low" is 12 for balls and
-- nothing at all for a ball machine. Null = no level set, which is every
-- existing row, so nothing is flagged low that was not before.
alter table coach_equipment add column if not exists low_at integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coach_equipment_low_at_check') then
    alter table coach_equipment
      add constraint coach_equipment_low_at_check check (low_at is null or low_at >= 0);
  end if;
end $$;

comment on column coach_equipment.low_at is
  'Flag the item as running low when quantity is at or below this. Null = no level set.';


-- ══ 2. Recordings: what the AI review of a recording created ════════════════
-- WHAT WAS WRONG. Reviewing a recording writes a lesson summary and marks the
-- player present, then offers the coach "Discard". Nothing recorded WHICH
-- summary and WHICH attendance mark came from the recording, so Discard could
-- only close the window: the summary, the mark and the file all stayed.
--
-- These two columns are that record. `attendance_id` is filled only when the
-- review itself created the mark — a player already marked present that day
-- keeps their mark if the recording is discarded. Deleting the summary or the
-- mark by hand simply empties the link.
do $$
begin
  if to_regclass('public.coach_media') is null then return; end if;

  if to_regclass('public.coach_sessions') is not null then
    alter table coach_media add column if not exists session_id uuid
      references coach_sessions(id) on delete set null;
  end if;
  if to_regclass('public.coach_attendance') is not null then
    alter table coach_media add column if not exists attendance_id uuid
      references coach_attendance(id) on delete set null;
  end if;
end $$;

comment on column coach_media.session_id is
  'The lesson summary written from this recording by the AI review. Null if none, or if it has since been deleted.';
comment on column coach_media.attendance_id is
  'The attendance mark the AI review created for this recording. Null if the player was already marked that day.';
