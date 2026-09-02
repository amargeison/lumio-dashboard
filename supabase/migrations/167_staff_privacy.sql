-- ─────────────────────────────────────────────────────────────────────────────
-- Correcting a grant from migration 166.
--
-- 166 let any coach in an academy read coach_staff, reasoning that a staff list
-- is only useful if you can see who your colleagues are. Seeing it rendered
-- proved that wrong: DBS numbers, DBS expiry dates, safeguarding training dates
-- and personal phone numbers all live on that same row. An assistant coach was
-- being shown the head coach's compliance record on the dashboard.
--
-- Row level security is per-ROW, not per-column, so there is no way to keep the
-- names and hide the rest through a policy. The read is therefore revoked, and
-- colleague names — which assignment dropdowns genuinely need — come from a view
-- that exposes only the harmless columns.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists lumio_coach_reads_staff on coach_staff;

-- Names, roles and photos. Nothing that belongs in a personnel file.
create or replace view coach_staff_directory
with (security_invoker = false) as
  select s.id, s.coach_id, s.name, s.role, s.is_head, s.avatar_url, s.home_venue
  from coach_staff s
  where lumio_in_academy(s.coach_id);

revoke all on coach_staff_directory from public;
grant select on coach_staff_directory to authenticated;

comment on view coach_staff_directory is
  'Colleague names for assignment dropdowns. Deliberately excludes DBS, '
  'safeguarding, email, phone and qualifications — see migration 167.';
