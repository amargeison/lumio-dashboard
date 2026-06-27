-- The live Lesson Summaries detail view (LiveLessonsView) renders the same rich
-- layout as the demo — session focus, what we covered, drills, skills, homework,
-- next focus, coach note — which needs the STRUCTURED summary, not just the
-- flattened ai_review text. AI-built summaries (from a recording) store the full
-- object here; manually-typed summaries simply leave it null and fall back to the
-- coach notes / ai_review text.

alter table coach_sessions add column if not exists review_json jsonb;
