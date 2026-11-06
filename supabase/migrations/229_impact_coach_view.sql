-- DRAFT — for review; apply by hand in the SQL editor. Rollback: supabase/drafts/229_rollback.sql
--
-- 229_impact_coach_view.sql
-- Coaches stop reading tp_children, tp_families, tp_sessions and tp_schools directly.
-- RLS works on rows, not columns, so a read policy on those tables also exposed the
-- HQ's notes, FSM and pupil premium. impact_coach_home() returns only what a coach
-- needs to run a session, including a paid yes/no per child and item, with no amounts.
--
-- Policies run as the caller, so any check that read one of those tables as the coach
-- would quietly stop working. Three are moved onto SECURITY DEFINER helpers: the
-- register insert, and the venue and QR policies. tp_attendance_coach_edits also gains
-- the child check: it didn't stop a coach pointing a row at a child outside their
-- sessions. impact_issue_pack and tp_pack_sizes_coach need no change.
--
-- Also here:
--   one person may hold two roles in an org: unique (user_id, hq_id, role)
--   coaches may record returns for their own children
--   impact_parent_home() gains each session's week number, for the This Week tab
--
-- One transaction: if anything fails, nothing changes. Safe to run twice.

begin;

drop policy if exists tp_children_coach on tp_children;
drop policy if exists tp_families_coach on tp_families;
drop policy if exists tp_sessions_coach on tp_sessions;
drop policy if exists tp_schools_coach on tp_schools;

-- One person may be a coach and a parent in the same org.
alter table impact_members drop constraint if exists impact_members_user_id_hq_id_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'impact_members_user_hq_role_key') then
    alter table impact_members add constraint impact_members_user_hq_role_key unique (user_id, hq_id, role);
  end if;
end $$;

-- Is this child in one of the caller's sessions, and in this org?
create or replace function impact_coach_has_child(p_child uuid, p_hq uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tp_children c where c.id = p_child and c.hq_id = p_hq and c.id in (select impact_coach_children()))
$$;

-- The venues of the caller's sessions.
create or replace function impact_coach_venues() returns setof uuid
language sql stable security definer set search_path = public as $$
  select venue_id from tp_sessions where venue_id is not null and id in (select impact_coach_sessions())
$$;

drop policy if exists tp_venues_coach on tp_venues;
create policy tp_venues_coach on tp_venues for select to authenticated using (id in (select impact_coach_venues()));
drop policy if exists tp_qr_checkins_coach_reads on tp_qr_checkins;
create policy tp_qr_checkins_coach_reads on tp_qr_checkins for select to authenticated using (tp_venue_id in (select impact_coach_venues()));
drop policy if exists tp_qr_checkins_coach_adds on tp_qr_checkins;
create policy tp_qr_checkins_coach_adds on tp_qr_checkins for insert to authenticated with check (
  hq_id in (select impact_hqs_for('coach')) and tp_venue_id in (select impact_coach_venues()));

drop policy if exists tp_attendance_coach_adds on tp_attendance;
create policy tp_attendance_coach_adds on tp_attendance for insert to authenticated with check (
  hq_id in (select impact_hqs_for('coach')) and session_id in (select impact_coach_sessions())
  and impact_coach_has_child(child_id, hq_id));
drop policy if exists tp_attendance_coach_edits on tp_attendance;
create policy tp_attendance_coach_edits on tp_attendance for update to authenticated using (session_id in (select impact_coach_sessions())) with check (
  hq_id in (select impact_hqs_for('coach')) and session_id in (select impact_coach_sessions())
  and impact_coach_has_child(child_id, hq_id));

-- The coach's register for one org. Each list is limited to their programmes and
-- sessions. Photos need both the family's and the child's consent, the same rule the
-- comms use; an unrecorded answer is a no. The id columns only join these lists up.
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

