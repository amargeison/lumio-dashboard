-- supabase/migrations/101_junior_fixtures.sql
-- Workstream B / Migration 101 — Lumio Junior Football fixtures + availability.
--
-- Builds on 099 + 100:
--   - Reuses helper functions: junior_staff_club_ids,
--     junior_guardian_player_ids (both 099)
--   - Reuses trigger function: junior_force_club_id_from_player (099) —
--     for junior_availability whose club_id is forced from a non-null
--     player_id
--   - Adds TWO new functions:
--       * junior_force_club_id_from_team() — for junior_fixtures, whose
--         club_id is forced from junior_teams.club_id (team-keyed). The
--         099 player-keyed and 100 membership-keyed variants don't fit
--         structurally.
--       * junior_guardian_team_ids() — SECURITY DEFINER STABLE helper
--         returning the set of team_ids that contain at least one of the
--         current user's guardian-linked children. Routes the guardian
--         fixtures-read path through a definer-rights helper, consistent
--         with every other authorization predicate in 099/100. B4–B6 can
--         reuse it for any team-scoped guardian read.
--
-- Two tables, three ENUMs. Pattern from 099/100 throughout: UUID PKs,
-- per-table updated_at trigger (drop-then-create), RLS enabled in this
-- migration, policies in this migration, role_template (+ status='active')
-- gating throughout, all FKs indexed.

-- ─── ENUMs ────────────────────────────────────────────────────────────────
-- Guarded with the DO $$ ... duplicate_object ... $$ pattern from
-- 091/092/098/099/100 for idempotent re-runs.

