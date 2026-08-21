-- Lumio Tennis Coach — record of camp announcements emailed to the roster.
--
-- Small on purpose. It exists so a coach can see "you sent this on Tuesday to 43
-- families" rather than wondering, and so a second click does not quietly mail
-- everybody again. The message body is NOT stored: it is regenerated copy the
-- coach edited, and keeping a copy of every parent mailing is a data-retention
-- liability with no operational payoff.

create table if not exists coach_camp_blasts (
  id           uuid default gen_random_uuid() primary key,
  coach_id     uuid not null references auth.users(id) on delete cascade,
  camp_id      uuid references coach_camps(id) on delete cascade,
  subject      text,
  sent_count   integer default 0,
  failed_count integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_camp_blasts_camp on coach_camp_blasts (camp_id);

alter table coach_camp_blasts enable row level security;

-- Same ownership rule as every other coach_* table.
drop policy if exists "coach owns blasts" on coach_camp_blasts;
create policy "coach owns blasts" on coach_camp_blasts
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
