-- Workspace contacts table for imported CRM contact data
CREATE TABLE IF NOT EXISTS workspace_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  first_name text,
  last_name text,
  email text,
  company text,
  phone text,
  job_title text,
  tags text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_contacts_business ON workspace_contacts (business_id);
CREATE INDEX IF NOT EXISTS idx_workspace_contacts_email ON workspace_contacts (business_id, email);
