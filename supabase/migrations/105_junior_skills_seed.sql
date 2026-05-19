-- supabase/migrations/105_junior_skills_seed.sql
-- Workstream B7a — FA four-corner skills framework seed.
--
-- FIRST seed migration in the repo. Pattern is INSERT … ON CONFLICT
-- (age_band, domain, skill_name) DO NOTHING — re-running 105 is a safe
-- no-op. The unique key on junior_skills_framework was sized exactly
-- for this idempotency pattern (migration 103).
--
-- This migration is the CANONICAL WRITER for junior_skills_framework.
-- 103's RLS posture on that table is service-role-only writes (RLS
-- enabled, SELECT policy only, no write policy). The Supabase SQL
-- editor (and CLI migration runs) execute with the postgres role,
-- which bypasses RLS — same as service_role for write purposes — so
-- the INSERTs below succeed without any RLS gymnastics.
--
-- AGE BANDS — three FA phase bands, NOT per-year. The Commit 7 portal
-- component src/app/junior/[slug]/_components/JuniorDevelopment.tsx
-- already splits its band hints at U7–U9 / U10–U12 / U13+ — these
-- seed rows use 'U7-U9', 'U10-U12', 'U13-U16' so the UI's bandHint
-- groupings and the catalogue agree.
--
-- COVERAGE — 5 skills per (age_band, domain) = 3 × 4 × 5 = 60 rows.
-- Enough for the development tracker to render four meaningful corner
-- panels per band without being an exhaustive coaching syllabus. The
-- canonical FA catalogue can replace these rows later via a follow-up
-- seed migration; the ON CONFLICT key keeps that re-seed safe.
--
-- DEMO DATA — none. Per B7a scope, no demo clubs / players / families
-- in the database. All demo content stays canned in the components.

-- ─── U7-U9 · Foundation phase ────────────────────────────────────────────

INSERT INTO junior_skills_framework (age_band, domain, skill_name, descriptor, sort_order) VALUES
  ('U7-U9', 'technical', 'First touch',              'Cushion the ball cleanly on the floor and in the air.',                  1),
  ('U7-U9', 'technical', 'Dribbling under control',  'Move with the ball close to the foot at walking and jogging pace.',      2),
  ('U7-U9', 'technical', 'Turns and stops',          'Use sole-of-foot stops and inside/outside turns to change direction.',   3),
  ('U7-U9', 'technical', 'Short passing',            'Pass accurately over 3–5 metres with both feet.',                        4),
  ('U7-U9', 'technical', 'Striking the ball',        'Strike with laces for distance, side-foot for accuracy.',                5),

  ('U7-U9', 'physical',  'Balance on the ball',      'Stay upright through contact, turns and quick stops.',                   1),
  ('U7-U9', 'physical',  'Basic coordination',       'Ladders, hops and skips — left foot and right foot.',                    2),
  ('U7-U9', 'physical',  'Running with the ball',    'Sprint with the ball at the foot without losing it.',                    3),
  ('U7-U9', 'physical',  'Jumping and landing',      'Two-footed take-off, soft two-footed landing for heading prep.',         4),
  ('U7-U9', 'physical',  'Age-appropriate stamina',  'Stay engaged across short games without dropping intensity.',            5),

  ('U7-U9', 'social',    'Cooperative play',         'Share the ball, take turns in drills, play as a team not a solo.',       1),
  ('U7-U9', 'social',    'Listening to the coach',   'Stop on the whistle, eyes on the coach, follow instructions first time.', 2),
  ('U7-U9', 'social',    'Encouraging teammates',    'Use positive words; no shouting at teammates after mistakes.',           3),
  ('U7-U9', 'social',    'FA Respect basics',        'Handshakes before and after, no dissent to the referee.',                4),
  ('U7-U9', 'social',    'Including everyone',       'Pick mixed teams in unstructured play, pass to less-confident players.', 5),

  ('U7-U9', 'psychological', 'Focus during drills',    'Stay on task for the length of the drill without drifting.',           1),
  ('U7-U9', 'psychological', 'Listening attentively',  'Repeat back instructions when asked; ask if unsure.',                  2),
  ('U7-U9', 'psychological', 'Trying again',           'Keep going after mistakes; treat them as part of learning.',           3),
  ('U7-U9', 'psychological', 'Following team rules',   'Stay in position when asked, return to roles in restarts.',            4),
  ('U7-U9', 'psychological', 'Enjoying the game',      'Show up keen, leave smiling — fun is the foundation at this age.',     5)
ON CONFLICT (age_band, domain, skill_name) DO NOTHING;

-- ─── U10-U12 · Development phase ─────────────────────────────────────────

