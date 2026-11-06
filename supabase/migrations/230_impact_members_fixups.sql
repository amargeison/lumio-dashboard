-- DRAFT — for review; apply by hand in the SQL editor. Rollback: supabase/drafts/230_rollback.sql
--
-- 230_impact_members_fixups.sql
-- Closes the HQ's notes on tp_programmes, tp_venues and tp_staff to coaches and school
-- logins. RLS works on rows, not columns, so the direct read policies go, and the
-- fields those logins need come through functions instead:
--   impact_coach_home()         gains the coach's programmes and venues; venues keep
--                               access_notes and storage_notes and drop notes
--   impact_school_programmes()  a school login's programmes, without notes
--
-- tp_staff_coach_self has no replacement: nothing reads a coach's own row.
-- tp_qr_checkins and tp_attendance don't read these tables as the caller, so their
-- policies are unaffected. HQ policies don't change.
--
-- One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

drop policy if exists tp_programmes_coach on tp_programmes;
drop policy if exists tp_programmes_school on tp_programmes;
drop policy if exists tp_venues_coach on tp_venues;
drop policy if exists tp_staff_coach_self on tp_staff;

create or replace function impact_coach_home(p_hq uuid default null) returns jsonb
language sql stable security definer set search_path = public as $$
  with org as (
    select coalesce(p_hq, impact_hq_for('coach')) as hq
  ), allowed as (
    select hq from org where hq in (select impact_hqs_for('coach'))
  ), kids as (
    select c.* from tp_children c join allowed a on a.hq = c.hq_id where c.id in (select impact_coach_children())
  ), ses as (
    select s.* from tp_sessions s join allowed a on a.hq = s.hq_id where s.id in (select impact_coach_sessions())
  )
  select jsonb_build_object(
    'hq_id', (select hq from allowed),
    'schools', coalesce((
      select jsonb_agg(jsonb_build_object('id', sc.id, 'name', sc.name, 'borough', sc.borough, 'address', sc.address, 'status', sc.status) order by sc.name)
      from tp_schools sc join allowed a on a.hq = sc.hq_id
      where sc.id in (select school_id from tp_programmes where id in (select impact_coach_programmes()))), '[]'::jsonb),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', k.id, 'family_id', k.family_id, 'programme_id', k.programme_id, 'school_id', k.school_id,
        'name', k.name, 'year_group', k.year_group, 'school', sc.name, 'medical_notes', k.medical_notes, 'send', k.send,
        'consent_photo', coalesce(k.photo_consent, false) and coalesce(f.consent_photo, false), 'stickers', k.stickers
      ) order by k.name)
      from kids k
      left join tp_schools sc on sc.id = k.school_id and sc.hq_id = k.hq_id
      left join tp_families f on f.id = k.family_id and f.hq_id = k.hq_id), '[]'::jsonb),
    'programmes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'school_id', p.school_id, 'term_label', p.term_label, 'year_groups', p.year_groups, 'current_week', p.current_week,
        'status', p.status, 'lead_staff_id', p.lead_staff_id, 'venue_id', p.venue_id
      ) order by p.term_label)
      from tp_programmes p join allowed a on a.hq = p.hq_id where p.id in (select impact_coach_programmes())), '[]'::jsonb),
    'venues', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'name', v.name, 'address', v.address, 'postcode', v.postcode, 'courts', v.courts, 'surface', v.surface,
        'access_notes', v.access_notes, 'storage_notes', v.storage_notes, 'session_day', v.session_day, 'session_time', v.session_time
      ) order by v.name)
      from tp_venues v join allowed a on a.hq = v.hq_id where v.id in (select impact_coach_venues())), '[]'::jsonb),
    'families', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'guardian_name', f.guardian_name, 'phone', f.phone, 'emergency_contact', f.emergency_contact) order by f.guardian_name)
      from tp_families f join allowed a on a.hq = f.hq_id where f.id in (select family_id from kids)), '[]'::jsonb),
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'kind', s.kind, 'programme_id', s.programme_id, 'session_date', s.session_date, 'week_number', s.week_number,
        'lead_staff_id', s.lead_staff_id, 'venue_id', s.venue_id, 'venue', v.name
      ) order by s.session_date)
      from ses s left join tp_venues v on v.id = s.venue_id and v.hq_id = s.hq_id), '[]'::jsonb),
    'attendance', coalesce((
      select jsonb_agg(jsonb_build_object('session_id', t.session_id, 'child_id', t.child_id, 'present', t.present, 'via', t.via))
      from tp_attendance t where t.session_id in (select id from ses) and t.child_id in (select id from kids)), '[]'::jsonb),
    'paid', coalesce((
      select jsonb_agg(distinct jsonb_build_object('child_id', p.child_id, 'item_id', p.item_id))
      from tp_pack_payments p where p.child_id in (select id from kids)), '[]'::jsonb)
  )
$$;

create or replace function impact_school_programmes() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'school_id', p.school_id, 'term_label', p.term_label, 'year_groups', p.year_groups, 'current_week', p.current_week, 'status', p.status
  ) order by p.term_label), '[]'::jsonb)
  from tp_programmes p where p.school_id in (select impact_my_schools())
$$;

revoke execute on function impact_school_programmes() from public, anon;
grant execute on function impact_school_programmes() to authenticated;

commit;

notify pgrst, 'reload schema';
