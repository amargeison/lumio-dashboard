-- Sports event tracking (clicks, actions, feature usage)
CREATE TABLE IF NOT EXISTS sports_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sports_events_user ON sports_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sports_events_type ON sports_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sports_events_created ON sports_events(created_at);
ALTER TABLE sports_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON sports_events USING (false);

-- Sports login tracking
CREATE TABLE IF NOT EXISTS sports_logins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sports_logins_user ON sports_logins(user_id);
ALTER TABLE sports_logins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON sports_logins USING (false);
