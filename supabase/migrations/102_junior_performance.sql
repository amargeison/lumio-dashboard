-- supabase/migrations/102_junior_performance.sql
-- Workstream B / Migration 102 — Lumio Junior Football performance + video.
--
-- Builds on 099 + 100 + 101:
--   - Reuses helper functions: junior_staff_club_ids,
--     junior_guardian_player_ids (both 099)
--   - Reuses trigger functions: junior_force_club_id_from_player (099)
--     for junior_match_stats; junior_force_club_id_from_player_if_present
--     (100) for junior_video_clips (player_id is nullable so a team-wide
--     clip can be logged without a per-child tag).
--   - NO new helper functions. The safeguarding consent gate on
--     junior_video_clips.SELECT is expressed inline because it joins
--     two distinct tables (junior_players + junior_consent) in a single
--     compound predicate — wrapping that in a helper would obscure the
--     intent without saving any policy-evaluation cost.
--
-- Two tables, two ENUMs. Pattern from 099/100/101 throughout.
--
-- THE CONSENT GATE — junior_video_clips is the most safeguarding-critical
-- table in Workstream B. Two layers of defence:
--
--   1. SELECT policy: requires (viewer-permitted) AND (clip-passes-consent).
--      The per-child consent branch fails closed in three independent
--      ways: restricted=true, film_consent=false, AND the absence of a
--      junior_consent row entirely (no consent on record = no clip).
--
--   2. FOR ALL policy's WITH CHECK: blocks WRITES of per-child clips
--      referencing a restricted player. `restricted` is an immutable
--      safeguarding state — a clip for a restricted child must never
--      be insertable. `film_consent` deliberately NOT enforced at
--      write time (async upload pipelines may arrive before consent
--      is recorded; the SELECT gate keeps such clips invisible until
--      consent lands).

