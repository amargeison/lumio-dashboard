-- School workspace architecture: trial → live conversion support
-- Mirrors the business portal architecture from migration 034

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS workspace_type TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS live_school_id UUID,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_schools_workspace_type ON schools(workspace_type);

-- Add portal_type to demo_tenants to distinguish business vs school
ALTER TABLE demo_tenants
  ADD COLUMN IF NOT EXISTS portal_type TEXT DEFAULT 'business';
