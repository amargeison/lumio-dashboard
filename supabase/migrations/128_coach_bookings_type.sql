-- The live Booking Calendar colour-codes blocks by activity type (Private /
-- Group / Cardio / Match play / Block), matching the demo's legend. The original
-- coach_bookings table had no type column — add it (defaulting to Private so all
-- existing rows render sensibly).

alter table coach_bookings add column if not exists type text default 'Private';
