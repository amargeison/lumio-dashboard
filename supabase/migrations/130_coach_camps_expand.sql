-- Training Camps go end-to-end: a camp now carries its setup (region, surface,
-- courts, board, daily rhythm), an AI-designable itinerary / equipment / targets
-- (jsonb), finance (price = per-head, collected), a confirmed flag for the
-- dashboard, and a roster-linked attendee list for live player packs.

alter table coach_camps add column if not exists region        text;
alter table coach_camps add column if not exists surface       text;
alter table coach_camps add column if not exists courts        integer;
alter table coach_camps add column if not exists board         text;
alter table coach_camps add column if not exists daily_rhythm  text;
alter table coach_camps add column if not exists description   text;
alter table coach_camps add column if not exists confirmed     boolean default false;
alter table coach_camps add column if not exists collected     numeric default 0;
alter table coach_camps add column if not exists itinerary     jsonb;   -- [{day,date,focus,did,nextAction,effort}]
alter table coach_camps add column if not exists equipment     jsonb;   -- ["Ball baskets x4", ...]
alter table coach_camps add column if not exists objectives    jsonb;   -- ["Every attendee adds…", ...]

-- Attendees, linked to the roster where possible so packs pull real data.
create table if not exists coach_camp_attendees (
  id          uuid default gen_random_uuid() primary key,
  coach_id    uuid not null references auth.users(id) on delete cascade,
  camp_id     uuid not null references coach_camps(id) on delete cascade,
  player_id   uuid references coach_players(id) on delete set null,
  player_name text not null,
  paid        boolean default false,
  created_at  timestamptz default now()
);
create index if not exists idx_camp_attendees_camp on coach_camp_attendees(camp_id);

alter table coach_camp_attendees enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'coach_camp_attendees' and policyname = 'coach_camp_attendees_owner') then
    create policy coach_camp_attendees_owner on coach_camp_attendees
      for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
  end if;
end $$;
