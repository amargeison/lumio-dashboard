-- Lumio Tennis Coach — Smartwatch "Reward GPS" (effort/engagement, not heatmaps).
-- Phase 0: ingest a per-session effort summary from a player's own smartwatch
-- (via an Apple Shortcut → /api/coach/watch/ingest) and turn it into XP that
-- feeds the Racket Progression reward system. NOTE: we deliberately store
-- effort/intensity/distance only — consumer watch GPS cannot do court position,
-- so there is no positional/heatmap data here by design.

-- Per-player additions:
--  • watch_token     — opaque bearer token the Shortcut/app uses to post sessions
--  • consent_wearable — parental consent to process biometric (HR) data; gating
--  • xp_total        — running XP aggregate (Phase 1 maps this into skill bars)
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS consent_wearable BOOLEAN DEFAULT FALSE;
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS xp_total         INTEGER DEFAULT 0;
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS watch_token      TEXT;

-- Backfill a unique token for existing players (no pgcrypto dependency).
UPDATE coach_players
   SET watch_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
 WHERE watch_token IS NULL;

-- Default for new players + uniqueness.
ALTER TABLE coach_players
  ALTER COLUMN watch_token SET DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_players_watch_token ON coach_players(watch_token);

-- Watch effort sessions.
CREATE TABLE IF NOT EXISTS coach_watch_sessions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES coach_players(id) ON DELETE CASCADE,
  source            TEXT DEFAULT 'apple_watch',  -- apple_watch | wear_os | garmin | manual
  started_at        TIMESTAMPTZ,
  duration_min      NUMERIC,
  avg_hr            INTEGER,
  max_hr            INTEGER,
  active_kcal       NUMERIC,
  distance_m        NUMERIC,        -- outdoor only; null/0 indoors
  -- Derived scores (0-100) computed at ingest time.
  effort_score      INTEGER,
  movement_score    INTEGER,
  consistency_score INTEGER,
  xp_awarded        INTEGER DEFAULT 0,
  estimated         BOOLEAN DEFAULT FALSE, -- true when HR (or distance) was missing and we fell back
  voided            BOOLEAN DEFAULT FALSE, -- coach can void a dodgy session (excludes its XP)
  raw               JSONB,                 -- original payload, for debugging
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_watch_coach  ON coach_watch_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_watch_player ON coach_watch_sessions(player_id);

-- RLS: coaches read/manage their own players' sessions in the portal. Inserts
-- come from the ingest route via the service role (which bypasses RLS), so the
-- authenticated policy only needs to cover the coach's own dashboard access.
ALTER TABLE coach_watch_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coach owns rows" ON coach_watch_sessions;
CREATE POLICY "Coach owns rows" ON coach_watch_sessions FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
