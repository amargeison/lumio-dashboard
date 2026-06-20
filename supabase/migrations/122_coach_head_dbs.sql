-- Lumio Tennis Coach — the head coach's own DBS & safeguarding record.
-- Distinct from coach_staff DBS (migration 119, which covers the wider team).
-- Captured in the onboarding wizard and editable in Settings → Head coach profile.

ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS head_coach_dbs_number       TEXT;
ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS head_coach_dbs_expiry        DATE;
ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS head_coach_safeguarding_date DATE;
