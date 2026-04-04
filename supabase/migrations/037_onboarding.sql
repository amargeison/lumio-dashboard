-- Onboarding columns for businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_data_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}';
