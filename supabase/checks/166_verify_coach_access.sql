-- ─────────────────────────────────────────────────────────────────────────────
-- Verification for migration 166. Changes nothing; safe to run repeatedly.
--
-- ⚠ THE SUPABASE SQL EDITOR RUNS AS THE SERVICE ROLE, WHICH BYPASSES RLS.
--
-- Run the queries plainly and every count comes back as the whole table, it all
-- looks correct, and you have learned nothing. The giveaway is `who am i`
-- returning null. The blocks below impersonate a real user so the policies
-- actually apply.
--
-- Find the uuids to paste in with:
--
--   select p.id, p.display_name, p.contact_email from sports_profiles p
--   where exists (select 1 from coach_players c where c.coach_id = p.id);
--
--   select member_user_id, email, role, status, staff_id from coach_members;
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1. AS THE HEAD COACH ═════════════════════════════════════════════════════
-- Every count here must match what you saw before migration 166. The policies
-- are additive, so a drop anywhere means something is wrong.

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"PASTE-HEAD-COACH-UUID","role":"authenticated"}';

  select 'who am i' as check, coalesce(auth.uid()::text, '⚠ NULL — still the service role') as value
  union all select 'coach_players',       count(*)::text from coach_players
  union all select 'coach_bookings',      count(*)::text from coach_bookings
  union all select 'coach_sessions',      count(*)::text from coach_sessions
  union all select 'coach_payments',      count(*)::text from coach_payments
  union all select 'coach_camp_attendees',count(*)::text from coach_camp_attendees
  union all select 'coach_settings',      count(*)::text from coach_settings
  union all select 'coach_staff',         count(*)::text from coach_staff;
rollback;


-- ══ 2. AS AN ASSISTANT COACH ═════════════════════════════════════════════════
-- Needs a coach_members row with status='active' and a staff_id. An invited-but-
-- never-signed-in coach correctly sees nothing, which tells you nothing either.

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"PASTE-ASSISTANT-UUID","role":"authenticated"}';

  select 'who am i' as check, coalesce(auth.uid()::text, '⚠ NULL — still the service role') as value
  union all select 'my membership',
    coalesce((select role || ' / ' || status || ' / staff_id ' || coalesce(staff_id::text, 'NOT SET ⚠')
              from coach_members where member_user_id = auth.uid() limit 1), '⚠ none — cannot test')

  union all select '— should be only theirs —', ''
  union all select 'coach_players',        count(*)::text from coach_players
  union all select 'coach_bookings',       count(*)::text from coach_bookings
  union all select 'coach_sessions',       count(*)::text from coach_sessions
  union all select 'coach_player_skills',  count(*)::text from coach_player_skills

  union all select '— shared, expect the academy total —', ''
  union all select 'coach_staff',     count(*)::text from coach_staff
  union all select 'coach_venues',    count(*)::text from coach_venues
  union all select 'coach_resources', count(*)::text from coach_resources

  union all select '— MUST ALL BE 0 —', ''
  union all select 'coach_payments',            count(*)::text from coach_payments
  union all select 'coach_charges',             count(*)::text from coach_charges
  union all select 'coach_camp_attendees',      count(*)::text from coach_camp_attendees
  union all select 'coach_messages',            count(*)::text from coach_messages
  union all select 'coach_settings',            count(*)::text from coach_settings
  union all select 'coach_consent_submissions', count(*)::text from coach_consent_submissions;
rollback;


-- ══ 3. THE ONE THAT WOULD ACTUALLY HURT ══════════════════════════════════════
-- Cross-academy leakage. Must return ZERO rows.

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"PASTE-ASSISTANT-UUID","role":"authenticated"}';

  select 'LEAK — another academy''s player is visible' as problem, p.id, p.name, p.coach_id
  from coach_players p
  where p.coach_id <> auth.uid()
    and p.coach_id not in (
      select academy_id from coach_members
      where member_user_id = auth.uid() and status = 'active'
    );
rollback;


-- ══ 4. WRITES, NOT JUST READS ════════════════════════════════════════════════
-- A policy that reads correctly can still permit a bad write. An assistant
-- reassigning an unassigned player to themselves would be a way to help
-- themselves to the head coach's roster.
--
-- Expect: UPDATE 0. Anything else means the WITH CHECK clause is wrong.

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"PASTE-ASSISTANT-UUID","role":"authenticated"}';

  update coach_players
     set staff_id = (select staff_id from coach_members
                     where member_user_id = auth.uid() and status = 'active' limit 1)
   where staff_id is null;
rollback;   -- nothing is kept either way
