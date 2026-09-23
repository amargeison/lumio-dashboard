-- One plan, one lesson summary.
--
-- "Session done" inserted a coach_sessions row every time it was called. The
-- write-up takes up to two minutes (Lumio Coach reads the plan and writes the
-- summary), so a coach who thought it had stalled and pressed it again got a
-- second identical lesson — and a third. Penrith ended up with three copies of
-- the same Sven summary, which is worse than a missing one: the player's page
-- repeats itself and the coach cannot tell which is the real record.
--
-- The fix is an identity the retry can collide with. A lesson that came from a
-- plan now carries that plan's id, and the unique index makes a second insert
-- for the same plan impossible no matter how many times the button is pressed
-- or how many browser tabs are open.

alter table coach_sessions add column if not exists plan_id uuid;

-- Existing duplicates: keep the oldest row of each identical set.
--
-- "Identical" is deliberately strict — same coach, same player, same date, same
-- focus AND the same summary text. Two genuinely different lessons with one
-- player on one day (a morning private and an evening squad) differ in at least
-- one of those, so they survive. Only true copies go.
with ranked as (
  select id,
         row_number() over (
           partition by coach_id, coalesce(player_id::text, player_name), session_date,
                        coalesce(focus, ''), coalesce(summary, '')
           order by created_at asc, id asc
         ) as n
  from coach_sessions
)
delete from coach_sessions s
using ranked r
where s.id = r.id and r.n > 1;

-- The guard itself. Partial, because lessons written by hand or from a
-- recording have no plan behind them and must stay free to repeat.
create unique index if not exists uniq_coach_sessions_plan
  on coach_sessions (coach_id, plan_id)
  where plan_id is not null;

create index if not exists idx_coach_sessions_plan on coach_sessions (plan_id);
