-- 044: PIN-based authentication alongside email OTP
-- Adds PIN columns to both demo_tenants (business) and school_users (schools)

-- Business users (demo_tenants stores owner info)
ALTER TABLE demo_tenants ADD COLUMN IF NOT EXISTS login_pin TEXT;
ALTER TABLE demo_tenants ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0;
ALTER TABLE demo_tenants ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;
ALTER TABLE demo_tenants ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'otp';

-- School users
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS login_pin TEXT;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS pin_attempts INTEGER DEFAULT 0;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'otp';

-- School sessions table (was missing — schools had no persistent sessions)
CREATE TABLE IF NOT EXISTS school_sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token      UUID NOT NULL UNIQUE,
  school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_sessions_token ON school_sessions(token);
ALTER TABLE school_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_sessions_service" ON school_sessions FOR ALL USING (true) WITH CHECK (true);
