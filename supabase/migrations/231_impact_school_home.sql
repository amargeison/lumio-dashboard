-- DRAFT — for review; apply by hand in the SQL editor. Rollback: supabase/drafts/231_rollback.sql
--
-- 231_impact_school_home.sql
-- Closes tp_schools.notes to school logins. RLS works on rows, not columns, so the direct
-- read policy goes and a school login reads its own school through impact_school_home().
-- That function also takes over from impact_school_programmes() (230), so a school login
-- has one entry point, like impact_coach_home() and impact_parent_home(). Nothing in the
-- app calls impact_school_programmes().
--
-- tp_schools has no postcode or type column, so neither is returned. safeguarding_lead,
-- funding_source and notes stay with the HQ. No policy reads tp_schools as the caller, so
-- nothing else is affected. HQ policies don't change.
--
-- One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

drop policy if exists tp_schools_school on tp_schools;
drop function if exists impact_school_programmes();

create or replace function impact_school_home() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'schools', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'borough', s.borough, 'address', s.address, 'status', s.status,
        'head_name', s.head_name, 'pe_lead_name', s.pe_lead_name, 'contact_email', s.contact_email, 'contact_phone', s.contact_phone
      ) order by s.name)
      from tp_schools s where s.id in (select impact_my_schools())), '[]'::jsonb),
    'programmes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'school_id', p.school_id, 'term_label', p.term_label, 'year_groups', p.year_groups, 'current_week', p.current_week, 'status', p.status
      ) order by p.term_label)
      from tp_programmes p where p.school_id in (select impact_my_schools())), '[]'::jsonb)
  )
$$;

revoke execute on function impact_school_home() from public, anon;
grant execute on function impact_school_home() to authenticated;

commit;

notify pgrst, 'reload schema';
