-- How this family actually pays.
--
-- Lumio knew whether a pack was paid and nothing about HOW — so a coach looking
-- at eight unpaid packs could not tell the standing-order family (money is
-- coming, leave them alone) from the cash-on-court one (ask them on Saturday)
-- from the card payer who just needs a link. That is the difference between a
-- useful chase list and a list you ignore.
--
-- Free text with a known set in the UI rather than an enum: a coach who takes
-- childcare vouchers or invoices a school should be able to say so without a
-- migration. It records what the coach expects, not what a payment processor
-- confirmed — Lumio is not collecting it, the coach is.
alter table coach_players add column if not exists payment_method text;

comment on column coach_players.payment_method is
  'How this player/family pays: Direct debit | Standing order | Bank transfer | Card | Cash | Invoice | anything the coach types. Informational — no collection attached.';
