-- ─────────────────────────────────────────────────────────────────────────────
-- Whose Discord server is whose.
--
-- There is one Lumio bot, and it sits in every academy's server. Until now the
-- camp Discord tab listed every server the bot could see — to every coach. With
-- one academy that was invisible; with two, each could see the other's server,
-- link its channels to their own camp and read another club's parents talking.
--
-- A server now belongs to the coach who added the bot to it. Discord proves
-- that for us: adding a bot needs Manage Server on that server, and the invite
-- comes back through our own callback with the server id in Discord's
-- server-to-server response, not in anything a browser could edit.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists coach_discord_guilds (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references auth.users(id) on delete cascade,
  guild_id    text not null,
  guild_name  text,
  created_at  timestamptz not null default now(),
  -- One owner per server. Two academies sharing a server is a conversation to
  -- have with a human, not something to allow by accident.
  unique (guild_id)
);

create index if not exists idx_discord_guilds_coach on coach_discord_guilds (coach_id);

alter table coach_discord_guilds enable row level security;
drop policy if exists lumio_discord_guilds_own on coach_discord_guilds;
create policy lumio_discord_guilds_own on coach_discord_guilds for select to authenticated
  using (coach_id = auth.uid() or lumio_in_academy(coach_id));

-- Servers already linked before this existed belong to whoever linked them.
insert into coach_discord_guilds (coach_id, guild_id)
select distinct on (guild_id) coach_id, guild_id
from coach_camp_channels
where guild_id is not null
order by guild_id, created_at asc
on conflict (guild_id) do nothing;
