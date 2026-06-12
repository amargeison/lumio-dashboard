-- supabase/migrations/106_sports_travel.sql
-- Travel & Logistics module — Migration 106.
--
-- Two new tables shared across ALL Lumio Sports portals (Women's first,
-- then Club/Woking, then Non-League via the copy-and-retheme port). The
-- schema is deliberately PORTAL-AGNOSTIC: there is no womens-specific
-- column here. Demo content (Oakridge Women FC) lives in the app data
-- layer (src/app/womens/[slug]/_lib/womens-trip-fixtures.ts), NOT in the
-- database — womens-demo never reads this table (see the Demo AI content
-- rule in the build spec).
--
--   sports_trip_suppliers — coach / hotel / catering / minibus vendors a
--     club books for away days. rate_* columns hold PLACEHOLDER per-unit
--     rates today (no live supplier feed yet); the comparison engine reads
--     central placeholder constants, not these, until a real rate source
--     lands. Kept here so a signed LIVE client can store real negotiated
--     rates per supplier without a re-migration.
--
--   sports_trips — one away trip. Carries BOTH the day-trip and overnight
--     inputs from the start (is_overnight, nights_count, hotel_supplier_id)
--     so the side-by-side same-day-vs-overnight comparison — the core
--     feature — needs no schema change when overnight trips are exercised
--     on a live portal. Flights / private charter are Pro Phase 2 and are
--     deliberately NOT modelled here.
--
-- Pattern throughout mirrors 099–105 (junior_*): idempotent enum creates,
-- UUID PKs, all FKs indexed, per-table updated_at trigger (drop-then-
-- create), RLS enabled + policies in THIS migration, role_template
-- (+ status='active') gating that FAILS CLOSED on a null role_template.
--
-- RLS shape:
--   READ  — any active member of the club (sports_member_club_ids()).
--   WRITE — club admins + the ops/secretary persona
--           (owner/admin/ceo/chairman/manager/head_operations/
--            team_manager/coach). welfare/medical/analyst/commercial and
--           parent/player roles have NO write path to travel logistics.
--   Both helpers are SECURITY DEFINER STABLE and live in this migration;
--   they are generic (sports_*, not womens_*) so the Club/NL ports reuse
--   them verbatim with no new policy code.

-- ─── ENUMs ────────────────────────────────────────────────────────────────
-- Guarded with the DO $$ ... duplicate_object ... $$ idempotent pattern
-- used by 091/092/098–105.

