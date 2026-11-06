-- DRAFT — for review; apply by hand in the SQL editor.
--
-- 226_impact_packs.sql
-- Welcome packs: what an org gives each child, what it has in stock, who has had
-- what, who has paid, and the Activity Booklet. Defined per org, nothing is
-- specific to one. Additive: new tables only, no existing table is altered, and
-- nothing here references a coach_* table.
--
--   tp_pack_items        the pack: included items and paid items
--   tp_pack_sizes        each child's size for a sized item
--   tp_pack_stock        qty on hand. Read-only: only the moves trigger writes it
--   tp_pack_stock_moves  every change to stock. Never edited or deleted
--   tp_pack_issues       who received what. Written only by the two functions below
--   tp_pack_payments     money received for paid items
--   tp_booklet           the org's Activity Booklet, one row each
--
-- The rules live here so a browser session can't get round them:
--   qty is the sum of the moves      a trigger applies every move to tp_pack_stock
--   stock can't go below zero        a check on qty, and a lock while issuing
--   issuing is all or nothing        one function call, one transaction
--   no issue without a payment       checked in the function
--   no second issue without a return checked in the function
--
-- A foreign key doesn't check that a row belongs to this HQ, so the write policies
-- and the function check ownership themselves.
-- Safe to run twice.

-- ── The pack ────────────────────────────────────────────────────────────────
create table if not exists tp_pack_items (
  id              uuid primary key default gen_random_uuid(),
  hq_id           uuid not null references auth.users(id) on delete cascade,
  name            text not null check (char_length(btrim(name)) between 1 and 80),
  kind            text not null default 'included' check (kind in ('included', 'paid')),
  price_pence     integer,
  has_sizes       boolean not null default false,
  sizes           text[] not null default '{}',
  low_stock       integer not null default 10 check (low_stock >= 0),
  unit_cost_pence integer check (unit_cost_pence is null or unit_cost_pence >= 0),
  sort            integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint tp_pack_items_price_ok check ((kind = 'paid' and price_pence is not null and price_pence > 0) or (kind = 'included' and price_pence is null)),
  constraint tp_pack_items_sizes_ok check (has_sizes = (cardinality(sizes) > 0))
);
create index if not exists idx_tp_pack_items_hq on tp_pack_items (hq_id, sort);

-- A child's size for a sized item. Set before a pack can be issued.
create table if not exists tp_pack_sizes (
  hq_id      uuid not null references auth.users(id) on delete cascade,
  child_id   uuid not null references tp_children(id) on delete cascade,
  item_id    uuid not null references tp_pack_items(id) on delete cascade,
  size       text not null,
  updated_at timestamptz not null default now(),
  primary key (child_id, item_id)
);
create index if not exists idx_tp_pack_sizes_hq on tp_pack_sizes (hq_id);

-- ── Stock ───────────────────────────────────────────────────────────────────
create table if not exists tp_pack_stock (
  id         uuid primary key default gen_random_uuid(),
  hq_id      uuid not null references auth.users(id) on delete cascade,
  item_id    uuid not null references tp_pack_items(id),
  size       text,
  qty        integer not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now()
);
-- coalesce, because two nulls are distinct in a plain unique index.
create unique index if not exists idx_tp_pack_stock_line on tp_pack_stock (item_id, coalesce(size, ''));
create index if not exists idx_tp_pack_stock_hq on tp_pack_stock (hq_id);

create table if not exists tp_pack_stock_moves (
  id         uuid primary key default gen_random_uuid(),
  hq_id      uuid not null references auth.users(id) on delete cascade,
  item_id    uuid not null references tp_pack_items(id),
  size       text,
  delta      integer not null check (delta <> 0),
  reason     text not null check (reason in ('received', 'issued', 'adjusted', 'returned')),
  child_id   uuid references tp_children(id) on delete set null,
  note       text,
  created_at timestamptz not null default now(),
  constraint tp_pack_moves_sign_ok check (
    (reason in ('received', 'returned') and delta > 0) or (reason = 'issued' and delta < 0) or reason = 'adjusted'),
  constraint tp_pack_moves_note_ok check (reason <> 'adjusted' or char_length(btrim(coalesce(note, ''))) > 0)
);
create index if not exists idx_tp_pack_moves_hq on tp_pack_stock_moves (hq_id, created_at desc);
create index if not exists idx_tp_pack_moves_line on tp_pack_stock_moves (item_id, size);
create index if not exists idx_tp_pack_moves_child on tp_pack_stock_moves (child_id, item_id);

-- ── Issues and payments ─────────────────────────────────────────────────────
create table if not exists tp_pack_issues (
  id         uuid primary key default gen_random_uuid(),
  hq_id      uuid not null references auth.users(id) on delete cascade,
  child_id   uuid not null references tp_children(id) on delete cascade,
  item_id    uuid not null references tp_pack_items(id),
  size       text,
  issued_at  timestamptz not null default now(),
  issued_by  uuid references tp_staff(id) on delete set null,
  session_id uuid references tp_sessions(id) on delete set null,
  note       text
);
create index if not exists idx_tp_pack_issues_hq on tp_pack_issues (hq_id, issued_at desc);
create index if not exists idx_tp_pack_issues_child on tp_pack_issues (child_id, item_id, issued_at desc);

