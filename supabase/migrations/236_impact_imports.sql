-- DRAFT — for review; apply by hand in the SQL editor. Rollback: supabase/drafts/236_rollback.sql
--
-- 236_impact_imports.sql
-- Import history and undo.
--
--   1. impact_imports: one row per import.
--   2. import_batch_id (nullable) on every table the importer writes. Set only on rows an
--      import CREATED, never on rows it updated. Existing rows read null.
--   3. A trigger so a row can only be stamped when it is created, with an import of the
--      same org that hasn't been undone. Otherwise a coach who can edit a register could
--      restamp it and have an undo delete it.
--   4. impact_record_past_issue takes the import too. The old four-argument call still works.
--   5. impact_undo_import: one transaction, all or nothing. Deletes what the import created.
--      Refuses if anything NOT from that import points at those rows (a register, payment,
--      pack issue, login, message, a child added since…) and says what. The import's own
--      registers and payments go with it. It finds links from the foreign keys, so tables
--      added later are covered without changing this function.
--   6. tp_schools.postcode, to match schools on name and postcode.
--
-- Additive: no data is changed. One transaction. Safe to run twice.

begin;

-- ── 1. History ──────────────────────────────────────────────────────────────
create table if not exists impact_imports (
  id          uuid primary key default gen_random_uuid(),
  hq_id       uuid not null references auth.users(id) on delete cascade,
  file_name   text not null check (char_length(file_name) between 1 and 300),
  counts      jsonb not null default '{}'::jsonb check (jsonb_typeof(counts) = 'object'),  -- { children: { created, updated, skipped, review } }
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  finished_at timestamptz,      -- null: it stopped part-way. It can still be undone
  undone_at   timestamptz,
  undone_by   uuid references auth.users(id) on delete set null
);
create index if not exists idx_impact_imports_hq on impact_imports (hq_id, created_at desc);

alter table impact_imports enable row level security;
drop policy if exists impact_imports_hq_reads on impact_imports;
create policy impact_imports_hq_reads on impact_imports for select to authenticated using (hq_id in (select impact_hqs_for('hq')));
drop policy if exists impact_imports_hq_adds on impact_imports;
create policy impact_imports_hq_adds on impact_imports for insert to authenticated
  with check (hq_id in (select impact_hqs_for('hq')) and created_by = auth.uid());
drop policy if exists impact_imports_hq_finishes on impact_imports;
create policy impact_imports_hq_finishes on impact_imports for update to authenticated
  using (hq_id in (select impact_hqs_for('hq')) and undone_at is null) with check (hq_id in (select impact_hqs_for('hq')));
-- undone_at is written only by impact_undo_import; history is never deleted.
revoke all on impact_imports from public, anon, authenticated;
grant select on impact_imports to authenticated;
grant insert (id, hq_id, file_name, counts) on impact_imports to authenticated;
grant update (counts, finished_at) on impact_imports to authenticated;

-- ── 6. School postcode ──────────────────────────────────────────────────────
alter table tp_schools add column if not exists postcode text;

-- ── 2 and 3. The stamp ──────────────────────────────────────────────────────
create or replace function impact_import_stamp_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.import_batch_id is not null and new.import_batch_id is distinct from old.import_batch_id then
      raise exception 'An import can only be recorded on a row when it is created.';
    end if;
  elsif new.import_batch_id is not null and not exists (
    select 1 from impact_imports i where i.id = new.import_batch_id and i.hq_id = new.hq_id and i.undone_at is null) then
    raise exception 'That import could not be found.';
  end if;
  return new;
end $$;
revoke all on function impact_import_stamp_guard() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'tp_schools','tp_programmes','tp_venues','tp_staff','tp_families','tp_volunteers','tp_children',
    'tp_fundraising_campaigns','tp_fundraising_events','tp_donations','tp_sessions','tp_attendance',
    'tp_impact_responses','tp_cpd','tp_pack_sizes','tp_pack_issues','tp_pack_payments'] loop
    execute format('alter table %I add column if not exists import_batch_id uuid references impact_imports(id) on delete set null', t);
    execute format('create index if not exists %I on %I (import_batch_id) where import_batch_id is not null', 'idx_' || t || '_import', t);
    execute format('drop trigger if exists impact_import_stamp_guard on %I', t);
    execute format('create trigger impact_import_stamp_guard before insert or update of import_batch_id on %I for each row execute function impact_import_stamp_guard()', t);
  end loop;
end $$;

-- ── 4. Past pack issues ─────────────────────────────────────────────────────
-- Dropped first: two versions would make the four-argument call ambiguous.
drop function if exists impact_record_past_issue(uuid, uuid, text, timestamptz);
create or replace function impact_record_past_issue(p_child uuid, p_item uuid, p_size text, p_issued_at timestamptz, p_import uuid default null) returns integer
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
  insert into tp_pack_issues (hq_id, child_id, item_id, size, issued_at, note, import_batch_id)
  values (v_hq, p_child, p_item, v_size, p_issued_at, 'Imported', p_import);
  return 1;
