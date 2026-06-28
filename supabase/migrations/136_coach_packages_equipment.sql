-- Packages can carry the equipment needed per session, which is pushed onto the
-- Equipment & Kit grab-and-go checklist for that session type.
alter table coach_packages add column if not exists equipment text;   -- newline-separated
