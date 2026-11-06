-- ROLLBACK for 230_impact_members_fixups.sql. Run by hand in the SQL editor only if 230
-- has to be undone. Puts the four read policies and impact_coach_home() back exactly as
-- 229 left them and drops impact_school_programmes(). Safe to run twice.
-- The app deployed with 230 reads programmes and venues from impact_coach_home(), so
-- rolling this back without rolling the app back leaves coaches with an empty view.

begin;

drop policy if exists tp_programmes_coach on tp_programmes;
create policy tp_programmes_coach on tp_programmes for select to authenticated using (id in (select impact_coach_programmes()));
drop policy if exists tp_programmes_school on tp_programmes;
create policy tp_programmes_school on tp_programmes for select to authenticated using (school_id in (select impact_my_schools()));
drop policy if exists tp_venues_coach on tp_venues;
create policy tp_venues_coach on tp_venues for select to authenticated using (id in (select impact_coach_venues()));
drop policy if exists tp_staff_coach_self on tp_staff;
create policy tp_staff_coach_self on tp_staff for select to authenticated using (id in (select impact_my_staff()));

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

drop function if exists impact_school_programmes();

commit;

notify pgrst, 'reload schema';
