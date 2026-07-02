-- Lumio Tennis — per-child scope hardening.
-- coach_sessions / coach_bookings historically key on the free-text `player_name`,
-- which lets two children with the SAME name in one academy collide (a parent
-- scoped to one child could see the other's sessions/bookings). Add a real
-- `player_id` FK so the portal can scope by id. Best-effort backfill by name;
-- new writes set player_id directly, and portal reads prefer id with a name
-- fallback for any legacy row that couldn't be matched (so nothing disappears).

alter table coach_sessions add column if not exists player_id uuid;
alter table coach_bookings  add column if not exists player_id uuid;

-- Best-effort backfill (exact, case-insensitive, trimmed name match within the coach).
update coach_sessions s set player_id = p.id
  from coach_players p
  where p.coach_id = s.coach_id
    and lower(trim(p.name)) = lower(trim(s.player_name))
    and s.player_id is null;

update coach_bookings b set player_id = p.id
  from coach_players p
  where p.coach_id = b.coach_id
    and lower(trim(p.name)) = lower(trim(b.player_name))
    and b.player_id is null;

create index if not exists idx_coach_sessions_player_id on coach_sessions (player_id) where player_id is not null;
create index if not exists idx_coach_bookings_player_id on coach_bookings (player_id) where player_id is not null;
