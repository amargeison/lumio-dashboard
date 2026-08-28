-- Lumio Tennis Coach — the camp countdown emails.
--
-- Six emails between signing up and getting home, sent automatically from the
-- camp record. The coach can edit or skip any of them, or pause the whole
-- sequence for a camp.

-- ── The send log ────────────────────────────────────────────────────────────
-- This table is the safety mechanism, not a report. The unique index is the
-- whole point: a cron that fires twice, a deploy that restarts mid-batch, or a
-- manual re-run cannot email the same family the same stage again. With
-- auto-send, a duplicate is the failure that would actually cost a coach trust.
--
-- 'skipped' rows are written deliberately — a late sign-up gets its passed
-- stages marked skipped at sign-up, which is what stops them arriving in a burst.
create table if not exists coach_camp_emails (
  id          uuid default gen_random_uuid() primary key,
  coach_id    uuid not null references auth.users(id) on delete cascade,
  camp_id     uuid references coach_camps(id) on delete cascade,
  attendee_id uuid references coach_camp_attendees(id) on delete cascade,
  stage       text not null,          -- signup | details | two_weeks | one_week | tomorrow | after
  status      text not null,          -- sent | skipped | failed
  error       text,
  subject     text,
  sent_at     timestamptz default now(),
  created_at  timestamptz default now()
);

create unique index if not exists idx_camp_emails_once
  on coach_camp_emails (attendee_id, stage);
create index if not exists idx_camp_emails_camp on coach_camp_emails (camp_id);

alter table coach_camp_emails enable row level security;
drop policy if exists "coach owns camp emails" on coach_camp_emails;
create policy "coach owns camp emails" on coach_camp_emails
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- ── Camp-level controls ─────────────────────────────────────────────────────
alter table coach_camps add column if not exists emails_paused boolean default false;

-- Passport and insurance lines only belong on a trip abroad. A checkbox rather
-- than inferring it from the free-text region, which would be wrong sometimes
-- and wrong in a way a parent notices.
alter table coach_camps add column if not exists overseas boolean default false;

-- Where a parent pays the outstanding balance on a deposit booking. Deliberately
-- a free-text URL, not a Stripe field: a coach may use PayPal.me, a Stripe
-- payment link, or their own booking page. Lumio cannot see this being paid, so
-- the coach still ticks the attendee off by hand — the UI says so.
alter table coach_camps add column if not exists balance_link text;

-- Per-camp stage overrides: { "two_weeks": { "skip": true }, "one_week": { "body": "..." } }
-- Editing or skipping a stage is per camp, not global — a coach who rewrites the
-- week-to-go email for a Portugal trip should not have changed it for next
-- summer's day camp.
alter table coach_camps add column if not exists email_overrides jsonb;