DO $$ BEGIN
  CREATE TYPE sports_supplier_type AS ENUM (
    'coach', 'hotel', 'catering', 'minibus', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sports_trip_status AS ENUM (
    'planning', 'enquiring', 'confirmed', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Recommendation snapshot persisted alongside a trip. The decision engine
-- (overnight-engine.ts) is the source of truth and recomputes live; this
-- column just records what the engine said at create/edit time so the UI
-- can show the recommendation without re-running the engine on every read,
-- and so a future audit can see what was recommended vs what the secretary
-- actually chose. 'none' = engine has no strong steer (short drive).
DO $$ BEGIN
  CREATE TYPE sports_trip_recommendation AS ENUM (
    'day_trip', 'overnight', 'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TABLE: sports_trip_suppliers ─────────────────────────────────────────
-- Created before sports_trips because sports_trips FKs into it (coach /
-- hotel / catering supplier references). club_id is the scoping column,
-- set directly by the writer and pinned by RLS WITH CHECK (no denormalised
-- force-club-id trigger needed — unlike the junior team-keyed tables, this
-- table is club-keyed at source).
--
-- rate_* columns: TEMPORARY placeholder rate storage. Nullable because no
-- live supplier rate feed exists yet. The cost comparison reads central
-- placeholder constants (trip-rates.ts) today; these columns let a LIVE
-- client override per-supplier later WITHOUT a re-migration. region is
-- captured now to seed the future pooled cross-club rate-benchmarking
-- feature (region + squad size) — no logic reads it yet.
CREATE TABLE IF NOT EXISTS sports_trip_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  name           TEXT NOT NULL,
  supplier_type  sports_supplier_type NOT NULL,

  contact_name   TEXT,
  contact_email  TEXT,
  contact_phone  TEXT,
  region         TEXT,   -- future rate-benchmarking dimension; unused today
  notes          TEXT,

  -- TEMPORARY placeholder rate columns — see header. All nullable.
  rate_per_mile        NUMERIC(10,2),  -- coach / minibus
  rate_per_room_night  NUMERIC(10,2),  -- hotel
  rate_per_head        NUMERIC(10,2),  -- catering / meal stop

  is_active  BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE: sports_trips ──────────────────────────────────────────────────
-- One away trip. Inputs to the decision engine: kickoff_at,
-- one_way_drive_minutes, squad_headcount + staff_headcount. In DEMO these
-- come from canned fixtures; on a LIVE portal one_way_drive_minutes /
-- one_way_distance_miles are populated from a Maps lookup at create time.
--
-- is_overnight + nights_count carry the CHOSEN plan (what the secretary
-- decided). The engine always computes BOTH costs regardless; these record
-- the decision. hotel_supplier_id is only meaningful when is_overnight.
--
-- Flights / private charter: OUT OF SCOPE (Pro Phase 2) — intentionally no
-- columns for air travel.
CREATE TABLE IF NOT EXISTS sports_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  club_id UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  title        TEXT NOT NULL,
  opponent     TEXT,
  competition  TEXT,
  venue        TEXT,

  kickoff_at              TIMESTAMPTZ NOT NULL,
  match_duration_minutes  INT NOT NULL DEFAULT 110,  -- 90' + warm-up/HT/stoppage buffer

  -- Engine inputs. one_way_* are nullable until a drive lookup runs
  -- (canned in demo, Maps in live).
  one_way_drive_minutes   INT,
  one_way_distance_miles  NUMERIC(10,1),
  squad_headcount         INT NOT NULL DEFAULT 0,
  staff_headcount         INT NOT NULL DEFAULT 0,

  -- Chosen plan (the secretary's decision; engine still shows both costs).
  is_overnight  BOOLEAN NOT NULL DEFAULT false,
  nights_count  INT NOT NULL DEFAULT 0,

  -- Supplier links. ON DELETE SET NULL — removing a supplier must not
  -- delete the trip; the link just clears.
  coach_supplier_id     UUID REFERENCES sports_trip_suppliers(id) ON DELETE SET NULL,
  hotel_supplier_id     UUID REFERENCES sports_trip_suppliers(id) ON DELETE SET NULL,
  catering_supplier_id  UUID REFERENCES sports_trip_suppliers(id) ON DELETE SET NULL,

  -- Engine recommendation snapshot (see enum comment). Defaults to 'none'.
  recommendation  sports_trip_recommendation NOT NULL DEFAULT 'none',

  status  sports_trip_status NOT NULL DEFAULT 'planning',
  notes   TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Defensive: nights_count must be > 0 exactly when is_overnight, and a
  -- day trip must have 0 nights. Keeps the chosen-plan fields coherent.
  CONSTRAINT sports_trips_overnight_nights_ck
    CHECK ( (is_overnight AND nights_count >= 1)
         OR (NOT is_overnight AND nights_count = 0) )
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────
-- Every FK column gets a B-tree index (junior_* convention).

CREATE INDEX IF NOT EXISTS idx_sports_trip_suppliers_club
  ON sports_trip_suppliers(club_id);
-- Hot path: "active coach suppliers for this club" in the supplier picker.
CREATE INDEX IF NOT EXISTS idx_sports_trip_suppliers_club_type
  ON sports_trip_suppliers(club_id, supplier_type)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_sports_trips_club ON sports_trips(club_id);
-- Hot path: "upcoming away trips for this club" in kickoff order.
CREATE INDEX IF NOT EXISTS idx_sports_trips_kickoff ON sports_trips(club_id, kickoff_at);
CREATE INDEX IF NOT EXISTS idx_sports_trips_coach_supplier
  ON sports_trips(coach_supplier_id) WHERE coach_supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sports_trips_hotel_supplier
  ON sports_trips(hotel_supplier_id) WHERE hotel_supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sports_trips_catering_supplier
  ON sports_trips(catering_supplier_id) WHERE catering_supplier_id IS NOT NULL;

-- ─── updated_at TRIGGERS ──────────────────────────────────────────────────
-- One function per table — verbatim pattern from 091/092/099–105.

CREATE OR REPLACE FUNCTION update_sports_trip_suppliers_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sports_trip_suppliers_updated_at ON sports_trip_suppliers;
CREATE TRIGGER trg_sports_trip_suppliers_updated_at
  BEFORE UPDATE ON sports_trip_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_sports_trip_suppliers_updated_at();

CREATE OR REPLACE FUNCTION update_sports_trips_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sports_trips_updated_at ON sports_trips;
CREATE TRIGGER trg_sports_trips_updated_at
  BEFORE UPDATE ON sports_trips
  FOR EACH ROW EXECUTE FUNCTION update_sports_trips_updated_at();

-- ─── RLS HELPER FUNCTIONS ─────────────────────────────────────────────────
-- Generic (sports_*, portal-agnostic) so Club/NL ports reuse them. Both
-- SECURITY DEFINER STABLE, mirroring junior_staff_club_ids() (099).

-- sports_member_club_ids — every club the current user is an ACTIVE member
-- of, any role. Drives the READ policies (a member can see their club's
-- trips + suppliers). role_template is NOT consulted for reads.
CREATE OR REPLACE FUNCTION sports_member_club_ids()
  RETURNS SETOF UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT DISTINCT club_id
  FROM sports_memberships
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

-- sports_ops_writer_club_ids — clubs where the current user holds an
-- ops/admin role_template. Drives WRITE policies. FAILS CLOSED: a null
-- role_template never matches the IN (...) list, so a membership with no
-- role_template gets no write access. welfare/medical/analyst/commercial,
-- parent_guardian, player, junior_player are deliberately excluded.
CREATE OR REPLACE FUNCTION sports_ops_writer_club_ids()
  RETURNS SETOF UUID
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT DISTINCT club_id
  FROM sports_memberships
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND role_template IS NOT NULL
    AND role_template IN (
      'owner', 'admin', 'ceo', 'chairman', 'manager',
      'head_operations', 'team_manager', 'coach'
    );
$$;

-- ─── RLS: sports_trip_suppliers ───────────────────────────────────────────
ALTER TABLE sports_trip_suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read club suppliers" ON sports_trip_suppliers;
CREATE POLICY "Members read club suppliers"
  ON sports_trip_suppliers FOR SELECT
  USING ( club_id IN (SELECT * FROM sports_member_club_ids()) );

DROP POLICY IF EXISTS "Ops writers manage suppliers" ON sports_trip_suppliers;
CREATE POLICY "Ops writers manage suppliers"
  ON sports_trip_suppliers FOR ALL
  USING      ( club_id IN (SELECT * FROM sports_ops_writer_club_ids()) )
  WITH CHECK ( club_id IN (SELECT * FROM sports_ops_writer_club_ids()) );

-- ─── RLS: sports_trips ────────────────────────────────────────────────────
ALTER TABLE sports_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read club trips" ON sports_trips;
CREATE POLICY "Members read club trips"
  ON sports_trips FOR SELECT
  USING ( club_id IN (SELECT * FROM sports_member_club_ids()) );

DROP POLICY IF EXISTS "Ops writers manage trips" ON sports_trips;
CREATE POLICY "Ops writers manage trips"
  ON sports_trips FOR ALL
  USING      ( club_id IN (SELECT * FROM sports_ops_writer_club_ids()) )
  WITH CHECK ( club_id IN (SELECT * FROM sports_ops_writer_club_ids()) );

-- ─── END 106 ──────────────────────────────────────────────────────────────