end $$;
revoke all on function impact_record_past_issue(uuid, uuid, text, timestamptz, uuid) from public, anon;
grant execute on function impact_record_past_issue(uuid, uuid, text, timestamptz, uuid) to authenticated;

-- ── 5. Undo ─────────────────────────────────────────────────────────────────
-- p_check true: only says what would happen. Returns
--   { ok, deleted: { tp_children: 12, … }, blocked: [{ table, on, count, names: […] }] }
create or replace function impact_undo_import(p_import uuid, p_check boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_imp impact_imports%rowtype;
  v_t text; v_label text; v_extra text; v_n bigint; v_names text[];
  v_fk record;
  v_blocked jsonb := '[]'::jsonb;
  v_deleted jsonb := '{}'::jsonb;
  -- Children before parents.
  v_tables text[] := array[
    'tp_pack_payments','tp_pack_issues','tp_pack_sizes','tp_attendance','tp_impact_responses','tp_cpd','tp_donations',
    'tp_fundraising_events','tp_fundraising_campaigns','tp_sessions','tp_volunteers','tp_children','tp_families',
    'tp_programmes','tp_staff','tp_venues','tp_schools'];
begin
  if auth.uid() is null then raise exception 'Please sign in again.'; end if;
  select * into v_imp from impact_imports where id = p_import for update;
  if not found or v_imp.hq_id not in (select impact_hqs_for('hq')) then raise exception 'That import could not be found.'; end if;
  if v_imp.undone_at is not null then raise exception 'That import has already been undone.'; end if;

  foreach v_t in array v_tables loop
    -- Nothing can attach itself to these rows until this finishes.
    execute format('select count(*) from (select 1 from %I where import_batch_id = $1 and hq_id = $2 for update) x', v_t) into v_n using p_import, v_imp.hq_id;
    if v_n > 0 then v_deleted := v_deleted || jsonb_build_object(v_t, v_n); end if;
  end loop;

  foreach v_t in array v_tables loop
    if not v_deleted ? v_t then continue; end if;
    v_label := case v_t when 'tp_families' then 'x.guardian_name' when 'tp_programmes' then 'x.term_label' when 'tp_sessions' then 'x.session_date::text'
      when 'tp_children' then 'x.name' when 'tp_schools' then 'x.name' when 'tp_venues' then 'x.name' when 'tp_staff' then 'x.name'
      when 'tp_volunteers' then 'x.name' when 'tp_fundraising_events' then 'x.name' else 'null::text' end;
    for v_fk in
      select r.relname as tbl, a.attname as col,
        exists (select 1 from pg_attribute s where s.attrelid = r.oid and s.attname = 'import_batch_id' and not s.attisdropped) as stamped
      from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace and n.nspname = 'public'
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
      where c.contype = 'f' and c.confrelid = format('public.%I', v_t)::regclass and cardinality(c.conkey) = 1
    loop
      v_extra := case when v_fk.stamped then 'and r.import_batch_id is distinct from $1' else '' end;
      if v_t = 'tp_fundraising_campaigns' then
        -- The importer makes the org's campaign when there is none. If it's in use, it stays.
        execute format('select count(*) from %I x join %I r on r.%I = x.id where x.import_batch_id = $1 and x.hq_id = $2 %s', v_t, v_fk.tbl, v_fk.col, v_extra) into v_n using p_import, v_imp.hq_id;
        if v_n > 0 then v_deleted := v_deleted - v_t; end if;
      else
        execute format('select count(*), (array_agg(distinct %s))[1:5] from %I x join %I r on r.%I = x.id where x.import_batch_id = $1 and x.hq_id = $2 %s', v_label, v_t, v_fk.tbl, v_fk.col, v_extra)
          into v_n, v_names using p_import, v_imp.hq_id;
        if v_n > 0 then
          v_blocked := v_blocked || jsonb_build_object('table', v_fk.tbl, 'on', v_t, 'count', v_n, 'names', to_jsonb(array_remove(v_names, null)));
        end if;
      end if;
    end loop;
  end loop;

  if jsonb_array_length(v_blocked) > 0 or p_check then
    return jsonb_build_object('ok', jsonb_array_length(v_blocked) = 0, 'deleted', v_deleted, 'blocked', v_blocked);
  end if;
  foreach v_t in array v_tables loop
    if v_deleted ? v_t then
      execute format('delete from %I where import_batch_id = $1 and hq_id = $2', v_t) using p_import, v_imp.hq_id;
    end if;
  end loop;
  update impact_imports set undone_at = now(), undone_by = auth.uid() where id = p_import;
  return jsonb_build_object('ok', true, 'deleted', v_deleted, 'blocked', v_blocked);
end $$;
revoke all on function impact_undo_import(uuid, boolean) from public, anon;
grant execute on function impact_undo_import(uuid, boolean) to authenticated;

commit;
notify pgrst, 'reload schema';
