create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  country text,
  region text,
  status text not null default 'Active',
  tier text,
  notes text,
  created_at timestamptz not null default now()
);

alter table partners enable row level security;

drop policy if exists "partners_insert" on partners;
drop policy if exists "partners_select" on partners;

create policy "partners_insert" on partners
  for insert to authenticated with check (true);

create policy "partners_select" on partners
  for select to authenticated using (true);

-- Storage bucket for partner files (run manually in Supabase Dashboard if SQL editor lacks storage permissions)
-- insert into storage.buckets (id, name, public) values ('partner-files', 'partner-files', false)
-- on conflict (id) do nothing;
