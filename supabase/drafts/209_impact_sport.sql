-- DRAFT — NOT APPLIED. For review; move to supabase/migrations/ and apply by hand.
--
-- 209_impact_sport.sql
-- Allow Lumio Impact HQ accounts to sign up. The live Impact portal
-- (/impact/<slug>, src/lib/impact/use-live-impact.ts) recognises a signed-in
-- HQ by a sports_profiles row with sport = 'impact', but the check constraint
-- (last recreated in 107_coach_sport.sql) rejects that value with:
--   new row for relation "sports_profiles" violates check constraint
--   "sports_profiles_sport_check"
-- Until this is applied every visitor to a live Impact portal gets the empty
-- founder view, which is the intended day-one state.
--
-- Before applying: confirm the live constraint still matches 107's list
-- (anything added directly in the dashboard since would be dropped here):
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conname = 'sports_profiles_sport_check';

ALTER TABLE sports_profiles DROP CONSTRAINT IF EXISTS sports_profiles_sport_check;

ALTER TABLE sports_profiles ADD CONSTRAINT sports_profiles_sport_check
  CHECK (sport IN (
    'tennis','golf','darts','boxing','cricket','rugby',
    'football','nonleague','grassroots','womens','junior','coach',
    'impact'
  ));
