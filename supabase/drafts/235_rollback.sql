-- ROLLBACK for 235_impact_admins.sql. Run by hand only if 235 has to be undone.
-- Deletes every admin membership, then puts back 228's function, 228's constraints and
-- 211's policies (so org records are public again).

begin;

drop trigger if exists impact_members_admin_guard on impact_members;
drop function if exists impact_members_admin_guard();
delete from impact_members where role = 'admin';

create or replace function impact_hqs_for(p_role text default null) returns setof uuid
language sql stable security definer set search_path = public as $$
  select auth.uid() where (p_role is null or p_role = 'hq') and exists (select 1 from impact_orgs where hq_id = auth.uid())
  union
  select hq_id from impact_members
  where user_id = auth.uid() and accepted_at is not null and revoked_at is null and (p_role is null or role = p_role)
$$;

alter table impact_members drop constraint if exists impact_members_role_check;
alter table impact_members add constraint impact_members_role_check check (role in ('coach', 'parent', 'school'));
alter table impact_members drop constraint if exists impact_members_target_ok;
alter table impact_members add constraint impact_members_target_ok check (
  (role = 'coach' and staff_id is not null) or (role = 'parent' and family_id is not null) or (role = 'school' and school_id is not null));

drop policy if exists impact_orgs_read on impact_orgs;
create policy impact_orgs_read on impact_orgs for select using (true);
drop policy if exists impact_orgs_hq_update on impact_orgs;
create policy impact_orgs_hq_update on impact_orgs for update using (hq_id = auth.uid()) with check (hq_id = auth.uid());

commit;

notify pgrst, 'reload schema';
