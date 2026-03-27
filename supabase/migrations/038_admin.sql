-- Admin portal tables

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin', -- super_admin | admin | support
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Seed first super admin
INSERT INTO admin_users (email, name, role)
VALUES ('arron@oxedandassessment.com', 'Arron', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Admin sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE,
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_slug TEXT NOT NULL,
  account_type TEXT NOT NULL, -- business | schools
  action TEXT NOT NULL,
  department TEXT,
  user_email TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_slug ON activity_log(account_slug);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- Admin magic links (OTP for admin login)
CREATE TABLE IF NOT EXISTS admin_magic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin notes column on businesses and schools
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Billing columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'monthly';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS billing_type TEXT DEFAULT 'monthly';
