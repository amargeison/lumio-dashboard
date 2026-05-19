-- supabase/migrations/099_junior_core.sql
-- Workstream B / Migration 099 — Lumio Junior Football core club structure +
-- RLS helpers + safeguarding-restricted notes table.
--
-- Pattern-setter for B2–B6. The helper functions below are the canonical
-- predicates every later junior_* table's RLS policies will gate on.
--
-- ROLE COLUMN — read carefully. sports_memberships has TWO role columns:
--   - role          (ENUM admin/manager/member/viewer) — coarse access tier.
--                   DO NOT use for junior gating. 095/096 gate on it, but it
--                   has no concept of chairman/coach/welfare_officer/etc.
--   - role_template (TEXT, nullable, no CHECK/FK) — free-text role-template
--                   id matching src/lib/sports/role-templates.ts. THIS is the
--                   column every junior policy and helper below gates on.
--
-- A NULL role_template must match nothing. NULL IN (...) already evaluates
-- to NULL (treated as false in WHERE), but every predicate carries an
-- explicit role_template IS NOT NULL as belt-and-braces.
--
-- SAFEGUARDING BOUNDARY — three layers of defence:
--   1. junior_guardian_player_ids() is gated on role_template =
--      'parent_guardian'. Fails closed if the user's membership has moved
--      off the parent role.
--   2. junior_player_restrictions is a welfare-only sidecar to
--      junior_players for sensitive notes (court-order refs etc.) — RLS
--      cannot express column visibility, so the column is in a separate
--      table with welfare-only access.
--   3. junior_guardianships.club_id and junior_player_restrictions.club_id
--      are denormalised from junior_players.club_id for RLS efficiency;
--      a BEFORE trigger FORCES them to match the player's club_id, and a
--      separate trigger on junior_players makes club_id IMMUTABLE — so
--      the dependent rows can never silently drift out of sync.

-- ─── TABLES ───────────────────────────────────────────────────────────────
-- Tables first, then functions (which reference these tables). Indexes,
-- triggers and RLS follow.

-- junior_teams — age-band teams within a club. One club runs many.
CREATE TABLE IF NOT EXISTS junior_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  name TEXT NOT NULL,                       -- 'U11 Lions'
  age_band TEXT NOT NULL,                   -- 'U7'..'U16'; CHECK in a later
                                            -- migration once catalogue settles
  capacity INT,                             -- typical squad cap (12–16); nullable

  lead_coach_membership_id    UUID REFERENCES sports_memberships(id) ON DELETE SET NULL,
  team_manager_membership_id  UUID REFERENCES sports_memberships(id) ON DELETE SET NULL,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (club_id, name)
);

-- junior_players — `restricted` is the safeguarding chokepoint flag visible
-- to every role that can see the player (needed for imagery rules).
-- The SENSITIVE detail (court-order references, reason for restriction)
-- lives in junior_player_restrictions (welfare-only).
--
-- club_id is IMMUTABLE — enforced by a BEFORE UPDATE trigger below. A
-- player moving club is a delete-and-recreate, not an update.
CREATE TABLE IF NOT EXISTS junior_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,
  team_id UUID REFERENCES junior_teams(id) ON DELETE SET NULL,

  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  date_of_birth DATE NOT NULL,

  shirt_number INT,
  position     TEXT,            -- 'GK' / 'DEF' / 'MID' / 'FWD' — free-form

  -- Safeguarding restriction FLAG. When true, imagery is auto-excluded
  -- across all portal surfaces. The reason / notes live in
  -- junior_player_restrictions (welfare-only). The flag itself is visible
  -- to anyone who can see the player — coaches need it to honour imagery
  -- rules at selection time, even though they can't see why.
  restricted BOOLEAN NOT NULL DEFAULT false,

  joined_at DATE DEFAULT CURRENT_DATE,

  -- B7 seeds demo clubs into the live tables; this flag lets a later
  -- cleanup step delete demo rows safely without touching real data.
  demo_flag BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- junior_player_restrictions — welfare-officer-only sensitive notes for any
