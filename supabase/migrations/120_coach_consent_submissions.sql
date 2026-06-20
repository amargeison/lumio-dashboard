-- Lumio Tennis Coach — parent-facing consent form submissions.
-- A public form (no parent login) writes here via a service-role route; the
-- coach reviews each and applies it to a player. Owner-only RLS for the coach;
-- public inserts go through the service role and bypass RLS.

CREATE TABLE IF NOT EXISTS coach_consent_submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name      TEXT,
  child_age       INTEGER,
  parent_name     TEXT,
  parent_email    TEXT,
  consent_data    BOOLEAN DEFAULT FALSE,
  consent_photo   BOOLEAN DEFAULT FALSE,
  consent_medical BOOLEAN DEFAULT FALSE,
  medical_notes   TEXT,
  status          TEXT DEFAULT 'pending',  -- pending | applied
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_consent_sub_coach ON coach_consent_submissions(coach_id);

ALTER TABLE coach_consent_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coach owns rows" ON coach_consent_submissions;
CREATE POLICY "Coach owns rows" ON coach_consent_submissions FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
