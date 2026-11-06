-- ROLLBACK for 228_impact_members.sql. Run by hand in the SQL editor only if 228 has
-- to be undone. Puts every policy and pack function back exactly as 226/227 left
-- them. impact_members and impact_invites stay, with their rows, closed to everyone
-- but the service key, so memberships survive if 228 is re-applied.
-- Safe to run twice.

begin;

do $$
declare r record; t text;
  a text[][] := array[
    ['tp_schools','tp_schools_hq'],['tp_programmes','tp_programmes_hq'],['tp_qr_checkins','tp_qr_checkins_hq'],
    ['tp_fundraising_campaigns','tp_camp_hq'],['tp_fundraising_events','tp_fund_events_hq'],['tp_fundraising_pledges','tp_pledges_hq'],['tp_donations','tp_donations_hq'],
    ['tp_impact_responses','tp_impact_hq'],['tp_funder_reports','tp_reports_hq'],['tp_pathway_referrals','tp_pathways_hq'],
    ['tp_venues','tp_venues_hq'],['tp_staff','tp_staff_hq'],['tp_families','tp_families_hq'],['tp_volunteers','tp_volunteers_hq'],['tp_children','tp_children_hq'],
    ['tp_sessions','tp_sessions_hq'],['tp_attendance','tp_attendance_hq']];
  b text[] := array['impact_messages','impact_campaigns','tp_cpd','impact_leads','impact_lead_events','tp_pack_items','tp_booklet'];
  reads text[] := array['impact_lead_hooks','tp_pack_stock','tp_pack_issues','tp_pack_stock_moves'];
  i int;
begin
  for r in select tablename, policyname from pg_policies where schemaname = 'public' and (tablename like 'tp\_%' or tablename like 'impact\_%')
    and tablename not in ('impact_orgs', 'impact_reference_content') loop
    execute format('drop policy %I on %I', r.policyname, r.tablename);
  end loop;
  for i in 1 .. array_length(a, 1) loop
    execute format('create policy %I on %I using (hq_id = auth.uid()) with check (hq_id = auth.uid())', a[i][2], a[i][1]);
  end loop;
  foreach t in array b loop
    execute format('create policy %I on %I for all to authenticated using (hq_id = auth.uid()) with check (hq_id = auth.uid())', t || '_hq', t);
  end loop;
  foreach t in array reads loop
    execute format('create policy %I on %I for select to authenticated using (hq_id = auth.uid())', t || '_hq_reads', t);
  end loop;
end $$;

create policy tp_pack_sizes_hq on tp_pack_sizes for all to authenticated using (hq_id = auth.uid()) with check (
  hq_id = auth.uid()
  and exists (select 1 from tp_children c where c.id = child_id and c.hq_id = auth.uid())
  and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = auth.uid()));
create policy tp_pack_payments_hq on tp_pack_payments for all to authenticated using (hq_id = auth.uid()) with check (
  hq_id = auth.uid()
  and (child_id is null or exists (select 1 from tp_children c where c.id = child_id and c.hq_id = auth.uid()))
  and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = auth.uid()));
create policy tp_pack_stock_moves_hq_adds on tp_pack_stock_moves for insert to authenticated with check (
  hq_id = auth.uid() and reason <> 'issued'
  and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = auth.uid())
  and (child_id is null or exists (select 1 from tp_children c where c.id = child_id and c.hq_id = auth.uid())));

