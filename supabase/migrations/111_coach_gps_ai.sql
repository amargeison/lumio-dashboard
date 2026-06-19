-- Lumio Tennis Coach — GPS & video sessions + AI lesson reviews.

-- GPS & video session logs (per-coach, RLS owner-only).
CREATE TABLE IF NOT EXISTS coach_gps_sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name   TEXT,
  session_date  DATE,
  distance_m    NUMERIC,
  top_speed_kmh NUMERIC,
  avg_hr        INTEGER,
  video_url     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_gps_coach ON coach_gps_sessions(coach_id);

ALTER TABLE coach_gps_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coach owns rows" ON coach_gps_sessions;
CREATE POLICY "Coach owns rows" ON coach_gps_sessions FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- AI-generated session review stored alongside the lesson summary.
ALTER TABLE coach_sessions ADD COLUMN IF NOT EXISTS ai_review TEXT;