-- ─── ENUMs ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE junior_gps_source AS ENUM (
    'johan', 'manual', 'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE junior_clip_type AS ENUM (
    'goal', 'assist', 'tackle', 'save', 'skill', 'team', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TABLES ───────────────────────────────────────────────────────────────

-- junior_match_stats — one row per (fixture, player). Records minutes,
-- position, goals, assists and (where available) GPS / heatmap data.
-- gps_source='none' is the default: many junior clubs run without GPS
-- and the row exists for the non-GPS counts. distance_m / sprint_count /
-- top_speed_kmh / heatmap_data are nullable accordingly.
--
-- club_id is denormalised from junior_players.club_id; reuses 099's
-- junior_force_club_id_from_player trigger. junior_players.club_id is
-- immutable (099) so no drift is possible.
--
-- CONSENT POLICY — DELIBERATE: match stats (including heatmap_data and
-- GPS metrics) are NOT consent-gated. The restriction / consent model
-- in this schema governs IMAGERY only — junior_video_clips and any
-- future photo surfaces. Performance data is performance data: a
-- guardian seeing their own child's stats is the intended product, and
-- restricted children still need staff visibility on minutes / position /
-- workload for welfare reasons (overload management, growth-aware
-- load tracking). If a future requirement emerges to redact specific
-- fields for restricted children, do it at the application layer or
-- via a view, not by widening the safeguarding gate from imagery to
-- performance. This is a considered decision; not an oversight.
CREATE TABLE IF NOT EXISTS junior_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  fixture_id UUID NOT NULL REFERENCES junior_fixtures(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES junior_players(id) ON DELETE CASCADE,
  club_id    UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  minutes_played INT NOT NULL DEFAULT 0,
  position       TEXT,                          -- 'GK' / 'DEF' / 'MID' / 'FWD' (nullable)

  goals    INT NOT NULL DEFAULT 0,
  assists  INT NOT NULL DEFAULT 0,

  -- GPS-derived metrics — nullable, populated only when gps_source != 'none'.
  distance_m     INT,
  sprint_count   INT,
  top_speed_kmh  NUMERIC(4,1),                  -- e.g. 19.2; fits up to 999.9
  heatmap_data   JSONB,

  gps_source junior_gps_source NOT NULL DEFAULT 'none',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (fixture_id, player_id)
);

-- junior_video_clips — metadata only; the actual video files live in
-- Supabase Storage at the paths referenced by video_ref / thumbnail_ref /
-- full_match_ref.
--
-- player_id is NULLABLE so a team-wide clip (post-match crowd, whole-team
-- celebration, training-ground drill where multiple players are tagged)
-- can be logged with player_id IS NULL. When player_id IS NOT NULL the
-- clip is a per-child clip and is subject to BOTH the consent gate on
-- SELECT and the restricted-block on the write-side WITH CHECK.
--
-- ON DELETE CASCADE on player_id (NOT SET NULL): if a player is deleted,
-- their per-child clips are deleted with them. SET NULL would silently
-- transition the clip to "team clip" status, bypassing the consent gate
-- on SELECT — a safeguarding hole. CASCADE keeps the gate watertight.
--
-- club_id is denormalised; reuses 100's
-- junior_force_club_id_from_player_if_present trigger (player_id may be
-- NULL). When player_id IS NULL, the caller-provided club_id is honoured
-- (and RLS WITH CHECK still gates whether the caller may write to that
-- club).
CREATE TABLE IF NOT EXISTS junior_video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  fixture_id UUID NOT NULL REFERENCES junior_fixtures(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES junior_players(id) ON DELETE CASCADE,   -- NULLABLE = team clip
  club_id    UUID NOT NULL REFERENCES sports_clubs(id) ON DELETE CASCADE,

  clip_type junior_clip_type NOT NULL,
  title     TEXT,

  -- Storage references — opaque paths into Supabase Storage. Nothing in
  -- this table contains media bytes.
  video_ref       TEXT NOT NULL,
  thumbnail_ref   TEXT,
  full_match_ref  TEXT,

  duration_seconds INT,
  auto_tagged      BOOLEAN NOT NULL DEFAULT false,

  clipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────

-- junior_match_stats. fixture_id is the leading column of the UNIQUE on
-- (fixture_id, player_id), so its lookup is already indexed. Add
-- player_id + club_id explicitly.
CREATE INDEX IF NOT EXISTS idx_junior_match_stats_player ON junior_match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_junior_match_stats_club   ON junior_match_stats(club_id);

-- junior_video_clips.
CREATE INDEX IF NOT EXISTS idx_junior_video_clips_fixture ON junior_video_clips(fixture_id);
CREATE INDEX IF NOT EXISTS idx_junior_video_clips_player  ON junior_video_clips(player_id)
  WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_junior_video_clips_club    ON junior_video_clips(club_id);
-- Parent app hot path: "my child's recent clips, newest first".
CREATE INDEX IF NOT EXISTS idx_junior_video_clips_player_recent
  ON junior_video_clips(player_id, clipped_at DESC)
  WHERE player_id IS NOT NULL;

-- ─── updated_at TRIGGERS ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_junior_match_stats_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_match_stats_updated_at ON junior_match_stats;
CREATE TRIGGER trg_junior_match_stats_updated_at
  BEFORE UPDATE ON junior_match_stats
  FOR EACH ROW EXECUTE FUNCTION update_junior_match_stats_updated_at();

CREATE OR REPLACE FUNCTION update_junior_video_clips_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_junior_video_clips_updated_at ON junior_video_clips;
CREATE TRIGGER trg_junior_video_clips_updated_at
  BEFORE UPDATE ON junior_video_clips
  FOR EACH ROW EXECUTE FUNCTION update_junior_video_clips_updated_at();

-- ─── FORCE-CLUB-ID TRIGGERS ──────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_junior_match_stats_force_club_id ON junior_match_stats;
CREATE TRIGGER trg_junior_match_stats_force_club_id
  BEFORE INSERT OR UPDATE ON junior_match_stats
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player();

DROP TRIGGER IF EXISTS trg_junior_video_clips_force_club_id ON junior_video_clips;
CREATE TRIGGER trg_junior_video_clips_force_club_id
  BEFORE INSERT OR UPDATE ON junior_video_clips
  FOR EACH ROW EXECUTE FUNCTION junior_force_club_id_from_player_if_present();

-- ─── RLS ──────────────────────────────────────────────────────────────────

-- ── junior_match_stats ───────────────────────────────────────────────────
-- SELECT: staff for the club, OR guardian-for-own-child. No consent
-- gating — performance data is intentionally outside the imagery
-- restriction/consent model (see comment on the table). WRITE:
-- chairman + coach + team_manager (matches junior_fixtures /
-- junior_availability pattern).
ALTER TABLE junior_match_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior staff + guardians read match stats" ON junior_match_stats;
CREATE POLICY "Junior staff + guardians read match stats"
  ON junior_match_stats FOR SELECT
  USING (
    club_id IN (SELECT * FROM junior_staff_club_ids())
    OR player_id IN (SELECT * FROM junior_guardian_player_ids())
  );

DROP POLICY IF EXISTS "Junior team-writers manage match stats" ON junior_match_stats;
CREATE POLICY "Junior team-writers manage match stats"
  ON junior_match_stats FOR ALL
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

-- ── junior_video_clips ───────────────────────────────────────────────────
-- THE CONSENT GATE — two-layer defence (SELECT + write-side WITH CHECK).
--
-- SELECT requires BOTH:
--   (a) viewer is permitted — staff for the club OR guardian of the
--       tagged child
--   (b) clip passes per-child consent — either player_id IS NULL (team
--       clip; see team-clip caveat below) OR the tagged player is not
--       restricted AND has an explicit film_consent = true on a
--       junior_consent row
--
-- Three independent fail-closed paths in branch (b):
--   1. junior_players.restricted = true       → first EXISTS returns false
--   2. junior_consent.film_consent = false     → second EXISTS returns false
--   3. no junior_consent row for the player    → second EXISTS returns false
--
-- TEAM-CLIP CAVEAT: when player_id IS NULL, branch (b) short-circuits to
-- visible-if-permitted. RLS cannot inspect which children appear IN-FRAME
-- of a team clip — that responsibility belongs upstream to the
-- clipping / publish pipeline (Workstream C). The pipeline MUST NOT
-- publish a team clip containing a restricted child as player_id=NULL.
-- This RLS gate guards database-tagged consent, not pixel-level content.
--
-- FOR ALL (WRITE) policy:
--   USING       — staff role gate (coach / team_manager of the club) for
--                 UPDATE / DELETE on existing rows. NO restricted check
--                 in USING — DELETE must remain possible for clips
--                 referencing children who became restricted after
--                 insert, so the row can be cleaned up.
--   WITH CHECK  — staff role gate AND restricted-block on per-child
--                 clips. A clip referencing a restricted player can
--                 NEVER be inserted, and an UPDATE that would result
--                 in a restricted player_id is also blocked.
--
-- Write-side intentionally checks `restricted` only, NOT `film_consent`.
-- `restricted` is an immutable safeguarding state — a court-order child
-- must never have imagery created. `film_consent` legitimately may lag
-- an async upload pipeline; the SELECT gate keeps such clips invisible
-- until consent lands, so blocking at write time would reject otherwise-
-- valid clips. The two checks are deliberately asymmetric.

ALTER TABLE junior_video_clips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Junior consent-gated read clips" ON junior_video_clips;
CREATE POLICY "Junior consent-gated read clips"
  ON junior_video_clips FOR SELECT
  USING (
    -- (a) viewer permitted
    (
      club_id IN (SELECT * FROM junior_staff_club_ids())
      OR player_id IN (SELECT * FROM junior_guardian_player_ids())
    )
    AND
    -- (b) clip passes the per-child consent gate
    (
      player_id IS NULL
      OR (
        EXISTS (
          SELECT 1
          FROM junior_players p
          WHERE p.id = junior_video_clips.player_id
            AND p.restricted = false
        )
        AND
        EXISTS (
          SELECT 1
          FROM junior_consent c
          WHERE c.player_id = junior_video_clips.player_id
            AND c.film_consent = true
        )
      )
    )
  );

DROP POLICY IF EXISTS "Junior team-writers manage clips" ON junior_video_clips;
CREATE POLICY "Junior team-writers manage clips"
  ON junior_video_clips FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('coach','team_manager')
    )
  )
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM sports_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role_template IS NOT NULL
        AND role_template IN ('coach','team_manager')
    )
    AND
    -- Restricted-block: a clip referencing a restricted player can
    -- never be inserted or updated. Team clips (player_id IS NULL) are
    -- exempt — see the team-clip caveat on the SELECT policy.
    (
      player_id IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM junior_players p
        WHERE p.id = junior_video_clips.player_id
          AND p.restricted = true
      )
    )
  );
