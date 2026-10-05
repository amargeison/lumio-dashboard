-- ─────────────────────────────────────────────────────────────────────────────
-- Roster: merging two profiles, erasing a player, and the attendance register.
--
-- Four things, each closing a fault a tester reproduced:
--
--   1. coach_consent_submissions had no created_at. Every list in the portal is
--      read newest-first by created_at, so the consent forms parents sent in
--      could never be listed — the read failed and the screen showed none.
--   2. Attendance accepted a record with no date, a date years ahead, and a
--      second record for a day that already had one. All three counted towards
--      the attendance percentage.
--   3. Merging duplicate profiles DELETED the merged profile's skill grades (all
--      of them) as soon as one skill was graded on both. It also ran as a dozen
--      separate writes from the server, so a failure half way left a player's
--      history split across two profiles.
--   4. "Delete player" is what the portal tells a coach to use for a
--      right-to-erasure request, and it removed one row: the bookings, lesson
--      summaries, messages, recordings and camp details all stayed.
--
-- Safe to run twice. It removes no existing data: the attendance rule applies
-- to records written from now on, and the two functions do nothing until the
-- server calls them. Tables and columns are checked for before they are used,
-- because production has some that the migrations do not know about and may be
-- missing some that they do.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1. Consent submissions: the column every list is sorted by ══════════════
-- Added only if it is not already there (it may have been added by hand in
-- production), and filled from submitted_at so existing forms keep their order.
do $$
begin
  if to_regclass('public.coach_consent_submissions') is not null
     and not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'coach_consent_submissions'
                       and column_name = 'created_at') then
    alter table public.coach_consent_submissions add column created_at timestamptz;
    update public.coach_consent_submissions set created_at = coalesce(submitted_at, now());
    alter table public.coach_consent_submissions alter column created_at set default now();
  end if;
end $$;


-- ══ 2. Attendance: a date, not in the future, once per player per day ═══════
-- A trigger rather than a unique index: an index could not be built while old
-- duplicate records exist, and deleting a coach's records to make room for one
-- is not this migration's call. Existing records are left exactly as they are
-- and can still be marked present/absent or removed; the rule is applied to
-- records that are added, or moved to another day or player.
--
-- The messages are written to be shown to a coach as they stand.
--
-- Runs with its owner's rights so it sees every record for the player: an
-- assistant coach cannot read a colleague's records, and would otherwise be
-- allowed a second one for the same day.
create or replace function lumio_attendance_rules()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- A merge carries old records across as they are (see section 3).
  if current_setting('lumio.merging_players', true) = 'on' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.player_id    is not distinct from old.player_id
     and new.session_date is not distinct from old.session_date then
    return new;
  end if;

  if new.session_date is null then
    raise exception 'Choose the date of the session first.' using errcode = '23514';
  end if;
  -- One day's grace, so a late-evening session is not refused because the
  -- database's clock (UTC) is a few hours behind or ahead of the court.
  if new.session_date > current_date + 1 then
    raise exception 'That date is in the future. Attendance can only be recorded for a session that has happened.' using errcode = '23514';
  end if;

  -- Two taps landing together must not both get through.
  perform pg_advisory_xact_lock(hashtextextended(new.player_id::text || ':' || new.session_date::text, 0));
  if exists (select 1 from coach_attendance a
             where a.player_id = new.player_id and a.session_date = new.session_date
               and a.id is distinct from new.id) then
    raise exception 'Attendance is already recorded for this player on that day. Change that record instead.' using errcode = '23505';
  end if;
  return new;
end $$;

do $$
begin
  if to_regclass('public.coach_attendance') is not null then
    -- Changing a record stamps updated_at, as on every other table. The column
    -- was missing here, so each change was refused once and then retried
    -- without it (migration 162 added it to the other tables that lacked it).
    alter table public.coach_attendance add column if not exists updated_at timestamptz default now();

    drop trigger if exists trg_lumio_attendance_rules on public.coach_attendance;
    create trigger trg_lumio_attendance_rules before insert or update on public.coach_attendance
      for each row execute function lumio_attendance_rules();
  end if;
