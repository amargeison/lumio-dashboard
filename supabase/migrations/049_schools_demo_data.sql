-- 049_schools_demo_data.sql
-- Add demo_data_active flag to schools table (mirrors businesses table pattern)

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS demo_data_active BOOLEAN DEFAULT false;
