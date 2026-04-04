-- CRM Companies (must come before contacts due to FK)
create table if not exists crm_companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references businesses(id) on delete cascade,
  name text not null,
  domain text,
  industry text,
  headcount_range text,
  revenue_estimate text,
  funded boolean default false,
  linkedin_url text,
  website text,
  location text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CRM Contacts
create table if not exists crm_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role text,
  company_name text,
  company_id uuid references crm_companies(id),
  linkedin_url text,
  twitter_handle text,
  location text,
  bio text,
  avatar_initials text,
  avatar_color text,
  aria_score integer default 0 check (aria_score >= 0 and aria_score <= 100),
  email_status text default 'unverified' check (email_status in ('live','warning','bounced','unverified')),
  linkedin_status text default 'unknown' check (linkedin_status in ('found','not_found','unknown')),
  company_status text default 'unknown' check (company_status in ('confirmed','warning','unknown')),
  tags text[] default '{}',
  deal_value numeric default 0,
  last_contacted_at timestamptz,
  enriched_at timestamptz,
  enrichment_data jsonb default '{}',
  buying_signals jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CRM Pipeline Stages
create table if not exists crm_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references businesses(id) on delete cascade,
  name text not null,
  position integer not null,
  color text default '#6B7299',
  created_at timestamptz default now()
);

-- CRM Deals
create table if not exists crm_deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references businesses(id) on delete cascade,
  title text not null,
  value numeric default 0,
  stage_id uuid references crm_pipeline_stages(id),
  contact_id uuid references crm_contacts(id),
  company_id uuid references crm_companies(id),
  owner_id uuid,
  aria_score integer default 0,
  engagement_score integer default 0,
  stakeholder_score integer default 0,
  momentum_score integer default 0,
  risk_score integer default 0,
  days_in_stage integer default 0,
  last_activity_at timestamptz,
  expected_close_date date,
  closed_at timestamptz,
  won boolean,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CRM Activities
create table if not exists crm_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references businesses(id) on delete cascade,
  deal_id uuid references crm_deals(id),
  contact_id uuid references crm_contacts(id),
  type text not null check (type in ('call','email','note','meeting','task','enrichment','aria_alert')),
  title text not null,
  body text,
  metadata jsonb default '{}',
  created_by uuid,
  created_at timestamptz default now()
);

-- CRM ARIA Insights
create table if not exists crm_aria_insights (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references businesses(id) on delete cascade,
  deal_id uuid references crm_deals(id),
  contact_id uuid references crm_contacts(id),
  type text not null check (type in ('warning','info','signal','tip')),
  title text not null,
  description text not null,
  action_label text,
  deal_value numeric,
  dismissed boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table crm_contacts enable row level security;
alter table crm_companies enable row level security;
alter table crm_pipeline_stages enable row level security;
alter table crm_deals enable row level security;
alter table crm_activities enable row level security;
alter table crm_aria_insights enable row level security;
