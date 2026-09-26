-- ─────────────────────────────────────────────────────────────────────────────
-- A camp is not one channel.
--
-- Pete's server has #general, #important-info and #faqs, and a parent asking
-- what time the bus leaves will use whichever one they happen to be looking at.
-- One channel per camp meant picking which conversation Lumio was allowed to
-- see, which is the wrong question: it should see all the ones the coach links,
-- and keep them apart so the thread reads like the server does.
--
-- Replaces the single set of discord_* columns on coach_camps (migration 183).
-- Those columns stay for now — dropping them while a deploy is mid-flight would
-- break the running build — but nothing writes to them any more.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists coach_camp_channels (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references auth.users(id) on delete cascade,
  camp_id         uuid not null references coach_camps(id) on delete cascade,
  guild_id        text,
  channel_id      text not null,
  channel_name    text,
  -- Everything up to here is already in Lumio. Snowflakes sort chronologically.
  last_message_id text,
  synced_at       timestamptz,
  -- Whether Lumio's own camp messages are echoed here. On for the first channel
  -- a camp links and off for the rest by default: a coach sending one message
  -- does not expect it posted three times across the server.
  mirror          boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (camp_id, channel_id)
);

create index if not exists idx_camp_channels_camp on coach_camp_channels (coach_id, camp_id);

alter table coach_camp_channels enable row level security;
drop policy if exists lumio_camp_channels_head on coach_camp_channels;
create policy lumio_camp_channels_head on coach_camp_channels for all to authenticated
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
drop policy if exists lumio_camp_channels_staff on coach_camp_channels;
create policy lumio_camp_channels_staff on coach_camp_channels for select to authenticated
  using (lumio_in_academy(coach_id));

-- Carry over anything linked under the single-channel version, keeping its place
-- in the channel so nothing is re-imported.
insert into coach_camp_channels (coach_id, camp_id, guild_id, channel_id, channel_name, last_message_id, synced_at, mirror)
select coach_id, id, discord_guild_id, discord_channel_id, discord_channel_name, discord_last_message_id, discord_synced_at,
       coalesce(discord_mirror, true)
from coach_camps
where discord_channel_id is not null
on conflict (camp_id, channel_id) do nothing;

-- Which channel a message came from, so the thread can be split by channel
-- rather than being one run-on conversation from three different rooms.
alter table coach_messages add column if not exists discord_channel_id   text;
alter table coach_messages add column if not exists discord_channel_name text;
