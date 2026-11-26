-- Rollback for 236_impact_imports.sql. Loses the import history and stamps; keeps every
-- imported row. tp_schools.postcode is dropped with any postcodes saved in it.
begin;
drop function if exists impact_undo_import(uuid, boolean);
drop function if exists impact_record_past_issue(uuid, uuid, text, timestamptz, uuid);
create or replace function impact_record_past_issue(p_child uuid, p_item uuid, p_size text, p_issued_at timestamptz) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hq uuid;
  v_item tp_pack_items%rowtype;
  v_size text := nullif(btrim(coalesce(p_size, '')), '');
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  select hq_id into v_hq from tp_children where id = p_child;
  if v_hq is null or v_hq not in (select impact_hqs_for('hq')) then raise exception 'That child could not be found.'; end if;
  select * into v_item from tp_pack_items where id = p_item and hq_id = v_hq;
  if not found then raise exception 'That item could not be found.'; end if;
  if not v_item.has_sizes then v_size := null; end if;
  if v_size is not null and not v_size = any (v_item.sizes) then raise exception '% doesn’t come in size %.', v_item.name, v_size; end if;
  if p_issued_at is null or p_issued_at > now() then raise exception 'That date isn’t in the past.'; end if;
  if exists (select 1 from tp_pack_issues where child_id = p_child and item_id = p_item) then return 0; end if;
  insert into tp_pack_issues (hq_id, child_id, item_id, size, issued_at, note) values (v_hq, p_child, p_item, v_size, p_issued_at, 'Imported');
  return 1;
end $$;
revoke all on function impact_record_past_issue(uuid, uuid, text, timestamptz) from public, anon;
grant execute on function impact_record_past_issue(uuid, uuid, text, timestamptz) to authenticated;
do $$
declare t text;
begin
  foreach t in array array[
    'tp_schools','tp_programmes','tp_venues','tp_staff','tp_families','tp_volunteers','tp_children',
    'tp_fundraising_campaigns','tp_fundraising_events','tp_donations','tp_sessions','tp_attendance',
    'tp_impact_responses','tp_cpd','tp_pack_sizes','tp_pack_issues','tp_pack_payments'] loop
    execute format('drop trigger if exists impact_import_stamp_guard on %I', t);
    execute format('alter table %I drop column if exists import_batch_id', t);
  end loop;
end $$;
drop function if exists impact_import_stamp_guard();
alter table tp_schools drop column if exists postcode;
drop table if exists impact_imports;
commit;
notify pgrst, 'reload schema';
