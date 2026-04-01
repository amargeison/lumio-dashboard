-- 059_gps_data.sql
-- GPS/wearables data from Catapult, STATSports, or CSV uploads

CREATE TABLE IF NOT EXISTS gps_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  football_club_id uuid,
  session_date date,
  session_type text, -- 'training' or 'match'
  session_name text,
  provider text, -- 'catapult', 'statsports', or 'csv'
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gps_player_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES gps_sessions(id) ON DELETE CASCADE,
  player_name text,
  player_id text,
  total_distance numeric,
  high_speed_distance numeric,
  sprint_distance numeric,
  max_speed numeric,
  player_load numeric,
  accelerations integer,
  decelerations integer,
  duration_mins integer,
  heart_rate_avg integer,
  heart_rate_max integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gps_sessions_club ON gps_sessions(football_club_id);
CREATE INDEX IF NOT EXISTS idx_gps_sessions_date ON gps_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_gps_player_data_session ON gps_player_data(session_id);
CREATE INDEX IF NOT EXISTS idx_gps_player_data_player ON gps_player_data(player_name);
