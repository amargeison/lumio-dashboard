-- Track whether a lesson-package payment has been collected, so the coach can
-- confirm payment with one click and the Earned / Outstanding tiles are real.
-- (Once Stripe is live, the payment webhook sets these automatically.)
alter table coach_payments add column if not exists paid    boolean default false;
alter table coach_payments add column if not exists paid_at timestamptz;
