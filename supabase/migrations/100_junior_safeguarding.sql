-- supabase/migrations/100_junior_safeguarding.sql
-- Workstream B / Migration 100 — Lumio Junior Football safeguarding tables.
--
-- Builds on 099_junior_core.sql:
--   - Reuses helper functions: junior_staff_club_ids,
--     junior_welfare_club_ids, junior_guardian_player_ids
--   - Reuses trigger function: junior_force_club_id_from_player (for
--     junior_consent, whose club_id is forced from a non-null player_id)
--   - Adds TWO new force-club-id trigger functions where 099's doesn't
--     structurally fit:
--       * junior_force_club_id_from_membership() — for junior_dbs, which
--         keys off sports_memberships (no player involved)
--       * junior_force_club_id_from_player_if_present() — for
--         junior_safeguarding_incidents, where player_id is nullable
--         (spectator / opposition / club-wide incidents must be loggable)
--
-- Three tables, three ENUMs. Pattern from 099 throughout: UUID PKs,
-- per-table updated_at trigger (drop-then-create), RLS enabled in this
-- migration, policies in this migration, role_template (+ status='active')
-- gating throughout, all FKs indexed.

-- ─── ENUMs ────────────────────────────────────────────────────────────────
-- Guarded with the DO $$ ... duplicate_object ... $$ pattern from
-- 091/092/098/099 for idempotent re-runs.

