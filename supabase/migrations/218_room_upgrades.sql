-- 218 — Room upgrades on camps and trips.
--
--   coach_camps            the rooms a family can choose, each with its
--                          supplement on top of the price of the place
--   coach_camp_attendees   the room chosen and its supplement (added to what
--                          the place costs), and the balance the family agreed
--                          could be taken from their card — so a later upgrade
--                          is never taken from the card without asking them
--
-- Safe to run twice.

alter table coach_camps add column if not exists room_options jsonb not null default '[]'::jsonb;

alter table coach_camp_attendees add column if not exists extra_pennies          integer not null default 0;
alter table coach_camp_attendees add column if not exists extra_label            text;
alter table coach_camp_attendees add column if not exists balance_agreed_pennies integer;

alter table coach_camp_attendees drop constraint if exists coach_camp_attendees_extra_ok;
alter table coach_camp_attendees add constraint coach_camp_attendees_extra_ok check (extra_pennies >= 0 and extra_pennies <= 1000000);

notify pgrst, 'reload schema';
