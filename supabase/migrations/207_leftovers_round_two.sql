-- ═══════════════════════════════════════════════════════════════════════════
-- 207 — Leftovers from the second test round
--
-- Five separate things, each small. Safe to run twice; nothing here rewrites
-- existing rows.
--
--   1. Resources given to a player can be kept to that player.
--   2. Deleting a player also deletes the session plans written for them.
--   3. Merging two profiles whose names differ only in capitals leaves the
--      moved rows under the kept spelling.
--   4. A family logging sessions has a weekly limit as well as a daily one.
--   5. A dated record of every racket (colour) change.
-- ═══════════════════════════════════════════════════════════════════════════


-- ══ 1. "Give to a player" keeps a resource to that player ═══════════════════
-- WHAT WAS WRONG. A resource is on a player's page when its racket colour is
-- theirs, or when its level is "All levels" — which is what the Add form
-- starts on. So a resource given to Ben was also on every other player's
-- page, and taking it back from Ben did not take it off his.
--
-- THE RULE NOW. A resource marked given_only is shown to the players it has
-- been given to and nobody else, whatever its level says. The Give dialog sets
-- it (and offers "also show it to every player" for the coach who wants both).
-- Existing resources are untouched: false means "as before".
alter table public.coach_resources add column if not exists given_only boolean not null default false;


-- ══ 2. Deleting a player erases their session plans too ═════════════════════
-- The whole function is restated (it is replaced as one piece); the only
-- change from migration 200 is the block marked (207).
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

  -- (207) Session plans. A plan written for one of this player's bookings has
  -- their name in its title and the coach's note about them ("diabetic — sugar
  -- on hand"). It used to be left behind, still listed in Session Planner.
  -- Removed BEFORE the bookings, while the link to them is still there. A
  -- stand-alone plan under the player's name goes too, when the name is theirs
  -- alone.
  if to_regclass('public.coach_session_plans') is not null then
    delete from coach_session_plans sp
     where sp.coach_id = p_academy
       and (sp.booking_id in (
              select b.id from coach_bookings b
               where b.coach_id = p_academy
                 and (b.player_id = p_player or (v_only and b.player_id is null and lower(btrim(b.player_name)) = v_name)))
            or (v_only and lower(btrim(sp.group_name)) = v_name));
    get diagnostics v_n = row_count;
    v_erased := v_erased || jsonb_build_object('plans', v_n);
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


-- ══ 3. A merge leaves one spelling ══════════════════════════════════════════
-- Restated in full for the same reason; the two changes from migration 200 are
-- marked (207).
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
  -- (207) "Different" now includes capitals: "casey mccase" merged into "Casey
  -- McCase" used to be skipped here, so its rows kept the old spelling.
  update coach_players
     set name = v_keep.name
   where coach_id = p_academy and id = any(v_losers)
     and coalesce(btrim(v_keep.name), '') <> ''
     and name is distinct from v_keep.name;

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
      -- (207) They take the kept spelling as well as the id.
      execute format('update public.%I set player_id = $1, player_name = $4 where coach_id = $2 and player_id is null and lower(btrim(player_name)) = $3', t)
        using p_keep, p_academy, v_name, v_keep.name;
    end loop;
    if to_regclass('public.coach_bookings') is not null then
      update coach_bookings b set title = v_keep.name
       where b.coach_id = p_academy and b.player_id = p_keep
         and lower(btrim(b.title)) = v_name and b.title is distinct from v_keep.name;
    end if;
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


-- ══ 4. A weekly limit on sessions a family logs ═════════════════════════════
-- WHAT WAS WRONG. The limit was three typed-in sessions per player per DAY,
-- and a session could be dated up to thirty days back. Somebody could
-- therefore log three a day for every one of those days in a few seconds and
-- take a player's XP from 1,307 to 8,507.
--
-- THE RULE NOW. The server lets a family date a session at most seven days
-- back, and this function counts what the family has logged in the last seven
-- days before saving another. It takes the same lock on the player as
-- lumio_log_effort (which it then calls), so two logs sent together cannot
-- both slip under the limit. Sessions the COACH logs are not counted and not
-- limited by this — the coach's route still calls lumio_log_effort directly.
--
-- Callable by Lumio's servers only.
create or replace function lumio_log_family_effort(
  p_coach uuid, p_player uuid, p_source text, p_started timestamptz, p_duration numeric,
  p_avg_hr integer, p_max_hr integer, p_kcal numeric, p_distance numeric,
  p_effort integer, p_movement integer, p_consistency integer, p_xp integer,
  p_estimated boolean, p_raw jsonb, p_daily_cap integer, p_weekly_cap integer)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_total integer;
  v_week  integer;
