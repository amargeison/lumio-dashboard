-- Lumio Tennis Coach — player contact columns.
--
-- Booking confirmations go to the PARENT for an under-16 and to the PLAYER
-- otherwise, which needs somewhere to store a parent's address. coach_players
-- already had `age` and `parent_name` but no parent email, so the safeguarding
-- rule could not actually be implemented.
--
-- These columns are also already SELECTed by /api/coach/mail/sync (it reads
-- `name, email, contact_email, parent_email` to match inbound mail to a player),
-- so that query has been failing against PostgREST and silently returning nothing.
-- Adding them here fixes that as well.

ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS parent_email  TEXT;  -- guardian, used for under-16s
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS contact_email TEXT;  -- alternate/secondary address

-- Confirmations are looked up by player from a booking, so keep the name lookup cheap.
CREATE INDEX IF NOT EXISTS idx_coach_players_name ON coach_players (coach_id, lower(name));
