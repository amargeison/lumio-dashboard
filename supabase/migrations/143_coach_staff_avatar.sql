-- Coach profile photos, mirroring players. Stored in the public 'avatars' bucket;
-- the URL lives here. The head coach's own photo lives in their local settings
-- (no coach_staff row for the head).
alter table coach_staff add column if not exists avatar_url text;
