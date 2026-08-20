-- Lumio Tennis Coach — portal settings, moved off localStorage.
--
-- Settings (academy name, accreditation, rates, messaging, feature toggles,
-- per-module section visibility) lived only in localStorage, so they were tied to
-- one browser on one device. A coach using an iPhone on court and an iMac at home
-- saw two different portals — which is a blocker for any real pilot.
--
-- Stored as a single JSONB blob rather than typed columns on purpose: CoachSettings
-- changes shape often (every new module adds toggles), and a blob means a new
-- setting never needs a migration. The client keeps localStorage as a synchronous
-- cache and treats this table as the source of truth on load.

CREATE TABLE IF NOT EXISTS coach_settings (
  coach_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Owner-only, matching every other coach_* table (see 110_coach_portal_data).
ALTER TABLE coach_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coach owns rows" ON coach_settings;
CREATE POLICY "Coach owns rows" ON coach_settings FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
