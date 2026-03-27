-- Email log table — tracks all transactional emails sent from Lumio
CREATE TABLE IF NOT EXISTS email_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id  TEXT NOT NULL,
  email_type    TEXT NOT NULL,
  recipient     TEXT NOT NULL,
  sent_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_workspace ON email_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_log_type      ON email_log(email_type);

-- Add welcome_email_sent flag to demo_tenants
ALTER TABLE demo_tenants
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT false;
