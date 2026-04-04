create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  portal_type text not null default 'business',
  slug text,
  title text not null,
  body text,
  type text default 'info',
  category text,
  read boolean default false,
  action_url text,
  action_label text,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Users see own notifications"
  on notifications for all
  using (auth.uid() = user_id);
