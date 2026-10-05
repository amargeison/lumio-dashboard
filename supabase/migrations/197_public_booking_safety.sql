-- ─────────────────────────────────────────────────────────────────────────────
-- Public booking links and public camp sign-ups, made safe when two people
-- press the button at the same moment.
--
-- Both public routes used to READ ("is this slot free?", "is there a place
-- left?") and then WRITE in a separate step. Two phones pressing Book together
-- both read "free" and both wrote: a slot was double booked, a 1-place camp took
-- six children, a single-use link was used twice. A check and a write that are
-- not one step cannot be made safe in the route, so the check-and-insert now
-- lives here, behind a lock.
--
-- Also in this file, for the same two routes:
--   • coach_bookings.venue_id — a booking finally records WHERE it is, so the
--     confirmation no longer has to guess the venue from the court's name.
--   • coach_bookings.told_state / told_to — what the family was last told about
--     a booking (date, time, status) and at which address, so the server can
--     tell "moved" and "cancelled" from "nothing changed" and write to them once.
--   • Shareable booking links are wiped of the visitor details that used to be
--     stamped on them by whoever booked first.
--
-- Safe to run twice, and safe on a database that already holds real bookings.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Where a booking is ──────────────────────────────────────────────────────
alter table coach_bookings add column if not exists venue_id uuid references coach_venues(id) on delete set null;

-- ── What the family was last told ───────────────────────────────────────────
-- 'YYYY-MM-DD|HH:MM|minutes|booked' (or pending / cancelled). Null = never told.
-- Bookings that already exist are assumed to have been told what they currently
-- say — otherwise the first small edit to an old booking would email the family
-- a "Booking confirmed" for a lesson they have known about for weeks. The
-- backfill runs only at the moment the column is created, never on a re-run.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'coach_bookings' and column_name = 'told_state'
  ) then
    alter table coach_bookings add column told_state text;
    update coach_bookings
       set told_state = booking_date::text || '|' || left(coalesce(start_time, ''), 5) || '|' || coalesce(duration_min, 60)::text || '|booked'
     where booking_date is not null
       and lower(coalesce(status, 'confirmed')) not in ('pending', 'cancelled');
  end if;
end $$;

-- Which address that was sent to, so a later "moved" or "cancelled" note goes to
-- the same person the confirmation did.
alter table coach_bookings add column if not exists told_to text;

-- ── Shareable links stay anonymous ──────────────────────────────────────────
-- A reusable link used to be stamped with the name, email and child of the first
-- person to book through it, and showed them to everybody who opened it after.
-- The route no longer does that; this clears the ones already stamped.
update coach_booking_links
   set name = null, email = null, player_id = null
 where reusable
   and (name is not null or email is not null or player_id is not null);

-- ── Take a slot through a booking link ──────────────────────────────────────
-- One step, behind two locks: the link row (so a single-use link is used once)
-- and a per-academy lock (so two bookings for the same coach are checked one
-- after the other, never side by side). The route still checks the coach's
-- hours, camps and connected calendar first; this is the last word on whether
-- the Lumio diary itself is still free.
--
-- Everything about the session — length, type, court, venue, which coach —
-- comes from the link row. The caller supplies only the day, the time and who.
create or replace function lumio_book_link_slot(
  p_token       text,
  p_date        date,
  p_time        text,
  p_buffer      integer,
  p_player_id   uuid,
  p_new_player  jsonb,
  p_player_name text,
  p_notes       text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  l        coach_booking_links%rowtype;
  v_start  integer;
  v_end    integer;
  v_buf    integer := greatest(0, least(60, coalesce(p_buffer, 0)));
  v_player uuid;
  v_name   text := nullif(btrim(coalesce(p_player_name, '')), '');
  v_type   text;
  v_id     uuid;
begin
  if p_date is null or p_time is null or p_time !~ '^[0-2][0-9]:[0-5][0-9]$' then
    return jsonb_build_object('result', 'invalid');
  end if;

  select * into l from coach_booking_links where token = p_token for update;
  if not found
     or l.revoked_at is not null
     or l.expires_at < now()
     or (not l.reusable and (l.uses > 0 or l.booking_id is not null)) then
    return jsonb_build_object('result', 'link');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('lumio_book:' || l.coach_id::text, 0));

  v_start := split_part(p_time, ':', 1)::integer * 60 + split_part(p_time, ':', 2)::integer;
  v_end   := v_start + l.duration_min;

  -- The same overlap rule as lib/coach/booking-slots.ts: a booking is busy from
  -- its start to its end, plus the coach's gap either side; cancelled ones are
  -- not busy at all.
  if exists (
    select 1
      from coach_bookings b,
           lateral (select (regexp_match(coalesce(b.start_time, ''), '(\d{1,2}):(\d{2})')) as m) t
     where b.coach_id = l.coach_id
       and b.booking_date = p_date
       and lower(coalesce(b.status, '')) <> 'cancelled'
       and t.m is not null
       and v_start < least(23, t.m[1]::integer) * 60 + least(59, t.m[2]::integer)
                     + coalesce(nullif(b.duration_min, 0), 60) + v_buf
       and least(23, t.m[1]::integer) * 60 + least(59, t.m[2]::integer) - v_buf < v_end
  ) then
    return jsonb_build_object('result', 'taken');
  end if;

  -- Who it is for. An id is only honoured when it belongs to this academy.
  if p_player_id is not null then
    select id into v_player from coach_players where id = p_player_id and coach_id = l.coach_id;
  end if;
  if v_player is null and p_new_player is not null and nullif(btrim(coalesce(p_new_player->>'name', '')), '') is not null then
    insert into coach_players (coach_id, staff_id, name, email, parent_name, parent_email, phone, category, notes)
    values (
      l.coach_id, l.staff_id,
      btrim(p_new_player->>'name'),
      nullif(p_new_player->>'email', ''),
      nullif(p_new_player->>'parent_name', ''),
      nullif(p_new_player->>'parent_email', ''),
      nullif(p_new_player->>'phone', ''),
      nullif(p_new_player->>'category', ''),
      'Added from a booking link.'
    ) returning id into v_player;
    v_name := coalesce(v_name, btrim(p_new_player->>'name'));
  end if;

  v_type := coalesce(nullif(l.session_type, ''), 'Private');
  insert into coach_bookings (coach_id, staff_id, player_id, player_name, title, type, court, venue_id,
                              booking_date, start_time, duration_min, status, notes)
  values (l.coach_id, l.staff_id, v_player, v_name, v_type || ' — ' || coalesce(v_name, 'Booking'), v_type,
          l.court, l.venue_id, p_date, p_time, l.duration_min, 'confirmed', nullif(p_notes, ''))
  returning id into v_id;

  -- The link is used. Nothing about the visitor is written on it: a shareable
  -- link is opened by many people, and the booking itself records who booked.
  update coach_booking_links
     set uses = uses + 1,
         used_at = now(),
         booking_id = coalesce(booking_id, v_id)
   where id = l.id;

  return jsonb_build_object('result', 'ok', 'booking_id', v_id, 'player_id', v_player);
