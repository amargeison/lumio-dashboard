-- Sports memberships — RLS policies.
--
-- This is the trickiest RLS migration of the Path B build because the
-- policies on sports_memberships need to query sports_memberships
-- itself ("can this user see this row? → check the user's other rows").
-- A naive subquery would trigger the same policy recursively and
-- Postgres would error with "infinite recursion detected in policy
-- for relation sports_memberships".
--
-- Solution: two SECURITY DEFINER helper functions that the policies
-- call to look up the calling user's club_ids. SECURITY DEFINER makes
-- the function body run as the function owner (a superuser via
-- Supabase) which bypasses RLS on its internal query. The function
-- still sees auth.uid() correctly (auth.uid() reads from
-- request.jwt.claims, a session GUC unaffected by SECURITY DEFINER).
--
-- The helpers are no-argument and intrinsically caller-scoped — there
-- is no way for a caller to pass a different user id and enumerate
-- someone else's clubs.
--
-- Policies installed:
--   1. SELECT — a user can read any membership row whose club_id is
--      one they have an active membership in. Members see all
--      colleagues in their clubs (admins, managers, members, viewers).
--      Pending / suspended / removed / declined memberships grant
--      zero visibility — including the user's own row.
--   2. ALL  — a user with role='admin' (active) in club X can
--      INSERT / UPDATE / DELETE any membership in club X. WITH CHECK
--      is specified explicitly (matches USING) so INSERTs are
--      constrained the same way visible UPDATEs are.
--
-- "Last admin lockout" is intentionally NOT prevented in RLS. An
-- admin demoting themselves to member, or removing their own
-- membership, is allowed by these policies. Preventing the club
-- from ending up with zero admins is enforced in the
-- /api/sports-clubs/[id]/members route at the application layer —
-- doing it at the RLS layer would require either another self-
-- referential subquery (also needing a SECURITY DEFINER helper) or
-- a row-level BEFORE trigger. Both are heavier than a 3-line app
-- check, so the choice is to keep RLS clean and put the guard
-- where it's most visible.
--
-- Writers (via the policies):
--   - /api/sports-clubs/[id]/invite, /remove, /suspend, /reassign
--     (authenticated, admin only — gated by the ALL policy)
-- Readers:
--   - Any module rendering a club's member list, org chart, etc.
--   - Service role for the admin tool (bypasses RLS)
--
-- See docs/specs/path-b-rbac-architecture.md ("Migration 095" in spec, 096 here).

-- ── Helper function 1: clubs where the caller has an active membership ──
-- Used by the SELECT policy. Returns 0 rows for anon and for users
-- whose only memberships are non-active (pending/suspended/etc).
CREATE OR REPLACE FUNCTION public.my_active_club_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT club_id
  FROM sports_memberships
  WHERE user_id = (SELECT auth.uid())
    AND status = 'active'
$$;

-- ── Helper function 2: clubs where the caller is an active admin ──
-- Used by the ALL policy. Strict subset of my_active_club_ids().
CREATE OR REPLACE FUNCTION public.my_admin_club_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT club_id
  FROM sports_memberships
  WHERE user_id = (SELECT auth.uid())
    AND status = 'active'
    AND role = 'admin'
$$;

-- Lock down execution: only authenticated users invoke these from
-- inside RLS policy evaluation. anon does not need EXECUTE — even if
-- a policy path reached the function, auth.uid() returns NULL and
-- the result would be empty, but no-execute is the belt-and-braces
-- denial. service_role bypasses RLS entirely so doesn't need these
-- helpers, and the REVOKE PUBLIC below does not affect service_role.
REVOKE EXECUTE ON FUNCTION public.my_active_club_ids() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_admin_club_ids()  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.my_active_club_ids() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.my_admin_club_ids()  TO authenticated;

-- ── Policies ────────────────────────────────────────────────────────────
-- Idempotent re-run: drop any earlier instance of each policy before
-- recreating. Pattern matches 087_sports_auth.sql and 095_sports_clubs_rls.sql.

DROP POLICY IF EXISTS "Members read memberships in their clubs" ON sports_memberships;
CREATE POLICY "Members read memberships in their clubs"
  ON sports_memberships FOR SELECT
  USING (club_id IN (SELECT public.my_active_club_ids()));

-- FOR ALL covers INSERT, UPDATE, DELETE. WITH CHECK is specified
-- explicitly: for INSERT, only USING-default-to-WITH-CHECK applies in
-- some Postgres minor versions and being explicit removes ambiguity.
DROP POLICY IF EXISTS "Admins manage memberships in their clubs" ON sports_memberships;
CREATE POLICY "Admins manage memberships in their clubs"
  ON sports_memberships FOR ALL
  USING      (club_id IN (SELECT public.my_admin_club_ids()))
  WITH CHECK (club_id IN (SELECT public.my_admin_club_ids()));
