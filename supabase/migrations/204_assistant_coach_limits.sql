-- ─────────────────────────────────────────────────────────────────────────────
-- What an invited (assistant) coach may NOT do to the academy's records.
--
-- Migration 166 let an invited coach into the real portal: full access to the
-- rows that carry their own coach record (staff_id). Three things that follow
-- from "full access" were never intended, and all three could be done through
-- the public database API with nothing but the coach's own sign-in:
--
--   1. MOVE a player (and their bookings) out of the academy, by changing the
--      row's coach_id to their own user id. The older rule "Coach owns rows"
--      (coach_id = auth.uid()) accepted the new row. The head coach lost the
--      record without trace, and the coach kept the child's details after their
--      access was removed.
--   2. WRITE a lesson, booking, attendance mark, development note or booking
--      link against ANY player in the academy — by id, or just by typing the
--      name, which the database then linked to the player. The lesson appeared
--      in that family's app.
--   3. REWRITE or DELETE a message a parent or the head coach had written in one
--      of their players' conversations (migration 196 gave them update and
--      delete on the whole row).
--
-- None of this is checked in the browser. Every rule below is in the database,
-- applies to anything that is not the server (lumio_is_server, migration 193),
-- and refuses when in doubt.
--
-- The head coach loses nothing: every rule steps aside for the academy's owner
-- (auth.uid() = coach_id), except the first, which nobody signed in may do.
-- The server (service role) is not affected at all — merges, imports, the
-- public booking link and the family app carry on as before.
--
-- Safe to run twice. Changes no data.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1. A row never changes academy ══════════════════════════════════════════
-- coach_id says whose academy a row belongs to. There is no screen, for anyone,
-- that changes it — so nobody signed in may. On every coach_* table that has
-- the column, so a table added later needs only this loop run again.
--
-- Not security definer: it has to see who is really calling.
create or replace function lumio_coach_id_fixed()
returns trigger
language plpgsql set search_path = public as $$
begin
  if new.coach_id is distinct from old.coach_id and not lumio_is_server() then
    raise exception 'A record cannot be moved to another academy.' using errcode = '42501';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  for t in
    select c.table_name
      from information_schema.columns c
      join information_schema.tables tb
        on tb.table_schema = c.table_schema and tb.table_name = c.table_name
     where c.table_schema = 'public'
       and c.table_name like 'coach\_%'
       and c.column_name = 'coach_id'
       and tb.table_type = 'BASE TABLE'
  loop
    execute format('drop trigger if exists trg_lumio_coach_id_fixed on %I', t);
    execute format($f$
      create trigger trg_lumio_coach_id_fixed before update on %I
        for each row when (new.coach_id is distinct from old.coach_id)
        execute function lumio_coach_id_fixed()
    $f$, t);
  end loop;
end $$;


-- ══ 2. An invited coach writes about their OWN players ═══════════════════════
-- Payments, skills, recordings and messages already hang off the player's
-- assignment (migrations 166, 188, 196). Lessons, bookings, development notes,
-- attendance and booking links carry a coach record of their own, and the rule
-- for them looked only at that — so a row stamped with the coach's own
-- staff_id could name anybody's player.
--
-- "Is this player mine?" The head coach: any player of the academy. An invited
-- coach: a player assigned to them. Runs with the owner's rights so it can
-- answer for a player the caller is not allowed to read; it says yes or no and
-- nothing else.
create or replace function lumio_is_my_player(p_academy uuid, p_player uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from coach_players p
    where p.id = p_player
      and p.coach_id = p_academy
      and lumio_can_see(p.coach_id, p.staff_id)
  )
$$;

-- Does anybody on the academy's roster have this name? (Same comparison as
-- lumio_player_by_name.)
create or replace function lumio_name_on_roster(p_academy uuid, p_name text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from coach_players p
    where p.coach_id = p_academy
      and lower(btrim(p.name)) = lower(btrim(p_name))
  )
$$;