-- A coach's return goes through the same issue rules, so a replacement is recorded as them.
create or replace function impact_return_item(
  p_child uuid, p_item uuid, p_reason text, p_note text default null,
  p_reissue boolean default false, p_size text default null, p_issued_by uuid default null
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hq uuid;
  v_item tp_pack_items%rowtype;
  v_issue tp_pack_issues%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_size text := nullif(btrim(coalesce(p_size, '')), '');
  v_label text;
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  if p_reason is null or p_reason not in ('too_small', 'damaged', 'lost_replaced', 'other') then raise exception 'Choose a reason for the return.'; end if;
  if p_reason = 'other' and v_note is null then raise exception 'Add a note saying why it was returned.'; end if;
  select hq_id into v_hq from tp_children where id = p_child;
  if v_hq is null or not (v_hq in (select impact_hqs_for('hq')) or p_child in (select impact_coach_children())) then raise exception 'That child could not be found.'; end if;
  select * into v_item from tp_pack_items where id = p_item and hq_id = v_hq;
  if not found then raise exception 'That item could not be found.'; end if;

  select * into v_issue from tp_pack_issues where child_id = p_child and item_id = p_item order by issued_at desc limit 1;
  if not found or exists (
    select 1 from tp_pack_stock_moves where child_id = p_child and item_id = p_item and reason = 'returned' and created_at > v_issue.issued_at
  ) then
    raise exception 'This child doesn’t have a % to return.', v_item.name;
  end if;

  v_label := case p_reason when 'too_small' then 'Too small' when 'damaged' then 'Damaged' when 'lost_replaced' then 'Lost, replaced' else 'Other' end
    || coalesce(' · ' || v_note, '');
  insert into tp_pack_stock_moves (hq_id, item_id, size, delta, reason, child_id, note)
  values (v_hq, p_item, v_issue.size, 1, 'returned', p_child, v_label);
  if p_reason in ('damaged', 'lost_replaced') then
    insert into tp_pack_stock_moves (hq_id, item_id, size, delta, reason, child_id, note)
    values (v_hq, p_item, v_issue.size, -1, 'adjusted', p_child, 'Written off: ' || v_label);
  end if;

  if not p_reissue then return 0; end if;
  if v_item.has_sizes and v_size is null then v_size := v_issue.size; end if;
  perform impact_issue_pack(p_child, jsonb_build_array(jsonb_build_object('item_id', p_item, 'size', v_size)), null, p_issued_by, 'Replacement: ' || v_label);
  if v_item.has_sizes then
    insert into tp_pack_sizes (hq_id, child_id, item_id, size) values (v_hq, p_child, p_item, v_size)
    on conflict (child_id, item_id) do update set size = excluded.size, updated_at = now();
  end if;
  return 1;
end $$;

-- A second role in the same org adds a membership; it no longer replaces the first.
create or replace function impact_accept_invite(p_token_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_inv impact_invites%rowtype;
begin
  if v_user is null then raise exception 'Please sign in again.'; end if;
  select * into v_inv from impact_invites where token_hash = p_token_hash for update;
  if not found or v_inv.revoked_at is not null then raise exception 'This invite isn’t valid. Ask for a new one.'; end if;
  if v_inv.accepted_at is not null then raise exception 'This invite has already been used.'; end if;
  if v_inv.expires_at < now() then raise exception 'This invite has expired. Ask for a new one.'; end if;
  select email into v_email from auth.users where id = v_user;
  if lower(coalesce(v_email, '')) <> lower(v_inv.email) then raise exception 'This invite was sent to a different email address.'; end if;
  if v_user = v_inv.hq_id then raise exception 'This is the organisation’s own login.'; end if;

  insert into impact_members (user_id, hq_id, role, staff_id, family_id, school_id, invited_email, invited_at, accepted_at)
  values (v_user, v_inv.hq_id, v_inv.role, v_inv.staff_id, v_inv.family_id, v_inv.school_id, v_inv.email, v_inv.created_at, now())
  on conflict (user_id, hq_id, role) do update set staff_id = excluded.staff_id, family_id = excluded.family_id, school_id = excluded.school_id,
    invited_email = excluded.invited_email, invited_at = excluded.invited_at, accepted_at = now(), revoked_at = null;
  update impact_invites set accepted_at = now() where id = v_inv.id;
  return jsonb_build_object('role', v_inv.role, 'slug', (select slug from impact_orgs where hq_id = v_inv.hq_id));
end $$;

create or replace function impact_parent_home() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'hq_id', f.hq_id, 'guardian_name', f.guardian_name, 'guardian2_name', f.guardian2_name, 'email', f.email, 'phone', f.phone,
    'emergency_contact', f.emergency_contact, 'consent_data', f.consent_data, 'consent_photo', f.consent_photo,
    'opt_in_email', f.opt_in_email, 'opt_in_sms', f.opt_in_sms, 'opt_in_app', f.opt_in_app,
    'children', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'date_of_birth', c.date_of_birth, 'year_group', c.year_group, 'stickers', c.stickers, 'photo_consent', c.photo_consent,
      'school', (select s.name from tp_schools s where s.id = c.school_id and s.hq_id = f.hq_id),
      'sessions', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'kind', x.kind, 'session_date', x.session_date, 'week_number', x.week_number, 'venue', (select v.name from tp_venues v where v.id = x.venue_id and v.hq_id = f.hq_id)) order by x.session_date), '[]'::jsonb)
        from tp_sessions x where x.hq_id = f.hq_id and (x.programme_id = c.programme_id or x.id in (select a.session_id from tp_attendance a where a.child_id = c.id)))
    ) order by c.name), '[]'::jsonb) from tp_children c where c.family_id = f.id and c.hq_id = f.hq_id)
  )), '[]'::jsonb)
  from tp_families f where f.id in (select impact_my_families())
$$;

revoke execute on function impact_coach_venues() from public, anon;
grant execute on function impact_coach_venues() to authenticated;
revoke execute on function impact_coach_has_child(uuid, uuid) from public, anon;
revoke execute on function impact_coach_home(uuid) from public, anon;
grant execute on function impact_coach_has_child(uuid, uuid) to authenticated;
grant execute on function impact_coach_home(uuid) to authenticated;

commit;

notify pgrst, 'reload schema';
