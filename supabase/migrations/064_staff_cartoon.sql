-- ============================================================================
-- 064: Workspace staff cartoon avatar URL
-- ============================================================================

ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS cartoon_url TEXT;