-- The pack functions as 226 and 227 wrote them.
create or replace function impact_issue_pack(
  p_child uuid, p_lines jsonb, p_session uuid default null, p_issued_by uuid default null, p_note text default null
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hq uuid := auth.uid();
  v_line jsonb;
  v_item tp_pack_items%rowtype;
  v_size text;
  v_label text;
  v_last timestamptz;
  v_qty integer;
  v_count integer := 0;
begin
  if v_hq is null then raise exception 'Please sign in again.'; end if;
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'Choose at least one item to issue.'; end if;
  if not exists (select 1 from tp_children where id = p_child and hq_id = v_hq) then raise exception 'That child could not be found.'; end if;
  if p_session is not null and not exists (select 1 from tp_sessions where id = p_session and hq_id = v_hq) then raise exception 'That session could not be found.'; end if;
  if p_issued_by is not null and not exists (select 1 from tp_staff where id = p_issued_by and hq_id = v_hq) then raise exception 'That coach could not be found.'; end if;

  -- In item order, so two people issuing at once can't deadlock on the stock rows.
  for v_line in select value from jsonb_array_elements(p_lines) order by value->>'item_id', value->>'size' loop
    select * into v_item from tp_pack_items where id = (v_line->>'item_id')::uuid and hq_id = v_hq and active;
    if not found then raise exception 'That item could not be found.'; end if;

    v_size := nullif(btrim(coalesce(v_line->>'size', '')), '');
    if v_item.has_sizes and v_size is null then raise exception 'Choose a size for %.', v_item.name; end if;
    if v_item.has_sizes and not v_size = any (v_item.sizes) then raise exception '% doesn’t come in size %.', v_item.name, v_size; end if;
    if not v_item.has_sizes then v_size := null; end if;
    v_label := v_item.name || coalesce(' ' || v_size, '');

    if v_item.kind = 'paid' and not exists (select 1 from tp_pack_payments where hq_id = v_hq and child_id = p_child and item_id = v_item.id) then
      raise exception 'No payment recorded for % — record it first', v_item.name;
    end if;

    -- A second one needs a return after the last issue.
    select max(issued_at) into v_last from tp_pack_issues where child_id = p_child and item_id = v_item.id;
    if v_last is not null and not exists (
      select 1 from tp_pack_stock_moves where child_id = p_child and item_id = v_item.id and reason = 'returned' and created_at > v_last
    ) then
      raise exception 'This child already has a %.', v_item.name;
    end if;

    select qty into v_qty from tp_pack_stock where item_id = v_item.id and coalesce(size, '') = coalesce(v_size, '') for update;
    if coalesce(v_qty, 0) < 1 then raise exception 'No % in stock — receive stock first', v_label; end if;

    insert into tp_pack_issues (hq_id, child_id, item_id, size, issued_by, session_id, note)
    values (v_hq, p_child, v_item.id, v_size, p_issued_by, p_session, nullif(btrim(coalesce(p_note, '')), ''));
    insert into tp_pack_stock_moves (hq_id, item_id, size, delta, reason, child_id)
    values (v_hq, v_item.id, v_size, -1, 'issued', p_child);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

create or replace function impact_record_past_issue(p_child uuid, p_item uuid, p_size text, p_issued_at timestamptz) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hq uuid := auth.uid();
  v_item tp_pack_items%rowtype;
  v_size text := nullif(btrim(coalesce(p_size, '')), '');
begin
  if v_hq is null then raise exception 'Please sign in again.'; end if;
  if not exists (select 1 from tp_children where id = p_child and hq_id = v_hq) then raise exception 'That child could not be found.'; end if;
  select * into v_item from tp_pack_items where id = p_item and hq_id = v_hq;
  if not found then raise exception 'That item could not be found.'; end if;
  if not v_item.has_sizes then v_size := null; end if;
  if v_size is not null and not v_size = any (v_item.sizes) then raise exception '% doesn’t come in size %.', v_item.name, v_size; end if;
  if p_issued_at is null or p_issued_at > now() then raise exception 'That date isn’t in the past.'; end if;
  if exists (select 1 from tp_pack_issues where child_id = p_child and item_id = p_item) then return 0; end if;
  insert into tp_pack_issues (hq_id, child_id, item_id, size, issued_at, note) values (v_hq, p_child, p_item, v_size, p_issued_at, 'Imported');
  return 1;
end $$;

create or replace function impact_return_item(
  p_child uuid, p_item uuid, p_reason text, p_note text default null,
  p_reissue boolean default false, p_size text default null, p_issued_by uuid default null
) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hq uuid := auth.uid();
  v_item tp_pack_items%rowtype;
  v_issue tp_pack_issues%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_size text := nullif(btrim(coalesce(p_size, '')), '');
  v_label text;
begin
  if v_hq is null then raise exception 'Please sign in again.'; end if;
  if p_reason is null or p_reason not in ('too_small', 'damaged', 'lost_replaced', 'other') then raise exception 'Choose a reason for the return.'; end if;
  if p_reason = 'other' and v_note is null then raise exception 'Add a note saying why it was returned.'; end if;
  if not exists (select 1 from tp_children where id = p_child and hq_id = v_hq) then raise exception 'That child could not be found.'; end if;
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

drop function if exists impact_accept_invite(text);
drop function if exists impact_parent_update_family(uuid, text, text, text, boolean, boolean, boolean, boolean, boolean);
drop function if exists impact_parent_home();
drop function if exists impact_parent_children();
drop function if exists impact_coach_children();
drop function if exists impact_coach_sessions();
drop function if exists impact_coach_programmes();
drop function if exists impact_my_schools();
drop function if exists impact_my_families();
drop function if exists impact_my_staff();
drop function if exists impact_hq_for(text);
drop function if exists impact_hqs_for(text);

commit;

notify pgrst, 'reload schema';
