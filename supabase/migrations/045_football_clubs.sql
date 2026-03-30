CREATE TABLE IF NOT EXISTS football_clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  club_name TEXT NOT NULL,
  tier TEXT DEFAULT 'Championship',
  league_position INTEGER,
  plan TEXT DEFAULT 'pro-club',
  status TEXT DEFAULT 'trial',
  monthly_price INTEGER DEFAULT 5000,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  director_of_football TEXT,
  head_coach TEXT,
  stadium TEXT,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  health_score INTEGER DEFAULT 60,
  notes TEXT
);

ALTER TABLE football_clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "football_clubs_all" ON football_clubs FOR ALL USING (true) WITH CHECK (true);

INSERT INTO football_clubs (slug, club_name, tier, league_position, plan, status, monthly_price, contact_name, contact_email, director_of_football, head_coach, stadium, capacity)
VALUES ('oakridge-fc', 'Oakridge FC', 'Championship', 8, 'pro-club', 'trial', 5000, 'Robert Blackwell', 'admin@oakridgefc.com', 'Dave Thompson', 'Marcus Reid', 'Oakridge Park', 24000)
ON CONFLICT (slug) DO NOTHING;
