-- Family memberships: one per child, and nothing left pointing at nothing.
--
-- coach_members was unique on (academy_id, email) with a single scope_player_id,
-- so a parent could hold access to exactly one child per academy. Inviting them
-- for a second child overwrote the first; a coach whose own child joined the
-- academy had their coach row turned into a parent row. And scope_player_id was
-- a bare uuid: delete or merge the player and the login stayed "active",
-- pointing at a row that no longer existed ("Player not found").
--
-- After this migration:
--   • a coach is still ONE row per academy + email;
--   • a parent/student is one row PER CHILD (academy + email + player);
--   • a family membership cannot outlive its player;
--   • people locked out by a re-sent invite (bound to a user but back at
--     'invited') are let back in;
--   • XP is added to a player's total inside the database, so two sessions
--     landing together cannot lose one.
--
-- Safe to run twice. Existing rows keep working: every row that was unique on
-- (academy_id, email) is unique under both new rules.
--
-- DEPLOY ORDER: run this BEFORE the code that goes with it is live for long —
-- the old invite route upserts on (academy_id, email) and will fail once that
-- constraint has gone; the new one does not depend on it.

-- ── 1. Tidy what is there ───────────────────────────────────────────────────
-- Addresses are compared exactly from now on (an ilike match treats "_" as a
-- wildcard, which is not how anyone's email address should be matched), so
-- every stored address has to be in the one form the app writes: trimmed and
-- lower-case. Skipped where tidying would collide with a row that is already
-- tidy — that row wins and the untidy one simply never matches a sign-in.
update coach_members m
   set email = lower(btrim(m.email))
 where m.email <> lower(btrim(m.email))
   and not exists (select 1 from coach_members o
                    where o.academy_id = m.academy_id and o.id <> m.id
                      and o.email = lower(btrim(m.email)));

-- A family login whose player has gone, or belongs to a different academy,
-- opens nothing: the portal answers "Player not found". Removed, so the foreign
-- key below can be added and so the person sees an honest "no access" page.
delete from coach_members m
 where m.role in ('parent', 'student')
   and m.scope_player_id is not null
   and not exists (select 1 from coach_players p
                    where p.id = m.scope_player_id and p.coach_id = m.academy_id);

-- Bound to a user but 'invited' can only mean one thing: they had signed in
-- (binding is the only thing that sets member_user_id, and it sets 'active' in
-- the same write) and a re-sent invite then put them back to 'invited', where
-- nothing would ever activate them again. Let them back in.
update coach_members
   set status = 'active', updated_at = now()
 where member_user_id is not null and status = 'invited';

-- ── 2. One row per coach, one row per child ─────────────────────────────────
alter table coach_members drop constraint if exists coach_members_academy_id_email_key;

create unique index if not exists coach_members_one_coach
  on coach_members (academy_id, email) where role = 'coach';
create unique index if not exists coach_members_one_per_player
  on coach_members (academy_id, email, scope_player_id) where role in ('parent', 'student');
create index if not exists idx_coach_members_scope_player on coach_members (scope_player_id);

-- When the invite email last went out. Lets the invite route refuse to send the
-- same email again a few seconds later (a double-click used to send three).
alter table coach_members add column if not exists invite_sent_at timestamptz;

-- ── 3. A family login cannot outlive its player ─────────────────────────────
-- Deleting a player — one at a time from the roster, or all of them with
-- "Start again → Players" — now removes the family's access with it, which is
-- what that tick-box has always promised ("…and app access").
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_members_scope_player_fkey') then
    alter table coach_members
      add constraint coach_members_scope_player_fkey
      foreign key (scope_player_id) references coach_players(id) on delete cascade;
  end if;
end $$;

-- (That a membership cannot name ANOTHER academy's player is enforced by
-- migration 193's guard on this table, trg_lumio_guard_member.)
--
-- The address is tidied whoever writes the row, so the exact match used when an
-- invite is claimed, and the two unique rules above, always see one form.
create or replace function coach_members_tidy_email() returns trigger
language plpgsql set search_path = public as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end $$;

drop trigger if exists trg_coach_members_tidy_email on coach_members;
create trigger trg_coach_members_tidy_email
  before insert or update of email on coach_members
  for each row execute function coach_members_tidy_email();

-- ── 4. "Player app" off means off ───────────────────────────────────────────
-- The Settings switch only ever hid the coach's own preview; families could be
-- invited and use the portal with it off. The portal now honours it. Every
-- academy that has already invited a family is therefore switched ON here, so
-- nobody who can use their page today loses it when this ships — the switch
-- defaulted to off and most coaches never touched it.
update coach_settings s
   set data = coalesce(s.data, '{}'::jsonb) || jsonb_build_object('studentApp', true),
       updated_at = now()
 where coalesce(s.data ->> 'studentApp', '') <> 'true'
   and exists (select 1 from coach_members m
                where m.academy_id = s.coach_id
                  and m.role in ('parent', 'student') and m.status <> 'revoked');

insert into coach_settings (coach_id, data)
select distinct m.academy_id, jsonb_build_object('studentApp', true)
  from coach_members m
 where m.role in ('parent', 'student') and m.status <> 'revoked'
   and not exists (select 1 from coach_settings s where s.coach_id = m.academy_id);

-- ── 5. Effort sessions: saved and counted in one step ───────────────────────
-- The three routes that log a session (the family's "Log a session", the
-- coach's, and the smartwatch) each inserted the session, then read xp_total
-- and wrote it back plus the new XP. Two logs landing together both read the
-- same total and one award was lost. Here the player's row is locked first, so
-- logs for one player queue up, and the total is added to — never overwritten.
--
-- The same lock makes the other two rules safe:
--   • the same workout is counted once — a watch session with the same start
--     time, or the same hand-typed session (same length, effort and time)
--     sent twice within two minutes;
--   • no more than p_daily_cap sessions of one kind (typed / watch) for one
--     player on one day (UK date of the session).
-- Returns {status: ok | duplicate | cap | no_player, xp_total}.
--
-- Service role only: the routes decide who may log for whom; nobody calls this
-- with their own key.
create or replace function lumio_log_effort(
  p_coach uuid, p_player uuid, p_source text, p_started timestamptz, p_duration numeric,
  p_avg_hr integer, p_max_hr integer, p_kcal numeric, p_distance numeric,
  p_effort integer, p_movement integer, p_consistency integer, p_xp integer,
  p_estimated boolean, p_raw jsonb, p_daily_cap integer
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_total  integer;
  v_manual boolean := (p_source = 'manual');
  v_dupe   uuid;
  v_count  integer;
begin
  select coalesce(xp_total, 0) into v_total
    from coach_players where id = p_player and coach_id = p_coach for update;
  if not found then
    return jsonb_build_object('status', 'no_player');
  end if;

  if v_manual then
    select id into v_dupe from coach_watch_sessions
     where player_id = p_player and source = 'manual'
       and duration_min = p_duration
       and (raw ->> 'perceived_effort') is not distinct from (p_raw ->> 'perceived_effort')
       and created_at > now() - interval '2 minutes'
       and started_at between p_started - interval '2 minutes' and p_started + interval '2 minutes'
     limit 1;
  else
    -- Voided ones count as seen: a session the coach struck out must not come
    -- back because the watch sent it again.
    select id into v_dupe from coach_watch_sessions
     where player_id = p_player and source <> 'manual' and started_at = p_started
     limit 1;
  end if;
  if v_dupe is not null then
    return jsonb_build_object('status', 'duplicate', 'xp_total', v_total);
  end if;

  select count(*) into v_count from coach_watch_sessions
   where player_id = p_player and not coalesce(voided, false)
     and (source = 'manual') = v_manual
     and (started_at at time zone 'Europe/London')::date = (p_started at time zone 'Europe/London')::date;
  if v_count >= p_daily_cap then
    return jsonb_build_object('status', 'cap', 'xp_total', v_total);
  end if;

  insert into coach_watch_sessions (
    coach_id, player_id, source, started_at, duration_min, avg_hr, max_hr, active_kcal, distance_m,
    effort_score, movement_score, consistency_score, xp_awarded, estimated, raw
  ) values (
    p_coach, p_player, p_source, p_started, p_duration, p_avg_hr, p_max_hr, p_kcal, p_distance,
    p_effort, p_movement, p_consistency, p_xp, p_estimated, p_raw
  );

  update coach_players set xp_total = coalesce(xp_total, 0) + p_xp
   where id = p_player and coach_id = p_coach
   returning xp_total into v_total;

  return jsonb_build_object('status', 'ok', 'xp_total', v_total);
end $$;

-- Striking a session out (or putting it back) moves its XP with it, in the same
-- step, so the total always equals the sessions that count. Returns
-- {status: ok | unchanged | not_found, xp_total}.
create or replace function lumio_void_effort(p_coach uuid, p_session uuid, p_voided boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_player uuid;
  v_xp     integer;
  v_was    boolean;
  v_total  integer;
begin
  select player_id into v_player from coach_watch_sessions where id = p_session and coach_id = p_coach;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  -- Same lock, same order, as lumio_log_effort: player first, then the session.
  select coalesce(xp_total, 0) into v_total from coach_players where id = v_player for update;
  select coalesce(xp_awarded, 0), coalesce(voided, false) into v_xp, v_was
    from coach_watch_sessions where id = p_session for update;
  if v_was = p_voided then
    return jsonb_build_object('status', 'unchanged', 'xp_total', v_total);
  end if;
  update coach_watch_sessions set voided = p_voided, updated_at = now() where id = p_session;
  update coach_players
     set xp_total = greatest(0, coalesce(xp_total, 0) + case when p_voided then -v_xp else v_xp end)
   where id = v_player
   returning xp_total into v_total;
  return jsonb_build_object('status', 'ok', 'xp_total', v_total);
end $$;

revoke all on function lumio_log_effort(uuid, uuid, text, timestamptz, numeric, integer, integer, numeric, numeric, integer, integer, integer, integer, boolean, jsonb, integer) from public, anon, authenticated;
revoke all on function lumio_void_effort(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function lumio_log_effort(uuid, uuid, text, timestamptz, numeric, integer, integer, numeric, numeric, integer, integer, integer, integer, boolean, jsonb, integer) to service_role;
grant execute on function lumio_void_effort(uuid, uuid, boolean) to service_role;
