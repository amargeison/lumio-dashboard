-- ─────────────────────────────────────────────────────────────────────────────
-- Emails barred from signing in.
--
-- Deleting a demo lead tidies the admin list and nothing else. It cannot keep
-- anybody out, because sign-up is self-service: the next OTP recreates the lead
-- row, and generateLink recreates the auth user along with it. Deleting the auth
-- user has the same hole — the very next sign-in makes a new one.
--
-- So barring somebody needs a fact that survives deletion, checked before an OTP
-- is ever minted. That is this table.
--
-- Deliberately keyed on EMAIL rather than on a user id, for exactly that reason:
-- the user id is the thing that gets recreated. The email is what a competitor
-- has to keep using to get back to the same account.
create table if not exists sports_blocked_emails (
  email      text primary key,
  reason     text,
  blocked_at timestamptz default now(),
  blocked_by text
);

-- Service role only. No policy is added, and RLS is on, so the anon key cannot
-- read this table — the block list is not something a visitor should be able to
-- enumerate, and "is this address barred" is not a question the browser gets to
-- ask directly.
alter table sports_blocked_emails enable row level security;

create index if not exists idx_blocked_emails_at on sports_blocked_emails (blocked_at desc);
