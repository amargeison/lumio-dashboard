-- ─────────────────────────────────────────────────────────────────────────────
-- Running a camp, not just selling one.
--
-- The live camp tabs could take a booking and take the money. Everything
-- between — where a player sleeps, when they land, what they are there to work
-- on, what the kit list actually is, and what the week costs the coach to put
-- on — lived only in the demo, which is to say nowhere. A coach ran the camp out
-- of a spreadsheet and Lumio held the deposit.
--
-- Nothing here is computed or clever. It is the handful of facts a coach writes
-- on a clipboard on day one, given a column each so the portal can print them,
-- email them and add them up.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Per attendee: the rooming list, the airport run, the point of the week ───
alter table coach_camp_attendees add column if not exists room      text;
alter table coach_camp_attendees add column if not exists arrival   text;
alter table coach_camp_attendees add column if not exists camp_goal text;

-- What this family has actually handed over, in pennies, INCLUDING money that
-- never touched Stripe — the bank transfer, the cash at the club, the first
-- installment. amount_pennies stays what Stripe took and is not overwritten, so
-- a reconciliation against Stripe still works; paid_pennies is the coach's own
-- ledger and is what the balance is worked out from.
alter table coach_camp_attendees add column if not exists paid_pennies integer;

comment on column coach_camp_attendees.paid_pennies is
  'Total received for this place in pennies, from any source. Null = fall back to amount_pennies (Stripe only).';

-- ── Per camp: the kit list, the cost base, and how people pay ───────────────
-- kit: the structured checklist — categories, items, quantities, ready/check/to
-- order. The older `equipment` column holds the same information as loose lines
-- of text and is left alone: camps designed before this keep rendering, and the
-- first time one is opened the text is folded into the checklist rather than
-- thrown away.
alter table coach_camps add column if not exists kit jsonb;

-- costs: named cost lines the coach types in — resort, court hire, assistant
-- coaches, transfers. Deliberately free-form rather than a fixed set of columns,
-- because every camp's cost base is shaped differently and a margin built from
-- someone else's categories is a number nobody trusts.
alter table coach_camps add column if not exists costs jsonb;

-- payment_plan: { deposit, installments: [{ label, amount, due }] }. Lumio
-- tracks it and the reminder emails chase it; the money still arrives however
-- the coach already takes it. No new payment rails here.
alter table coach_camps add column if not exists payment_plan jsonb;

comment on column coach_camps.kit is
  'Structured kit checklist: [{ category, items: [{ name, qty, note, status }] }]. status = ready|check|order.';
comment on column coach_camps.costs is
  'Cost lines for the margin: [{ label, amount }]. Coach-entered; never estimated.';
comment on column coach_camps.payment_plan is
  'Installment plan: { deposit: number, installments: [{ label, amount, due }] }.';
