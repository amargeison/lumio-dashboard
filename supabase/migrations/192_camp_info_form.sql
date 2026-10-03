-- Camp player-information form.
--
-- Every camp gets a short form the family (or, on an adult camp, the player)
-- fills in before the first morning: who to ring, what they cannot eat, what
-- they want from the week — and, when the camp is abroad, their flights and
-- room. The link goes out with the sign-up confirmation and the countdown
-- emails, and each link belongs to ONE attendee on ONE camp, so the answers
-- land on that attendee's row and nowhere else.
--
-- coach_camps.info_form     the questions, when the coach has changed them.
--                           NULL means "the standard form for this camp", which
--                           is worked out from the camp itself (adult or junior,
--                           home or overseas) — see src/lib/coach/camp-form.ts.
-- attendees.form_token      the secret in that attendee's link. Long, random,
--                           and never shown to anyone but them and their coach.
-- attendees.form_answers    what they said: { [questionId]: answer }.
-- attendees.form_submitted_at / form_sent_at   when they answered; when the
--                           coach last emailed them the link by hand.

alter table coach_camps add column if not exists info_form jsonb;

alter table coach_camp_attendees add column if not exists form_token text
  default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
alter table coach_camp_attendees add column if not exists form_answers jsonb;
alter table coach_camp_attendees add column if not exists form_submitted_at timestamptz;
alter table coach_camp_attendees add column if not exists form_sent_at timestamptz;

-- Belt and braces: any row the default did not reach gets a token now.
update coach_camp_attendees
   set form_token = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
 where form_token is null;

create unique index if not exists idx_camp_attendees_form_token on coach_camp_attendees (form_token);
