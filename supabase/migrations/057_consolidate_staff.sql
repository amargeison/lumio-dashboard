-- Consolidate staff data onto workspace_staff as the single source of truth
-- Add columns that were previously only on business_employees

ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS microsoft_job_title text;
ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS microsoft_department text;
ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS department_assigned boolean DEFAULT false;
ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS department_assignment_pending boolean DEFAULT false;

-- Re-run role backfill to catch any new records
UPDATE workspace_staff SET role = 'director', role_level = 1
WHERE (role IS NULL OR role = 'user') AND (
  job_title ~* '\y(md|managing director|ceo|chief executive|coo|chief operating|cfo|chief financial|fd|finance director|cto|chief technology|ciso|chairman|president|founder|co-founder|owner|partner|principal)\y'
  OR job_title ~* '\y(director|chief|president|founder)\y'
);

UPDATE workspace_staff SET role = 'admin', role_level = 2
WHERE (role IS NULL OR role = 'user') AND (
  job_title ~* '\y(office manager|executive assistant|hr manager|people manager|operations manager)\y'
  OR job_title ~* '\y(head of|vp|vice president)\y'
);

UPDATE workspace_staff SET role = 'manager', role_level = 3
WHERE (role IS NULL OR role = 'user') AND job_title ~* '\y(manager|lead|supervisor|team lead|senior)\y';
