-- ─── 040 Demo Data Tables ───────────────────────────────────────────────────
-- Tables for business-scoped demo data inserted by /api/onboarding/load-demo

-- ── New tables ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_employees (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT,
  role                TEXT NOT NULL,
  department          TEXT NOT NULL,
  salary              NUMERIC,
  start_date          DATE,
  leave_balance_days  INTEGER DEFAULT 25,
  status              TEXT NOT NULL DEFAULT 'active',
  avatar              TEXT,
  is_demo             BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_meetings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  starts_at         TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  attendees         TEXT[] DEFAULT '{}',
  location          TEXT,
  type              TEXT NOT NULL DEFAULT 'video',
  source            TEXT NOT NULL DEFAULT 'manual',
  link              TEXT,
  is_demo           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_finance_monthly (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  month         DATE NOT NULL,
  revenue       NUMERIC NOT NULL DEFAULT 0,
  expenses      NUMERIC NOT NULL DEFAULT 0,
  is_demo       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL,
  company         TEXT NOT NULL,
  amount          NUMERIC NOT NULL,
  due_date        DATE NOT NULL,
  paid_date       DATE,
  status          TEXT NOT NULL DEFAULT 'unpaid',
  is_demo         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  due             TEXT,
  priority        TEXT NOT NULL DEFAULT 'medium',
  category        TEXT,
  source          TEXT NOT NULL DEFAULT 'manual',
  assignee        TEXT,
  done            BOOLEAN NOT NULL DEFAULT false,
  overdue         BOOLEAN NOT NULL DEFAULT false,
  linked_workflow TEXT,
  is_demo         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_compliance_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  log_type      TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  severity      TEXT NOT NULL DEFAULT 'medium',
  status        TEXT NOT NULL DEFAULT 'open',
  reported_by   TEXT,
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  is_demo       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_biz_employees_bid   ON business_employees(business_id);
CREATE INDEX IF NOT EXISTS idx_biz_meetings_bid    ON business_meetings(business_id);
CREATE INDEX IF NOT EXISTS idx_biz_finance_bid     ON business_finance_monthly(business_id);
CREATE INDEX IF NOT EXISTS idx_biz_invoices_bid    ON business_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_biz_tasks_bid       ON business_tasks(business_id);
CREATE INDEX IF NOT EXISTS idx_biz_compliance_bid  ON business_compliance_logs(business_id);

-- ── Add business_id + is_demo to existing tables ────────────────────────────

ALTER TABLE hr_onboardings         ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE hr_onboardings         ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE hr_leave_requests      ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE hr_leave_requests      ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE hr_performance_reviews ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE hr_performance_reviews ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE crm_deals              ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE crm_deals              ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
