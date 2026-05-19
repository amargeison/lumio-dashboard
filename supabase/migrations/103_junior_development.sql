-- supabase/migrations/103_junior_development.sql
-- Workstream B / Migration 103 — Lumio Junior Football development tracker.
--
-- Builds on 099 + 100 + 101 + 102:
--   - Reuses helper functions: junior_staff_club_ids,
--     junior_guardian_player_ids (both 099)
--   - Reuses trigger function: junior_force_club_id_from_player (099)
--     for the two player-keyed tables (junior_development_reviews,
--     junior_milestones)
--   - NO new helper functions.
--
-- Three tables, one ENUM. Pattern from 099–102 throughout.
--
-- THE FA FOUR-CORNER FRAMEWORK is the canonical Lumio Junior development
-- model — same domains as the Coach Toolkit player cards (Commit 7
-- reconciliation). junior_skills_framework names the four corners;
-- junior_development_reviews stores per-child term ratings against them.
--
-- junior_skills_framework is the FIRST junior table with NO club_id. It
-- is a shared cross-tenant reference catalogue. WRITES are deliberately
-- service-role-only (RLS enabled with no write policy) — see the comment
-- on the table and decision-1 in the proposal review.

-- ─── ENUM ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE junior_development_domain AS ENUM (
    'technical', 'physical', 'social', 'psychological'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TABLES ───────────────────────────────────────────────────────────────

-- junior_skills_framework — shared cross-tenant reference catalogue of
-- skills per age band and four-corner domain. NO player_id, NO club_id.
--
-- WRITES ARE SERVICE-ROLE-ONLY BY DESIGN. RLS is enabled with only a
-- SELECT policy below; no INSERT/UPDATE/DELETE policy exists, which
-- means authenticated and anon roles cannot mutate this table at all.
-- service_role bypasses RLS and seeds / maintains the catalogue
-- out-of-band (admin tool or one-off migrations).
--
-- Reasoning: this table is shared across every junior club. An inline
-- "any chairman or academy_lead can write" policy would let one club's
-- staff mutate or delete rows that another club's development reviews
-- depend on — a cross-tenant blast radius. The FA-canonical entries
-- should not change, so no portal-level write path is granted.
--
-- Per-club skill extensions are a real future feature, but the schema
-- shape for it (a `source` column distinguishing 'fa_canonical' from
-- 'club_extension', plus a `created_by_club_id` column, plus a
-- per-club RLS policy gating writes to club_extension rows) is
-- deliberate work for a later migration — not a loose write policy
-- bolted on here.
CREATE TABLE IF NOT EXISTS junior_skills_framework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  age_band   TEXT NOT NULL,                       -- 'U7'..'U16'
  domain     junior_development_domain NOT NULL,
  skill_name TEXT NOT NULL,
  descriptor TEXT,                                -- longer explanation, nullable
  sort_order INT NOT NULL DEFAULT 0,              -- within (age_band, domain)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (age_band, domain, skill_name)
);

-- junior_development_reviews — per-child, per-term rating across the
-- four corners + coach notes. parent_visible controls whether the
-- guardian sees the review at all (default true; a coach may
-- temporarily hide an in-progress draft).
--
-- One review per (player, term). Re-opening a term overwrites via UPDATE.
CREATE TABLE IF NOT EXISTS junior_development_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  player_id UUID NOT NULL REFERENCES junior_players(id) ON DELETE CASCADE,
  club_id   UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  term TEXT NOT NULL,                             -- 'Autumn 25/26' / 'Spring 25/26' / 'Summer 25/26'
  reviewed_by_membership_id UUID REFERENCES sports_memberships(id) ON DELETE SET NULL,

  -- Four-corner ratings — 0..100. CHECK constraints enforce the band at
  -- the database layer so out-of-range UI bugs can't corrupt history.
  technical     INT NOT NULL CHECK (technical     BETWEEN 0 AND 100),
  physical      INT NOT NULL CHECK (physical      BETWEEN 0 AND 100),
  social        INT NOT NULL CHECK (social        BETWEEN 0 AND 100),
  psychological INT NOT NULL CHECK (psychological BETWEEN 0 AND 100),

  coach_notes    TEXT,
  parent_visible BOOLEAN NOT NULL DEFAULT true,

  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (player_id, term)
);

-- junior_milestones — discrete achievements (50 sessions, player-of-match,
-- captain-for-a-week, FA Charter participation event, etc.).
-- milestone_type is free-form TEXT for v1 — the catalogue isn't settled
-- enough to lock down with an ENUM yet. CHECK / lookup-table can land
-- later once the canonical list stabilises.
CREATE TABLE IF NOT EXISTS junior_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  player_id UUID NOT NULL REFERENCES junior_players(id) ON DELETE CASCADE,
  club_id   UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  milestone_type TEXT NOT NULL,                   -- e.g. '50_sessions', 'player_of_match', 'captain'
  title          TEXT NOT NULL,
  description    TEXT,

  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────

-- junior_skills_framework. The UNIQUE on (age_band, domain, skill_name)
-- gives a leading-column composite index. Add a dedicated
-- (age_band, domain, sort_order) for the ordered-display hot path.
CREATE INDEX IF NOT EXISTS idx_junior_skills_framework_display
  ON junior_skills_framework(age_band, domain, sort_order);

