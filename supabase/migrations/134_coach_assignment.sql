-- Assign bookings and players to a specific coach, so the Coaches page can show
-- each coach's own week + squad and compute real workload stats. Stored as the
-- coach's name (head coach = the account; null = the head coach / unassigned).
alter table coach_bookings add column if not exists assigned_coach  text;
alter table coach_players  add column if not exists assigned_coach  text;
-- Contracted weekly hours → utilisation %.
alter table coach_staff    add column if not exists contracted_hours integer;
