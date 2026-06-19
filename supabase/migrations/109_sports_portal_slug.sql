-- Sports portal slug: the URL slug that resolves an account's live portal
-- (e.g. /tennis/coach/new-malden-tennis). Set at signup from the club name and
-- editable from the sports-admin account detail page, so Impersonate opens the
-- real portal instead of the demo.

ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS portal_slug TEXT;

-- Backfill existing rows from brand_name where we have one (matches the
-- client-side slugify: lowercase, non-alphanumerics → '-', trim leading/trailing).
UPDATE sports_profiles
SET portal_slug = trim(both '-' from regexp_replace(lower(brand_name), '[^a-z0-9]+', '-', 'g'))
WHERE portal_slug IS NULL
  AND brand_name IS NOT NULL
  AND brand_name <> '';

CREATE INDEX IF NOT EXISTS idx_sports_profiles_portal_slug ON sports_profiles(portal_slug);
