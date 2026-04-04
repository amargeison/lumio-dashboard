create table if not exists school_incidents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id),
  created_at timestamptz default now(),
  initiated_by text,
  lockdown_type text, -- 'genuine' or 'drill'
  incident_type text,
  description text,
  location text,
  outcome text,
  outcome_notes text,
  timeline jsonb,
  communications_sent jsonb,
  stand_down_at timestamptz,
  report_pdf_url text
);
