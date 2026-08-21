-- Lumio Tennis Coach — session plans built by Lumio Coach.
--
-- The planner already stored focus points and drills as free text. What it never
-- stored was the run-sheet: the timed phase-by-phase plan the coach actually
-- works from on court. That was generated in the browser from a fixed percentage
-- template every time the modal rendered, so it was never the same twice, never
-- reviewable, and never anything a coach had agreed to.
--
-- Storing it makes the plan a real artefact: printable, auditable, and the thing
-- the next session can build on.

alter table coach_session_plans add column if not exists run_sheet   jsonb;   -- [{phase, mins, detail, cue}]
alter table coach_session_plans add column if not exists kit         text[];
alter table coach_session_plans add column if not exists coach_note  text;    -- one line to the coach, not the player

-- Provenance. 'lumio-coach' = built by the agent; 'coach' = written by hand
-- through the manual escape hatch. Without this there is no way to tell a plan
-- the agent designed from one a coach typed at 11pm, which matters the first
-- time someone asks why a plan says what it says.
alter table coach_session_plans add column if not exists built_by    text;
alter table coach_session_plans add column if not exists designed_at timestamptz;

-- Where the plan came from: the planner, or the "next session" suggestion under
-- a lesson review. Tells us which entry point coaches actually use.
alter table coach_session_plans add column if not exists source      text;
