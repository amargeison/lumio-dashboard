-- 215 — Lesson packs paid from a saved card.
--
-- A pack or invoice on the Payments page (coach_payments) can now be charged to
-- the player's saved card or Direct Debit. The charge says which line it was
-- for, so the line is ticked paid when the money is in — straight away for a
-- card, about three working days later for a Direct Debit (the Stripe webhook).
--
-- The credit rules themselves (late cancellations and missed lessons use a
-- lesson from the pack; the coach's own cancellations never do) need no
-- database change: they are worked out from the bookings, the same way the
-- Payments page already counts lessons off a pack.
--
-- Safe to run twice.

alter table coach_charges add column if not exists payment_id uuid references coach_payments(id) on delete set null;
create index if not exists idx_coach_charges_payment on coach_charges (payment_id) where payment_id is not null;

-- One live charge per pack, so two presses cannot take it twice.
create unique index if not exists uniq_coach_charges_payment
  on coach_charges (payment_id)
  where payment_id is not null and status in ('charging', 'processing', 'paid');

notify pgrst, 'reload schema';