begin
  select coalesce(xp_total, 0) into v_total
    from coach_players where id = p_player and coach_id = p_coach for update;
  if not found then
    return jsonb_build_object('status', 'no_player');
  end if;

  select count(*) into v_week from coach_watch_sessions
   where player_id = p_player and source = 'manual' and not coalesce(voided, false)
     and coalesce(raw ->> 'logged_by', '') <> 'coach'
     and created_at > now() - interval '7 days';
  if v_week >= p_weekly_cap then
    return jsonb_build_object('status', 'week_cap', 'xp_total', v_total);
  end if;

  return lumio_log_effort(p_coach, p_player, p_source, p_started, p_duration, p_avg_hr, p_max_hr, p_kcal,
                          p_distance, p_effort, p_movement, p_consistency, p_xp, p_estimated, p_raw, p_daily_cap);
end $$;

revoke all on function lumio_log_family_effort(uuid, uuid, text, timestamptz, numeric, integer, integer, numeric, numeric, integer, integer, integer, integer, boolean, jsonb, integer, integer) from public, anon, authenticated;
grant execute on function lumio_log_family_effort(uuid, uuid, text, timestamptz, numeric, integer, integer, numeric, numeric, integer, integer, integer, integer, boolean, jsonb, integer, integer) to service_role;


-- ══ 5. A dated record of racket changes ═════════════════════════════════════
-- WHAT WAS WRONG. The only record of a racket being awarded was the player's
-- current colour. Nothing said when they moved, or from what.
--
-- THE RULE NOW. Every change of a player's racket_stage — an award, a move on
-- the squad matrix, an edit on the roster — writes one row here, in the same
-- step as the change, with the date and who was signed in. Nobody writes to
-- this table directly: there is no insert, update or delete rule, only the
-- trigger. Rows go when the player is deleted.
--
-- Who can read a row: whoever can see that player (the head coach, or the
-- coach the player is assigned to) — the same rule as the player's skills.
create table if not exists public.coach_racket_awards (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  player_id   uuid not null references public.coach_players(id) on delete cascade,
  from_stage  text,
  to_stage    text,
  changed_by  uuid,
  created_at  timestamptz not null default now()
);
create index if not exists idx_coach_racket_awards_player on public.coach_racket_awards (coach_id, player_id, created_at desc);

alter table public.coach_racket_awards enable row level security;

drop policy if exists "lumio_racket_awards_owner" on public.coach_racket_awards;
create policy "lumio_racket_awards_owner" on public.coach_racket_awards
  for select to authenticated
  using (coach_id = auth.uid());

drop policy if exists "lumio_racket_awards_staff" on public.coach_racket_awards;
create policy "lumio_racket_awards_staff" on public.coach_racket_awards
  for select to authenticated
  using (lumio_can_see(coach_id, (select p.staff_id from public.coach_players p where p.id = coach_racket_awards.player_id)));

revoke all on public.coach_racket_awards from anon;
revoke insert, update, delete on public.coach_racket_awards from authenticated;
grant select on public.coach_racket_awards to authenticated;
grant all on public.coach_racket_awards to service_role;

create or replace function lumio_record_racket_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.racket_stage is distinct from old.racket_stage then
    insert into coach_racket_awards (coach_id, player_id, from_stage, to_stage, changed_by)
    values (new.coach_id, new.id, old.racket_stage, new.racket_stage, auth.uid());
  end if;
  return new;
end $$;
revoke all on function lumio_record_racket_change() from public, anon, authenticated;

drop trigger if exists trg_lumio_record_racket_change on public.coach_players;
create trigger trg_lumio_record_racket_change
  after update of racket_stage on public.coach_players
  for each row execute function lumio_record_racket_change();
