-- Lumio Tennis Coach — richer session plan fields for the demo-matched planner.

ALTER TABLE coach_session_plans ADD COLUMN IF NOT EXISTS court        TEXT;
ALTER TABLE coach_session_plans ADD COLUMN IF NOT EXISTS start_time   TEXT;
ALTER TABLE coach_session_plans ADD COLUMN IF NOT EXISTS session_type TEXT;   -- Private | Group | Cardio | Match play | Mini / red ball
ALTER TABLE coach_session_plans ADD COLUMN IF NOT EXISTS racket_stage TEXT;
ALTER TABLE coach_session_plans ADD COLUMN IF NOT EXISTS standard     TEXT;
ALTER TABLE coach_session_plans ADD COLUMN IF NOT EXISTS focus_points TEXT;
