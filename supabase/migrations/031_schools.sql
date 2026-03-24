-- ─── 031 Schools ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schools (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  type             TEXT,  -- primary, secondary, special, MAT
  phase            TEXT,  -- eyfs, primary, secondary, all-through
  ofsted_rating    TEXT,  -- outstanding, good, requires_improvement, inadequate
  pupil_count      INTEGER,
  staff_count      INTEGER,
  address          TEXT,
  town             TEXT,
  postcode         TEXT,
  headteacher      TEXT,
  business_manager TEXT,
  phone            TEXT,
  email            TEXT,
  website          TEXT,
  plan             TEXT DEFAULT 'starter', -- starter, school, trust, enterprise
  trial_ends_at    TIMESTAMPTZ,
  active           BOOLEAN DEFAULT true,
  onboarded        BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_users (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id  UUID REFERENCES schools(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'staff', -- headteacher, deputy, senco, business_manager, office, teacher, staff
  name       TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_magic_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  school_id  UUID REFERENCES schools(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  used       BOOLEAN DEFAULT false,
  used_at    TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE schools            ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_magic_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schools_select"      ON schools;
DROP POLICY IF EXISTS "school_users_select" ON school_users;
DROP POLICY IF EXISTS "school_users_insert" ON school_users;
DROP POLICY IF EXISTS "school_magic_select" ON school_magic_links;
DROP POLICY IF EXISTS "school_magic_insert" ON school_magic_links;
DROP POLICY IF EXISTS "school_magic_update" ON school_magic_links;

CREATE POLICY "schools_select"      ON schools            FOR SELECT TO authenticated USING (true);
CREATE POLICY "school_users_select" ON school_users       FOR SELECT TO authenticated USING (true);
CREATE POLICY "school_users_insert" ON school_users       FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "school_magic_select" ON school_magic_links FOR SELECT USING (true);
CREATE POLICY "school_magic_insert" ON school_magic_links FOR INSERT WITH CHECK (true);
CREATE POLICY "school_magic_update" ON school_magic_links FOR UPDATE USING (true);
