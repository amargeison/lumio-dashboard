-- 210 — a card (or Direct Debit) on file, and the 24-hour policy behind it.
--
-- A client saves their card once, through a link the coach sends, and agrees
-- to the coach's cancellation policy at the same moment. Lumio can then take
-- a lesson's money from that card without asking them again: when the coach
-- presses Charge, or (if the coach has switched it on) when the cancellation
-- window closes before the lesson.
--
-- The card itself is held by Stripe, on the COACH's own Stripe account. Lumio
-- keeps only Stripe's reference to it, the brand and last four digits to show
-- the coach, and a record of what the client agreed to and when.
--
--   coach_pay_methods   one row per link sent / card saved, for a player
--   coach_charges       gains which lesson a charge was for, and why
--   coach_bookings      gains cancelled_at, set by the database itself, so a
--                       late cancellation can be told from an early one
--
-- Safe to run twice.

create table if not exists coach_pay_methods (
  id                        uuid primary key default gen_random_uuid(),
  coach_id                  uuid not null references auth.users(id) on delete cascade,
  player_id                 uuid not null references coach_players(id) on delete cascade,
  -- The client's link: /card/<token>. Unguessable; one per invitation.
  link_token                text not null unique,
  link_sent_to              text,
  link_sent_at              timestamptz,
  -- invited → active (saved) → removed. A newer active row replaces an older one.
  status                    text not null default 'invited',
  kind                      text,             -- 'card' | 'bacs_debit'
  stripe_customer_id        text,
  stripe_payment_method_id  text,
  stripe_setup_session_id   text,
  brand                     text,             -- visa, mastercard… or the bank, for Direct Debit
  last4                     text,
  exp_month                 integer,
  exp_year                  integer,
  -- What they agreed to, word for word, and who said yes.
  policy_text               text,
  policy_agreed_at          timestamptz,
  agreed_by                 text,
  saved_at                  timestamptz,
  removed_at                timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_pay_methods_status_ok') then
    alter table coach_pay_methods add constraint coach_pay_methods_status_ok
      check (status in ('invited', 'active', 'removed'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_pay_methods_kind_ok') then
    alter table coach_pay_methods add constraint coach_pay_methods_kind_ok
      check (kind is null or kind in ('card', 'bacs_debit'));
  end if;
end $$;

create index if not exists idx_coach_pay_methods_player on coach_pay_methods (coach_id, player_id);

-- Written only by the server (the card routes and the Stripe webhook, with the
-- service key). The academy's owner may read their own rows; no browser writes
-- them — the same rule as coach_stripe and coach_charges (migration 193).
alter table coach_pay_methods enable row level security;
revoke insert, update, delete, truncate on coach_pay_methods from public, anon, authenticated;
drop policy if exists lumio_owner_reads on coach_pay_methods;
create policy lumio_owner_reads on coach_pay_methods for select to authenticated using (coach_id = auth.uid());

-- ── Charges know what they were for ──────────────────────────────────────────
alter table coach_charges
  add column if not exists player_id uuid references coach_players(id) on delete set null,
  add column if not exists booking_id uuid references coach_bookings(id) on delete set null,
  add column if not exists kind text,                -- lesson | late_cancel | no_show | other
  add column if not exists method_id uuid references coach_pay_methods(id) on delete set null,
  add column if not exists failure_reason text,
  add column if not exists refunded_pennies integer,
  add column if not exists charged_by text;          -- 'coach' | 'auto'

-- One lesson is never charged twice for the same reason. 'charging' is the
-- moment between asking Stripe and hearing back; 'processing' is a Direct
-- Debit on its way. A failed or abandoned attempt does not count.
create unique index if not exists uniq_coach_charges_booking_kind
  on coach_charges (booking_id, kind)
  where booking_id is not null and status in ('charging', 'processing', 'paid');

create index if not exists idx_coach_charges_booking on coach_charges (booking_id) where booking_id is not null;

-- ── When a booking was cancelled ─────────────────────────────────────────────
-- Set here, not by the app, so every way a booking gets cancelled (the
-- calendar, a family in the app, an import) records it the same way.
alter table coach_bookings add column if not exists cancelled_at timestamptz;

create or replace function lumio_booking_cancelled_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'cancelled' and (tg_op = 'INSERT' or old.status is distinct from 'cancelled') then
    new.cancelled_at := coalesce(new.cancelled_at, now());
  elsif new.status is distinct from 'cancelled' then
    new.cancelled_at := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_booking_cancelled_at on coach_bookings;
create trigger trg_booking_cancelled_at before insert or update of status on coach_bookings
  for each row execute function lumio_booking_cancelled_at();

notify pgrst, 'reload schema';
