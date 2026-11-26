-- Rollback for 237_impact_community.sql. Removes everything 237 added, including the
-- sign-up audit trail, weekend intents and every family's check-in code (printed QR codes
-- stop working). Attendance recorded by check-in is kept.
begin;
drop function if exists impact_parent_set_intent(uuid, date, boolean);
drop function if exists impact_parent_weekend();
drop function if exists impact_weekend_day(uuid, uuid, date);
drop function if exists impact_family_checkin(uuid, uuid, text, date);
drop table if exists tp_weekend_intents;
drop table if exists tp_community_signups;
alter table tp_venues drop column if exists capacity;
drop index if exists tp_families_checkin_code_key;
drop index if exists idx_tp_families_community_venue;
alter table tp_families drop column if exists checkin_code;
alter table tp_families drop column if exists waitlisted_at;
alter table tp_families drop column if exists lapsed_at;
alter table tp_families drop column if exists signed_up_at;
alter table tp_families drop column if exists community_venue_id;
alter table tp_families drop column if exists source;
drop function if exists impact_new_checkin_code();
commit;
notify pgrst, 'reload schema';
