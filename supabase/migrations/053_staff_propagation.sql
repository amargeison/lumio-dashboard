-- 053_staff_propagation.sql
-- Tables for staff propagation across HR, Accounts, and IT

CREATE TABLE IF NOT EXISTS workspace_payroll (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  employee_id text,
  first_name text,
  last_name text,
  email text,
  job_title text,
  department text,
  salary numeric,
  pay_frequency text DEFAULT 'monthly',
  bank_details_pending boolean DEFAULT true,
  start_date text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, email)
);

CREATE TABLE IF NOT EXISTS workspace_it_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  employee_id text,
  first_name text,
  last_name text,
  email text,
  department text,
  laptop_assigned boolean DEFAULT false,
  laptop_model text,
  phone_assigned boolean DEFAULT false,
  phone_model text,
  system_access text[] DEFAULT '{}',
  it_onboarding_complete boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, email)
);

CREATE TABLE IF NOT EXISTS workspace_employee_checklist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  employee_id text,
  employee_name text,
  email text,
  department text,
  hr_contract_sent boolean DEFAULT false,
  hr_handbook_sent boolean DEFAULT false,
  hr_induction_booked boolean DEFAULT false,
  accounts_bank_details boolean DEFAULT false,
  accounts_payroll_set_up boolean DEFAULT false,
  it_laptop_assigned boolean DEFAULT false,
  it_accounts_created boolean DEFAULT false,
  it_access_granted boolean DEFAULT false,
  it_equipment_delivered boolean DEFAULT false,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, email)
);

CREATE INDEX IF NOT EXISTS idx_workspace_payroll_business
  ON workspace_payroll(business_id);
CREATE INDEX IF NOT EXISTS idx_workspace_it_assets_business
  ON workspace_it_assets(business_id);
CREATE INDEX IF NOT EXISTS idx_workspace_employee_checklist_business
  ON workspace_employee_checklist(business_id);
