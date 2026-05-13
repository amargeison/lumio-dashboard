-- Sports clubs — RLS policies.
--
-- Pre-condition: sports_clubs has RLS enabled. Supabase enables RLS by
-- default on every new table in this project, so 091 left the table
-- denied-by-default for anon and authenticated roles. This migration
-- opens two controlled access paths on top of that default-deny.
--
-- Policies installed:
--   1. SELECT — a user can read any club where they have an active
--      membership. Members include admins, managers, members and
--      viewers. Pending / suspended / removed / declined memberships
--      grant zero access.
--   2. UPDATE — a user can update only those clubs where they are an
--      active admin. WITH CHECK is intentionally omitted: Postgres
--      defaults WITH CHECK to the USING expression for UPDATE
--      policies, which is exactly what we want (post-update row state
--      must still satisfy the same admin condition).
--
-- INSERT and DELETE are intentionally NOT covered. New clubs are
-- provisioned by the admin tool (service-role API) only. Club deletion
-- is destructive enough that we never want it to happen via PostgREST.
-- Service-role callers bypass RLS, so the admin tool retains full
-- INSERT/DELETE capability.
--
-- Writers (of this table, via the policies):
--   - /api/sports-clubs/[id] (authenticated, admin gates UPDATE)
-- Readers:
--   - Any module rendering club data for an active member
--   - Service role for the admin tool (bypasses RLS)
--
-- See docs/specs/path-b-rbac-architecture.md ("Migration 094" in spec, 095 here).

-- Idempotent re-run: drop any earlier instance of each policy before
-- recreating. Pattern matches 087_sports_auth.sql.
DROP POLICY IF EXISTS "Members read clubs they belong to" ON sports_clubs;
CREATE POLICY "Members read clubs they belong to"
  ON sports_clubs FOR SELECT
  USING (
    id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admins update their clubs" ON sports_clubs;
CREATE POLICY "Admins update their clubs"
  ON sports_clubs FOR UPDATE
  USING (
    id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role = 'admin'
    )
  );

-- No INSERT or DELETE policies by design — sports_clubs is provisioned
-- and removed via service-role APIs only (the admin tool / Path E).
-- Service role bypasses RLS automatically, so no policy is required
-- for it to operate normally.
