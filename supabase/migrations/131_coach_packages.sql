-- Payments & Packages goes live: a coach-editable package price list
-- (coach_packages) and per-player lesson packs (coach_payments) that track
-- sessions used vs the pack total and when they renew.

create table if not exists coach_packages (
  id          uuid default gen_random_uuid() primary key,
  coach_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  kind        text,                 -- Private | Performance | Adult | Group | Cardio
  price       numeric,
  sessions    integer,
  period      text,                 -- "per pack", "per month", "per term"
  description text,
  features    text,                 -- newline-separated bullet list
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_coach_packages_coach on coach_packages(coach_id);

-- Per-player lesson pack tracking (item = plan name, amount = price).
alter table coach_payments add column if not exists sessions_used  integer default 0;
alter table coach_payments add column if not exists sessions_total integer;
alter table coach_payments add column if not exists renews_date    date;

alter table coach_packages enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'coach_packages' and policyname = 'coach_packages_owner') then
    create policy coach_packages_owner on coach_packages
      for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
  end if;
end $$;
