-- Sports memberships — the multi-user join table linking auth.users to
-- sports_clubs (091). One row per (user, club) once accepted; pending
-- rows have user_id = NULL until the invite is consumed.
--
-- Writers:
--   - /api/sports-admin/memberships (service role, admin-only) — Phase 1
--   - /api/sports-auth/accept-invite (service role) — turns pending → active
--   - /api/sports-clubs/[id]/members (authenticated, admin-gated by RLS in 096)
-- Readers:
--   - /api/sports-clubs/* via authenticated user (RLS in 096)
--   - Service role for the admin tool (bypasses RLS)
--
-- See docs/specs/path-b-rbac-architecture.md ("Migration 091" in spec, 092 here).

-- Idempotent enum creates. Pattern mirrors 091_sports_clubs.sql.
DO $$ BEGIN
  CREATE TYPE membership_role AS ENUM (
    'admin', 'manager', 'member', 'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM (
    'pending', 'active', 'suspended', 'removed', 'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS sports_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- user_id is NULL while an invite is pending. The partial unique
  -- index below enforces (user_id, club_id) uniqueness only once the
  -- invite is consumed and user_id becomes non-null.
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  display_name TEXT,
  title TEXT,
  avatar_url TEXT,

  role membership_role NOT NULL DEFAULT 'member',
  role_template TEXT,
  primary_department TEXT NOT NULL,
  additional_departments TEXT[] NOT NULL DEFAULT '{}',
  cross_department_view BOOLEAN NOT NULL DEFAULT false,
  custom_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,

  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status membership_status NOT NULL DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index — see explanation below the CREATE.
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_club_unique
  ON sports_memberships(user_id, club_id)
  WHERE user_id IS NOT NULL;

-- Why partial, not a plain UNIQUE constraint:
-- 1. While invites are pending, user_id is NULL. A regular UNIQUE
--    constraint on (user_id, club_id) treats NULLs as distinct
--    (per SQL spec) — fine in PG <15 but PG 15 added NULLS NOT
--    DISTINCT, which would BLOCK multiple pending invites per club.
-- 2. We need many concurrent pending invites for the SAME club
--    (one per invited email), but we need exactly ONE active
--    membership per (user, club) once accepted.
-- 3. A partial unique index restricted to rows where user_id IS
--    NOT NULL gives us both behaviours unambiguously.

CREATE INDEX IF NOT EXISTS idx_memberships_user
  ON sports_memberships(user_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_memberships_club
  ON sports_memberships(club_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_memberships_status
  ON sports_memberships(status);

-- Auto-update updated_at on row changes. Mirrors the 091/087 pattern —
-- accept-invite API, admin tool, in-portal member-management UI all
-- touch this row, easier to enforce in SQL than at every call site.
CREATE OR REPLACE FUNCTION update_sports_memberships_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sports_memberships_updated_at ON sports_memberships;
CREATE TRIGGER trg_sports_memberships_updated_at
  BEFORE UPDATE ON sports_memberships
  FOR EACH ROW EXECUTE FUNCTION update_sports_memberships_updated_at();

-- RLS intentionally NOT enabled in this migration. Policies arrive in
-- 096_sports_memberships_rls.sql. Until then, only service-role
-- callers should read/write this table.
