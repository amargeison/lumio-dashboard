-- Lumio Tennis Coach — richer camp plans, designed by Lumio Coach (Boris).
--
-- The old plan was one paragraph per day ({day, focus, did, nextAction}). The
-- demo has always shown a TIMETABLE — AM/PM/EVE sessions with a time, a type and
-- a location — and that structural difference, not a lack of words, is why the
-- live itinerary reads thin next to it.
--
-- `itinerary` is already JSONB so the richer day shape needs no migration; it now
-- carries { day, date, theme, rest, sessions[], coachFocus, evening }. Old flat
-- days still render — the UI falls back when `sessions` is absent, so existing
-- camps are not broken by the upgrade.
--
-- What DOES need columns is everything Boris now produces beyond the itinerary.

alter table coach_camps add column if not exists parent_brief   jsonb;  -- {intro, whatTheyWorkOn[], whatToBring[], dailyShape, whatTheyLeaveWith[]}
alter table coach_camps add column if not exists player_targets jsonb;  -- [{player_name, stage, goals[], measure}]
alter table coach_camps add column if not exists ages           text;   -- e.g. "9-12" — drives how age-appropriate the plan is
alter table coach_camps add column if not exists group_size     integer;-- expected attendees, drives court/coach ratios
alter table coach_camps add column if not exists intent         text;   -- the coach's one line: what players should leave with
alter table coach_camps add column if not exists designed_at    timestamptz;
