-- ROLLBACK for 231_impact_school_home.sql. Run by hand in the SQL editor only if 231 has
-- to be undone. Puts tp_schools_school and impact_school_programmes() back exactly as 230
-- left them and drops impact_school_home(). Safe to run twice.
-- Run this before 230_rollback.sql if both have to go.

begin;

drop policy if exists tp_schools_school on tp_schools;
create policy tp_schools_school on tp_schools for select to authenticated using (id in (select impact_my_schools()));

create or replace function impact_school_programmes() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'school_id', p.school_id, 'term_label', p.term_label, 'year_groups', p.year_groups, 'current_week', p.current_week, 'status', p.status
  ) order by p.term_label), '[]'::jsonb)
  from tp_programmes p where p.school_id in (select impact_my_schools())
$$;

revoke execute on function impact_school_programmes() from public, anon;
grant execute on function impact_school_programmes() to authenticated;

drop function if exists impact_school_home();

commit;

notify pgrst, 'reload schema';