end $$;


-- ══ 3. Merging profiles, in one step ════════════════════════════════════════
-- WHAT WAS WRONG. The server moved each table with its own UPDATE. For skills
-- and book recommendations, which allow one row per player per skill/book, a
-- single clash failed the whole UPDATE — and the handler's answer was to delete
-- EVERY row the merged profile had in that table. A profile with three graded
-- skills, one of which the kept profile also had, lost all three.
--
-- THE RULE NOW. One function, one transaction: either everything has moved and
-- the duplicates are gone, or nothing has changed.
--   · Skills: every skill moves. Where both profiles graded the same skill, the
--     grade that was set most recently is kept (a grade is a coach's latest
--     judgement; the older one is out of date, not better). A real grade always
--     beats "not graded".
--   · Book/video recommendations: every one moves. The same item on both is kept
--     once, with both notes.
--   · Attendance: every day moves. The same day on both is kept once, as
--     present if either said present.
--   · Everything else that points at a player is re-pointed: bookings, lessons,
--     payments, camp places, messages, recordings, effort sessions, development
--     notes, booking links — and any table with a foreign key to coach_players
--     that this list does not know about yet.
--   · Family logins follow the player; the same person on both becomes one.
--   · Blanks on the kept profile are filled from the others; notes and medical
--     notes are joined rather than dropped; XP is added; a consent given on any
--     profile counts.
--
-- Callable by Lumio's servers only.
create or replace function lumio_merge_players(p_academy uuid, p_keep uuid, p_merge uuid[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_losers  uuid[];
  v_keep    coach_players%rowtype;
  v_name    text;
  v_moved   jsonb := '{}'::jsonb;
  v_filled  text[] := '{}';
  v_n       integer;
  v_logins  integer := 0;
  v_ok      boolean;
  r         record;
  k         record;
  c         text;
  t         text;
begin
  v_losers := array(select distinct x from unnest(coalesce(p_merge, '{}'::uuid[])) x where x is not null and x <> p_keep);
  if p_keep is null or coalesce(array_length(v_losers, 1), 0) = 0 then
    raise exception 'Pick which profile to keep and at least one to merge into it.' using errcode = '22023';
  end if;

  -- Lock every profile involved, in a fixed order, so two merges of the same
  -- people cannot interleave.
  perform 1 from coach_players
   where coach_id = p_academy and id = any(v_losers || p_keep)
   order by id for update;

  select * into v_keep from coach_players where id = p_keep and coach_id = p_academy;
  if not found
     or (select count(*) from coach_players where coach_id = p_academy and id = any(v_losers)) <> array_length(v_losers, 1) then
    -- Everything in a merge has to belong to this academy.
    raise exception 'Those players are not all on your roster.' using errcode = 'P0002';
  end if;
  v_name := lower(btrim(coalesce(v_keep.name, '')));

  -- A merged profile under a different spelling takes the kept name first. The
  -- rename rule (migration 193) then carries its bookings, lessons, payments,
  -- card charges and messages across to the kept name.
  update coach_players
     set name = v_keep.name
   where coach_id = p_academy and id = any(v_losers)
     and coalesce(btrim(v_keep.name), '') <> ''
     and lower(btrim(coalesce(name, ''))) <> v_name;

  -- ── Skills: newest grade wins a clash; nothing else is lost ───────────────
  if to_regclass('public.coach_player_skills') is not null then
    with ranked as (
      select s.id,
             row_number() over (
               partition by s.skill
               order by (coalesce(s.score, 0) > 0) desc,
                        coalesce(s.updated_at, s.created_at) desc nulls last,
                        s.score desc nulls last,
                        (s.player_id = p_keep) desc,
                        s.id) as rn
      from coach_player_skills s
      where s.player_id = any(v_losers || p_keep)
    )
    delete from coach_player_skills s using ranked x where x.id = s.id and x.rn > 1;

    update coach_player_skills set player_id = p_keep where player_id = any(v_losers);
    get diagnostics v_n = row_count;
    if v_n > 0 then v_moved := v_moved || jsonb_build_object('coach_player_skills', v_n); end if;
  end if;

  -- ── Recommendations: the same item on both is kept once, notes joined ─────
  if to_regclass('public.coach_player_resources') is not null then
    for r in
      select kind, ref_id,
             (array_agg(id order by (player_id = p_keep) desc, created_at, id))[1] as win,
             string_agg(distinct nullif(btrim(note), ''), E'\n') as notes
      from coach_player_resources
      where player_id = any(v_losers || p_keep) and ref_id is not null
      group by kind, ref_id
      having count(*) > 1
    loop
      update coach_player_resources set note = r.notes where id = r.win and r.notes is not null and note is distinct from r.notes;
      delete from coach_player_resources
       where player_id = any(v_losers || p_keep) and kind is not distinct from r.kind and ref_id = r.ref_id and id <> r.win;
    end loop;

    update coach_player_resources set player_id = p_keep where player_id = any(v_losers);
    get diagnostics v_n = row_count;
    if v_n > 0 then v_moved := v_moved || jsonb_build_object('coach_player_resources', v_n); end if;
  end if;

  -- ── Attendance: one record per day ────────────────────────────────────────
  if to_regclass('public.coach_attendance') is not null then
    -- Present on any profile that day means the player was there.
    update coach_attendance a set present = true
     where a.player_id = p_keep and a.present is distinct from true and a.session_date is not null
       and exists (select 1 from coach_attendance l
                   where l.player_id = any(v_losers) and l.session_date = a.session_date and l.present);
    delete from coach_attendance l
     where l.player_id = any(v_losers) and l.session_date is not null
       and exists (select 1 from coach_attendance a where a.player_id = p_keep and a.session_date = l.session_date);
    -- The same day on two of the merged profiles.
    with ranked as (
      select l.id, row_number() over (partition by l.session_date order by l.present desc nulls last, l.created_at desc nulls last, l.id) as rn
      from coach_attendance l
      where l.player_id = any(v_losers) and l.session_date is not null
    )
    delete from coach_attendance l using ranked x where x.id = l.id and x.rn > 1;

    -- Old records with no date or a date ahead are carried across as they are;
    -- the rule in section 2 is for new records, not a reason to refuse a merge.
    perform set_config('lumio.merging_players', 'on', true);
    update coach_attendance set player_id = p_keep where player_id = any(v_losers);
    get diagnostics v_n = row_count;
    perform set_config('lumio.merging_players', 'off', true);
    if v_n > 0 then v_moved := v_moved || jsonb_build_object('coach_attendance', v_n); end if;
  end if;

  -- ── Family logins follow the player ───────────────────────────────────────
  -- A parent's or player's membership names its profile in scope_player_id.
  -- If the same person already has one for the kept profile the two become one:
  -- the kept row survives with the better of the two states, and inherits the
  -- sign-in from the duplicate if it had none — whoever could open the page
  -- before the merge can open it after.
  if to_regclass('public.coach_members') is not null then
    for r in
      select m.* from coach_members m
      where m.academy_id = p_academy and m.scope_player_id = any(v_losers) and m.role in ('parent', 'student')
      order by (case m.status when 'active' then 2 when 'invited' then 1 else 0 end) desc, m.created_at
    loop
      select m.* into k from coach_members m
      where m.academy_id = p_academy and m.scope_player_id = p_keep
        and m.role in ('parent', 'student') and m.email = r.email
      limit 1;
      if not found then
        update coach_members set scope_player_id = p_keep, updated_at = now() where id = r.id;
        v_logins := v_logins + 1;
      else
        delete from coach_members where id = r.id;
        if (case r.status when 'active' then 2 when 'invited' then 1 else 0 end)
           > (case k.status when 'active' then 2 when 'invited' then 1 else 0 end) then
          update coach_members
             set status = r.status, member_user_id = coalesce(k.member_user_id, r.member_user_id), updated_at = now()
           where id = k.id;
        end if;
      end if;
    end loop;
    if v_logins > 0 then v_moved := v_moved || jsonb_build_object('coach_members', v_logins); end if;
  end if;

  -- ── Everything else that points at a player ───────────────────────────────
  -- The known tables (three of them have no foreign key, so they are named),
  -- plus anything with a foreign key to coach_players — a table added later is
  -- moved without anyone having to remember this list.
  for r in
    select x.tbl, x.col from (
      select cl.relname::text as tbl, a.attname::text as col
      from pg_constraint con
      join pg_class cl on cl.oid = con.conrelid
      join pg_namespace ns on ns.oid = cl.relnamespace and ns.nspname = 'public'
      join pg_attribute a on a.attrelid = con.conrelid and a.attnum = con.conkey[1]
      where con.contype = 'f' and con.confrelid = 'public.coach_players'::regclass
        and array_length(con.conkey, 1) = 1
      union
      select col.table_name::text, col.column_name::text
      from information_schema.columns col
      where col.table_schema = 'public' and col.column_name = 'player_id'
        and col.table_name in ('coach_bookings', 'coach_sessions', 'coach_media', 'coach_payments',
                               'coach_watch_sessions', 'coach_camp_attendees', 'coach_development',
                               'coach_booking_links', 'coach_messages')
    ) x
    where x.tbl not in ('coach_player_skills', 'coach_player_resources', 'coach_attendance', 'coach_members')
    order by x.tbl, x.col
  loop
    execute format('update public.%I set %I = $1 where %I = any($2)', r.tbl, r.col, r.col) using p_keep, v_losers;
    get diagnostics v_n = row_count;
    if v_n > 0 then v_moved := v_moved || jsonb_build_object(r.tbl, v_n); end if;
  end loop;

  -- ── Rescue what the duplicates knew ───────────────────────────────────────
  foreach c in array array[
    'nickname', 'age', 'level', 'category', 'racket_stage', 'goal', 'avatar_url',
    'email', 'contact_email', 'parent_email', 'parent_name', 'phone', 'contact_phone', 'parent_phone',
    'payment_method', 'year_group', 'consent_by', 'consent_date', 'discord_user_id',
    'tp_school_id', 'tp_programme_id'
  ] loop
    select exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = 'coach_players' and column_name = c) into v_ok;
    if not v_ok then continue; end if;
    execute format($f$
      update public.coach_players kp
         set %1$I = (select l.%1$I from public.coach_players l
                     where l.id = any($2) and l.%1$I is not null and btrim(l.%1$I::text) <> ''
                     order by array_position($2, l.id) limit 1)
       where kp.id = $1 and (kp.%1$I is null or btrim(kp.%1$I::text) = '')
         and exists (select 1 from public.coach_players l
                     where l.id = any($2) and l.%1$I is not null and btrim(l.%1$I::text) <> '')
    $f$, c) using p_keep, v_losers;
    get diagnostics v_n = row_count;
    if v_n > 0 then v_filled := v_filled || c; end if;
  end loop;

  -- The coach: the id and the name travel together, and only when the kept
  -- profile has neither (filling the id alone would overwrite a name).
  if v_keep.staff_id is null and coalesce(btrim(v_keep.assigned_coach), '') = '' then
    select l.staff_id, l.assigned_coach into k from coach_players l
     where l.id = any(v_losers) and (l.staff_id is not null or coalesce(btrim(l.assigned_coach), '') <> '')
     order by array_position(v_losers, l.id) limit 1;
    if found then
      update coach_players set staff_id = k.staff_id, assigned_coach = k.assigned_coach where id = p_keep;
      v_filled := v_filled || 'assigned_coach'::text;
    end if;
  end if;

  -- Development targets travel as a set.
  if v_keep.targets is null or v_keep.targets = '[]'::jsonb then
    select l.targets, l.targets_note, l.targets_set_at, l.targets_by into k from coach_players l
     where l.id = any(v_losers) and l.targets is not null and l.targets <> '[]'::jsonb
     order by l.targets_set_at desc nulls last limit 1;
    if found then
      update coach_players set targets = k.targets, targets_note = k.targets_note,
             targets_set_at = k.targets_set_at, targets_by = k.targets_by where id = p_keep;
      v_filled := v_filled || 'targets'::text;
    end if;
  end if;

  -- Free text is joined, never dropped: an allergy written on the duplicate
  -- must not vanish because the kept profile already said "asthma".
  foreach c in array array['notes', 'medical_notes'] loop
    for r in execute format(
      'select btrim(l.%1$I) as txt from public.coach_players l where l.id = any($1) and coalesce(btrim(l.%1$I), '''') <> '''' order by array_position($1, l.id)', c)
      using v_losers
    loop
      execute format($f$
        update public.coach_players kp
           set %1$I = case when coalesce(btrim(kp.%1$I), '') = '' then $2 else kp.%1$I || E'\n' || $2 end
         where kp.id = $1 and position(lower($2) in lower(coalesce(kp.%1$I, ''))) = 0
      $f$, c) using p_keep, r.txt;
      get diagnostics v_n = row_count;
      if v_n > 0 and not (c = any(v_filled)) then v_filled := v_filled || c; end if;
    end loop;
  end loop;

  -- XP is a total, so it adds up; a consent given on any profile was given.
  update coach_players kp
     set xp_total        = coalesce(kp.xp_total, 0) + coalesce((select sum(coalesce(l.xp_total, 0)) from coach_players l where l.id = any(v_losers)), 0),
         consent_data     = coalesce(kp.consent_data, false)     or exists (select 1 from coach_players l where l.id = any(v_losers) and l.consent_data),
         consent_photo    = coalesce(kp.consent_photo, false)    or exists (select 1 from coach_players l where l.id = any(v_losers) and l.consent_photo),
         consent_medical  = coalesce(kp.consent_medical, false)  or exists (select 1 from coach_players l where l.id = any(v_losers) and l.consent_medical),
         consent_wearable = coalesce(kp.consent_wearable, false) or exists (select 1 from coach_players l where l.id = any(v_losers) and l.consent_wearable),
         updated_at       = now()
   where kp.id = p_keep;

  -- ── Only now, the empty shells ────────────────────────────────────────────
  delete from coach_players where coach_id = p_academy and id = any(v_losers);

  -- Rows that carry the name and no id (written before ids existed). While the
  -- name was shared there was no telling whose they were; if the merge has left
  -- exactly one player with it, they are that player's — the same rule
  -- migration 193 applies everywhere else.
  if v_name <> '' and lumio_player_by_name(p_academy, v_keep.name) = p_keep then
    foreach t in array array['coach_bookings', 'coach_sessions', 'coach_payments',
                             'coach_development', 'coach_media', 'coach_camp_attendees'] loop
      select count(*) = 3 into v_ok from information_schema.columns
       where table_schema = 'public' and table_name = t and column_name in ('coach_id', 'player_id', 'player_name');
      if not v_ok then continue; end if;
      execute format('update public.%I set player_id = $1 where coach_id = $2 and player_id is null and lower(btrim(player_name)) = $3', t)
        using p_keep, p_academy, v_name;
    end loop;
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'coach_messages' and column_name = 'player_id') then
      update coach_messages m set player_id = p_keep
       where m.coach_id = p_academy and m.player_id is null and m.camp_id is null
         and lower(coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients))) = v_name;
    end if;
  end if;

  return jsonb_build_object('kept', p_keep, 'merged', array_length(v_losers, 1), 'moved', v_moved, 'filled', to_jsonb(v_filled));
