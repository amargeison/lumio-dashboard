-- Track the tenant_type column on demo_tenants. This mirrors an emergency
-- ALTER that was applied directly in Supabase after the insert in
-- /api/demo/signup started writing `tenant_type` without a migration.
--
-- The previous column `portal_type` (added in migration 035) is kept in
-- place for backwards-compat; `tenant_type` is the new canonical name used
-- across the codebase (middleware, check-slug, [slug]/page.tsx, etc).

ALTER TABLE demo_tenants
  ADD COLUMN IF NOT EXISTS tenant_type text DEFAULT 'business';

-- Backfill tenant_type from portal_type for any existing rows that only
-- had the old column populated.
UPDATE demo_tenants
  SET tenant_type = portal_type
  WHERE tenant_type IS NULL
    AND portal_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_demo_tenants_tenant_type
  ON demo_tenants(tenant_type);