DO $$ BEGIN
  CREATE TYPE junior_dbs_status AS ENUM (
    'valid', 'pending', 'expired', 'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE junior_incident_severity AS ENUM (
    'low', 'medium', 'high', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE junior_incident_status AS ENUM (
    'open', 'under_review', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TABLES ───────────────────────────────────────────────────────────────

-- junior_consent — one row per child (UNIQUE on player_id). Booleans for
-- each consent category; consented_by_membership_id records who signed
-- (typically a guardian's membership). expiry drives annual-renewal UX
-- and reporting.
--
-- club_id is denormalised from junior_players.club_id for RLS efficiency;
-- a BEFORE INSERT OR UPDATE trigger reuses 099's
-- junior_force_club_id_from_player to overwrite NEW.club_id with the
-- player's club_id. Combined with junior_players.club_id being immutable
-- (099 trigger), no drift is possible.
CREATE TABLE IF NOT EXISTS junior_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  player_id UUID NOT NULL UNIQUE REFERENCES junior_players(id) ON DELETE CASCADE,
  club_id   UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  photo_consent        BOOLEAN NOT NULL DEFAULT false,
  film_consent         BOOLEAN NOT NULL DEFAULT false,
  data_sharing_consent BOOLEAN NOT NULL DEFAULT false,
  transport_consent    BOOLEAN NOT NULL DEFAULT false,
  medical_consent      BOOLEAN NOT NULL DEFAULT false,

  -- Who signed the consent. Typically a guardian's sports_memberships
  -- row; ON DELETE SET NULL preserves the audit trail if the membership
  -- is later removed.
  consented_by_membership_id UUID REFERENCES sports_memberships(id) ON DELETE SET NULL,

  consented_at TIMESTAMPTZ DEFAULT NOW(),
  renewed_at   TIMESTAMPTZ,                  -- nullable: never renewed = original still in force
  expiry       DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year')::DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- junior_dbs — DBS records for staff/volunteers. Tracks STATUS + DATES
-- only — no certificate number column per spec. verified_by_membership_id
-- captures the welfare officer / chair who confirmed it.
--
-- club_id is denormalised from sports_memberships.club_id; the new
-- junior_force_club_id_from_membership trigger overwrites NEW.club_id
-- with the membership's club_id on every INSERT/UPDATE.
CREATE TABLE IF NOT EXISTS junior_dbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  membership_id UUID NOT NULL REFERENCES sports_memberships(id) ON DELETE CASCADE,
  club_id       UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  status      junior_dbs_status NOT NULL DEFAULT 'pending',
  issued_at   DATE,           -- nullable: 'pending' / 'none' have no issue date
  expires_at  DATE,           -- nullable for the same reason

  verified_by_membership_id UUID REFERENCES sports_memberships(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One DBS row per staff/volunteer membership. Renewals overwrite the
  -- same row (with status flipping back from 'expired' to 'valid' and
  -- new dates). History lives in a separate audit table if needed —
  -- not in scope for this migration.
  UNIQUE (membership_id)
);

-- junior_safeguarding_incidents — concerns, allegations, first-aid entries
-- and referrals. player_id is nullable (some incidents are club-wide or
-- about a spectator / opposition rather than a specific player). When set,
-- club_id is forced from the player. When null, club_id stays as caller-
-- provided (and RLS WITH CHECK ensures it's a club the caller is
-- welfare-eligible for).
--
-- The most restricted table in the junior schema after
-- junior_player_restrictions — single FOR ALL policy gated to
-- junior_welfare_club_ids() for SELECT and write alike.
CREATE TABLE IF NOT EXISTS junior_safeguarding_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,
  reported_by_membership_id UUID REFERENCES sports_memberships(id) ON DELETE SET NULL,
  player_id UUID REFERENCES junior_players(id) ON DELETE SET NULL,

  severity junior_incident_severity NOT NULL,
  category TEXT NOT NULL,        -- free-form: 'matchday', 'training', 'allegation',
                                  -- 'first-aid', 'referral', 'sideline-conduct' etc.
  summary  TEXT NOT NULL,
  status   junior_incident_status NOT NULL DEFAULT 'open',

  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NEW HELPER FUNCTIONS ─────────────────────────────────────────────────
-- 099 introduced junior_force_club_id_from_player. Migration 100 needs two
-- new variants because the source of club_id differs per table:
--   - junior_dbs derives club_id from a membership (no player involved).
--   - junior_safeguarding_incidents has a NULLABLE player_id, so the 099
--     function (which RAISES on NULL) can't be reused as-is.

-- Force NEW.club_id from sports_memberships.club_id. Raises if
-- membership_id doesn't exist. Mirrors the 099 pattern.
CREATE OR REPLACE FUNCTION junior_force_club_id_from_membership()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
  DECLARE
    membership_club UUID;
  BEGIN
    SELECT club_id INTO membership_club
    FROM sports_memberships
    WHERE id = NEW.membership_id;

    IF membership_club IS NULL THEN
      RAISE EXCEPTION
        'junior_force_club_id_from_membership: membership_id % does not exist in sports_memberships',
        NEW.membership_id;
    END IF;

    NEW.club_id := membership_club;
    RETURN NEW;
  END;
$$;

-- Conditional variant: if NEW.player_id IS NULL, leave NEW.club_id as
-- caller-provided (RLS WITH CHECK still gates whether the caller may
-- write to that club). If NEW.player_id IS NOT NULL, force from the
-- player as in 099 — raise if the player doesn't exist.
CREATE OR REPLACE FUNCTION junior_force_club_id_from_player_if_present()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
  DECLARE
    player_club UUID;
  BEGIN
    IF NEW.player_id IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT club_id INTO player_club
    FROM junior_players
    WHERE id = NEW.player_id;

    IF player_club IS NULL THEN
      RAISE EXCEPTION
        'junior_force_club_id_from_player_if_present: player_id % does not exist in junior_players',
        NEW.player_id;
    END IF;

    NEW.club_id := player_club;
    RETURN NEW;
  END;
$$;

-- ─── INDEXES ──────────────────────────────────────────────────────────────
-- Every FK column gets a B-tree index. UNIQUE constraints provide their
-- leading-column index implicitly.

-- junior_consent: player_id is UNIQUE (implicit index). Index club_id +
-- consented_by_membership_id.
CREATE INDEX IF NOT EXISTS idx_junior_consent_club ON junior_consent(club_id);
CREATE INDEX IF NOT EXISTS idx_junior_consent_consented_by ON junior_consent(consented_by_membership_id)
  WHERE consented_by_membership_id IS NOT NULL;
-- Renewal-due lookups: parents/welfare officers chase expiring consent.
CREATE INDEX IF NOT EXISTS idx_junior_consent_expiry ON junior_consent(expiry);

-- junior_dbs: membership_id is UNIQUE (implicit index). Index club_id +
-- verified_by. Partial index on status='expired' / 'pending' for the
-- welfare officer's dashboard hot-path.
CREATE INDEX IF NOT EXISTS idx_junior_dbs_club ON junior_dbs(club_id);
CREATE INDEX IF NOT EXISTS idx_junior_dbs_verified_by ON junior_dbs(verified_by_membership_id)
  WHERE verified_by_membership_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_junior_dbs_to_action ON junior_dbs(club_id, expires_at)
  WHERE status IN ('expired', 'pending');

-- junior_safeguarding_incidents.
CREATE INDEX IF NOT EXISTS idx_junior_safeguarding_incidents_club ON junior_safeguarding_incidents(club_id);
CREATE INDEX IF NOT EXISTS idx_junior_safeguarding_incidents_player ON junior_safeguarding_incidents(player_id)
  WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_junior_safeguarding_incidents_reporter ON junior_safeguarding_incidents(reported_by_membership_id)
  WHERE reported_by_membership_id IS NOT NULL;
-- Open incidents — welfare dashboard hot-path.
CREATE INDEX IF NOT EXISTS idx_junior_safeguarding_incidents_open ON junior_safeguarding_incidents(club_id, logged_at)
  WHERE status IN ('open', 'under_review');

-- ─── updated_at TRIGGERS ──────────────────────────────────────────────────
-- Verbatim pattern from 091/092/099 — one function per table.

CREATE OR REPLACE FUNCTION update_junior_consent_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_consent_updated_at ON junior_consent;
CREATE TRIGGER trg_junior_consent_updated_at
  BEFORE UPDATE ON junior_consent
  FOR EACH ROW EXECUTE FUNCTION update_junior_consent_updated_at();

CREATE OR REPLACE FUNCTION update_junior_dbs_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_dbs_updated_at ON junior_dbs;
CREATE TRIGGER trg_junior_dbs_updated_at
  BEFORE UPDATE ON junior_dbs
  FOR EACH ROW EXECUTE FUNCTION update_junior_dbs_updated_at();

CREATE OR REPLACE FUNCTION update_junior_safeguarding_incidents_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_safeguarding_incidents_updated_at ON junior_safeguarding_incidents;
CREATE TRIGGER trg_junior_safeguarding_incidents_updated_at
  BEFORE UPDATE ON junior_safeguarding_incidents
  FOR EACH ROW EXECUTE FUNCTION update_junior_safeguarding_incidents_updated_at();

-- ─── FORCE-CLUB-ID TRIGGERS ──────────────────────────────────────────────
-- Three triggers, three functions: 099's existing one for the player-keyed
-- table, and the two new variants defined above for membership-keyed and
-- conditionally-player-keyed.

-- junior_consent uses 099's function verbatim (player_id is NOT NULL).
DROP TRIGGER IF EXISTS trg_junior_consent_force_club_id ON junior_consent;
CREATE TRIGGER trg_junior_consent_force_club_id
  BEFORE INSERT OR UPDATE ON junior_consent
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player();

-- junior_dbs uses the new membership-keyed variant.
DROP TRIGGER IF EXISTS trg_junior_dbs_force_club_id ON junior_dbs;
CREATE TRIGGER trg_junior_dbs_force_club_id
  BEFORE INSERT OR UPDATE ON junior_dbs
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_membership();

-- junior_safeguarding_incidents uses the conditional variant
-- (player_id is nullable).
DROP TRIGGER IF EXISTS trg_junior_safeguarding_incidents_force_club_id ON junior_safeguarding_incidents;
CREATE TRIGGER trg_junior_safeguarding_incidents_force_club_id
  BEFORE INSERT OR UPDATE ON junior_safeguarding_incidents
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player_if_present();

-- ─── RLS ──────────────────────────────────────────────────────────────────
-- Three tables, three RLS shapes:
--   junior_consent          — dual-writer (welfare INSERT/UPDATE +
--                             guardian INSERT/UPDATE on own child)
--   junior_dbs              — broad SELECT for staff + narrow welfare WRITE
--   junior_safeguarding_incidents — single FOR ALL, welfare-only

-- ── junior_consent ───────────────────────────────────────────────────────
-- The 099 "FOR SELECT (broad) + FOR ALL (narrow)" pattern doesn't fit
-- here: writes have COMMAND-SPECIFIC rules. Three policies:
--   - FOR SELECT  — staff OR guardian-for-own-child
--   - FOR INSERT  — welfare OR guardian-for-own-child (dual-writer; a
--                   parent landing on their child's consent screen at
--                   first login must be able to create the row, otherwise
--                   a volunteer would have to pre-create blank rows for
--                   every child — backwards for a consent-capture product)
--   - FOR UPDATE  — welfare OR guardian-for-own-child
--
-- DELETE deliberately not covered — consent deletion is a service-role-
-- only operation (admin tool). The force-club-id trigger pins club_id on
-- every write, so a guardian INSERT can never plant a row for a child
-- who isn't theirs (RLS WITH CHECK on player_id IN guardian_player_ids
-- is the gate; the trigger ensures club_id stays correct).
ALTER TABLE junior_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff + guardians read consent" ON junior_consent;
CREATE POLICY "Junior staff + guardians read consent"
  ON junior_consent FOR SELECT
  USING (
    club_id IN (SELECT * FROM junior_staff_club_ids())
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );

DROP POLICY IF EXISTS "Welfare-eligible or guardian create consent" ON junior_consent;
CREATE POLICY "Welfare-eligible or guardian create consent"
  ON junior_consent FOR INSERT
  WITH CHECK (
    club_id IN (SELECT * FROM junior_welfare_club_ids())
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );

DROP POLICY IF EXISTS "Welfare-eligible or guardian update consent" ON junior_consent;
CREATE POLICY "Welfare-eligible or guardian update consent"
  ON junior_consent FOR UPDATE
  USING (
    club_id IN (SELECT * FROM junior_welfare_club_ids())
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  )
  WITH CHECK (
    club_id IN (SELECT * FROM junior_welfare_club_ids())
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );

-- ── junior_dbs ───────────────────────────────────────────────────────────
-- All five junior staff roles see DBS records (coaches need to know
-- their fellow staff's DBS state for matchday). Only chairman /
-- welfare_officer write — INSERT, UPDATE, DELETE all gate on
-- junior_welfare_club_ids() via the FOR ALL policy.
ALTER TABLE junior_dbs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff read DBS" ON junior_dbs;
CREATE POLICY "Junior staff read DBS"
  ON junior_dbs FOR SELECT
  USING (club_id IN (SELECT * FROM junior_staff_club_ids()));

DROP POLICY IF EXISTS "Welfare-eligible manage DBS" ON junior_dbs;
CREATE POLICY "Welfare-eligible manage DBS"
  ON junior_dbs FOR ALL
  USING (club_id IN (SELECT * FROM junior_welfare_club_ids()))
  WITH CHECK (club_id IN (SELECT * FROM junior_welfare_club_ids()));

-- ── junior_safeguarding_incidents ────────────────────────────────────────
-- Welfare-only across the board — SELECT and write share the same
-- predicate, so one FOR ALL policy (same shape as 099's
-- junior_player_restrictions). Coaches, team managers, academy leads,
-- guardians and players never see incident records.
ALTER TABLE junior_safeguarding_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Welfare-eligible access incidents" ON junior_safeguarding_incidents;
CREATE POLICY "Welfare-eligible access incidents"
  ON junior_safeguarding_incidents FOR ALL
  USING (club_id IN (SELECT * FROM junior_welfare_club_ids()))
  WITH CHECK (club_id IN (SELECT * FROM junior_welfare_club_ids()));
