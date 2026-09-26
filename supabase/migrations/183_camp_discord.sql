-- ─────────────────────────────────────────────────────────────────────────────
-- Camps that already live in Discord.
--
-- A touring camp does not start a conversation in Lumio because it already has
-- one: a Discord server where the parents ask what time the bus leaves and the
-- coaches post photos from court three. Asking those people to move is asking
-- them to abandon the thing that works, so Lumio joins them instead — a bot
-- reads the camp's channel into the camp thread, and messages sent from Lumio
-- go back out to the channel.
--
-- Deliberately per camp, not per academy: a coach may run four camps a year in
-- four different channels, and a player on one has no business reading another.
-- ─────────────────────────────────────────────────────────────────────────────

alter table coach_camps add column if not exists discord_guild_id        text;
alter table coach_camps add column if not exists discord_channel_id      text;
alter table coach_camps add column if not exists discord_channel_name    text;
-- The last Discord message id we have already stored. Snowflakes sort
-- chronologically, so this doubles as "everything up to here is in".
alter table coach_camps add column if not exists discord_last_message_id text;
alter table coach_camps add column if not exists discord_synced_at       timestamptz;
-- Whether Lumio's own camp messages are echoed into the channel. On by default:
-- a one-way mirror that only reads is a half-integration, and the coach who
-- sends from Lumio would still have to repeat themselves in Discord.
alter table coach_camps add column if not exists discord_mirror          boolean default true;

create index if not exists idx_coach_camps_discord on coach_camps (discord_channel_id) where discord_channel_id is not null;

-- Who is who. A Discord account is not a player until somebody says it is, so
-- until this is set an inbound message shows the Discord display name and is
-- filed under it.
alter table coach_players add column if not exists discord_user_id text;
create index if not exists idx_coach_players_discord on coach_players (coach_id, discord_user_id) where discord_user_id is not null;

-- Dedupe, enforced rather than hoped for.
--
-- Inbound sync has always deduped by reading the external ids it already has
-- and skipping those — which is a race, not a guarantee: two syncs that overlap
-- both read an empty result and both insert. Discord polls every minute, so
-- that race would happen. Clean out anything already doubled, then make it
-- impossible.
with ranked as (
  select id, row_number() over (partition by coach_id, external_id order by created_at asc, id asc) as n
  from coach_messages where external_id is not null
)
delete from coach_messages m using ranked r where m.id = r.id and r.n > 1;

create unique index if not exists uniq_coach_messages_external
  on coach_messages (coach_id, external_id) where external_id is not null;
