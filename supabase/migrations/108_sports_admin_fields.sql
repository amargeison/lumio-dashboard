-- Sports admin: per-account admin notes + suspend status.
-- Used by the sports-admin account detail page (Admin Notes + Danger Zone),
-- mirroring the CMS businesses admin.

ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE sports_profiles ADD COLUMN IF NOT EXISTS status TEXT;
