-- Add role columns to workspace_staff (where job_title lives)
ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS role_level integer DEFAULT 4;
ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS reports_to uuid;
ALTER TABLE workspace_staff ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- Backfill roles from existing job_title data
UPDATE workspace_staff SET role = 'director', role_level = 1
WHERE role = 'user' AND (
  job_title ~* '\y(md|managing director|ceo|chief executive|coo|chief operating|cfo|chief financial|fd|finance director|cto|chief technology|ciso|chairman|president|founder|co-founder|owner|partner|principal)\y'
  OR job_title ~* '\y(director|chief|president|founder)\y'
);

UPDATE workspace_staff SET role = 'admin', role_level = 2
WHERE role = 'user' AND (
  job_title ~* '\y(office manager|executive assistant|hr manager|people manager|operations manager)\y'
  OR job_title ~* '\y(head of|vp|vice president)\y'
);

UPDATE workspace_staff SET role = 'manager', role_level = 3
WHERE role = 'user' AND job_title ~* '\y(manager|lead|supervisor|team lead|senior)\y';
