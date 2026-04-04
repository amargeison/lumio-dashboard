-- Integration OAuth tokens storage
CREATE TABLE IF NOT EXISTS integration_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  provider text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  profile_email text,
  profile_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integration_tokens_business ON integration_tokens (business_id);
