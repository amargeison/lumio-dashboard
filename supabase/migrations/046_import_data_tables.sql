-- Generic imported data table (fallback for any department)
CREATE TABLE IF NOT EXISTS business_imported_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  import_key text NOT NULL,
  data jsonb,
  columns jsonb,
  row_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for business lookups
CREATE INDEX IF NOT EXISTS idx_imported_data_business ON business_imported_data(business_id);
CREATE INDEX IF NOT EXISTS idx_imported_data_key ON business_imported_data(import_key);

-- RLS
ALTER TABLE business_imported_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage imported data"
  ON business_imported_data
  FOR ALL
  USING (true)
  WITH CHECK (true);
