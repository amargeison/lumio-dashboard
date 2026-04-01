-- School staff role hierarchy
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS role_level integer DEFAULT 4;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS reports_to uuid;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS start_date text;
ALTER TABLE school_users ADD COLUMN IF NOT EXISTS phone text;

-- Backfill school roles from existing role column
UPDATE school_users SET role_level = 1 WHERE role IN ('headteacher', 'principal', 'executive_head', 'deputy_head', 'assistant_head');
UPDATE school_users SET role_level = 2 WHERE role IN ('senco', 'dsl', 'bursar', 'office_manager', 'pastoral_lead', 'head_of_year');
UPDATE school_users SET role_level = 3 WHERE role IN ('teacher', 'head_of_department', 'subject_lead', 'nqt');
UPDATE school_users SET role_level = 4 WHERE role_level IS NULL OR role_level = 0;

-- SLT Suite confidential items for schools
CREATE TABLE IF NOT EXISTS slt_suite_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id text NOT NULL,
  type text NOT NULL DEFAULT 'note',
  title text,
  content text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_confidential boolean DEFAULT true,
  slt_only boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_slt_suite_school ON slt_suite_items (school_id);
