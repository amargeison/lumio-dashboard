-- Businesses table: paid business workspaces (separate from demo_tenants)
-- demo_tenants holds trial records, businesses holds paid/live records

CREATE TABLE IF NOT EXISTS businesses (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name       TEXT NOT NULL,
  slug               TEXT UNIQUE NOT NULL,
  logo_url           TEXT,
  owner_email        TEXT NOT NULL,
  owner_name         TEXT NOT NULL,
  status             TEXT DEFAULT 'active',
  plan               TEXT DEFAULT 'paid',
  departments        TEXT[] DEFAULT '{}',
  integrations       TEXT[] DEFAULT '{}',
  invite_emails      TEXT[] DEFAULT '{}',
  demo_tenant_id     UUID REFERENCES demo_tenants(id),
  converted_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  onboarded          BOOLEAN DEFAULT false,
  welcome_email_sent BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_email);
CREATE INDEX IF NOT EXISTS idx_businesses_demo_tenant ON businesses(demo_tenant_id);

-- Add business_id FK to demo_tenants for reverse lookup
ALTER TABLE demo_tenants
  ADD COLUMN IF NOT EXISTS business_id UUID;

-- Sessions table: allow business workspace sessions alongside demo sessions
-- The demo_sessions table references tenant_id → demo_tenants.id
-- For businesses, we create a businesses_sessions table
CREATE TABLE IF NOT EXISTS business_sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token      UUID NOT NULL UNIQUE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_sessions_token ON business_sessions(token);
CREATE INDEX IF NOT EXISTS idx_business_sessions_business ON business_sessions(business_id);
