-- 208 — a session plan knows WHICH player it is for.
--
-- A plan held only the player's name (group_name). With two players called the
-- same, the Session Planner could not say which one a plan was for, and
-- finishing the session could not file the lesson on the right one. A plan made
-- for a booking is unaffected (the booking carries the player); this is for a
-- plan made on its own.
--
-- Nullable and filled in only by the app from now on: a group plan, a plan for
-- a typed name, and every plan written before this have none, and keep working
-- exactly as before. Safe to run twice.

alter table coach_session_plans
  add column if not exists player_id uuid references coach_players(id) on delete set null;

create index if not exists idx_coach_session_plans_player
  on coach_session_plans (player_id) where player_id is not null;
