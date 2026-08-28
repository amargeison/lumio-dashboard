-- Lumio Tennis Coach — what a camp promises to deliver.
--
-- `objectives` is what the players are working towards. This is the other half:
-- what the COACH commits to producing by the end — a development report, a
-- racket re-assessment, an off-season plan. Two different lists that were being
-- squeezed into one, so a coach either lost the promises or buried the targets.
alter table coach_camps add column if not exists outcomes jsonb;
