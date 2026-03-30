-- Create logos storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read logos
CREATE POLICY "Anyone can read logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

-- Authenticated users can upload logos
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'logos');

-- Authenticated users can update their logos
CREATE POLICY "Authenticated users can update logos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'logos');
