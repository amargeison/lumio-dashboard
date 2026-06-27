-- Equipment & Kit: the "kit for each session type" grab-and-go checklists
-- (inventory itself stays in coach_equipment).
create table if not exists coach_kit_items (
  id           uuid default gen_random_uuid() primary key,
  coach_id     uuid not null references auth.users(id) on delete cascade,
  session_type text not null,         -- Private lesson | Group / squad | Cardio Tennis | Match play | Mini / red ball
  label        text not null,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);
create index if not exists idx_coach_kit_items_coach on coach_kit_items(coach_id);

alter table coach_kit_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'coach_kit_items' and policyname = 'coach_kit_items_owner') then
    create policy coach_kit_items_owner on coach_kit_items
      for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
  end if;
end $$;
