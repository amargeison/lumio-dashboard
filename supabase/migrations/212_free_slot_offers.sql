-- 212 — free-slot pings.
--
-- "I have a free slot on Thursday at 2pm. Would you like it?" The coach offers
-- one slot to the clients who have said they would like to hear about them;
-- each gets their own link; the first to say yes gets the lesson, and everyone
-- else who opens their link afterwards is told it has gone.
--
--   coach_players.free_slot_pings   the client is happy to hear about free slots
--   coach_slot_offers               one row per slot offered
--   coach_slot_offer_recipients     one row per person it was sent to, with
--                                   their own link and what they said
--
-- "First to say yes" is decided by the database: the claim only succeeds while
-- the offer is still open (see the claim route). Safe to run twice.

alter table coach_players add column if not exists free_slot_pings boolean not null default false;

create table if not exists coach_slot_offers (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references auth.users(id) on delete cascade,
  staff_id      uuid references coach_staff(id) on delete set null,
  assigned_coach text,
  booking_date  date not null,
  start_time    text not null,
  duration_min  integer not null check (duration_min between 5 and 600),
  type          text not null default 'Private',
  venue_id      uuid references coach_venues(id) on delete set null,
  court_id      uuid references coach_courts(id) on delete set null,
  court         text,
  note          text,
  status        text not null default 'open',      -- open | taken | withdrawn
  taken_by      uuid references coach_players(id) on delete set null,
  booking_id    uuid references coach_bookings(id) on delete set null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_slot_offers_status_ok') then
    alter table coach_slot_offers add constraint coach_slot_offers_status_ok check (status in ('open', 'taken', 'withdrawn'));
  end if;
end $$;
create index if not exists idx_coach_slot_offers_coach on coach_slot_offers (coach_id, created_at desc);

create table if not exists coach_slot_offer_recipients (
  id            uuid primary key default gen_random_uuid(),
  offer_id      uuid not null references coach_slot_offers(id) on delete cascade,
  coach_id      uuid not null references auth.users(id) on delete cascade,
  player_id     uuid not null references coach_players(id) on delete cascade,
  token         text not null unique,
  sent_to       text,
  sent_at       timestamptz,
  opened_at     timestamptz,
  response      text,                                -- accepted | declined | too_late
  responded_at  timestamptz,
  -- No unique (offer, player): merging two profiles of one player moves both
  -- rows onto the kept profile, and must not fail on it. The app sends each
  -- player one link per offer.
  created_at    timestamptz not null default now()
);
create index if not exists idx_coach_slot_recipients_offer on coach_slot_offer_recipients (offer_id);

-- Written only by the server; the academy's owner may read their own.
do $$
declare t text;
begin
  foreach t in array array['coach_slot_offers', 'coach_slot_offer_recipients'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from public, anon, authenticated', t);
    execute format('drop policy if exists lumio_owner_reads on public.%I', t);
    execute format('create policy lumio_owner_reads on public.%I for select to authenticated using (coach_id = auth.uid())', t);
  end loop;
end $$;

notify pgrst, 'reload schema';
