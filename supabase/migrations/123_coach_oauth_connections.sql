-- Lumio Tennis Coach — per-coach email & calendar integrations.
--
-- Stores the OAuth tokens (Google / Microsoft) or CalDAV credentials (iCloud)
-- for a coach's connected mailbox + calendar. Used by the calendar two-way sync
-- and "send as the coach's address" features.
--
-- SECURITY: tokens are sensitive. RLS is enabled with NO anon/auth policies, so
-- the browser (anon) client can never read this table. All access goes through
-- service-role API routes (/api/coach/oauth/* and /api/coach/integrations) that
-- verify the coach's session and return only non-secret fields to the client.
-- Recommended hardening before GA: encrypt token columns with pgcrypto / Supabase
-- Vault rather than storing them as plaintext.

create table if not exists coach_oauth_connections (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references sports_profiles(id) on delete cascade,
  provider      text not null check (provider in ('google', 'microsoft', 'icloud')),
  email_address text,                       -- the connected account's address
  access_token  text,                       -- OAuth access token (google/microsoft)
  refresh_token text,                       -- OAuth refresh token (google/microsoft)
  token_expiry  timestamptz,                -- when access_token expires
  scopes        text,                       -- space-separated granted scopes
  app_password  text,                       -- iCloud app-specific password (caldav/smtp)
  caldav_url    text,                       -- iCloud CalDAV principal/home URL
  capabilities  text[] not null default '{}', -- {calendar, send_email, read_inbox}
  status        text not null default 'connected', -- connected | error | revoked
  last_synced   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (coach_id, provider)
);

create index if not exists idx_coach_oauth_coach on coach_oauth_connections (coach_id);

alter table coach_oauth_connections enable row level security;
-- Intentionally no policies: only the service role (which bypasses RLS) may touch
-- this table. The browser client is fully blocked from reading tokens.
