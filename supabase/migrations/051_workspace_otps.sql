-- 051_workspace_otps.sql
-- OTP codes for workspace (business portal) login

CREATE TABLE IF NOT EXISTS workspace_otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  otp        TEXT        NOT NULL,
  slug       TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_otps_email
  ON workspace_otps (email, used, expires_at);
