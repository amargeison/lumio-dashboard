-- Lumio Tennis Coach — live portal data.
-- All tables are owned per-coach (coach_id = auth.users.id) and protected by
-- RLS so the browser client can read/write directly: a coach only ever sees
-- their own rows. Admin impersonation works because it mints a real session
-- for the coach, so auth.uid() resolves to them.

-- ── Players ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_players (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  nickname     TEXT,
  level        TEXT,
  racket_stage TEXT,
  email        TEXT,
  phone        TEXT,
  notes        TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Coaches & staff ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_staff (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  role           TEXT,
  email          TEXT,
  phone          TEXT,
  qualifications TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Booking calendar ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_bookings (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT,
  player_name  TEXT,
  court        TEXT,
  booking_date DATE,
  start_time   TEXT,
  duration_min INTEGER,
  status       TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Lesson summaries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_sessions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name  TEXT,
  session_date DATE,
  focus        TEXT,
  summary      TEXT,
  rating       INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Training camps ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_camps (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  capacity    INTEGER,
  price       NUMERIC,
  location    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_payments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name  TEXT,
  item         TEXT,
  amount       NUMERIC,
  status       TEXT,
  due_date     DATE,
  paid         BOOLEAN DEFAULT FALSE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coach_players_coach   ON coach_players(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_staff_coach     ON coach_staff(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_bookings_coach  ON coach_bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_coach  ON coach_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_camps_coach     ON coach_camps(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_payments_coach  ON coach_payments(coach_id);

-- ── Row-Level Security — owner-only on every table ─────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'coach_players','coach_staff','coach_bookings',
    'coach_sessions','coach_camps','coach_payments'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Coach owns rows" ON %I;', t);
    EXECUTE format(
      'CREATE POLICY "Coach owns rows" ON %I FOR ALL TO authenticated
         USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());', t);
  END LOOP;
END $$;
