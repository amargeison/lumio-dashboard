-- ─────────────────────────────────────────────────────────────────────────────
-- 205 — private notes out of shared columns; public camp sign-ups that do not
--       create a second player of the same name; one answer on a full camp.
--
--   1. A public camp sign-up that shares a NAME with a player already on the
--      roster, but not their email, no longer creates a second roster player of
--      that name. It is saved as a camp place with no player attached, for the
--      coach to match (Attendees tab). The second same-name player made the
--      real family's name-keyed data ambiguous: their camp goals vanished from
--      their page and the coach could no longer message the child by name.
--   2. On a FULL camp the sign-up answers "full" whether or not the name and
--      email typed are already on the list. It used to answer "ok" for somebody
--      already on it, which let a stranger confirm that a named child, with a
--      given email address, was on the camp.
--   3. Lesson rows that hold a coach-only note in the column the family reads
--      (`summary`), or at the end of the shareable text (`ai_review`), have it
--      taken out. Nothing is lost: the private note stays in
--      review_json.coachNote and the plan note stays on the plan.
--
-- Safe to run twice. Section 3 only ever blanks a `summary` that is exactly a
-- coach-only note, and only trims an `ai_review` that ends with one.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══ 1a. A sign-up with no player attached stays that way ═════════════════════
-- lumio_link_player (migration 193) fills in player_id from the name whenever a
-- row has a name and no player and exactly one player has that name. That is
-- right for rows a coach types. It is wrong for a place made by the public
-- sign-up page: the one player of that name is somebody else's child unless the
-- email matched too, and that check has already been made (below) and failed.
-- So a public sign-up left without a player is never linked by name — on insert
-- or on any later edit of the row. Linking it is the coach's decision; setting
-- player_id by hand works exactly as before.
--
-- The body is migration 193's, unchanged, with that one exception added.
create or replace function lumio_link_player()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  if new.player_id is not null then
    select p.name into v_name
    from coach_players p
    where p.id = new.player_id and p.coach_id = new.coach_id;

    if not found then
      -- Only reachable for an old row whose player has since been deleted
      -- (bookings, lessons and recordings have no foreign key). A new or changed
      -- link to a missing player was already refused by section 4.
      return new;
    end if;

    if lower(btrim(coalesce(new.player_name, ''))) = lower(btrim(coalesce(v_name, ''))) then
      return new;                                   -- they agree
    end if;

    if tg_op = 'UPDATE'
       and new.player_id   is not distinct from old.player_id
       and new.player_name is distinct from old.player_name then
      new.player_id := null;                        -- the name was edited: follow it (below)
    else
      new.player_name := v_name;                    -- the id is the truth
      return new;
    end if;
  end if;

  -- A public camp sign-up with no player: never matched on the name alone.
  if tg_table_name = 'coach_camp_attendees'
     and new.player_id is null
     and to_jsonb(new)->>'source' = 'signup' then
    return new;
  end if;

  if new.player_id is null and coalesce(btrim(new.player_name), '') <> '' then
    new.player_id := lumio_player_by_name(new.coach_id, new.player_name);
  end if;
  return new;
end $$;
revoke all on function lumio_link_player() from public, anon, authenticated;


