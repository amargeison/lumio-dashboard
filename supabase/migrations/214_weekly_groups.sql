-- 214 — Weekly groups: ask who is coming, and take their money when they say yes.
--
--   coach_groups           a weekly group: its day, time, venue, places and price
--                          per person, and how many days before to ask
--   coach_group_members    who is in it (the people who get asked)
--   coach_group_sessions   one week of it: the date, and the booking in the diary
--   coach_group_replies    one person asked about one week: their private link,
--                          and whether they are coming
--   coach_charges          gains reply_id: which answer a group payment was for
--
-- Groups and their members are the coach's own work (lumio_can_see, migration
-- 166). Weeks and answers are written only by the server — the timer that asks,
-- and the client's link — and read by the coach.
--
-- A place is given by lumio_group_say_yes, one at a time per week, so two
-- people answering at the same moment can never take more places than there are.
-- Safe to run twice.

create table if not exists coach_groups (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references auth.users(id) on delete cascade,
  staff_id        uuid references coach_staff(id) on delete set null,
  name            text not null,
  weekday         smallint not null,             -- 0 Monday … 6 Sunday
  start_time      text not null,                 -- 'HH:MM', UK time
  duration_min    integer not null default 60,
  venue_id        uuid references coach_venues(id) on delete set null,
  court           text,
  assigned_coach  text,
  capacity        integer not null default 8,
  price_pennies   integer not null default 1500, -- per person
  ask_days        integer not null default 6,
  active          boolean not null default true,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_groups_ok') then
    alter table coach_groups add constraint coach_groups_ok check (
      char_length(btrim(name)) between 1 and 80
      and weekday between 0 and 6
      and start_time ~ '^[0-2][0-9]:[0-5][0-9]$'
      and duration_min between 15 and 600
      and capacity between 1 and 50
      and price_pennies between 0 and 20000
      and ask_days between 1 and 14
    );
  end if;
end $$;
create index if not exists idx_coach_groups_coach on coach_groups (coach_id, active);

create table if not exists coach_group_members (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  staff_id    uuid references coach_staff(id) on delete set null,
  group_id    uuid not null references coach_groups(id) on delete cascade,
  player_id   uuid not null references coach_players(id) on delete cascade,
  created_at  timestamptz not null default now()
);
-- No unique (group, player): merging two player records moves every player_id
-- across, and a unique key would make that merge fail. Lumio skips repeats.
create index if not exists idx_coach_group_members_group on coach_group_members (group_id);

do $$
declare t text;
begin
  foreach t in array array['coach_groups', 'coach_group_members'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists lumio_coach_own on public.%I', t);
    execute format($f$
      create policy lumio_coach_own on public.%I for all to authenticated
        using (lumio_can_see(coach_id, staff_id))
        with check (lumio_can_see(coach_id, staff_id))
    $f$, t);
  end loop;
end $$;

create table if not exists coach_group_sessions (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references auth.users(id) on delete cascade,
  staff_id      uuid references coach_staff(id) on delete set null,
  group_id      uuid not null references coach_groups(id) on delete cascade,
  session_date  date not null,
  booking_id    uuid references coach_bookings(id) on delete set null,
  status        text not null default 'open',    -- open | cancelled
  asked_at      timestamptz,
  created_at    timestamptz not null default now(),
  unique (group_id, session_date)
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_group_sessions_status_ok') then
    alter table coach_group_sessions add constraint coach_group_sessions_status_ok check (status in ('open', 'cancelled'));
  end if;
end $$;
create index if not exists idx_coach_group_sessions_coach on coach_group_sessions (coach_id, session_date desc);

create table if not exists coach_group_replies (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references auth.users(id) on delete cascade,
  staff_id     uuid references coach_staff(id) on delete set null,
  session_id   uuid not null references coach_group_sessions(id) on delete cascade,
  group_id     uuid not null references coach_groups(id) on delete cascade,
  player_id    uuid not null references coach_players(id) on delete cascade,
  token        text not null unique,
  sent_to      text,
  sent_at      timestamptz,
  opened_at    timestamptz,
  answer       text,                              -- null (not yet) | yes | no
  answered_at  timestamptz,
  answered_by  text,                              -- client | coach
  late         boolean not null default false,    -- said no after the free window closed
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_group_replies_answer_ok') then
    alter table coach_group_replies add constraint coach_group_replies_answer_ok check (answer is null or answer in ('yes', 'no'));
  end if;
end $$;
create index if not exists idx_coach_group_replies_session on coach_group_replies (session_id);

-- Written only by the server; the coach (and an invited coach, for their own
-- groups) may read them.
do $$
declare t text;
begin
  foreach t in array array['coach_group_sessions', 'coach_group_replies'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from public, anon, authenticated', t);
    execute format('drop policy if exists lumio_coach_reads on public.%I', t);
    execute format($f$
      create policy lumio_coach_reads on public.%I for select to authenticated
        using (lumio_can_see(coach_id, staff_id))
    $f$, t);
  end loop;
end $$;

-- ── Group payments ───────────────────────────────────────────────────────────
-- A group week is one booking with many people paying for it, so "one charge
-- per lesson and reason" (migration 210) does not fit: each ANSWER is paid once.
alter table coach_charges add column if not exists reply_id uuid references coach_group_replies(id) on delete set null;

drop index if exists uniq_coach_charges_booking_kind;
create unique index uniq_coach_charges_booking_kind
  on coach_charges (booking_id, kind)
  where booking_id is not null and kind is distinct from 'group' and status in ('charging', 'processing', 'paid');

create unique index if not exists uniq_coach_charges_reply
  on coach_charges (reply_id)
  where reply_id is not null and status in ('charging', 'processing', 'paid');

-- ── Saying yes ───────────────────────────────────────────────────────────────
-- Gives the place if there is one. The week's row is locked while places are
-- counted, so answers are taken one at a time. Returns 'yes', 'full', 'closed'
-- or 'missing'. The booking's headcount (and its price) follows the answers.
create or replace function lumio_group_say_yes(p_reply uuid, p_by text default 'client') returns text
language plpgsql security definer set search_path = public as $$
declare
  r coach_group_replies%rowtype;
  s coach_group_sessions%rowtype;
  g coach_groups%rowtype;
  n integer;
begin
  select * into r from coach_group_replies where id = p_reply;
  if not found then return 'missing'; end if;
  select * into s from coach_group_sessions where id = r.session_id for update;
  if not found then return 'missing'; end if;
  if s.status <> 'open' then return 'closed'; end if;
  if r.answer = 'yes' then return 'yes'; end if;
  select * into g from coach_groups where id = s.group_id;
  select count(*) into n from coach_group_replies where session_id = s.id and answer = 'yes';
  if n >= g.capacity then return 'full'; end if;
  update coach_group_replies
     set answer = 'yes', answered_at = now(), answered_by = coalesce(p_by, 'client'), late = false, updated_at = now()
   where id = p_reply;
  if s.booking_id is not null then
    update coach_bookings set headcount = n + 1, price_pennies = (n + 1) * g.price_pennies where id = s.booking_id;
  end if;
  return 'yes';
end $$;
revoke all on function lumio_group_say_yes(uuid, text) from public, anon, authenticated;
grant execute on function lumio_group_say_yes(uuid, text) to service_role;

notify pgrst, 'reload schema';
