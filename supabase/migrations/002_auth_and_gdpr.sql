-- ============================================================
-- LUMIO AUTH + GDPR SCHEMA
-- Run AFTER 001_demo_schema.sql
-- ============================================================

-- GDPR requests table (audit trail required by UK GDPR Article 5(2))
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference      TEXT NOT NULL UNIQUE,
  request_type   TEXT NOT NULL,
    -- delete_all | delete_account | delete_demo | access_request | correction
  email          TEXT NOT NULL,
  details        TEXT,
  status         TEXT DEFAULT 'received',
    -- received | in_progress | completed | rejected
  submitted_at   TIMESTAMPTZ NOT NULL,
  due_by         TIMESTAMPTZ NOT NULL,
  completed_at   TIMESTAMPTZ,
  completed_by   TEXT,
  response_notes TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_email  ON gdpr_requests(email);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);

-- Cookie consent audit log
CREATE TABLE IF NOT EXISTS cookie_consent_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  TEXT,
  email       TEXT,
  essential   BOOLEAN DEFAULT true,
  analytics   BOOLEAN DEFAULT false,
  marketing   BOOLEAN DEFAULT false,
  level       TEXT,           -- all | essential
  ip_hash     TEXT,           -- SHA-256 of IP — GDPR compliant
  user_agent  TEXT,
  consented_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE gdpr_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consent_log  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_gdpr_requests"
  ON gdpr_requests USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_cookie_log"
  ON cookie_consent_log USING (auth.role() = 'service_role');

-- ============================================================
-- Main tenants table (if not already created)
-- Add columns needed by the demo + auth system
-- ============================================================

-- These ALTER TABLEs are safe to run if the tenants table exists.
-- If tenants table doesn't exist yet, create it or skip these.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_demo        BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug           TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_email    TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS expires_at     TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gdpr_consent   BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS data_deletion_requested    BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS data_deletion_requested_at TIMESTAMPTZ;
