-- 048_onboarding_wizard.sql
-- Live tenant onboarding wizard — columns + supporting tables

-- ── Add onboarding columns to businesses ─────────────────────────────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS onboarding_completed    BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step         INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- ── Add onboarding columns to schools ────────────────────────────────────────
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS onboarding_completed    BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step         INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- ── Tenant integrations (OAuth + API-key connections) ────────────────────────
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL,
  tenant_type   TEXT        NOT NULL CHECK (tenant_type IN ('business', 'school')),
  service_name  TEXT        NOT NULL,
  api_key       TEXT,                        -- encrypted at-rest by Supabase vault later
  subdomain     TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('connected', 'pending', 'error')),
  connected_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_integrations_tenant
  ON tenant_integrations (tenant_id, tenant_type);

-- ── Onboarding CSV uploads ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_uploads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL,
  tenant_type TEXT        NOT NULL CHECK (tenant_type IN ('business', 'school')),
  file_type   TEXT        NOT NULL,
  filename    TEXT        NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_onboarding_uploads_tenant
  ON onboarding_uploads (tenant_id, tenant_type);

-- ── Team invites sent during onboarding ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL,
  tenant_type TEXT        NOT NULL CHECK (tenant_type IN ('business', 'school')),
  email       TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'staff',
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_tenant_invites_tenant
  ON tenant_invites (tenant_id, tenant_type);
