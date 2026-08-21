-- Lumio Tennis Coach — public camp sign-up pages.
--
-- A coach publishes a camp at /camp/<slug>; parents sign their child up and pay a
-- deposit or the full amount straight into the coach's own Stripe account.
--
-- Everything a parent submits lands on the attendee row, which is why it grows so
-- many columns here: the sign-up form IS the roster-onboarding form. Capturing
-- parent_email at sign-up also finally populates the field the under-16 booking
-- confirmations need and which nothing else fills in.

alter table coach_camps add column if not exists signup_slug     text;
alter table coach_camps add column if not exists signup_open     boolean default false;
alter table coach_camps add column if not exists payment_mode    text default 'none';   -- none | deposit | full
alter table coach_camps add column if not exists deposit_amount  numeric;
alter table coach_camps add column if not exists signup_note     text;                  -- coach's own line on the public page

-- One public URL per camp. Partial so camps without a page are unaffected.
create unique index if not exists idx_coach_camps_signup_slug
  on coach_camps (lower(signup_slug)) where signup_slug is not null;

alter table coach_camp_attendees add column if not exists parent_name       text;
alter table coach_camp_attendees add column if not exists parent_email      text;
alter table coach_camp_attendees add column if not exists parent_phone      text;
alter table coach_camp_attendees add column if not exists player_age        integer;
alter table coach_camp_attendees add column if not exists medical_notes     text;
alter table coach_camp_attendees add column if not exists emergency_contact text;
alter table coach_camp_attendees add column if not exists consent_photo     boolean default false;
alter table coach_camp_attendees add column if not exists consent_medical   boolean default false;
-- pending = signed up but payment outstanding · confirmed = place held
alter table coach_camp_attendees add column if not exists status            text default 'confirmed';
alter table coach_camp_attendees add column if not exists amount_pennies    integer;
alter table coach_camp_attendees add column if not exists stripe_session_id text;
alter table coach_camp_attendees add column if not exists source            text default 'coach';  -- coach | signup
alter table coach_camp_attendees add column if not exists signed_up_at      timestamptz;

-- The webhook looks the attendee up by session id when payment completes.
create index if not exists idx_camp_attendees_session on coach_camp_attendees (stripe_session_id);
