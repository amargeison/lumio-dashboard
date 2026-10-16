-- 209 — prices that fit how a coach charges, and what the courts cost.
--
-- Lumio knew one number: the private hourly rate. A real coach charges
--   • some clients their own rate ("legacy", "family") — coach_players.rate_*
--   • a private group by how many turn up (£65 for one, £35 each for two…)
--     — coach_bookings.headcount, priced from the price list in Settings
--   • a set price on one booking now and then — coach_bookings.price_pennies
-- and pays for courts in different ways: invoiced monthly per court hour, paid
-- at reception, or free — coach_venues.court_*.
--
-- All money is in pennies, like coach_payments. Every column is nullable and
-- empty means "not set": nothing written before this changes, and the app works
-- out a price from the price list when a booking has none of its own.
-- Safe to run twice.

alter table coach_players
  add column if not exists rate_pennies integer,
  add column if not exists rate_reason text;

alter table coach_venues
  add column if not exists court_cost_pennies integer,
  add column if not exists court_billing text;

alter table coach_bookings
  add column if not exists price_pennies integer,
  add column if not exists headcount integer;

-- The checks are added on their own so a second run does not trip over them.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'coach_players_rate_pennies_ok') then
    alter table coach_players add constraint coach_players_rate_pennies_ok
      check (rate_pennies is null or (rate_pennies >= 0 and rate_pennies <= 100000));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_players_rate_reason_ok') then
    alter table coach_players add constraint coach_players_rate_reason_ok
      check (rate_reason is null or char_length(rate_reason) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_venues_court_cost_ok') then
    alter table coach_venues add constraint coach_venues_court_cost_ok
      check (court_cost_pennies is null or (court_cost_pennies >= 0 and court_cost_pennies <= 100000));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_venues_court_billing_ok') then
    alter table coach_venues add constraint coach_venues_court_billing_ok
      check (court_billing is null or court_billing in ('invoice', 'pay', 'free'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_bookings_price_ok') then
    alter table coach_bookings add constraint coach_bookings_price_ok
      check (price_pennies is null or (price_pennies >= 0 and price_pennies <= 1000000));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coach_bookings_headcount_ok') then
    alter table coach_bookings add constraint coach_bookings_headcount_ok
      check (headcount is null or (headcount between 1 and 50));
  end if;
end $$;

notify pgrst, 'reload schema';
