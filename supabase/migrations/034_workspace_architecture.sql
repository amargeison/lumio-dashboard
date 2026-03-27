-- Workspace architecture: trial → live conversion support
-- Adds columns to demo_tenants for workspace type tracking and live workspace linking

ALTER TABLE demo_tenants
  ADD COLUMN IF NOT EXISTS workspace_type TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS live_workspace_id UUID,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- Index for cleanup queries and workspace type filtering
CREATE INDEX IF NOT EXISTS idx_demo_tenants_workspace_type ON demo_tenants(workspace_type);

-- Backfill: mark already-converted workspaces as 'live' type
UPDATE demo_tenants
  SET workspace_type = 'live', converted_at = activated_at
  WHERE status = 'converted' AND workspace_type = 'trial';
