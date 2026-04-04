-- Role hierarchy for business employees
ALTER TABLE business_employees ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE business_employees ADD COLUMN IF NOT EXISTS role_level integer DEFAULT 4;
ALTER TABLE business_employees ADD COLUMN IF NOT EXISTS reports_to uuid;

-- Workspace owner role
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_role text DEFAULT 'superadmin';

-- Directors Suite confidential items
CREATE TABLE IF NOT EXISTS director_suite_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  type text NOT NULL DEFAULT 'note',
  title text,
  content text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_confidential boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_director_suite_business ON director_suite_items (business_id);
