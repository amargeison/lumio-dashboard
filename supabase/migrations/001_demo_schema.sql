-- ============================================================
-- LUMIO DEMO SCHEMA
-- Run in Supabase SQL Editor: supabase.com → SQL Editor
-- ============================================================

-- Demo tenants table (separate from main tenants to avoid confusion)
CREATE TABLE IF NOT EXISTS demo_tenants (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  company_name  TEXT NOT NULL,
  owner_email   TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  logo_url      TEXT,
  departments   TEXT[] DEFAULT '{}',
  integrations  TEXT[] DEFAULT '{}',
  invite_emails TEXT[] DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending_onboarding',
    -- pending_onboarding | active | deleted
  gdpr_consent        BOOLEAN NOT NULL DEFAULT false,
  marketing_consent   BOOLEAN DEFAULT false,
  gdpr_consent_at     TIMESTAMPTZ,
  activated_at        TIMESTAMPTZ,
  onboarded_at        TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  warned_at           TIMESTAMPTZ,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_tenants_slug        ON demo_tenants(slug);
CREATE INDEX IF NOT EXISTS idx_demo_tenants_email       ON demo_tenants(owner_email);
CREATE INDEX IF NOT EXISTS idx_demo_tenants_expires_at  ON demo_tenants(expires_at);
CREATE INDEX IF NOT EXISTS idx_demo_tenants_status      ON demo_tenants(status);

-- Demo magic links
CREATE TABLE IF NOT EXISTS demo_magic_links (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL,
  slug       TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT false,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_magic_links_token ON demo_magic_links(token);
CREATE INDEX IF NOT EXISTS idx_demo_magic_links_email ON demo_magic_links(email);
CREATE INDEX IF NOT EXISTS idx_demo_magic_links_slug  ON demo_magic_links(slug);

-- Demo sessions
CREATE TABLE IF NOT EXISTS demo_sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token      UUID NOT NULL UNIQUE,
  tenant_id  UUID NOT NULL REFERENCES demo_tenants(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_token     ON demo_sessions(token);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_tenant_id ON demo_sessions(tenant_id);

-- ============================================================
-- RLS (Row Level Security)
-- All demo tables are service-role only — no client-side access
-- ============================================================

ALTER TABLE demo_tenants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_magic_links  ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_demo_tenants"
  ON demo_tenants USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_demo_magic_links"
  ON demo_magic_links USING (auth.role() = 'service_role');

CREATE POLICY "service_role_only_demo_sessions"
  ON demo_sessions USING (auth.role() = 'service_role');

-- ============================================================
-- Supabase Storage bucket for demo logos
-- ============================================================

-- Run this in Supabase Dashboard → Storage → New bucket
-- Name: demo-logos
-- Public: true (logos are displayed in the demo)
-- File size limit: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/webp, image/gif

-- ============================================================
-- Auto-cleanup function (belt-and-braces — n8n also runs cleanup)
-- ============================================================

CREATE OR REPLACE FUNCTION auto_delete_expired_demo_tenants()
RETURNS void AS $$
BEGIN
  UPDATE demo_tenants
  SET status = 'deleted', deleted_at = NOW()
  WHERE expires_at < NOW()
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired magic link tokens older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_expired_demo_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM demo_magic_links
  WHERE expires_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
