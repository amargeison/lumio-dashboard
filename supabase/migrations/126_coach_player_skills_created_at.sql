-- coach_player_skills was created without created_at, but the generic data layer
-- (coach-db dbList) orders every table by created_at — so listing skills 400s with
-- "column coach_player_skills.created_at does not exist". Add it.

alter table coach_player_skills add column if not exists created_at timestamptz not null default now();
alter table coach_player_skills add column if not exists updated_at timestamptz not null default now();