-- junior_development_reviews. player_id is the leading column of the
-- UNIQUE on (player_id, term) — implicit index. Add club_id +
-- reviewed_by (partial) explicitly.
CREATE INDEX IF NOT EXISTS idx_junior_development_reviews_club ON junior_development_reviews(club_id);
CREATE INDEX IF NOT EXISTS idx_junior_development_reviews_reviewed_by
  ON junior_development_reviews(reviewed_by_membership_id)
  WHERE reviewed_by_membership_id IS NOT NULL;
-- Parent app: "show me my child's reviews newest first" — visible-only.
CREATE INDEX IF NOT EXISTS idx_junior_development_reviews_player_recent
  ON junior_development_reviews(player_id, reviewed_at DESC)
  WHERE parent_visible = true;

-- junior_milestones.
CREATE INDEX IF NOT EXISTS idx_junior_milestones_player ON junior_milestones(player_id);
CREATE INDEX IF NOT EXISTS idx_junior_milestones_club   ON junior_milestones(club_id);
-- Parent app: "show my child's milestones newest first".
CREATE INDEX IF NOT EXISTS idx_junior_milestones_player_recent
  ON junior_milestones(player_id, achieved_at DESC);

-- ─── updated_at TRIGGERS ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_junior_skills_framework_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_skills_framework_updated_at ON junior_skills_framework;
CREATE TRIGGER trg_junior_skills_framework_updated_at
  BEFORE UPDATE ON junior_skills_framework
  FOR EACH ROW EXECUTE FUNCTION update_junior_skills_framework_updated_at();

CREATE OR REPLACE FUNCTION update_junior_development_reviews_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_development_reviews_updated_at ON junior_development_reviews;
CREATE TRIGGER trg_junior_development_reviews_updated_at
  BEFORE UPDATE ON junior_development_reviews
  FOR EACH ROW EXECUTE FUNCTION update_junior_development_reviews_updated_at();

CREATE OR REPLACE FUNCTION update_junior_milestones_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_milestones_updated_at ON junior_milestones;
CREATE TRIGGER trg_junior_milestones_updated_at
  BEFORE UPDATE ON junior_milestones
  FOR EACH ROW EXECUTE FUNCTION update_junior_milestones_updated_at();

-- ─── FORCE-CLUB-ID TRIGGERS ──────────────────────────────────────────────
-- junior_skills_framework has NO club_id and gets no force trigger. The
-- two player-keyed tables reuse 099's function.

DROP TRIGGER IF EXISTS trg_junior_development_reviews_force_club_id ON junior_development_reviews;
CREATE TRIGGER trg_junior_development_reviews_force_club_id
  BEFORE INSERT OR UPDATE ON junior_development_reviews
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player();

DROP TRIGGER IF EXISTS trg_junior_milestones_force_club_id ON junior_milestones;
CREATE TRIGGER trg_junior_milestones_force_club_id
  BEFORE INSERT OR UPDATE ON junior_milestones
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player();

-- ─── RLS ──────────────────────────────────────────────────────────────────

-- ── junior_skills_framework ──────────────────────────────────────────────
-- RLS enabled. SELECT open to any authenticated user — the catalogue is
-- a reference every junior portal session needs. WRITES INTENTIONALLY
-- NOT POLICY-COVERED — RLS enabled + no INSERT/UPDATE/DELETE policy
-- denies all writes to anon and authenticated roles. service_role
-- bypasses RLS and seeds / maintains the catalogue out-of-band.
--
-- See the table-level comment above for the cross-tenant rationale and
-- the documented future path (source + created_by_club_id columns for
-- per-club skill extensions).
ALTER TABLE junior_skills_framework ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read skills framework" ON junior_skills_framework;
CREATE POLICY "Authenticated users read skills framework"
  ON junior_skills_framework FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── junior_development_reviews ───────────────────────────────────────────
-- Staff always see. Guardians see their own child's review ONLY when
-- parent_visible = true — lets a coach hold a draft back until the
-- review is signed off by the Academy Lead.
ALTER TABLE junior_development_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff + visible-to-guardian read reviews" ON junior_development_reviews;
CREATE POLICY "Staff + visible-to-guardian read reviews"
  ON junior_development_reviews FOR SELECT
  USING (
    club_id IN (SELECT * FROM junior_staff_club_ids())
    OR (
      player_id IN (SELECT * FROM junior_guardian_player_ids())
      AND parent_visible = true
    )
  );

DROP POLICY IF EXISTS "Coach + academy lead manage reviews" ON junior_development_reviews;
CREATE POLICY "Coach + academy lead manage reviews"
  ON junior_development_reviews FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('coach','academy_lead')
    )
  )
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('coach','academy_lead')
    )
  );

-- ── junior_milestones ────────────────────────────────────────────────────
-- Staff see all club milestones; guardians see their own child's.
-- Coach + academy_lead write (no chairman per spec — chairs don't
-- author player development records).
ALTER TABLE junior_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff + guardians read milestones" ON junior_milestones;
CREATE POLICY "Junior staff + guardians read milestones"
  ON junior_milestones FOR SELECT
  USING (
    club_id IN (SELECT * FROM junior_staff_club_ids())
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );

DROP POLICY IF EXISTS "Coach + academy lead manage milestones" ON junior_milestones;
CREATE POLICY "Coach + academy lead manage milestones"
  ON junior_milestones FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('coach','academy_lead')
    )
  )
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('coach','academy_lead')
    )
  );
