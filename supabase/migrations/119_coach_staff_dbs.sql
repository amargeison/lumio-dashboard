-- Lumio Tennis Coach — DBS / safeguarding register on coaching staff.

ALTER TABLE coach_staff ADD COLUMN IF NOT EXISTS dbs_number           TEXT;
ALTER TABLE coach_staff ADD COLUMN IF NOT EXISTS dbs_issued           DATE;
ALTER TABLE coach_staff ADD COLUMN IF NOT EXISTS dbs_expiry           DATE;
ALTER TABLE coach_staff ADD COLUMN IF NOT EXISTS safeguarding_trained BOOLEAN DEFAULT FALSE;
ALTER TABLE coach_staff ADD COLUMN IF NOT EXISTS safeguarding_date    DATE;
