-- 223_impact_cpd.sql
-- Staff CPD per school, for the "Staff confidence & CPD" readiness criterion.
-- Impact-owned and additive: nothing is dropped and no other table is touched.
create table if not exists tp_cpd (
  id          uuid primary key default gen_random_uuid(),
  hq_id       uuid not null references auth.users(id) on delete cascade,
  school_id   uuid not null references tp_schools(id) on delete cascade,
  staff_name  text not null,     -- usually a teacher, so not a tp_staff row
  course      text not null,
  cpd_date    date,
  provider    text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_tp_cpd_hq on tp_cpd(hq_id);
create index if not exists idx_tp_cpd_school on tp_cpd(school_id);

alter table tp_cpd enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tp_cpd' and policyname = 'tp_cpd_hq') then
    create policy tp_cpd_hq on tp_cpd for all to authenticated using (hq_id = auth.uid()) with check (hq_id = auth.uid());
  end if;
end $$;
