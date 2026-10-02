-- ─────────────────────────────────────────────────────────────────────────────
-- An assistant coach sees what THEIR players owe — and nothing else of the
-- academy's money.
--
-- Until now coach_payments was head-coach-only (migration 166), so a coach saw
-- no balances at all, and the head's "View as coach" preview showed the whole
-- academy's. A coach does need to know that the families they teach owe money;
-- they must never see the academy's other balances.
--
-- Payments only carried a player NAME, and migration 166 is clear that access
-- rules must not join on a name string. So payments get a real player_id:
--   • filled in automatically on insert/update from an UNAMBIGUOUS name match
--     within the same academy (two players with the same name → left empty,
--     and that payment stays head-only rather than reaching the wrong coach);
--   • backfilled the same way for the payments that already exist.
-- The coach's access is then exactly the coach_player_skills rule: a payment is
-- theirs to read, add, edit, mark paid or delete if the player it belongs to is
-- assigned to them. Payments for anybody else's players — and the academy's own
-- unassigned players — never reach them.
--
-- The academy's price list (coach_packages) becomes readable to coaches so they
-- can put a player on a pack; changing the prices stays with the head coach.
-- ─────────────────────────────────────────────────────────────────────────────

alter table coach_payments add column if not exists player_id uuid references coach_players(id) on delete set null;
create index if not exists idx_coach_payments_player on coach_payments (coach_id, player_id);

-- The one place the name → player link is worked out.
create or replace function lumio_payment_player(p_academy uuid, p_name text)
returns uuid
language sql stable security definer set search_path = public as $$
  select case when count(*) = 1 then min(p.id::text)::uuid end
  from coach_players p
  where p.coach_id = p_academy
    and lower(btrim(p.name)) = lower(btrim(p_name))
$$;
revoke all on function lumio_payment_player(uuid, text) from public;

create or replace function lumio_payment_set_player()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Only fill it in when it is missing or the name has changed; a player_id set
  -- deliberately by the app is left alone.
  if new.player_name is not null and (
       new.player_id is null
       or (tg_op = 'UPDATE' and new.player_name is distinct from old.player_name and new.player_id is not distinct from old.player_id)
     ) then
    new.player_id := lumio_payment_player(new.coach_id, new.player_name);
  end if;
  return new;
end $$;

drop trigger if exists trg_coach_payments_player on coach_payments;
create trigger trg_coach_payments_player
  before insert or update on coach_payments
  for each row execute function lumio_payment_set_player();

-- Existing payments.
update coach_payments cp
set player_id = lumio_payment_player(cp.coach_id, cp.player_name)
where cp.player_id is null and cp.player_name is not null;

-- A coach may read and manage a payment for a player assigned to them.
-- lumio_can_see is true for the academy owner too, so this adds nothing for the
-- head coach. WITH CHECK runs after the trigger above has filled in player_id,
-- so a coach cannot create or move a payment onto somebody else's player.
drop policy if exists lumio_coach_reads_player_payments on coach_payments;
drop policy if exists lumio_coach_player_payments on coach_payments;
create policy lumio_coach_player_payments on coach_payments
  for all to authenticated
  using (
    player_id is not null
    and lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = coach_payments.player_id))
  )
  with check (
    player_id is not null
    and lumio_can_see(coach_id, (select p.staff_id from coach_players p where p.id = coach_payments.player_id))
  );

-- The price list: readable by the academy's coaches, editable by the head only.
drop policy if exists lumio_coach_reads_packages on coach_packages;
create policy lumio_coach_reads_packages on coach_packages
  for select to authenticated
  using (lumio_in_academy(coach_id));
