-- Lumio Tennis Coach — attendance log + per-player racket skill scores.

CREATE TABLE IF NOT EXISTS coach_attendance (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES coach_players(id) ON DELETE CASCADE,
  session_date DATE,
  present      BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_player_skills (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES coach_players(id) ON DELETE CASCADE,
  skill      TEXT NOT NULL,
  score      INTEGER DEFAULT 0,   -- 0 none · 1 Learning · 2 Developing · 3 Consolidating · 4 Consistent
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (player_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_coach_attendance_coach  ON coach_attendance(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_attendance_player ON coach_attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_coach_skills_coach      ON coach_player_skills(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_skills_player     ON coach_player_skills(player_id);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['coach_attendance','coach_player_skills'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Coach owns rows" ON %I;', t);
    EXECUTE format(
      'CREATE POLICY "Coach owns rows" ON %I FOR ALL TO authenticated
         USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());', t);
  END LOOP;
END $$;