-- child_id is set null if a child is erased, so the money still adds up.
create table if not exists tp_pack_payments (
  id           uuid primary key default gen_random_uuid(),
  hq_id        uuid not null references auth.users(id) on delete cascade,
  child_id     uuid references tp_children(id) on delete set null,
  item_id      uuid not null references tp_pack_items(id),
  amount_pence integer not null check (amount_pence > 0),
  paid_at      date not null default current_date,
  method       text not null check (method in ('cash', 'bank', 'school', 'other')),
  reference    text,
  recorded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_tp_pack_payments_hq on tp_pack_payments (hq_id, paid_at desc);
create index if not exists idx_tp_pack_payments_child on tp_pack_payments (child_id, item_id);

-- ── The Activity Booklet ────────────────────────────────────────────────────
create table if not exists tp_booklet (
  hq_id      uuid primary key references auth.users(id) on delete cascade,
  title      text not null default '',
  intro      text not null default '',
  weeks      jsonb not null default '[]'::jsonb check (jsonb_typeof(weeks) = 'array'),      -- [{ week, title, focus, home_task }]
  stickers   jsonb not null default '[]'::jsonb check (jsonb_typeof(stickers) = 'array'),   -- [{ id, label, description }]
  updated_at timestamptz not null default now()
);

-- ── Every move lands on the stock line ──────────────────────────────────────
create or replace function tp_pack_apply_move() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Two steps: a single upsert would test its proposed row against qty >= 0, so
  -- any decrease would fail however much is in stock.
  insert into tp_pack_stock (hq_id, item_id, size, qty)
  values (new.hq_id, new.item_id, new.size, 0)
  on conflict (item_id, coalesce(size, '')) do nothing;
  update tp_pack_stock set qty = qty + new.delta, updated_at = now()
  where item_id = new.item_id and coalesce(size, '') = coalesce(new.size, '');
  return new;
end $$;

drop trigger if exists tp_pack_moves_apply on tp_pack_stock_moves;
create trigger tp_pack_moves_apply after insert on tp_pack_stock_moves
  for each row execute function tp_pack_apply_move();

-- ── Issuing ─────────────────────────────────────────────────────────────────
-- p_lines: [{ "item_id": "...", "size": "9-10" }]. All of a child's lines go
-- together or none do. Each failure raises the sentence the person should read.
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

-- A pack handed out before stock was tracked, for the importer. It records the
-- issue and moves no stock, because that stock was never received here. Returns
-- 0 if the child already has the item, so importing a file twice changes nothing.
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

revoke all on function impact_issue_pack(uuid, jsonb, uuid, uuid, text) from public, anon;
grant execute on function impact_issue_pack(uuid, jsonb, uuid, uuid, text) to authenticated;
revoke all on function impact_record_past_issue(uuid, uuid, text, timestamptz) from public, anon;
grant execute on function impact_record_past_issue(uuid, uuid, text, timestamptz) to authenticated;
revoke all on function tp_pack_apply_move() from public, anon, authenticated;

-- ── RLS ─────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['tp_pack_items','tp_pack_sizes','tp_pack_stock','tp_pack_stock_moves','tp_pack_issues','tp_pack_payments','tp_booklet'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
  -- HQ edits these directly.
  foreach t in array array['tp_pack_items','tp_booklet'] loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_hq') then
      execute format('create policy %I on %I for all to authenticated using (hq_id = auth.uid()) with check (hq_id = auth.uid())', t || '_hq', t);
    end if;
  end loop;
  -- Reading only: these change through the trigger and the function.
  foreach t in array array['tp_pack_stock','tp_pack_issues','tp_pack_stock_moves'] loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = t || '_hq_reads') then
      execute format('create policy %I on %I for select to authenticated using (hq_id = auth.uid())', t || '_hq_reads', t);
    end if;
  end loop;
  if not exists (select 1 from pg_policies where tablename = 'tp_pack_sizes' and policyname = 'tp_pack_sizes_hq') then
    create policy tp_pack_sizes_hq on tp_pack_sizes for all to authenticated using (hq_id = auth.uid()) with check (
      hq_id = auth.uid()
      and exists (select 1 from tp_children c where c.id = child_id and c.hq_id = auth.uid())
      and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'tp_pack_payments' and policyname = 'tp_pack_payments_hq') then
    create policy tp_pack_payments_hq on tp_pack_payments for all to authenticated using (hq_id = auth.uid()) with check (
      hq_id = auth.uid()
      and (child_id is null or exists (select 1 from tp_children c where c.id = child_id and c.hq_id = auth.uid()))
      and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = auth.uid()));
  end if;
  -- Receiving, adjusting and returning are direct. Only the function records 'issued'.
  if not exists (select 1 from pg_policies where tablename = 'tp_pack_stock_moves' and policyname = 'tp_pack_stock_moves_hq_adds') then
    create policy tp_pack_stock_moves_hq_adds on tp_pack_stock_moves for insert to authenticated with check (
      hq_id = auth.uid() and reason <> 'issued'
      and exists (select 1 from tp_pack_items i where i.id = item_id and i.hq_id = auth.uid())
      and (child_id is null or exists (select 1 from tp_children c where c.id = child_id and c.hq_id = auth.uid())));
  end if;
end $$;

revoke insert, update, delete, truncate on tp_pack_stock, tp_pack_issues from public, anon, authenticated;
revoke update, delete, truncate on tp_pack_stock_moves from public, anon, authenticated;

notify pgrst, 'reload schema';
