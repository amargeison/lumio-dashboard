-- Sports clubs — first-class club entity for the Path B multi-user RBAC
-- model. One row per club; multi-user via sports_memberships (092).
--
-- Writers:
--   - /api/sports-admin/clubs (service role, admin-only) — Phase 1 sales-led
--   - Self-serve provisioning (Phase 2)
-- Readers:
--   - /api/sports-clubs/* via authenticated user (RLS in 095)
--   - Service role for the admin tool (bypasses RLS)
--
-- See docs/specs/path-b-rbac-architecture.md for the design rationale.

-- Idempotent enum create. Pattern mirrors 084_feature_tiers.sql.
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM (
    'lumio_pro', 'lumio_club', 'lumio_women', 'lumio_grassroots'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS sports_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sport TEXT NOT NULL DEFAULT 'football',
  product product_type NOT NULL,
  tier TEXT NOT NULL,

  parent_club_id UUID REFERENCES sports_clubs(id) ON DELETE SET NULL,

  logo_url TEXT,
  brand_primary TEXT,
  brand_secondary TEXT,

  league_name TEXT,
  fa_club_id TEXT,

  billing_status TEXT DEFAULT 'founding_member',
  billing_seats_included INT DEFAULT 5,
  billing_seats_purchased INT DEFAULT 0,
  billing_started_at TIMESTAMPTZ,
  billing_renews_at TIMESTAMPTZ,

  setup_complete BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No explicit idx_sports_clubs_slug — the UNIQUE constraint on slug
-- already creates an implicit B-tree index that serves the same lookups.
CREATE INDEX IF NOT EXISTS idx_sports_clubs_product
  ON sports_clubs(product);
CREATE INDEX IF NOT EXISTS idx_sports_clubs_parent
  ON sports_clubs(parent_club_id)
  WHERE parent_club_id IS NOT NULL;

-- Auto-update updated_at on row changes. Mirrors the sports_profiles
-- pattern in 087_sports_auth.sql — multiple code paths will touch this
-- row (admin tool, accept-invite API, club settings UI), so enforce
-- the timestamp in SQL rather than at every call site.
CREATE OR REPLACE FUNCTION update_sports_clubs_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sports_clubs_updated_at ON sports_clubs;
CREATE TRIGGER trg_sports_clubs_updated_at
  BEFORE UPDATE ON sports_clubs
  FOR EACH ROW EXECUTE FUNCTION update_sports_clubs_updated_at();

-- RLS intentionally NOT enabled in this migration. Policies arrive in
-- 095_sports_clubs_rls.sql once 092_sports_memberships.sql exists for
-- them to reference. Until then, only service-role callers should
-- read/write this table.