DO $$ BEGIN
  CREATE TYPE junior_event_type AS ENUM (
    'match', 'training', 'festival', 'tournament'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE junior_home_away AS ENUM (
    'home', 'away'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE junior_availability_status AS ENUM (
    'yes', 'no', 'maybe', 'no_response'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TABLES ───────────────────────────────────────────────────────────────

-- junior_fixtures — matches, training sessions, festivals, tournaments.
-- Keyed off junior_teams. club_id is denormalised from junior_teams.club_id
-- for RLS efficiency; the new junior_force_club_id_from_team trigger
-- below overwrites NEW.club_id with the team's club_id on every
-- INSERT/UPDATE.
--
-- home_away is nullable because not every event is a competitive fixture
-- (training, internal festival days). result_for / result_against are
-- nullable because they're not known until the event has been played.
-- No CHECK constraint on event_type vs nullable columns — app-layer
-- validation owns that.
CREATE TABLE IF NOT EXISTS junior_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL REFERENCES junior_teams(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  event_type        junior_event_type NOT NULL,
  opponent          TEXT,
  venue             TEXT,
  kickoff_at        TIMESTAMPTZ NOT NULL,
  duration_minutes  INT,
  home_away         junior_home_away,

  result_for        INT,
  result_against    INT,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- junior_availability — one row per (fixture, player) pair. Status defaults
-- to 'no_response' so a fresh fixture creates rows in 'no_response' state
-- and parents flip them as they respond. responded_by_membership_id
-- captures whoever flipped it (typically the guardian, sometimes a coach
-- on the parent's behalf).
--
-- club_id is denormalised from junior_players.club_id; the existing 099
-- junior_force_club_id_from_player trigger handles this exactly as it
-- does for junior_consent. junior_players.club_id is immutable (099) so
-- no drift is possible.
CREATE TABLE IF NOT EXISTS junior_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  fixture_id UUID NOT NULL REFERENCES junior_fixtures(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES junior_players(id) ON DELETE CASCADE,
  club_id    UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  status      junior_availability_status NOT NULL DEFAULT 'no_response',

  responded_by_membership_id UUID REFERENCES sports_memberships(id) ON DELETE SET NULL,
  responded_at               TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One availability row per (fixture, player) pair. Re-responses
  -- overwrite via UPDATE.
  UNIQUE (fixture_id, player_id)
);

-- ─── NEW HELPER FUNCTIONS ─────────────────────────────────────────────────

-- junior_force_club_id_from_team — mirrors the 100 membership variant
-- exactly. Required for junior_fixtures (team-keyed denormalised
-- club_id). Raises if team_id doesn't exist; pins NEW.club_id from the
-- referenced team. junior_teams.club_id is practically immutable (no
-- team moves clubs), so no drift is possible.
CREATE OR REPLACE FUNCTION junior_force_club_id_from_team()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
  DECLARE
    team_club UUID;
  BEGIN
    SELECT club_id INTO team_club
    FROM junior_teams
    WHERE id = NEW.team_id;

    IF team_club IS NULL THEN
      RAISE EXCEPTION
        'junior_force_club_id_from_team: team_id % does not exist in junior_teams',
        NEW.team_id;
    END IF;

    NEW.club_id := team_club;
    RETURN NEW;
  END;
$$;

-- junior_guardian_team_ids — SECURITY DEFINER STABLE helper returning the
-- set of team_ids that contain at least one of the current user's
-- guardian-linked children. Used by the junior_fixtures SELECT policy
-- (guardian read path) and available for B4–B6 to reuse for any
-- team-scoped guardian read.
--
-- Gated identically to junior_guardian_player_ids (099):
-- role_template = 'parent_guardian' AND status='active'. team_id IS NOT
-- NULL is enforced so a guardian's child with no current team
-- assignment doesn't produce a NULL in the result set.
--
-- DISTINCT — a guardian with two children on the same team should see
-- that team_id once, not twice.
CREATE OR REPLACE FUNCTION junior_guardian_team_ids()
  RETURNS SETOF UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT DISTINCT p.team_id
  FROM junior_players p
  JOIN junior_guardianships g ON g.player_id = p.id
  JOIN sports_memberships m  ON m.id = g.guardian_membership_id
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
    AND m.role_template = 'parent_guardian'
    AND p.team_id IS NOT NULL;
$$;

-- ─── INDEXES ──────────────────────────────────────────────────────────────
-- Every FK column gets a B-tree index. UNIQUE constraints provide their
-- leading-column index implicitly.

-- junior_fixtures.
CREATE INDEX IF NOT EXISTS idx_junior_fixtures_team    ON junior_fixtures(team_id);
CREATE INDEX IF NOT EXISTS idx_junior_fixtures_club    ON junior_fixtures(club_id);
-- Hot path: "upcoming fixtures for this club" in date order. A composite
-- (club_id, kickoff_at) supports both club-level and team-level scans
-- ordered by kickoff time.
CREATE INDEX IF NOT EXISTS idx_junior_fixtures_kickoff ON junior_fixtures(club_id, kickoff_at);

-- junior_availability. fixture_id is the leading column of the UNIQUE
-- on (fixture_id, player_id), so its lookup is already indexed. Add
-- player_id + club_id explicitly.
CREATE INDEX IF NOT EXISTS idx_junior_availability_player ON junior_availability(player_id);
CREATE INDEX IF NOT EXISTS idx_junior_availability_club   ON junior_availability(club_id);
CREATE INDEX IF NOT EXISTS idx_junior_availability_responded_by
  ON junior_availability(responded_by_membership_id)
  WHERE responded_by_membership_id IS NOT NULL;
-- Coach rollup: "how many no_response are still outstanding for this fixture?"
CREATE INDEX IF NOT EXISTS idx_junior_availability_unanswered
  ON junior_availability(fixture_id)
  WHERE status = 'no_response';

-- ─── updated_at TRIGGERS ──────────────────────────────────────────────────
-- Verbatim pattern from 091/092/099/100 — one function per table.

CREATE OR REPLACE FUNCTION update_junior_fixtures_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_fixtures_updated_at ON junior_fixtures;
CREATE TRIGGER trg_junior_fixtures_updated_at
  BEFORE UPDATE ON junior_fixtures
  FOR EACH ROW EXECUTE FUNCTION update_junior_fixtures_updated_at();

CREATE OR REPLACE FUNCTION update_junior_availability_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_availability_updated_at ON junior_availability;
CREATE TRIGGER trg_junior_availability_updated_at
  BEFORE UPDATE ON junior_availability
  FOR EACH ROW EXECUTE FUNCTION update_junior_availability_updated_at();

-- ─── FORCE-CLUB-ID TRIGGERS ──────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_junior_fixtures_force_club_id ON junior_fixtures;
CREATE TRIGGER trg_junior_fixtures_force_club_id
  BEFORE INSERT OR UPDATE ON junior_fixtures
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_team();

DROP TRIGGER IF EXISTS trg_junior_availability_force_club_id ON junior_availability;
CREATE TRIGGER trg_junior_availability_force_club_id
  BEFORE INSERT OR UPDATE ON junior_availability
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player();

-- ─── RLS ──────────────────────────────────────────────────────────────────

-- ── junior_fixtures ──────────────────────────────────────────────────────
-- SELECT: staff see all fixtures for clubs they're staff at; guardians
-- see fixtures for any team that contains one of their children — routed
-- through the new junior_guardian_team_ids() helper so every junior RLS
-- predicate consistently flows through a SECURITY DEFINER function.
--
-- WRITE: chairman / coach / team_manager of the club. Welfare officers
-- and academy leads have no write path to fixtures; if they need a
-- session set up they liaise with the team manager or coach. Inline
-- predicate, consistent with the 099 junior_teams / junior_players
-- write policies.
ALTER TABLE junior_fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff + guardians read fixtures" ON junior_fixtures;
CREATE POLICY "Junior staff + guardians read fixtures"
  ON junior_fixtures FOR SELECT
  USING (
    club_id IN (SELECT * FROM junior_staff_club_ids())
    OR team_id IN (SELECT * FROM junior_guardian_team_ids())
  );

DROP POLICY IF EXISTS "Junior team-writers manage fixtures" ON junior_fixtures;
CREATE POLICY "Junior team-writers manage fixtures"
  ON junior_fixtures FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('chairman','coach','team_manager')
    )
  )
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('chairman','coach','team_manager')
    )
  );

-- ── junior_availability ──────────────────────────────────────────────────
-- Dual-writer (chairman/coach/team_manager OR guardian-for-own-child) —
-- staff write set widened to include chairman (per review decision), so
-- the staff write predicate matches junior_fixtures exactly. Coherent
-- with the typical small-club shape where the chairman runs a team
-- when no coach/team_manager is assigned; locking the chair out of
-- availability while letting them write fixtures would be an incoherent
-- gap.
--
-- welfare_officer and academy_lead deliberately have NO write path to
-- availability — operational matchday concerns, not their remit.
--
-- Three policies: SELECT (broad) + FOR INSERT (dual-writer) + FOR
-- UPDATE (dual-writer). DELETE deliberately not covered — availability
-- rows are owned by the (fixture, player) pair and cascade-deleted when
-- either is removed.
ALTER TABLE junior_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff + guardians read availability" ON junior_availability;
CREATE POLICY "Junior staff + guardians read availability"
  ON junior_availability FOR SELECT
  USING (
    club_id IN (SELECT * FROM junior_staff_club_ids())
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );

DROP POLICY IF EXISTS "Team-writers or guardian create availability" ON junior_availability;
CREATE POLICY "Team-writers or guardian create availability"
  ON junior_availability FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('chairman','coach','team_manager')
    )
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );

DROP POLICY IF EXISTS "Team-writers or guardian update availability" ON junior_availability;
CREATE POLICY "Team-writers or guardian update availability"
  ON junior_availability FOR UPDATE
  USING (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('chairman','coach','team_manager')
    )
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  )
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('chairman','coach','team_manager')
    )
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );
