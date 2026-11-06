-- DRAFT — for review; apply by hand in the SQL editor.
--
-- 227_impact_pack_returns.sql
-- Returning a welcome-pack item, and recording who really issued one. Additive:
-- one new function and one new column. Nothing is dropped, and impact_issue_pack()
-- and the RLS from 226 are unchanged.
--
--   impact_return_item()            a return, and optionally the swap, in one transaction
--   tp_pack_issues.issued_by_user   the signed-in login that issued it
--
-- issued_by stays what it was: a tp_staff row, the coach who handed it over. An HQ
-- has no tp_staff row, so the login needs its own column. The default means both
-- existing functions fill it in without being changed.
--
-- What a return does to stock:
--   too_small, other         the item comes back: +1
--   damaged, lost_replaced   it can't be given out again, so +1 and then -1. The
--                            'returned' move still unblocks a re-issue, the stock
--                            total doesn't rise, and the log shows what happened.
-- Safe to run twice.

alter table tp_pack_issues add column if not exists issued_by_user uuid references auth.users(id) on delete set null default auth.uid();

-- p_reissue: give the child a replacement in the same transaction. If that fails,
-- for instance with no stock in the new size, the return doesn't happen either.
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

revoke all on function impact_return_item(uuid, uuid, text, text, boolean, text, uuid) from public, anon;
grant execute on function impact_return_item(uuid, uuid, text, text, boolean, text, uuid) to authenticated;

notify pgrst, 'reload schema';
