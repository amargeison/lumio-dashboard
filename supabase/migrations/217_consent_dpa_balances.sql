-- 217 — Consent to record lessons, the data processing agreement, and holiday
-- balances taken on the due date.
--
--   coach_players            consent to lessons being recorded: whether, when,
--                            who said so and how (their welcome link, or the
--                            coach noting they agreed in person)
--   coach_dpa_acceptances    the academy accepting Lumio's data processing
--                            agreement: which version, who, when, and the words
--   coach_camps              when the balance is due, and whether it is taken
--                            from the card the deposit was paid with
--   coach_camp_attendees     the card kept for the balance (Stripe's reference
--                            only), what the family agreed to, and where the
--                            balance has got to
--
-- Safe to run twice.

-- ── Recording consent ─────────────────────────────────────────────────────────
alter table coach_players add column if not exists consent_record     boolean not null default false;
alter table coach_players add column if not exists consent_record_at  timestamptz;
alter table coach_players add column if not exists consent_record_by  text;     -- the name of whoever agreed
alter table coach_players add column if not exists consent_record_how text;     -- welcome | in_person | withdrawn

-- ── The data processing agreement ─────────────────────────────────────────────
create table if not exists coach_dpa_acceptances (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references auth.users(id) on delete cascade,
  version      text not null,
  accepted_by  text not null,
  accepted_at  timestamptz not null default now(),
  text         text not null
);
create index if not exists idx_coach_dpa_coach on coach_dpa_acceptances (coach_id, accepted_at desc);
alter table coach_dpa_acceptances enable row level security;
revoke insert, update, delete, truncate on coach_dpa_acceptances from public, anon, authenticated;
drop policy if exists lumio_owner_reads on coach_dpa_acceptances;
create policy lumio_owner_reads on coach_dpa_acceptances for select to authenticated using (coach_id = auth.uid());

-- ── Holiday balances ──────────────────────────────────────────────────────────
alter table coach_camps add column if not exists balance_due           date;
alter table coach_camps add column if not exists auto_balance          boolean not null default true;
alter table coach_camps add column if not exists balance_reminder_days integer not null default 7;

alter table coach_camp_attendees add column if not exists stripe_customer_id       text;
alter table coach_camp_attendees add column if not exists stripe_payment_method_id text;
alter table coach_camp_attendees add column if not exists card_brand               text;
alter table coach_camp_attendees add column if not exists card_last4               text;
alter table coach_camp_attendees add column if not exists balance_agreed_at        timestamptz;
alter table coach_camp_attendees add column if not exists balance_agreed_text      text;
alter table coach_camp_attendees add column if not exists balance_token            text;
alter table coach_camp_attendees add column if not exists balance_reminded_at      timestamptz;
alter table coach_camp_attendees add column if not exists balance_status           text;   -- charging | paid | failed
alter table coach_camp_attendees add column if not exists balance_failed_reason    text;
alter table coach_camp_attendees add column if not exists balance_charge_id        uuid references coach_charges(id) on delete set null;
create unique index if not exists uniq_camp_attendee_balance_token on coach_camp_attendees (balance_token) where balance_token is not null;

notify pgrst, 'reload schema';
