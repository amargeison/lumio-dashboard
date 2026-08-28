-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3: let an assistant coach sign into the real portal.
--
-- Until now RLS has been `coach_id = auth.uid()` everywhere, so only the academy
-- owner could read anything. Sub-coaches were served through /api/portal/* with
-- a service-role client and hand-written filters. That works, but it means every
-- new feature needs a second implementation before a coach can use it.
--
-- THE SAFETY PROPERTY OF THIS MIGRATION: it only ADDS policies.
--
-- Postgres OR's policies together, so every existing `coach_id = auth.uid()`
-- rule stays exactly as it is and the head coach cannot lose access to anything.
-- If a policy below is wrong, the failure is a coach seeing too LITTLE — never a
-- head coach locked out, and never one academy seeing another, because every new
-- policy is anchored on a membership row whose academy_id must equal the row's
-- own coach_id.
--
-- Three tiers, because "what a coach can see" is genuinely three questions:
--   1. Their own work        — full access, scoped to staff_id
--   2. The academy's kit     — read-only: courts, venues, equipment, resources
--   3. The head coach's own  — no access at all: money, settings, integrations
-- ─────────────────────────────────────────────────────────────────────────────

-- ── The predicate everything hangs on ───────────────────────────────────────
-- Deliberately strict in two ways.
--
-- Only role='coach'. Parents and students are also coach_members rows, and they
-- must keep going through the portal routes — this must never widen to them by
-- accident.
--
-- And `m.staff_id is not null`. A coach membership with no staff link is one the
-- backfill could not resolve (an ambiguous name). Such a membership sees
-- NOTHING rather than everything: the unresolved case must fail closed, because
-- failing open here hands somebody an entire academy.
create or replace function lumio_can_see(p_academy uuid, p_staff uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    p_academy = auth.uid()
    or (
      p_staff is not null
      and exists (
        select 1 from coach_members m
        where m.member_user_id = auth.uid()
          and m.academy_id     = p_academy
          and m.role           = 'coach'
          and m.status         = 'active'
          and m.staff_id is not null
          and m.staff_id       = p_staff
      )
    )
$$;

-- Membership of an academy, without any per-row scope. Only ever used to grant
-- READ on shared reference data — never on anything holding personal detail.
create or replace function lumio_in_academy(p_academy uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    p_academy = auth.uid()
    or exists (
      select 1 from coach_members m
      where m.member_user_id = auth.uid()
        and m.academy_id     = p_academy
        and m.role           = 'coach'
        and m.status         = 'active'
    )
$$;

revoke all on function lumio_can_see(uuid, uuid) from public;
revoke all on function lumio_in_academy(uuid) from public;
grant execute on function lumio_can_see(uuid, uuid) to authenticated;
grant execute on function lumio_in_academy(uuid) to authenticated;

-- ── Tier 1: a coach's own work ──────────────────────────────────────────────
-- Tables carrying staff_id from phase 2. Full access, but only to rows assigned
-- to them. An unassigned row belongs to the academy and stays with the head.
do $$
declare t text;
begin
  foreach t in array array[
    'coach_players', 'coach_bookings', 'coach_sessions', 'coach_session_plans',
    'coach_camps', 'coach_development', 'coach_attendance'
  ] loop
    execute format('drop policy if exists lumio_coach_own on %I', t);
    execute format($f$
      create policy lumio_coach_own on %I for all to authenticated
        using (lumio_can_see(coach_id, staff_id))
        with check (lumio_can_see(coach_id, staff_id))
    $f$, t);
  end loop;
end $$;

-- ── Tier 1b: rows that belong to a player rather than to a coach ────────────
-- Skills, media and GPS have no staff_id of their own — they hang off a player.
-- A coach reaches them through that player's assignment, so moving a player to
-- another coach moves their history with them, which is the behaviour a coach
-- would expect.
do $$
declare t text;
begin
  -- coach_gps_sessions is NOT here: it has only player_name, no player_id, and
  -- joining a policy on a name string is exactly the bug this whole phase exists
  -- to remove. It stays head-only until it has a real player id. No loss today —
  -- there is no GPS capture, the data is demo-only.
  foreach t in array array['coach_player_skills', 'coach_media'] loop
    execute format('drop policy if exists lumio_coach_via_player on %I', t);
    execute format($f$
      create policy lumio_coach_via_player on %I for all to authenticated
        using (lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = %I.player_id)))
        with check (lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = %I.player_id)))
    $f$, t, t, t);
  end loop;
end $$;

-- ── Tier 2: the academy's shared kit, read-only ─────────────────────────────
-- A coach needs to know which court they are on and what is in the store
-- cupboard. They do not get to edit the academy's inventory, so SELECT only —
-- writes still fall to the head coach's existing policy.
do $$
declare t text;
begin
  foreach t in array array[
    'coach_venues', 'coach_courts', 'coach_equipment', 'coach_kit_items', 'coach_resources'
  ] loop
    execute format('drop policy if exists lumio_coach_reads_shared on %I', t);
    execute format($f$
      create policy lumio_coach_reads_shared on %I for select to authenticated
        using (lumio_in_academy(coach_id))
    $f$, t);
  end loop;
end $$;

-- A coach can see who their colleagues are — names and roles are how a staff
-- list is useful at all. DBS numbers and personal contact details sit on the
-- same row, so this is SELECT only and the head coach remains the only one who
-- can change anything.
drop policy if exists lumio_coach_reads_staff on coach_staff;
create policy lumio_coach_reads_staff on coach_staff for select to authenticated
  using (lumio_in_academy(coach_id));

-- ── Tier 3: deliberately NOT granted ────────────────────────────────────────
-- No policy is added for any of these, so they keep the head-coach-only rule:
--
--   coach_payments, coach_charges, coach_packages, coach_stripe  — money
--   coach_settings                                               — academy config
--   coach_oauth_connections, coach_calendar_links                — secrets
--   coach_messages                                               — the head's inbox
--   coach_camp_attendees, coach_camp_blasts, coach_camp_emails   — customer contact
--   coach_consent_submissions, coach_watch_sessions              — safeguarding
--   coach_gps_sessions                                           — no player_id
--   coach_members                                                — access control
--
-- coach_camp_attendees is the one worth explaining: a coach can see the CAMP
-- they run, but the attendee rows carry parents' emails, phone numbers, medical
-- notes and consent flags. Until there is a reason a coach needs those, they do
-- not get them.

-- ── Prove it ────────────────────────────────────────────────────────────────
-- What this SHOULD return, per role. Anything else is a bug, and the two rows
-- marked MUST BE 0 are the ones that matter — a non-zero there is a data leak,
-- not a broken screen.
--
--   table                     head coach        assistant coach
--   ────────────────────────────────────────────────────────────────
--   coach_players             all               only theirs
--   coach_bookings            all               only theirs
--   coach_sessions            all               only theirs
--   coach_venues              all               all (read-only)
--   coach_staff               all               all (read-only)
--   coach_payments            all               MUST BE 0
--   coach_camp_attendees      all               MUST BE 0
--   coach_members             all               their own row only
--
-- The check itself lives in supabase/checks/166_verify_coach_access.sql. Run it
-- from the SQL editor while signed in AS EACH USER — not with the service role,
-- which bypasses RLS entirely and will cheerfully show you everything, proving
-- nothing at all.
