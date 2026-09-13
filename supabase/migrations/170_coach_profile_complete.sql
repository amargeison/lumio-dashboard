-- ─────────────────────────────────────────────────────────────────────────────
-- Has this coach finished setting themselves up?
--
-- The head coach creates a coach_staff row with a name and maybe an email. Photo,
-- accreditation, DBS and safeguarding are the coach's own to add, and they are
-- prompted for them once, on first sign-in.
--
-- Explicit rather than inferred, for the same reason equipment_own is (migration
-- 168): "I went through setup and chose to skip the DBS" and "I have never seen
-- setup" are different states. Inferring from whether dbs_number is null would
-- re-run the wizard at every sign-in for a coach who has no DBS yet — which is
-- most apprentices, and exactly the people least helped by being nagged.
alter table coach_staff add column if not exists profile_complete boolean default false;

-- Anyone already carrying real detail has plainly been set up, by themselves or
-- by their head coach. Don't send them through a wizard to confirm what is
-- already on the screen.
update coach_staff
   set profile_complete = true
 where profile_complete is not true
   and (avatar_url is not null or dbs_number is not null or qualifications is not null);
