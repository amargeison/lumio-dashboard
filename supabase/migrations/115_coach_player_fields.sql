-- Lumio Tennis Coach — richer player fields for the demo-matched roster.

ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS age         INTEGER;
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS goal        TEXT;
ALTER TABLE coach_players ADD COLUMN IF NOT EXISTS category    TEXT;  -- Junior | Performance | Adult
