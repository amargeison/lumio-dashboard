-- Customer intelligence tables

CREATE TABLE IF NOT EXISTS account_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_slug TEXT NOT NULL,
  account_type TEXT NOT NULL,
  research JSONB NOT NULL,
  researched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_slug, account_type)
);

CREATE INDEX IF NOT EXISTS idx_account_research_slug ON account_research(account_slug);
CREATE INDEX IF NOT EXISTS idx_activity_log_slug_created ON activity_log(account_slug, created_at DESC);
