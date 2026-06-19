-- Lumio Tennis Coach — outbound message log (email + SMS).
-- One row per send (which may fan out to several recipients/channels). The
-- per-recipient/channel outcome is captured in `results` for the history view.

CREATE TABLE IF NOT EXISTS coach_messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipients   TEXT,          -- comma-separated recipient names (summary)
  channels     TEXT,          -- e.g. "email, sms"
  subject      TEXT,
  body         TEXT,
  status       TEXT,          -- sent | partial | failed
  results      JSONB,         -- [{ name, channel, ok, detail }]
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_coach ON coach_messages(coach_id);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coach owns rows" ON coach_messages;
CREATE POLICY "Coach owns rows" ON coach_messages FOR ALL TO authenticated
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
