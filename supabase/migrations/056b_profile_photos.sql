-- 056_profile_photos.sql
-- Add profile photo URL column and create storage bucket

ALTER TABLE workspace_staff
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Create the profile-photos storage bucket with public read access
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload profile photos
CREATE POLICY "Authenticated users can upload profile photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos');

-- Allow public read access to profile photos
CREATE POLICY "Public can read profile photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

-- Allow authenticated users to update/overwrite their photos
CREATE POLICY "Authenticated users can update profile photos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'profile-photos');
