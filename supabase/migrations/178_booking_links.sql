-- ─────────────────────────────────────────────────────────────────────────────
-- "Book me in" — a link, instead of an email thread.
--
-- Today a player without the app emails the coach asking for a lesson. The coach
-- reads the email, opens the calendar, works out what is free, types the booking
-- in, then replies to say when it is. Four screens and a day's delay for one
-- hour of tennis, and the coach is the bottleneck in every one of those steps.
--
-- A booking link moves the work to the person who actually knows when they are
-- free. The coach sends a link; the player sees the coach's real availability —
-- their Lumio diary, their connected calendar and their camps, all of it — picks
-- a slot, and it is booked. The confirmation emails and the in-app message are
-- exactly the ones a coach-made booking sends, because it IS a coach booking:
-- the row lands in coach_bookings like any other.
--
-- WHY A TABLE AND NOT A SIGNED URL. A link has to be revocable, has to know who
-- it was sent to (so the booking attaches to the right player rather than a
-- typed name), and has to be able to expire or be used once. None of that can
-- live in the URL itself. It also gives the coach a list of what they have sent,
-- which is the difference between a feature and a thing you forget you did.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists coach_booking_links (
  id            uuid default gen_random_uuid() primary key,
  coach_id      uuid not null references auth.users(id) on delete cascade,
  -- Which coach the session is with. Null = the academy's / the head's.
  staff_id      uuid references coach_staff(id) on delete set null,
  -- Who it was sent to, when we know them. This is what makes the booking
  -- attach to a real player instead of matching on a typed-in name — the same
  -- id-not-name discipline as migrations 146 and 165.
  player_id     uuid references coach_players(id) on delete set null,

  -- The public half of the URL: /book/<token>. Random, not guessable, and the
  -- only thing the recipient ever sees of this row.
  token         text not null unique,

  -- Who the coach addressed it to, for their own list and to prefill the form.
  name          text,
  email         text,

  -- What is being booked. Read server-side when the booking is made; nothing
  -- about duration or type is ever taken from the browser.
  duration_min  integer not null default 60,
  session_type  text default 'Private',
  venue_id      uuid references coach_venues(id) on delete set null,
  court         text,
  note          text,

  -- A personal invite is used once. A general link the coach puts in a signature
  -- or on a club noticeboard is reusable and just keeps counting.
  reusable      boolean not null default false,
  uses          integer not null default 0,
  booking_id    uuid references coach_bookings(id) on delete set null,
  used_at       timestamptz,

  revoked_at    timestamptz,
  expires_at    timestamptz not null default (now() + interval '60 days'),
  created_at    timestamptz default now()
);

create index if not exists idx_booking_links_coach on coach_booking_links (coach_id, created_at desc);
create index if not exists idx_booking_links_token on coach_booking_links (token);

-- ── Access ──────────────────────────────────────────────────────────────────
-- The head coach owns every link in the academy. An assistant can see and send
-- their own — a link is how they fill their own diary — but only their own,
-- because a link carries a family's email address.
alter table coach_booking_links enable row level security;

drop policy if exists lumio_booking_links_head on coach_booking_links;
create policy lumio_booking_links_head on coach_booking_links for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

drop policy if exists lumio_booking_links_own on coach_booking_links;
create policy lumio_booking_links_own on coach_booking_links for all to authenticated
  using (lumio_can_see(coach_id, staff_id)) with check (lumio_can_see(coach_id, staff_id));

-- The public /book/<token> page reads and writes with the service role, never
-- as a signed-in user: the person following the link has no account, and the
-- route hands back only the coach's free times — never another booking, never
-- another family, never a contact detail.
