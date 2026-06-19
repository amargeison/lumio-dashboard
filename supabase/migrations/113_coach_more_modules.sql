-- Lumio Tennis Coach — Session Planner, Court Planner, Player Development,
-- Equipment and Resource Centre. All per-coach, RLS owner-only.

CREATE TABLE IF NOT EXISTS coach_session_plans (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  session_date DATE,
  group_name   TEXT,
  focus        TEXT,
  duration_min INTEGER,
  drills       TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_courts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  surface    TEXT,
  location   TEXT,
  hours      TEXT,
  status     TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_development (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  area        TEXT,
  rating      INTEGER,
  target      TEXT,
  review_date DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_equipment (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item       TEXT NOT NULL,
  category   TEXT,
  quantity   INTEGER,
  status     TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_resources (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  type       TEXT,
  url        TEXT,
  category   TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_session_plans_coach ON coach_session_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_courts_coach        ON coach_courts(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_development_coach   ON coach_development(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_equipment_coach     ON coach_equipment(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_resources_coach     ON coach_resources(coach_id);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'coach_session_plans','coach_courts','coach_development','coach_equipment','coach_resources'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Coach owns rows" ON %I;', t);
    EXECUTE format(
      'CREATE POLICY "Coach owns rows" ON %I FOR ALL TO authenticated
         USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());', t);
  END LOOP;
END $$;