-- player with restricted = true. One row per player (UNIQUE on player_id).
-- RLS gates BOTH read and write to junior_welfare_club_ids() — coaches,
-- team managers, academy leads, parents and the players themselves never
-- see this table.
--
-- The `restricted` flag on junior_players is the visible chokepoint; this
-- table is the audit trail (court-order references, originating
-- safeguarding lead, the reason). Splitting it out of junior_players is
-- the only way to express column-level visibility for sensitive content
-- inside Postgres RLS.
--
-- restriction_notes is NOT NULL — a row in this table represents a
-- DOCUMENTED restriction. The "flag set, notes pending" state is
-- represented by junior_players.restricted = true with NO row in this
-- table yet.
CREATE TABLE IF NOT EXISTS junior_player_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  player_id UUID NOT NULL UNIQUE REFERENCES junior_players(id) ON DELETE CASCADE,
  club_id   UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  restriction_notes TEXT NOT NULL,   -- court-order ref, reason, context

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- junior_guardianships — parent → child link. Links a guardian's
-- sports_memberships row to a junior_players row. club_id is denormalised
-- from junior_players.club_id for RLS efficiency; a BEFORE INSERT OR
-- UPDATE trigger FORCES it to match the player's club_id (see
-- junior_force_club_id_from_player below).
CREATE TABLE IF NOT EXISTS junior_guardianships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  guardian_membership_id UUID NOT NULL REFERENCES sports_memberships(id) ON DELETE CASCADE,
  player_id              UUID NOT NULL REFERENCES junior_players(id) ON DELETE CASCADE,
  club_id                UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  relationship    TEXT NOT NULL,   -- 'mother' / 'father' / 'guardian' / 'carer' / 'kin'
  primary_contact BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (guardian_membership_id, player_id)
);

-- ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────
-- All helpers: SECURITY DEFINER, STABLE, SET search_path = public.
--   SECURITY DEFINER — read sports_memberships / junior_guardianships
--                      without recursive RLS evaluation.
--   STABLE          — auth.uid() is stable within a statement; result
--                     can be cached across rows.
--   search_path     — defends against search_path injection. auth.uid()
--                     and table names are fully qualified by schema where
--                     ambiguity could exist.

CREATE OR REPLACE FUNCTION junior_staff_club_ids()
  RETURNS SETOF UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT club_id
  FROM sports_memberships
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND role_template IS NOT NULL
    AND role_template IN ('chairman','coach','team_manager','welfare_officer','academy_lead');
$$;

CREATE OR REPLACE FUNCTION junior_welfare_club_ids()
  RETURNS SETOF UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT club_id
  FROM sports_memberships
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND role_template IS NOT NULL
    AND role_template IN ('chairman','welfare_officer');
$$;

-- Returns the set of player_ids the current user is a guardian of.
--
-- Gated on role_template = 'parent_guardian'. Fails closed if the user's
-- membership has moved off the parent role. A stale guardianship row on a
-- membership whose role_template is now 'coach' (or anything else)
-- returns ZERO rows from this function — guardian-path access requires
-- currently and actively holding the parent_guardian role. (Staff-path
-- access for that user would still come via junior_staff_club_ids if
-- applicable.)
CREATE OR REPLACE FUNCTION junior_guardian_player_ids()
  RETURNS SETOF UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT g.player_id
  FROM junior_guardianships g
  JOIN sports_memberships m ON m.id = g.guardian_membership_id
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
    AND m.role_template = 'parent_guardian';
$$;

-- Trigger function — FORCES the row's club_id to match the referenced
-- junior_players.club_id. Used by both junior_guardianships and
-- junior_player_restrictions (their club_id columns are denormalised for
-- RLS efficiency; mismatch silently breaks the safeguarding boundary, so
-- we don't trust the caller).
--
-- Runs SECURITY DEFINER so the trigger can read junior_players regardless
-- of the invoker's RLS visibility (e.g. a parent_guardian who is allowed
-- to insert a restriction row on their own child still needs the trigger
-- to read junior_players.club_id — though in practice writes to these
-- tables come from welfare-eligible roles).
--
-- Cascading drift CANNOT happen: junior_players.club_id is enforced
-- IMMUTABLE by trg_junior_players_immutable_club_id below. The only way
-- to move a player to a different club is delete-and-recreate, which
-- cascades through the FKs and brings the dependent rows with it. So
-- this trigger only needs to fire on INSERT/UPDATE of guardianship /
-- restriction rows, not on changes to junior_players.
CREATE OR REPLACE FUNCTION junior_force_club_id_from_player()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
  DECLARE
    player_club UUID;
  BEGIN
    SELECT club_id INTO player_club
    FROM junior_players
    WHERE id = NEW.player_id;

    IF player_club IS NULL THEN
      RAISE EXCEPTION
        'junior_force_club_id_from_player: player_id % does not exist in junior_players',
        NEW.player_id;
    END IF;

    NEW.club_id := player_club;
    RETURN NEW;
  END;