revoke all on function lumio_is_my_player(uuid, uuid) from public;
revoke all on function lumio_name_on_roster(uuid, text) from public;
grant execute on function lumio_is_my_player(uuid, uuid) to authenticated, service_role;
grant execute on function lumio_name_on_roster(uuid, text) to authenticated, service_role;

-- The check itself. It runs AFTER lumio_link_player (triggers fire in name
-- order, and "own" sorts after "link"), so a name typed with no id has already
-- been turned into the player it belongs to — and is then checked like any id.
--
--   • a player id            → must be one of the caller's players
--   • a name and no id       → refused if anybody on the roster has that name
--                              (it was not linked, so it is shared by two or
--                              more players: the coach must pick one — and a
--                              name must never be a way to write about somebody
--                              else's player)
--   • a name nobody has      → allowed. That is how a group session is filed
--                              ("Red squad"), and it is about no player.
--
-- An edit that does not touch who the row is about is left alone, so a coach
-- can still correct the time of an old booking that names a player by name.
--
-- Not security definer, for the same reason as above.
create or replace function lumio_own_player_only()
returns trigger
language plpgsql set search_path = public as $$
declare
  v_name     text := nullif(btrim(coalesce(to_jsonb(new) ->> 'player_name', '')), '');
  v_old_name text;
begin
  -- The server, and the academy's own head coach, are not limited by this.
  if lumio_is_server() or auth.uid() is null or new.coach_id = auth.uid() then
    return new;
  end if;
  -- A merge carries old records across as they are (migration 200).
  if current_setting('lumio.merging_players', true) = 'on' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_old_name := nullif(btrim(coalesce(to_jsonb(old) ->> 'player_name', '')), '');
    if new.player_id is not distinct from old.player_id
       and v_name is not distinct from v_old_name then
      return new;
    end if;
  end if;

  if new.player_id is not null then
    if not lumio_is_my_player(new.coach_id, new.player_id) then
      raise exception 'That player is not one of yours. Ask your head coach to assign them to you first.'
        using errcode = '42501';
    end if;
  elsif v_name is not null and lumio_name_on_roster(new.coach_id, v_name) then
    raise exception 'More than one player has that name. Choose the player from your list.'
      using errcode = '42501';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'coach_sessions', 'coach_bookings', 'coach_development', 'coach_attendance', 'coach_booking_links'
  ] loop
    execute format('drop trigger if exists trg_lumio_own_player on %I', t);
    execute format($f$
      create trigger trg_lumio_own_player before insert or update on %I
        for each row execute function lumio_own_player_only()
    $f$, t);
  end loop;
end $$;


-- ══ 3. A conversation is the academy's record ═══════════════════════════════
-- An invited coach reads their players' conversations, and the inbox lets them
-- mark a message read, react to it and dismiss it from their dashboard. That is
-- all the update rule is for. The words of a message, who it is from and who it
-- is about are not theirs to change — and a message cannot be removed from the
-- record by anyone but the head coach.
--
-- (Sending is unchanged: it goes through the server route, which checks the
-- recipient and records who really sent it. There is still no INSERT rule.)
drop policy if exists lumio_coach_player_messages_delete on coach_messages;

-- Not security definer, for the same reason as above.
create or replace function lumio_message_flags_only()
returns trigger
language plpgsql set search_path = public as $$
begin
  if lumio_is_server() or auth.uid() is null or old.coach_id = auth.uid() then
    return new;
  end if;
  if (to_jsonb(new) - 'read' - 'reaction' - 'dismissed' - 'updated_at')
     is distinct from
     (to_jsonb(old) - 'read' - 'reaction' - 'dismissed' - 'updated_at') then
    raise exception 'A message cannot be changed once it is sent. You can mark it as read or react to it.'
      using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists trg_lumio_message_flags_only on coach_messages;
create trigger trg_lumio_message_flags_only before update on coach_messages
  for each row execute function lumio_message_flags_only();
