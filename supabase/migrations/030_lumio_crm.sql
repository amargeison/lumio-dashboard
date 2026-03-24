-- ─── 030 Lumio CRM ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  email          TEXT,
  phone          TEXT,
  job_title      TEXT,
  company        TEXT,
  status         TEXT DEFAULT 'lead',  -- lead, trial, customer, cold, churned
  source         TEXT,                 -- demo, referral, inbound, outbound, event
  owner          TEXT,
  notes          TEXT,
  last_contacted TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  company          TEXT NOT NULL,
  value_annual     INTEGER,
  stage            TEXT DEFAULT 'lead', -- lead, qualified, demo, proposal, closing, won, lost
  heat             TEXT DEFAULT 'warm', -- hot, warm, cold
  owner            TEXT,
  next_action      TEXT,
  next_action_date DATE,
  notes            TEXT,
  won_at           TIMESTAMPTZ,
  lost_at          TIMESTAMPTZ,
  lost_reason      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activity_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id    UUID REFERENCES crm_deals(id)    ON DELETE SET NULL,
  type       TEXT NOT NULL,   -- call, email, meeting, note, stage_change, conversion
  title      TEXT NOT NULL,
  body       TEXT,
  logged_by  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE crm_contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm_contacts_select"     ON crm_contacts;
DROP POLICY IF EXISTS "crm_contacts_insert"     ON crm_contacts;
DROP POLICY IF EXISTS "crm_contacts_update"     ON crm_contacts;
DROP POLICY IF EXISTS "crm_deals_select"        ON crm_deals;
DROP POLICY IF EXISTS "crm_deals_insert"        ON crm_deals;
DROP POLICY IF EXISTS "crm_deals_update"        ON crm_deals;
DROP POLICY IF EXISTS "crm_activity_select"     ON crm_activity_log;
DROP POLICY IF EXISTS "crm_activity_insert"     ON crm_activity_log;

CREATE POLICY "crm_contacts_select" ON crm_contacts     FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_contacts_insert" ON crm_contacts     FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_contacts_update" ON crm_contacts     FOR UPDATE TO authenticated USING (true);

CREATE POLICY "crm_deals_select"    ON crm_deals        FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_deals_insert"    ON crm_deals        FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_deals_update"    ON crm_deals        FOR UPDATE TO authenticated USING (true);

CREATE POLICY "crm_activity_select" ON crm_activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_activity_insert" ON crm_activity_log FOR INSERT TO authenticated WITH CHECK (true);
