-- 055_sso_department_fields.sql
-- Add Microsoft SSO profile fields to business_employees for department auto-matching

ALTER TABLE business_employees
  ADD COLUMN IF NOT EXISTS microsoft_job_title TEXT,
  ADD COLUMN IF NOT EXISTS microsoft_department TEXT,
  ADD COLUMN IF NOT EXISTS department_assigned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS department_assignment_pending BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sso_provider TEXT,
  ADD COLUMN IF NOT EXISTS sso_first_login_at TIMESTAMPTZ;

-- Also add to workspace_staff for imported-then-SSO-matched employees
ALTER TABLE workspace_staff
  ADD COLUMN IF NOT EXISTS microsoft_job_title TEXT,
  ADD COLUMN IF NOT EXISTS microsoft_department TEXT,
  ADD COLUMN IF NOT EXISTS sso_provider TEXT;