end $$;

revoke all on function lumio_merge_players(uuid, uuid, uuid[]) from public, anon, authenticated;
grant execute on function lumio_merge_players(uuid, uuid, uuid[]) to service_role;


-- ══ 4. Deleting a player erases them ════════════════════════════════════════
-- WHAT WAS WRONG. The Consent tab says "use Delete for a right-to-erasure
-- request". Delete removed the profile row (and, since migration 195, the
-- family's login). The player's bookings stayed on the calendar, their lesson
-- summaries, messages and recordings stayed, and the camp place kept the
-- parent's phone number and the child's medical notes.
--
-- THE RULE NOW. Delete means what the screen says.
--   ERASED: the profile, photo, skills, attendance, effort sessions,
--     recommendations, family logins (those go with the row), and now also
--     bookings, lesson summaries, development notes, recordings, messages with
--     the family, booking links, GPS sessions, the consent form a parent sent
--     in, the player's targets inside a camp, and any camp place with no money
--     against it.
--   KEPT, WITHOUT THE NAME: payments (paid or not), card charges, and camp
--     places that have money against them. A business has to keep its financial
--     records; it does not have to keep whose child they were about. The name
--     becomes "Removed player", the link to the player goes, and the notes,
--     parent details and medical details on those rows are cleared.
--
-- Rows that carry only a NAME (no player id) are treated as this player's only
-- when nobody else in the academy has that name — otherwise they might be the
-- other person's and are left alone.
--
-- Returns what was erased and kept, the future bookings that were removed (so
-- the server can take them out of a connected calendar), and the storage paths
-- of the recordings (so the server can remove the files).
--
-- Callable by Lumio's servers only.
create or replace function lumio_erase_player(p_academy uuid, p_player uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v         coach_players%rowtype;
  v_name    text;
  v_only    boolean;
  v_gone    constant text := 'Removed player';
  v_erased  jsonb := '{}'::jsonb;
  v_kept    jsonb := '{}'::jsonb;
  v_paths   text[] := '{}';
  v_booked  uuid[] := '{}';
  v_n       integer;
begin
  select * into v from coach_players where id = p_player and coach_id = p_academy for update;
  if not found then
    raise exception 'Player not found' using errcode = 'P0002';
  end if;
  v_name := lower(btrim(coalesce(v.name, '')));
  v_only := v_name <> '' and not exists (
    select 1 from coach_players p
    where p.coach_id = p_academy and p.id <> p_player and lower(btrim(p.name)) = v_name);

  -- Recordings: remember the files, then the rows (and clips cut from them).
  if to_regclass('public.coach_media') is not null then
    select coalesce(array_agg(m.storage_path) filter (where coalesce(m.storage_path, '') <> ''), '{}') into v_paths
    from coach_media m
    where m.coach_id = p_academy
      and (m.player_id = p_player or (v_only and m.player_id is null and lower(btrim(m.player_name)) = v_name));
    delete from coach_media m
     where m.coach_id = p_academy
       and (m.player_id = p_player or (v_only and m.player_id is null and lower(btrim(m.player_name)) = v_name));
    get diagnostics v_n = row_count;
    v_erased := v_erased || jsonb_build_object('recordings', v_n);
  end if;

  if to_regclass('public.coach_bookings') is not null then
    select coalesce(array_agg(b.id), '{}') into v_booked
    from coach_bookings b
    where b.coach_id = p_academy and b.booking_date >= current_date - 1
      and (b.player_id = p_player or (v_only and b.player_id is null and lower(btrim(b.player_name)) = v_name));
    delete from coach_bookings b
     where b.coach_id = p_academy
       and (b.player_id = p_player or (v_only and b.player_id is null and lower(btrim(b.player_name)) = v_name));
    get diagnostics v_n = row_count;
    v_erased := v_erased || jsonb_build_object('bookings', v_n);
  end if;

  if to_regclass('public.coach_sessions') is not null then
    delete from coach_sessions s
     where s.coach_id = p_academy
       and (s.player_id = p_player or (v_only and s.player_id is null and lower(btrim(s.player_name)) = v_name));
    get diagnostics v_n = row_count;
    v_erased := v_erased || jsonb_build_object('lessons', v_n);
  end if;

  if to_regclass('public.coach_development') is not null then
    delete from coach_development d
     where d.coach_id = p_academy
       and (d.player_id = p_player or (v_only and d.player_id is null and lower(btrim(d.player_name)) = v_name));
  end if;

  if to_regclass('public.coach_messages') is not null then
    delete from coach_messages m
     where m.coach_id = p_academy
       and (m.player_id = p_player
            or (v_only and m.player_id is null and m.camp_id is null
                and lower(coalesce(nullif(btrim(m.thread_key), ''), btrim(m.recipients))) = v_name));
    get diagnostics v_n = row_count;
    v_erased := v_erased || jsonb_build_object('messages', v_n);
  end if;

  if to_regclass('public.coach_booking_links') is not null then
    delete from coach_booking_links l where l.coach_id = p_academy and l.player_id = p_player;
  end if;

  if v_only and to_regclass('public.coach_gps_sessions') is not null then
    delete from coach_gps_sessions g where g.coach_id = p_academy and lower(btrim(g.player_name)) = v_name;
  end if;

  if v_only and to_regclass('public.coach_consent_submissions') is not null then
    delete from coach_consent_submissions c where c.coach_id = p_academy and lower(btrim(c.child_name)) = v_name;
  end if;

  -- A camp's per-player targets: a list of { player_name, … }.
  if v_only and exists (select 1 from information_schema.columns
                        where table_schema = 'public' and table_name = 'coach_camps' and column_name = 'player_targets') then
    update coach_camps c
       set player_targets = coalesce((
             select jsonb_agg(e.v order by e.n)
             from jsonb_array_elements(c.player_targets) with ordinality as e(v, n)
             where not (jsonb_typeof(e.v) = 'object' and lower(btrim(e.v ->> 'player_name')) = v_name)), '[]'::jsonb)
     where c.coach_id = p_academy
       and jsonb_typeof(c.player_targets) = 'array'
       and exists (select 1 from jsonb_array_elements(c.player_targets) x
                   where jsonb_typeof(x) = 'object' and lower(btrim(x ->> 'player_name')) = v_name);
  end if;

  -- Camp places. No money against it → it goes. Money against it → the place
  -- stays on the camp's books with everything personal cleared.
  if to_regclass('public.coach_camp_attendees') is not null then
    delete from coach_camp_attendees a
     where a.coach_id = p_academy
       and (a.player_id = p_player or (v_only and a.player_id is null and lower(btrim(a.player_name)) = v_name))
       and not coalesce(a.paid, false) and coalesce(a.paid_pennies, 0) = 0;
    get diagnostics v_n = row_count;
    v_erased := v_erased || jsonb_build_object('campPlaces', v_n);

    update coach_camp_attendees a
       set player_id = null, player_name = v_gone,
           parent_name = null, parent_email = null, parent_phone = null, player_age = null,
           medical_notes = null, emergency_contact = null, camp_goal = null,
           room = null, arrival = null, form_answers = null,
           consent_photo = false, consent_medical = false
     where a.coach_id = p_academy
       and (a.player_id = p_player or (v_only and a.player_id is null and lower(btrim(a.player_name)) = v_name));
    get diagnostics v_n = row_count;
    v_kept := v_kept || jsonb_build_object('campPlaces', v_n);
  end if;

  -- Money: kept, without the name.
  if to_regclass('public.coach_payments') is not null then
    update coach_payments p
       set player_id = null, player_name = v_gone, notes = null
     where p.coach_id = p_academy
       and (p.player_id = p_player or (v_only and p.player_id is null and lower(btrim(p.player_name)) = v_name));
    get diagnostics v_n = row_count;
    v_kept := v_kept || jsonb_build_object('payments', v_n);
  end if;
  if v_only and to_regclass('public.coach_charges') is not null then
    update coach_charges c set player_name = v_gone
     where c.coach_id = p_academy and lower(btrim(c.player_name)) = v_name;
  end if;

  -- The profile itself. Skills, attendance, effort sessions, recommendations
  -- and family logins are removed with it by their foreign keys.
  delete from coach_players where id = p_player and coach_id = p_academy;

  return jsonb_build_object(
    'erased', v_erased, 'kept', v_kept,
    'bookingIds', to_jsonb(v_booked), 'mediaPaths', to_jsonb(v_paths),
    'avatar', v.avatar_url);
end $$;

revoke all on function lumio_erase_player(uuid, uuid) from public, anon, authenticated;
grant execute on function lumio_erase_player(uuid, uuid) to service_role;
