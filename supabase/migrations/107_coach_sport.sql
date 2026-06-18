-- 107_coach_sport.sql
-- Allow the Tennis Coach product to sign up. The original sports_profiles check
-- constraint (087_sports_auth.sql) only permitted the player/club sports, so a
-- coach profile (sport = 'coach') was rejected with:
--   new row for relation "sports_profiles" violates check constraint
--   "sports_profiles_sport_check"
-- Recreate the constraint with the full current set including 'junior' and 'coach'.

ALTER TABLE sports_profiles DROP CONSTRAINT IF EXISTS sports_profiles_sport_check;

ALTER TABLE sports_profiles ADD CONSTRAINT sports_profiles_sport_check
  CHECK (sport IN (
    'tennis','golf','darts','boxing','cricket','rugby',
    'football','nonleague','grassroots','womens','junior','coach'
  ));
