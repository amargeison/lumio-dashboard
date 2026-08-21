-- Lumio Tennis Coach — development targets per player.
--
-- Camps have had per-player targets since the camps overhaul; individual players
-- never did. A coach could see a player's skills matrix, their attendance and
-- every lesson summary, and still had nowhere to write down what this player is
-- actually working towards over the next block — the thing a parent asks about
-- and the thing a session plan should be serving.

alter table coach_players add column if not exists targets       jsonb;        -- [{ target, why, measure, by }]
alter table coach_players add column if not exists targets_note  text;         -- one line to the coach about the block as a whole
alter table coach_players add column if not exists targets_set_at timestamptz;
-- 'lumio-coach' or 'coach', same provenance rule as session plans: there must be
-- a way to tell what the agent proposed from what a coach decided.
alter table coach_players add column if not exists targets_by    text;
