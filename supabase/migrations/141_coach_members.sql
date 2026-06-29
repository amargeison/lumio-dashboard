-- Student/parent + sub-coach access. A membership binds a separate auth user to a
-- head coach's academy with a role and a tight scope. Sub-users get NO direct
-- access to coach_* tables (those stay head-owner-only); their data is served
-- only through scoped server routes that read this table. Lockdown by default.
create table if not exists coach_members (
  id              uuid primary key default gen_random_uuid(),
  academy_id      uuid not null references auth.users(id) on delete cascade,  -- the head coach
  member_user_id  uuid references auth.users(id) on delete set null,          -- bound on first sign-in
  email           text not null,
  role            text not null check (role in ('coach','parent','student')),
  scope_player_id uuid,            -- parent/student: the ONE player they may see
  scope_coach_name text,           -- coach: the assigned_coach value their data is filtered to
  status          text default 'invited',   -- invited | active | revoked
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (academy_id, email)   -- email is stored lower-cased by the app
);

create index if not exists idx_coach_members_user on coach_members(member_user_id);
create index if not exists idx_coach_members_email on coach_members(lower(email));

alter table coach_members enable row level security;
do $$ begin
  -- Head coach manages their own academy's memberships.
  if not exists (select 1 from pg_policies where tablename='coach_members' and policyname='coach_members_head') then
    create policy coach_members_head on coach_members using (academy_id = auth.uid()) with check (academy_id = auth.uid());
  end if;
  -- A member may read only their own membership row.
  if not exists (select 1 from pg_policies where tablename='coach_members' and policyname='coach_members_self') then
    create policy coach_members_self on coach_members for select using (member_user_id = auth.uid());
  end if;
end $$;