end $$;

-- ── Take a place on a camp ──────────────────────────────────────────────────
-- The camp row is locked for the length of the sign-up, so the count of places
-- taken and the new attendee are one step: the tenth family and the eleventh
-- cannot both be told there is one place left.
--
-- p carries what the parent typed, already validated by the route:
--   player_name, email, parent_name, phone, player_age, medical_notes,
--   emergency_contact, consent_photo, consent_medical, adult,
--   status ('confirmed' | 'pending'), amount_pennies
--
-- Matching to the roster is deliberately strict. A public form is filled in by
-- anybody, so a sign-up is tied to an existing player ONLY when the name is the
-- same AND the email typed is already on that player's record. Anybody else —
-- including somebody who types the name of a child already on the roster — gets
-- a roster record of their own, flagged for the coach to check and merge by
-- hand if it really is the same child. A stranger is never attached to an
-- existing child's file.
--
-- (It has to be a record of their own rather than a place with no player:
-- migration 193 links any row that has a name and no player to the one player
-- of that name, which is exactly the link this must not make.)
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

  -- Already on this camp under the same name and email: nothing new is written.
  select a.id, a.status, a.amount_pennies, a.paid into d
    from coach_camp_attendees a
   where a.camp_id = c.id
     and lower(regexp_replace(btrim(a.player_name), '\s+', ' ', 'g')) = lower(v_name)
     and lower(btrim(coalesce(a.parent_email, ''))) = v_email
     and coalesce(a.status, 'confirmed') <> 'cancelled'
   order by a.created_at
   limit 1;
  if found then
    return jsonb_build_object('result', 'duplicate', 'attendee_id', d.id, 'status', coalesce(d.status, 'confirmed'),
                              'amount_pennies', coalesce(d.amount_pennies, 0), 'paid', coalesce(d.paid, false));
  end if;

  select count(*) into v_taken
    from coach_camp_attendees a
   where a.camp_id = c.id and coalesce(a.status, 'confirmed') <> 'cancelled';
  if coalesce(c.capacity, 0) > 0 and v_taken >= c.capacity then
    return jsonb_build_object('result', 'full');
  end if;

  -- The roster record.
  select count(*), (array_agg(pl.id))[1] into v_n, v_player
    from coach_players pl
   where pl.coach_id = c.coach_id
     and lower(regexp_replace(btrim(pl.name), '\s+', ' ', 'g')) = lower(v_name)
     and v_email in (lower(btrim(coalesce(pl.parent_email, ''))),
                     lower(btrim(coalesce(pl.email, ''))),
                     lower(btrim(coalesce(pl.contact_email, ''))));
  if v_n <> 1 then
    -- An adult is stored as an adult — their own address is theirs, not a
    -- "parent email".
    insert into coach_players (coach_id, name, age, email, parent_name, parent_email, phone, category,
                               medical_notes, consent_photo, consent_medical, consent_by, consent_date, notes)
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
      (now() at time zone 'Europe/London')::date,
      case when exists (select 1 from coach_players pl
                         where pl.coach_id = c.coach_id
                           and lower(regexp_replace(btrim(pl.name), '\s+', ' ', 'g')) = lower(v_name))
           then 'Added from a camp sign-up. Another player on your roster has the same name but a different email — check whether this is the same person before merging.'
      end
    ) returning id into v_player;
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

-- Only the server (service role) calls these. They run with the caller's own
-- rights, so even if somebody else could call one, row level security would
-- still apply to them.
revoke all on function lumio_book_link_slot(text, date, text, integer, uuid, jsonb, text, text) from public, anon, authenticated;
revoke all on function lumio_camp_signup(uuid, jsonb) from public, anon, authenticated;
grant execute on function lumio_book_link_slot(text, date, text, integer, uuid, jsonb, text, text) to service_role;
grant execute on function lumio_camp_signup(uuid, jsonb) to service_role;
