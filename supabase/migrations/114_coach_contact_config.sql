-- Lumio Tennis Coach — contact + calendar config on the coach's own profile.
-- Drives Messages (email/text channels), Settings, and dashboard "set up" prompts.

ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS contact_email     TEXT;
ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS contact_phone     TEXT;
ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS calendar_provider TEXT;