-- ══ 1b + 2. The public camp sign-up ══════════════════════════════════════════
-- Migration 197's function with two changes, both marked below.
create or replace function lumio_camp_signup(p_camp_id uuid, p jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  c        coach_camps%rowtype;
  v_name   text := regexp_replace(btrim(coalesce(p->>'player_name', '')), '\s+', ' ', 'g');
  v_email  text := lower(btrim(coalesce(p->>'email', '')));
  v_parent text := nullif(btrim(coalesce(p->>'parent_name', '')), '');
  v_adult  boolean := coalesce((p->>'adult')::boolean, false);
  v_age    integer := nullif(p->>'player_age', '')::integer;
  v_taken  integer;
  v_n      integer;
  v_player uuid;
  v_id     uuid;
  v_dup    boolean := false;
  d        record;
begin
  if v_name = '' or v_email = '' then
    return jsonb_build_object('result', 'invalid');
  end if;

  select * into c from coach_camps where id = p_camp_id for update;
  if not found or not coalesce(c.signup_open, false) then
    return jsonb_build_object('result', 'closed');
  end if;
  if coalesce(c.end_date, c.start_date) < (now() at time zone 'Europe/London')::date then
    return jsonb_build_object('result', 'finished');
  end if;

  -- Already on this camp under the same name and email?
  select a.id, a.status, a.amount_pennies, a.paid into d
    from coach_camp_attendees a
   where a.camp_id = c.id
     and lower(regexp_replace(btrim(a.player_name), '\s+', ' ', 'g')) = lower(v_name)
     and lower(btrim(coalesce(a.parent_email, ''))) = v_email
     and coalesce(a.status, 'confirmed') <> 'cancelled'
   order by a.created_at
   limit 1;
  v_dup := found;

  -- CHANGED (2): the camp being full is decided BEFORE the duplicate is
  -- reported, so a full camp gives everybody the same answer. The place already
  -- held is passed back only so the server can re-send that family their
  -- confirmation — to the address already on the place, never shown on screen.
  select count(*) into v_taken
    from coach_camp_attendees a
   where a.camp_id = c.id and coalesce(a.status, 'confirmed') <> 'cancelled';
  if coalesce(c.capacity, 0) > 0 and v_taken >= c.capacity then
    return jsonb_build_object('result', 'full') ||
           case when v_dup then jsonb_build_object('attendee_id', d.id) else '{}'::jsonb end;
  end if;

  if v_dup then
    return jsonb_build_object('result', 'duplicate', 'attendee_id', d.id, 'status', coalesce(d.status, 'confirmed'),
                              'amount_pennies', coalesce(d.amount_pennies, 0), 'paid', coalesce(d.paid, false));
  end if;

  -- The roster record. Tied to an existing player only when the name AND the
  -- email typed are both already on that player's record.
  select count(*), (array_agg(pl.id))[1] into v_n, v_player
    from coach_players pl
   where pl.coach_id = c.coach_id
     and lower(regexp_replace(btrim(pl.name), '\s+', ' ', 'g')) = lower(v_name)
     and v_email in (lower(btrim(coalesce(pl.parent_email, ''))),
                     lower(btrim(coalesce(pl.email, ''))),
                     lower(btrim(coalesce(pl.contact_email, ''))));
  if v_n <> 1 then
    v_player := null;
    -- CHANGED (1): somebody of this name is already on the roster and the email
    -- does not single one of them out. No second player of that name is made;
    -- the place is saved with no player attached and the coach matches it.
    if not exists (select 1 from coach_players pl
                    where pl.coach_id = c.coach_id
                      and lower(regexp_replace(btrim(pl.name), '\s+', ' ', 'g')) = lower(v_name)) then
      -- A new name: a new roster record, as before. An adult is stored as an
      -- adult — their own address is theirs, not a "parent email".
      insert into coach_players (coach_id, name, age, email, parent_name, parent_email, phone, category,
                                 medical_notes, consent_photo, consent_medical, consent_by, consent_date)
      values (
        c.coach_id, v_name, v_age,
        case when v_adult then v_email end,
        case when v_adult then null else v_parent end,
        case when v_adult then null else v_email end,
        nullif(p->>'phone', ''),
        case when v_adult then 'Adult' end,
        nullif(p->>'medical_notes', ''),
        coalesce((p->>'consent_photo')::boolean, false),
        coalesce((p->>'consent_medical')::boolean, false),
        case when v_adult then v_name else v_parent end,
        (now() at time zone 'Europe/London')::date
      ) returning id into v_player;
    end if;
  end if;

  insert into coach_camp_attendees (coach_id, camp_id, player_id, player_name, parent_name, parent_email, parent_phone,
                                    player_age, medical_notes, emergency_contact, consent_photo, consent_medical,
                                    status, amount_pennies, paid, source, signed_up_at)
  values (
    c.coach_id, c.id, v_player, v_name, v_parent, v_email, nullif(p->>'phone', ''),
    v_age, nullif(p->>'medical_notes', ''), nullif(p->>'emergency_contact', ''),
    coalesce((p->>'consent_photo')::boolean, false), coalesce((p->>'consent_medical')::boolean, false),
    case when p->>'status' = 'pending' then 'pending' else 'confirmed' end,
    greatest(0, coalesce((p->>'amount_pennies')::integer, 0)),
    false, 'signup', now()
  ) returning id into v_id;

  return jsonb_build_object('result', 'ok', 'attendee_id', v_id, 'player_id', v_player);
end $$;
revoke all on function lumio_camp_signup(uuid, jsonb) from public, anon, authenticated;
grant execute on function lumio_camp_signup(uuid, jsonb) to service_role;


-- ══ 3. Coach-only notes out of the columns a family reads ════════════════════
-- (a) "Finish session" saved the plan's own note — what the coach asked Lumio
--     Coach for when building the plan — as the lesson's shared summary whenever
--     "How did it go?" was left empty. Where a lesson's summary is exactly its
--     plan's note, it is cleared. The note is still on the plan.
update coach_sessions s
   set summary = ''
  from coach_session_plans pl
 where s.plan_id = pl.id
   and s.coach_id = pl.coach_id
   and btrim(coalesce(pl.notes, '')) <> ''
   and lower(regexp_replace(btrim(coalesce(s.summary, '')), '\s+', ' ', 'g'))
     = lower(regexp_replace(btrim(pl.notes), '\s+', ' ', 'g'));

-- (b) The lesson form used to copy the private coach note into `summary`.
--     Where the summary is exactly that note, it is cleared. The note is still
--     in review_json.coachNote, where only the coach sees it.
update coach_sessions s
   set summary = ''
 where btrim(coalesce(s.review_json->>'coachNote', '')) not in ('', '—')
   and lower(regexp_replace(btrim(coalesce(s.summary, '')), '\s+', ' ', 'g'))
     = lower(regexp_replace(btrim(s.review_json->>'coachNote'), '\s+', ' ', 'g'));

-- (c) …and appended it to the end of `ai_review`, the text that is shared and
--     copied to parents. Where the text ends with the note ON ITS OWN LINE
--     (which is how the form wrote it), the note is cut off. A review that
--     merely happens to end with the same words mid-line is left alone.
update coach_sessions s
   set ai_review = rtrim(left(s.ai_review, length(s.ai_review) - length(btrim(s.review_json->>'coachNote'))), E' \n\r\t')
 where btrim(coalesce(s.review_json->>'coachNote', '')) not in ('', '—')
   and length(s.ai_review) >= length(btrim(s.review_json->>'coachNote'))
   and right(s.ai_review, length(btrim(s.review_json->>'coachNote'))) = btrim(s.review_json->>'coachNote')
   and (length(s.ai_review) = length(btrim(s.review_json->>'coachNote'))
        or substr(s.ai_review, length(s.ai_review) - length(btrim(s.review_json->>'coachNote')), 1) = E'\n');
