-- Waitlist for lumiocms.com coming-soon pages (Lumio Business + Lumio Schools).
-- Writes are performed server-side via the service-role key in
-- src/app/api/waitlist/route.ts. RLS is enabled with no public policies,
-- so anon/authenticated clients cannot read or insert directly.

CREATE TABLE IF NOT EXISTS lumio_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL CHECK (source IN ('business', 'schools')),
  name text,
  company text,
  role text,
  use_case text,
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_waitlist_source ON lumio_waitlist(source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email_source ON lumio_waitlist(email, source);

ALTER TABLE lumio_waitlist ENABLE ROW LEVEL SECURITY;
