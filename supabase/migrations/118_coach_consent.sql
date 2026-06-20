-- Lumio Tennis Coach — GDPR / consent for processing children's data.
-- Per-player consent records + academy-level Data Processing Agreement.

ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS consent_data    BOOLEAN DEFAULT FALSE; -- parental consent to process data
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS consent_photo   BOOLEAN DEFAULT FALSE; -- photography / video consent
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS consent_medical BOOLEAN DEFAULT FALSE; -- consent to hold medical info
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS consent_by      TEXT;                  -- name of parent/guardian giving consent
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS consent_date    DATE;
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS medical_notes   TEXT;

-- Academy accepted Lumio's Data Processing Agreement (Lumio = processor, coach = controller).
ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS dpa_accepted_at TIMESTAMPTZ;