INSERT INTO junior_skills_framework (age_band, domain, skill_name, descriptor, sort_order) VALUES
  ('U10-U12', 'technical', 'Passing patterns',           'Play in 3rds, give-and-go, third-man runs — recognise and execute.',  1),
  ('U10-U12', 'technical', 'Scanning before receiving',  'Look over both shoulders before the ball arrives.',                   2),
  ('U10-U12', 'technical', 'Weak-foot use',              'Pass and strike with the weaker foot in drills and games.',           3),
  ('U10-U12', 'technical', 'First touch under pressure', 'Take the ball away from pressure with the first touch.',              4),
  ('U10-U12', 'technical', '1v1 attacking',              'Take on a defender with a recognised move; commit and finish.',       5),

  ('U10-U12', 'physical',  'Agility',                    'Change direction quickly and recover balance.',                       1),
  ('U10-U12', 'physical',  'Short-distance speed',       'Accelerate over 5–10 metres in match situations.',                    2),
  ('U10-U12', 'physical',  'Coordination under fatigue', 'Technique holds up when tired — ladders at the end of session.',      3),
  ('U10-U12', 'physical',  'Bodyweight strength',        'Press-ups, squats and planks at age-appropriate volume.',             4),
  ('U10-U12', 'physical',  'Balance through contact',    'Stay on feet through shoulder-to-shoulder challenges.',               5),

  ('U10-U12', 'social',    'Positional teamwork',        'Hold a position to support teammates; rotate intentionally.',         1),
  ('U10-U12', 'social',    'Vocal cues on pitch',        'Call for the ball, talk teammates onto runners, communicate clearly.', 2),
  ('U10-U12', 'social',    'Leading by example',         'Set the tone in warm-ups and in pressing moments.',                   3),
  ('U10-U12', 'social',    'Supporting teammates',       'Lift heads after errors; celebrate teammates'' goals first.',         4),
  ('U10-U12', 'social',    'Respect for officials',      'No dissent, captain handles refereeing queries on behalf of team.',   5),

  ('U10-U12', 'psychological', 'Decision-making',          'Choose pass / shoot / dribble appropriate to the moment.',          1),
  ('U10-U12', 'psychological', 'Reading the game',         'Anticipate where the ball is going next; arrive before the ball.',  2),
  ('U10-U12', 'psychological', 'Composure in possession',  'Keep the ball calmly under press; don''t panic-clear.',              3),
  ('U10-U12', 'psychological', 'Dealing with mistakes',    'Recover within seconds; next action matters more than the last.',   4),
  ('U10-U12', 'psychological', 'Sustained concentration',  'Stay locked in for a full half without switching off.',             5)
ON CONFLICT (age_band, domain, skill_name) DO NOTHING;

-- ─── U13-U16 · Youth phase ───────────────────────────────────────────────

INSERT INTO junior_skills_framework (age_band, domain, skill_name, descriptor, sort_order) VALUES
  ('U13-U16', 'technical', 'Technique under pressure',   'Pass, control and finish cleanly with a defender on the shoulder.',   1),
  ('U13-U16', 'technical', 'Two-footed finishing',       'Finish at goal with both feet from inside and outside the area.',     2),
  ('U13-U16', 'technical', 'Set-piece delivery',         'Corners, free kicks and long throws to repeatable target zones.',     3),
  ('U13-U16', 'technical', 'Defending 1v1',              'Jockey, delay and tackle — choose the right one for the situation.',  4),
  ('U13-U16', 'technical', 'Passing range',              'Switches, through balls, line-breaking passes from deep positions.',  5),

  ('U13-U16', 'physical',  'Power',                      'Sprint repeatability, vertical jump, change-of-pace acceleration.',   1),
  ('U13-U16', 'physical',  'Endurance',                  'Sustain intensity across a full match — age-appropriate minutes.',    2),
  ('U13-U16', 'physical',  'Strength and conditioning',  'Programmed S&C twice a week; technique-first, load second.',          3),
  ('U13-U16', 'physical',  'Recovery management',        'Hydration, sleep, post-match nutrition treated as training.',         4),
  ('U13-U16', 'physical',  'Growth-aware load tracking', 'Coach + parent flag growth spurts; adjust load to protect knees.',    5),

  ('U13-U16', 'social',    'Leadership moments',         'Step up in difficult moments — vocal, visible, accountable.',         1),
  ('U13-U16', 'social',    'Captaincy candidacy',        'Represent the team to officials and parents with composure.',         2),
  ('U13-U16', 'social',    'Mentoring younger players',  'Help at lower age-band sessions — give back to the club.',            3),
  ('U13-U16', 'social',    'Off-pitch conduct',          'Social media, school behaviour and travel conduct represent the club.', 4),
  ('U13-U16', 'social',    'On-pitch conflict resolution', 'Cool teammates after fouls; defuse rather than escalate.',          5),

  ('U13-U16', 'psychological', 'Composure under pressure', 'Penalties, last-minute defending, big-game moments — stay clear.',  1),
  ('U13-U16', 'psychological', 'Tactical adaptability',    'Adjust to in-game tactical changes from the bench without resetting.', 2),
  ('U13-U16', 'psychological', 'Resilience after setbacks','Bounce back from a poor half, a substitution, or a defeat.',        3),
  ('U13-U16', 'psychological', 'Self-management',          'Own sleep, hydration, school workload — coach trusts you to.',      4),
  ('U13-U16', 'psychological', 'Goal-setting and review',  'Set termly targets with the Academy Lead; reflect honestly.',       5)
ON CONFLICT (age_band, domain, skill_name) DO NOTHING;
