-- A plan that has been run.
--
-- "Session done" writes a lesson summary (see /api/coach/session-complete), but
-- nothing marked the PLAN itself as finished — so a session the coach had
-- already taught kept appearing in the planner as something still to do, and
-- "needs a plan" counted an hour that had happened.
alter table coach_session_plans add column if not exists completed_at timestamptz;

comment on column coach_session_plans.completed_at is
  'When the coach finished this session (Session Planner → Finish session). Null = still ahead of them.';

create index if not exists idx_session_plans_completed on coach_session_plans (coach_id, completed_at);
