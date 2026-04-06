-- Add columns to store Resend scheduled email IDs for cancellation on upgrade
ALTER TABLE demo_tenants ADD COLUMN IF NOT EXISTS followup_email_id TEXT;
ALTER TABLE demo_tenants ADD COLUMN IF NOT EXISTS followup_14d_email_id TEXT;

-- Schools table (if schools have their own trial flow)
ALTER TABLE schools ADD COLUMN IF NOT EXISTS followup_email_id TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS followup_14d_email_id TEXT;