$$;

-- Trigger function — enforces junior_players.club_id immutability. A
-- player moving club is modelled as delete-and-recreate; allowing
-- club_id to change would orphan denormalised club_id values on
-- junior_guardianships and junior_player_restrictions, silently breaking
-- the safeguarding boundary. This trigger makes that impossible at the
-- database layer.
CREATE OR REPLACE FUNCTION junior_players_prevent_club_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
  BEGIN
    IF NEW.club_id IS DISTINCT FROM OLD.club_id THEN
      RAISE EXCEPTION
        'junior_players.club_id is immutable. Player % cannot move from club % to club %. To re-register a player at a different club, delete and recreate the row (FK cascades will bring dependents).',
        NEW.id, OLD.club_id, NEW.club_id;
    END IF;
    RETURN NEW;
  END;
$$;

-- ─── INDEXES ──────────────────────────────────────────────────────────────
-- Every FK column gets a B-tree index. UNIQUE constraints provide the
-- leading-column index implicitly; we add the rest.

CREATE INDEX IF NOT EXISTS idx_junior_teams_club          ON junior_teams(club_id);
CREATE INDEX IF NOT EXISTS idx_junior_teams_lead_coach    ON junior_teams(lead_coach_membership_id)
  WHERE lead_coach_membership_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_junior_teams_team_manager  ON junior_teams(team_manager_membership_id)
  WHERE team_manager_membership_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_junior_players_club        ON junior_players(club_id);
CREATE INDEX IF NOT EXISTS idx_junior_players_team        ON junior_players(team_id)
  WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_junior_players_restricted  ON junior_players(club_id)
  WHERE restricted = true;

-- player_id is the UNIQUE leading column on junior_player_restrictions, so
-- its lookup is already indexed. club_id needs its own index for RLS.
CREATE INDEX IF NOT EXISTS idx_junior_player_restrictions_club ON junior_player_restrictions(club_id);

-- guardian_membership_id is the leading column of the UNIQUE constraint
-- on junior_guardianships, so its lookup is already covered. Add
-- player_id + club_id explicitly.
CREATE INDEX IF NOT EXISTS idx_junior_guardianships_player ON junior_guardianships(player_id);
CREATE INDEX IF NOT EXISTS idx_junior_guardianships_club   ON junior_guardianships(club_id);

-- ─── updated_at TRIGGERS ──────────────────────────────────────────────────
-- Verbatim pattern from 091/092 — one function per table, drop-then-create.

CREATE OR REPLACE FUNCTION update_junior_teams_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_teams_updated_at ON junior_teams;
CREATE TRIGGER trg_junior_teams_updated_at
  BEFORE UPDATE ON junior_teams
  FOR EACH ROW EXECUTE FUNCTION update_junior_teams_updated_at();

CREATE OR REPLACE FUNCTION update_junior_players_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_players_updated_at ON junior_players;
CREATE TRIGGER trg_junior_players_updated_at
  BEFORE UPDATE ON junior_players
  FOR EACH ROW EXECUTE FUNCTION update_junior_players_updated_at();

CREATE OR REPLACE FUNCTION update_junior_player_restrictions_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_player_restrictions_updated_at ON junior_player_restrictions;
CREATE TRIGGER trg_junior_player_restrictions_updated_at
  BEFORE UPDATE ON junior_player_restrictions
  FOR EACH ROW EXECUTE FUNCTION update_junior_player_restrictions_updated_at();

CREATE OR REPLACE FUNCTION update_junior_guardianships_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_guardianships_updated_at ON junior_guardianships;
CREATE TRIGGER trg_junior_guardianships_updated_at
  BEFORE UPDATE ON junior_guardianships
  FOR EACH ROW EXECUTE FUNCTION update_junior_guardianships_updated_at();

-- ─── FORCE-CLUB-ID TRIGGERS ──────────────────────────────────────────────
-- BEFORE INSERT OR UPDATE (any column) on junior_guardianships and
-- junior_player_restrictions. Always overwrites NEW.club_id with the
-- referenced junior_players.club_id. App code cannot pass a wrong value;
-- silent RLS-boundary drift is impossible.

DROP TRIGGER IF EXISTS trg_junior_guardianships_force_club_id ON junior_guardianships;
CREATE TRIGGER trg_junior_guardianships_force_club_id
  BEFORE INSERT OR UPDATE ON junior_guardianships
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player();

