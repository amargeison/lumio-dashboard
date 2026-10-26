-- 221 — The iPhone app's push notifications.
--
--   lumio_push_devices   one row per phone that said yes to notifications: the
--                        Apple device token, whose account it is signed in to,
--                        and that account's email (how a family is matched to
--                        the emails a coach already sends them).
--
-- Only the server reads and writes it (service role). A signed-in person can
-- see their own devices and nobody else's. A token moves to whoever signs in
-- on that phone next, so a shared phone never gets the last person's news.
--
-- Safe to run twice.

create table if not exists lumio_push_devices (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique check (token ~ '^[0-9A-Fa-f]{32,200}$'),
  user_id       uuid not null references auth.users(id) on delete cascade,
  email         text check (email is null or char_length(email) <= 320),
  platform      text not null default 'ios' check (platform in ('ios')),
  -- Which Apple push service the token belongs to: Xcode builds use the
  -- sandbox, TestFlight and App Store builds use production. Found on the
  -- first send.
  apns_env      text check (apns_env in ('production', 'sandbox')),
  app_version   text check (app_version is null or char_length(app_version) <= 40),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  -- Apple said the token is no longer valid (app deleted, notifications off).
  disabled_at   timestamptz
);

create index if not exists idx_push_devices_user  on lumio_push_devices (user_id) where disabled_at is null;
-- Stored lower-case by the server, so a plain index serves the lookup.
create index if not exists idx_push_devices_email on lumio_push_devices (email) where disabled_at is null;

alter table lumio_push_devices enable row level security;

drop policy if exists push_devices_own on lumio_push_devices;
create policy push_devices_own on lumio_push_devices
  for select to authenticated using (user_id = auth.uid());

revoke insert, update, delete on lumio_push_devices from anon, authenticated;

notify pgrst, 'reload schema';
