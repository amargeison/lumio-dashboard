-- ============================================================================
-- 063: CRM Dedupe System — Merge audit log and duplicate tracking fields
-- ============================================================================

-- Merge audit log
CREATE TABLE IF NOT EXISTS crm_merge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contact', 'company')),
  winner_id UUID NOT NULL,
  loser_id UUID NOT NULL,
  winner_snapshot JSONB,
  loser_snapshot JSONB,
  merged_fields TEXT[],
  merge_notes TEXT,
  merged_by TEXT DEFAULT 'user',
  confidence_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add dedupe fields to contacts and companies
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS duplicate_score INTEGER DEFAULT 0;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES crm_contacts(id);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS dedupe_reviewed_at TIMESTAMPTZ;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS duplicate_score INTEGER DEFAULT 0;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS duplicate_of UUID REFERENCES crm_companies(id);
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS dedupe_reviewed_at TIMESTAMPTZ;

-- Index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_phone ON crm_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_crm_companies_name ON crm_companies(name);
