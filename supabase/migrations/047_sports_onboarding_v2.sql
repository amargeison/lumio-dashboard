ALTER TABLE sports_profiles
  ADD COLUMN IF NOT EXISTS portal_slug text,
  ADD COLUMN IF NOT EXISTS slug_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS enabled_features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_type text,
  ADD COLUMN IF NOT EXISTS setup_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS club_name text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS invites jsonb DEFAULT '[]'::jsonb;
