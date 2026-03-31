-- Workspace staff table for imported employee data
CREATE TABLE IF NOT EXISTS workspace_staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  first_name text,
  last_name text,
  email text,
  job_title text,
  department text,
  phone text,
  start_date text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspace_staff_business ON workspace_staff (business_id);
CREATE INDEX IF NOT EXISTS idx_workspace_staff_email ON workspace_staff (business_id, email);
