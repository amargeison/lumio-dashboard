-- Sports portal user profiles
-- Pairs with /api/sports-auth/create-profile and /sports-login, /sports-signup
CREATE TABLE IF NOT EXISTS sports_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  sport TEXT NOT NULL CHECK (sport IN ('tennis','golf','darts','boxing','cricket','rugby','football','nonleague','grassroots','womens')),
  display_name TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  brand_name TEXT,
  brand_logo_url TEXT,
  plan TEXT DEFAULT 'founding',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_profiles_sport ON sports_profiles(sport);

ALTER TABLE sports_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update/insert their own row only
DROP POLICY IF EXISTS "Users read own profile" ON sports_profiles;
CREATE POLICY "Users read own profile"
  ON sports_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON sports_profiles;
CREATE POLICY "Users update own profile"
  ON sports_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON sports_profiles;
CREATE POLICY "Users insert own profile"
  ON sports_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_sports_profiles_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sports_profiles_updated_at ON sports_profiles;
CREATE TRIGGER trg_sports_profiles_updated_at
  BEFORE UPDATE ON sports_profiles
  FOR EACH ROW EXECUTE FUNCTION update_sports_profiles_updated_at();
