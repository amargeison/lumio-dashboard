-- ─── 043 School Email Domain (SSO) ──────────────────────────────────────────
-- Stores the school's email domain for Google/Microsoft SSO matching

ALTER TABLE schools ADD COLUMN IF NOT EXISTS email_domain TEXT;

-- Index for fast domain lookups during OAuth callback
CREATE INDEX IF NOT EXISTS idx_schools_email_domain ON schools(email_domain) WHERE email_domain IS NOT NULL;
