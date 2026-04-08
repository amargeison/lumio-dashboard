-- Darts player profile table
CREATE TABLE IF NOT EXISTS darts_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  nationality TEXT DEFAULT 'English',
  flag TEXT DEFAULT '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  pdc_rank INTEGER,
  order_of_merit_rank INTEGER,
  order_of_merit_amount DECIMAL(10,2) DEFAULT 0,
  three_dart_average DECIMAL(5,2) DEFAULT 0,
  checkout_percent DECIMAL(5,2) DEFAULT 0,
  one_eighties_per_leg DECIMAL(5,3) DEFAULT 0,
  first_nine_average DECIMAL(5,2) DEFAULT 0,
  highest_checkout INTEGER DEFAULT 0,
  tour_card TEXT DEFAULT 'Not held',
  plan TEXT DEFAULT 'Starter',
  manager TEXT,
  coach TEXT,
  sponsor_1 TEXT,
  sponsor_2 TEXT,
  walk_on_music TEXT,
  dart_setup TEXT,
  career_earnings DECIMAL(12,2) DEFAULT 0,
  this_year_earnings DECIMAL(12,2) DEFAULT 0,
  career_titles INTEGER DEFAULT 0,
  major_titles INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE darts_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own profile"
  ON darts_players FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players can update own profile"
  ON darts_players FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Demo slug is publicly readable"
  ON darts_players FOR SELECT
  USING (slug = 'darts-demo');

-- Insert demo player
INSERT INTO darts_players (
  slug, name, nickname, nationality, flag,
  pdc_rank, order_of_merit_rank, order_of_merit_amount,
  three_dart_average, checkout_percent, one_eighties_per_leg,
  first_nine_average, highest_checkout, tour_card, plan,
  manager, coach, sponsor_1, sponsor_2, walk_on_music,
  career_earnings, this_year_earnings, career_titles, major_titles
) VALUES (
  'darts-demo', 'Jake Morrison', 'The Hammer', 'English', '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  19, 19, 687420.00,
  97.8, 42.3, 0.84,
  101.4, 164, 'Secured — top 64', 'Premier League · £279/mo',
  'Dave Harris (DH Sports Management)',
  'Phil "The Power" Coaching Academy',
  'Red Dragon Darts', 'Paddy Power',
  'Iron by Within Temptation',
  687000.00, 42800.00, 3, 0
) ON CONFLICT (slug) DO NOTHING;

-- Darts sessions table (for DartConnect + Practice Games)
CREATE TABLE IF NOT EXISTS darts_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES darts_players(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type TEXT NOT NULL CHECK (session_type IN (
    'match_pc', 'match_euro', 'match_major', 'match_tv',
    'practice_solo', 'practice_partner',
    'bobs27', 'around_the_clock', '180_challenge',
    'doubles_round', 'checkout_trainer', 'halveit', 'shanghai', 'cricket'
  )),
  three_dart_average DECIMAL(5,2),
  checkout_percent DECIMAL(5,2),
  one_eighties INTEGER DEFAULT 0,
  first_nine_average DECIMAL(5,2),
  legs_played INTEGER DEFAULT 0,
  legs_won INTEGER DEFAULT 0,
  opponent_name TEXT,
  opponent_rank INTEGER,
  tournament TEXT,
  prize_money DECIMAL(10,2) DEFAULT 0,
  game_score INTEGER,  -- for practice games (Bob's 27 score etc.)
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'dartconnect', 'pdclive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE darts_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can manage own sessions"
  ON darts_sessions FOR ALL
  USING (player_id IN (
    SELECT id FROM darts_players WHERE user_id = auth.uid()
  ));

CREATE POLICY "Demo sessions readable"
  ON darts_sessions FOR SELECT
  USING (player_id IN (
    SELECT id FROM darts_players WHERE slug = 'darts-demo'
  ));
