-- Sports profiles ↔ sports memberships link.
--
-- Adds a nullable FK from sports_profiles (the individual-athlete
-- model, 087/047) to sports_memberships (the team-RBAC model, 092).
-- Used only when a single auth user spans both worlds — e.g. a
-- boxer who also coaches a non-league club. Almost all rows will
-- have club_membership_id IS NULL.
--
-- Writers:
--   - /api/sports-admin/link-profile (service role, manual ops) — Phase 1+
--   - Future self-serve "claim membership from profile" flow (Phase 2+)
-- Readers:
--   - Server-side profile loaders that need to surface a linked
--     club portal alongside the individual portal.
--
-- See docs/specs/path-b-rbac-architecture.md ("Migration 093" in spec, 094 here).

ALTER TABLE sports_profiles
  ADD COLUMN IF NOT EXISTS club_membership_id
    UUID REFERENCES sports_memberships(id) ON DELETE SET NULL;

-- Partial index — column is NULL for the vast majority of rows. The
-- partial index keeps the index footprint tiny and accelerates both
-- "find profile by membership" lookups and the reverse-scan that fires
-- when a membership row is deleted (ON DELETE SET NULL cascade).
-- Same shape as idx_sports_clubs_parent in 091.
CREATE INDEX IF NOT EXISTS idx_sports_profiles_club_membership
  ON sports_profiles(club_membership_id)
  WHERE club_membership_id IS NOT NULL;

-- RLS is unchanged: sports_profiles already has RLS enabled with
-- self-only policies from 087_sports_auth.sql (auth.uid() = id).
-- Those policies are not column-scoped, so they automatically cover
-- the new club_membership_id column. No policy change needed here.
