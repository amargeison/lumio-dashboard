-- Add onboarding fields to demo_sessions
ALTER TABLE demo_sessions
  ADD COLUMN IF NOT EXISTS onboarded             BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_departments  JSONB   DEFAULT '[]';
