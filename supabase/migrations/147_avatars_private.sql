-- Lumio Tennis — make children's/staff photos PRIVATE (safeguarding/GDPR).
-- The `avatars` bucket was public (guessable, permanent URLs). Flip it to private
-- and rewrite stored avatar_url values from full public URLs down to the bare
-- storage path, so reads are signed on demand (coach via /api/coach/avatar-img;
-- parents server-side in the portal routes).
--
-- ORDER OF DEPLOY (important): ship the CODE first (the avatarSrc() proxy wraps +
-- the signing proxy route + portal-route signing), THEN apply this migration.
-- Applying it before the code is live would break avatar rendering.

-- 1. Rewrite stored values to just the path (strip the domain and any ?v= query).
update coach_players
  set avatar_url = regexp_replace(split_part(avatar_url, '?', 1), '^.*/avatars/', '')
  where avatar_url like '%/avatars/%';

update coach_staff
  set avatar_url = regexp_replace(split_part(avatar_url, '?', 1), '^.*/avatars/', '')
  where avatar_url like '%/avatars/%';

-- 2. Make the bucket private.
update storage.buckets set public = false where id = 'avatars';