DROP TRIGGER IF EXISTS trg_junior_player_restrictions_force_club_id ON junior_player_restrictions;
CREATE TRIGGER trg_junior_player_restrictions_force_club_id
  BEFORE INSERT OR UPDATE ON junior_player_restrictions
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player();

-- ─── IMMUTABILITY TRIGGER ─────────────────────────────────────────────────
-- junior_players.club_id is enforced immutable. Combined with the
-- force-club-id triggers above, this guarantees the denormalised club_id
-- on junior_guardianships and junior_player_restrictions can never drift
-- out of sync with the player's club_id — the only way to "move" a
-- player to a different club is delete-and-recreate, which cascades
-- through the FKs and removes the dependent rows in lockstep.

DROP TRIGGER IF EXISTS trg_junior_players_immutable_club_id ON junior_players;
CREATE TRIGGER trg_junior_players_immutable_club_id
  BEFORE UPDATE ON junior_players
  FOR EACH ROW EXECUTE FUNCTION junior_players_prevent_club_change();

-- ─── RLS ──────────────────────────────────────────────────────────────────
-- All four junior_* tables have RLS enabled in this migration with policies
-- defined immediately below (same-migration grouping confirmed in review).
--
-- Policy pattern (3 of 4 tables):
--   - 1 FOR SELECT policy with the broader read predicate
--   - 1 FOR ALL policy with the narrower write predicate (USING + WITH CHECK)
--
-- junior_player_restrictions departs from this pattern: SELECT and write
-- share the SAME predicate (welfare-only), so it gets a single FOR ALL
-- policy that covers both. No reader is permitted who isn't also a writer.

-- ── junior_teams ─────────────────────────────────────────────────────────
ALTER TABLE junior_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff read teams" ON junior_teams;
CREATE POLICY "Junior staff read teams"
  ON junior_teams FOR SELECT
  USING (club_id IN (SELECT * FROM junior_staff_club_ids()));

DROP POLICY IF EXISTS "Junior team-writers manage teams" ON junior_teams;
CREATE POLICY "Junior team-writers manage teams"
  ON junior_teams FOR ALL
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

-- ── junior_players ───────────────────────────────────────────────────────
ALTER TABLE junior_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff + guardians read players" ON junior_players;
CREATE POLICY "Junior staff + guardians read players"
  ON junior_players FOR SELECT
  USING (
    club_id IN (SELECT * FROM junior_staff_club_ids())
    OR id IN (SELECT * FROM junior_guardian_player_ids())
  );

DROP POLICY IF EXISTS "Junior team-writers manage players" ON junior_players;
CREATE POLICY "Junior team-writers manage players"
  ON junior_players FOR ALL
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

-- ── junior_player_restrictions ───────────────────────────────────────────
-- Welfare-only access. Single FOR ALL policy: same predicate gates SELECT,
-- INSERT, UPDATE and DELETE. Coaches, team managers, academy leads,
-- parents and the players themselves see nothing — not even via the
-- staff or guardian path. This is the most-restricted table in the
-- junior schema, deliberately.
ALTER TABLE junior_player_restrictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Welfare-eligible access restrictions" ON junior_player_restrictions;
CREATE POLICY "Welfare-eligible access restrictions"
  ON junior_player_restrictions FOR ALL
  USING (club_id IN (SELECT * FROM junior_welfare_club_ids()))
  WITH CHECK (club_id IN (SELECT * FROM junior_welfare_club_ids()));

-- ── junior_guardianships ─────────────────────────────────────────────────
ALTER TABLE junior_guardianships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff + guardians read guardianships" ON junior_guardianships;
CREATE POLICY "Junior staff + guardians read guardianships"
  ON junior_guardianships FOR SELECT
  USING (
    club_id IN (SELECT * FROM junior_staff_club_ids())
    OR EXISTS (
      SELECT 1 FROM sports_memberships m
      WHERE m.id = guardian_membership_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role_template = 'parent_guardian'
    )
  );

DROP POLICY IF EXISTS "Welfare-eligible manage guardianships" ON junior_guardianships;
CREATE POLICY "Welfare-eligible manage guardianships"
  ON junior_guardianships FOR ALL
  USING (club_id IN (SELECT * FROM junior_welfare_club_ids()))
  WITH CHECK (club_id IN (SELECT * FROM junior_welfare_club_ids()));
