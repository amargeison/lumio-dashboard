-- HR performance reviews table
-- Stores records created by the Performance Review quick action

create table if not exists hr_performance_reviews (
  id               uuid        primary key default gen_random_uuid(),
  employee_name    text        not null,
  job_title        text        not null,
  department       text        not null,
  manager          text,
  review_type      text        not null,
  due_date         date        not null,
  review_period    text        not null,
  self_assessment  boolean     not null default true,
  peer_feedback    boolean     not null default false,
  peer_reviewers   text,
  goals            text,
  notes            text,
  status           text        not null default 'In Progress',
  created_at       timestamptz not null default now()
);

alter table hr_performance_reviews enable row level security;

create policy "hr_performance_reviews_insert" on hr_performance_reviews
  for insert to authenticated with check (true);

create policy "hr_performance_reviews_select" on hr_performance_reviews
  for select to authenticated using (true);
