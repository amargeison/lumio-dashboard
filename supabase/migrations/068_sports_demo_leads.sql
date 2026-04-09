CREATE TABLE IF NOT EXISTS sports_demo_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  sport TEXT NOT NULL,
  club_name TEXT,
  user_name TEXT,
  role TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, sport)
);

CREATE INDEX IF NOT EXISTS idx_sports_demo_leads_sport ON sports_demo_leads(sport);
CREATE INDEX IF NOT EXISTS idx_sports_demo_leads_email ON sports_demo_leads(email);
