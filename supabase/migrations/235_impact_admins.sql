-- DRAFT — for review; apply by hand in the SQL editor. Rollback: supabase/drafts/235_rollback.sql
--
-- 235_impact_admins.sql
-- Platform admins, and private org records.
--
--   1. impact_members gains the role 'admin'. An accepted, non-revoked admin has
--      exactly the HQ's rights on that one org: every HQ policy and function asks
--      impact_hqs_for('hq'), so extending that function is all it takes.
--   2. An admin membership can only be made, changed or restored with the service key
--      (or here in the SQL editor). Browser writes to impact_members were already
--      closed (228); the trigger also stops any function running for a signed-in user.
--      impact_invites keeps its own role check, so there is no admin invite.
--   3. impact_orgs was readable by anyone, which listed every org. Now only people in
--      an org can read its row. Its HQ and admins can change its settings; the
--      existing guard still stops a browser changing slug or hq_id.
--
-- One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

-- ── 1. The role ─────────────────────────────────────────────────────────────
alter table impact_members drop constraint if exists impact_members_role_check;
alter table impact_members add constraint impact_members_role_check check (role in ('coach', 'parent', 'school', 'admin'));
alter table impact_members drop constraint if exists impact_members_target_ok;
alter table impact_members add constraint impact_members_target_ok check (
  (role = 'coach' and staff_id is not null) or (role = 'parent' and family_id is not null) or (role = 'school' and school_id is not null)
  or (role = 'admin' and staff_id is null and family_id is null and school_id is null));

-- 'hq' is the org's own login, or an admin of it. A role of null means any role.
create or replace function impact_hqs_for(p_role text default null) returns setof uuid
language sql stable security definer set search_path = public as $$
  select auth.uid() where (p_role is null or p_role = 'hq') and exists (select 1 from impact_orgs where hq_id = auth.uid())
  union
  select hq_id from impact_members
  where user_id = auth.uid() and accepted_at is not null and revoked_at is null
    and (p_role is null or role = p_role or (p_role = 'hq' and role = 'admin'))
$$;

revoke all on function impact_hqs_for(text) from public, anon;
grant execute on function impact_hqs_for(text) to authenticated;

-- ── 2. Service key only ─────────────────────────────────────────────────────
create or replace function impact_members_admin_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  -- No claims means SQL run directly, like this editor.
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'service_role') <> 'service_role'
     and (new.role = 'admin' or (tg_op = 'UPDATE' and old.role = 'admin')) then
    raise exception 'Admin access is managed by Lumio.';
  end if;
  return new;
end $$;

drop trigger if exists impact_members_admin_guard on impact_members;
create trigger impact_members_admin_guard before insert or update on impact_members
  for each row execute function impact_members_admin_guard();

-- ── 3. Org records ──────────────────────────────────────────────────────────
drop policy if exists impact_orgs_read on impact_orgs;
create policy impact_orgs_read on impact_orgs for select to authenticated using (hq_id in (select impact_hqs_for()));
drop policy if exists impact_orgs_hq_update on impact_orgs;
create policy impact_orgs_hq_update on impact_orgs for update to authenticated
  using (hq_id in (select impact_hqs_for('hq'))) with check (hq_id in (select impact_hqs_for('hq')));

commit;

notify pgrst, 'reload schema';
