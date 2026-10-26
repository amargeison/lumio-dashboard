-- 220 — The player app can act, not just show.
--
--   coach_bookings         client_confirmed_at / client_confirmed_by: the client
--                          (or their parent) pressed "I'll be there". Cleared
--                          when the lesson moves, so an old yes never stands for
--                          a new time.
--                          client_token: the link in the day-before reminder
--                          that confirms or cancels without signing in.
--   lumio_portal_book()    a client booking a free slot from their own page:
--                          the same overlap rule and lock as a booking link, for
--                          a player who is already on the academy's roster.
--
-- Safe to run twice.

alter table coach_bookings add column if not exists client_confirmed_at timestamptz;
alter table coach_bookings add column if not exists client_confirmed_by text;
alter table coach_bookings add column if not exists client_token        text;
create unique index if not exists uniq_coach_bookings_client_token on coach_bookings (client_token) where client_token is not null;

-- A confirmation is for a time and a day. Moving the lesson, or cancelling it,
-- clears it.
create or replace function lumio_booking_confirm_reset()
returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (
       new.booking_date is distinct from old.booking_date
    or new.start_time   is distinct from old.start_time
    or lower(coalesce(new.status, '')) = 'cancelled'
  ) then
    new.client_confirmed_at := null;
    new.client_confirmed_by := null;
  end if;
  return new;
end $$;
drop trigger if exists trg_booking_confirm_reset on coach_bookings;
create trigger trg_booking_confirm_reset before update on coach_bookings
  for each row execute function lumio_booking_confirm_reset();

create or replace function lumio_portal_book(
  p_coach    uuid,
  p_player   uuid,
  p_date     date,
  p_time     text,
  p_mins     integer,
  p_buffer   integer,
  p_type     text,
  p_notes    text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  pl       coach_players%rowtype;
  v_start  integer;
  v_mins   integer := greatest(15, least(240, coalesce(p_mins, 60)));
  v_end    integer;
  v_buf    integer := greatest(0, least(60, coalesce(p_buffer, 0)));
  v_type   text := coalesce(nullif(btrim(coalesce(p_type, '')), ''), 'Private');
  v_id     uuid;
begin
  if p_date is null or p_time is null or p_time !~ '^[0-2][0-9]:[0-5][0-9]$' or p_date < current_date then
    return jsonb_build_object('result', 'invalid');
  end if;
  select * into pl from coach_players where id = p_player and coach_id = p_coach;
  if not found then return jsonb_build_object('result', 'player'); end if;

  perform pg_advisory_xact_lock(hashtextextended('lumio_book:' || p_coach::text, 0));

  v_start := split_part(p_time, ':', 1)::integer * 60 + split_part(p_time, ':', 2)::integer;
  v_end   := v_start + v_mins;

  -- The same overlap rule as lumio_book_link_slot and lib/coach/booking-slots.ts.
  if exists (
    select 1
      from coach_bookings b,
           lateral (select (regexp_match(coalesce(b.start_time, ''), '(\d{1,2}):(\d{2})')) as m) t
     where b.coach_id = p_coach
       and b.booking_date = p_date
       and lower(coalesce(b.status, '')) <> 'cancelled'
       and t.m is not null
       and v_start < least(23, t.m[1]::integer) * 60 + least(59, t.m[2]::integer)
                     + coalesce(nullif(b.duration_min, 0), 60) + v_buf
       and least(23, t.m[1]::integer) * 60 + least(59, t.m[2]::integer) - v_buf < v_end
  ) then
    return jsonb_build_object('result', 'taken');
  end if;

  insert into coach_bookings (coach_id, staff_id, player_id, player_name, title, type,
                              booking_date, start_time, duration_min, status, notes)
  values (p_coach, pl.staff_id, pl.id, pl.name, v_type || ' — ' || pl.name, v_type,
          p_date, p_time, v_mins, 'confirmed', nullif(p_notes, ''))
  returning id into v_id;

  return jsonb_build_object('result', 'ok', 'booking_id', v_id);
end $$;
revoke all on function lumio_portal_book(uuid, uuid, date, text, integer, integer, text, text) from public, anon, authenticated;
grant execute on function lumio_portal_book(uuid, uuid, date, text, integer, integer, text, text) to service_role;

notify pgrst, 'reload schema';
