-- Page view analytics (cookieless, privacy-first)
-- Writer: /api/analytics/pageview (service role)
-- Reader: /api/admin/analytics     (service role, admin-gated)

create table if not exists page_views (
  id             bigserial primary key,
  created_at     timestamptz not null default now(),
  path           text not null,
  full_url       text,
  referrer       text,
  referrer_host  text,
  session_hash   text not null,
  country        text,
  region         text,
  device_type    text,
  browser        text,
  os             text,
  bot            boolean not null default false,
  sport          text,
  slug           text,
  is_demo        boolean,
  duration_ms    integer,
  screen_size    text
);

create index if not exists page_views_created_at_idx on page_views (created_at desc);
create index if not exists page_views_path_idx       on page_views (path);
create index if not exists page_views_sport_idx      on page_views (sport) where sport is not null;
create index if not exists page_views_session_idx    on page_views (session_hash, created_at);

-- Service role bypasses RLS, so no read/write policies are needed.
-- RLS is enabled purely to deny anon / authenticated roles direct access.
alter table page_views enable row level security;
