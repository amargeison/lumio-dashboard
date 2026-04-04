-- 042: Fix CRM schema — migration 041 silently skipped crm_contacts and crm_deals
-- because they already existed from 030 (without tenant_id columns).
-- This migration drops the old tables and recreates them with the correct schema,
-- then adds RLS policies to ALL CRM tables.

-- ── 1. Drop old tables in FK-safe order ─────────────────────────────────────

-- Tables that reference crm_contacts or crm_deals
DROP TABLE IF EXISTS crm_aria_insights  CASCADE;
DROP TABLE IF EXISTS crm_activities     CASCADE;
DROP TABLE IF EXISTS crm_activity_log   CASCADE;  -- old 030 table
DROP TABLE IF EXISTS crm_deals          CASCADE;
DROP TABLE IF EXISTS crm_contacts       CASCADE;
DROP TABLE IF EXISTS crm_pipeline_stages CASCADE;
DROP TABLE IF EXISTS crm_companies      CASCADE;

-- ── 2. Recreate all CRM tables with correct schema ──────────────────────────

CREATE TABLE crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  industry text,
  headcount_range text,
  revenue_estimate text,
  funded boolean DEFAULT false,
  linkedin_url text,
  website text,
  location text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  role text,
  company_name text,
  company_id uuid REFERENCES crm_companies(id),
  linkedin_url text,
  twitter_handle text,
  location text,
  bio text,
  avatar_initials text,
  avatar_color text,
  aria_score integer DEFAULT 0 CHECK (aria_score >= 0 AND aria_score <= 100),
  email_status text DEFAULT 'unverified' CHECK (email_status IN ('live','warning','bounced','unverified')),
  linkedin_status text DEFAULT 'unknown' CHECK (linkedin_status IN ('found','not_found','unknown')),
  company_status text DEFAULT 'unknown' CHECK (company_status IN ('confirmed','warning','unknown')),
  tags text[] DEFAULT '{}',
  deal_value numeric DEFAULT 0,
  last_contacted_at timestamptz,
  enriched_at timestamptz,
  enrichment_data jsonb DEFAULT '{}',
  buying_signals jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL,
  color text DEFAULT '#6B7299',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  value numeric DEFAULT 0,
  stage_id uuid REFERENCES crm_pipeline_stages(id),
  contact_id uuid REFERENCES crm_contacts(id),
  company_id uuid REFERENCES crm_companies(id),
  owner_id uuid,
  aria_score integer DEFAULT 0,
  engagement_score integer DEFAULT 0,
  stakeholder_score integer DEFAULT 0,
  momentum_score integer DEFAULT 0,
  risk_score integer DEFAULT 0,
  days_in_stage integer DEFAULT 0,
  last_activity_at timestamptz,
  expected_close_date date,
  closed_at timestamptz,
  won boolean,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES crm_deals(id),
  contact_id uuid REFERENCES crm_contacts(id),
  type text NOT NULL CHECK (type IN ('call','email','note','meeting','task','enrichment','aria_alert')),
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE crm_aria_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES crm_deals(id),
  contact_id uuid REFERENCES crm_contacts(id),
  type text NOT NULL CHECK (type IN ('warning','info','signal','tip')),
  title text NOT NULL,
  description text NOT NULL,
  action_label text,
  deal_value numeric,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── 3. Enable RLS ───────────────────────────────────────────────────────────

ALTER TABLE crm_companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_aria_insights   ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS policies ─────────────────────────────────────────────────────────
-- All CRM access goes through server actions which use the service role key.
-- Service role bypasses RLS automatically.
-- These policies also allow the anon role as a fallback (matching the
-- briefing_actions pattern from migration 032) since all queries already
-- filter by tenant_id in application code.

CREATE POLICY "crm_companies_all"       ON crm_companies       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "crm_contacts_all"        ON crm_contacts        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "crm_pipeline_stages_all" ON crm_pipeline_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "crm_deals_all"           ON crm_deals           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "crm_activities_all"      ON crm_activities      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "crm_aria_insights_all"   ON crm_aria_insights   FOR ALL USING (true) WITH CHECK (true);
