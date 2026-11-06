-- ROLLBACK for 229_impact_coach_view.sql. Run by hand in the SQL editor only if 229 has
-- to be undone. Puts the policies, the one-role-per-org rule and the three changed
-- functions back exactly as 228 left them, then drops the new functions.
-- Stops and changes nothing if someone holds two roles in one org: 228's rule can't
-- hold them, so revoke one first. Safe to run twice.

begin;

do $$
begin
  if exists (select 1 from impact_members group by user_id, hq_id having count(*) > 1) then
    raise exception 'Someone holds two roles in one org. Remove one membership, then run this again.';
  end if;
end $$;

alter table impact_members drop constraint if exists impact_members_user_hq_role_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'impact_members_user_id_hq_id_key') then
    alter table impact_members add constraint impact_members_user_id_hq_id_key unique (user_id, hq_id);
  end if;
end $$;

drop policy if exists tp_schools_coach on tp_schools;
create policy tp_schools_coach on tp_schools for select to authenticated using (id in (select school_id from tp_programmes where id in (select impact_coach_programmes())));
drop policy if exists tp_sessions_coach on tp_sessions;
create policy tp_sessions_coach on tp_sessions for select to authenticated using (id in (select impact_coach_sessions()));
drop policy if exists tp_children_coach on tp_children;
create policy tp_children_coach on tp_children for select to authenticated using (id in (select impact_coach_children()));
drop policy if exists tp_families_coach on tp_families;
create policy tp_families_coach on tp_families for select to authenticated using (id in (select family_id from tp_children where id in (select impact_coach_children())));
drop policy if exists tp_venues_coach on tp_venues;
create policy tp_venues_coach on tp_venues for select to authenticated using (id in (select venue_id from tp_sessions where id in (select impact_coach_sessions())));
drop policy if exists tp_attendance_coach_adds on tp_attendance;
create policy tp_attendance_coach_adds on tp_attendance for insert to authenticated with check (
  hq_id in (select impact_hqs_for('coach')) and session_id in (select impact_coach_sessions())
  and exists (select 1 from tp_children c where c.id = child_id and c.hq_id = tp_attendance.hq_id));
drop policy if exists tp_attendance_coach_edits on tp_attendance;
create policy tp_attendance_coach_edits on tp_attendance for update to authenticated using (session_id in (select impact_coach_sessions())) with check (
  hq_id in (select impact_hqs_for('coach')) and session_id in (select impact_coach_sessions()));
drop policy if exists tp_qr_checkins_coach_reads on tp_qr_checkins;
create policy tp_qr_checkins_coach_reads on tp_qr_checkins for select to authenticated using (tp_venue_id in (select venue_id from tp_sessions where id in (select impact_coach_sessions())));
drop policy if exists tp_qr_checkins_coach_adds on tp_qr_checkins;
create policy tp_qr_checkins_coach_adds on tp_qr_checkins for insert to authenticated with check (
  hq_id in (select impact_hqs_for('coach')) and tp_venue_id in (select venue_id from tp_sessions where id in (select impact_coach_sessions())));

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
  if v_hq is null or v_hq not in (select impact_hqs_for('hq')) then raise exception 'That child could not be found.'; end if;
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
  on conflict (user_id, hq_id) do update set role = excluded.role, staff_id = excluded.staff_id, family_id = excluded.family_id, school_id = excluded.school_id,
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
      'sessions', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'kind', x.kind, 'session_date', x.session_date, 'venue', (select v.name from tp_venues v where v.id = x.venue_id and v.hq_id = f.hq_id)) order by x.session_date), '[]'::jsonb)
        from tp_sessions x where x.hq_id = f.hq_id and (x.programme_id = c.programme_id or x.id in (select a.session_id from tp_attendance a where a.child_id = c.id)))
    ) order by c.name), '[]'::jsonb) from tp_children c where c.family_id = f.id and c.hq_id = f.hq_id)
  )), '[]'::jsonb)
  from tp_families f where f.id in (select impact_my_families())
$$;

drop function if exists impact_coach_home(uuid);
drop function if exists impact_coach_has_child(uuid, uuid);
drop function if exists impact_coach_venues();

commit;

notify pgrst, 'reload schema';
