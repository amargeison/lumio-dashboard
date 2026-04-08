-- 082: Fan engagement — metrics, NPS, social, season tickets, journey funnel, competitor comparison

alter table football_clubs add column if not exists avg_ticket_price numeric;
alter table football_clubs add column if not exists ground_capacity integer;
update football_clubs set avg_ticket_price = 22, ground_capacity = 9000 where slug = 'lumio-dev-afc';
update football_clubs set avg_ticket_price = 20, ground_capacity = 8500 where slug = 'lumio-dev';

create table if not exists football_fan_metrics (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  metric_date date not null,
  metric_type text not null check (metric_type in ('attendance','nps','season_ticket','social_sentiment','merchandise_sales','app_downloads','newsletter_opens')),
  value numeric not null,
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);
create index if not exists football_fan_metrics_club_idx on football_fan_metrics (club_id, metric_date desc);

create table if not exists football_nps_surveys (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  survey_date date not null,
  match_id uuid,
  match_type text,
  promoters integer not null default 0,
  passives integer not null default 0,
  detractors integer not null default 0,
  total_responses integer not null default 0,
  nps_score numeric not null default 0,
  top_positive_themes text[] not null default '{}',
  top_negative_themes text[] not null default '{}',
  verbatim_comments text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists football_nps_surveys_club_idx on football_nps_surveys (club_id, survey_date desc);

create table if not exists football_social_mentions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  mention_date date not null,
  platform text not null check (platform in ('Twitter','Instagram','Facebook','TikTok','Reddit','News')),
  mention_count integer not null default 0,
  positive_count integer not null default 0,
  negative_count integer not null default 0,
  neutral_count integer not null default 0,
  sentiment_score numeric not null default 0,
  top_keywords text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists football_social_mentions_club_idx on football_social_mentions (club_id, mention_date desc);

create table if not exists football_season_tickets (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  season text not null,
  total_sold integer not null default 0,
  total_capacity integer not null default 0,
  renewal_rate numeric not null default 0,
  new_purchasers integer not null default 0,
  lapsed_purchasers integer not null default 0,
  revenue_total numeric not null default 0,
  sale_date date,
  avg_price numeric,
  geo_local_pct numeric,
  geo_regional_pct numeric,
  geo_travelling_pct numeric,
  created_at timestamptz not null default now()
);
create index if not exists football_season_tickets_club_idx on football_season_tickets (club_id, season desc);

create table if not exists football_fan_journey (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  social_followers integer not null default 0,
  app_downloads integer not null default 0,
  newsletter_subscribers integer not null default 0,
  match_attendees integer not null default 0,
  season_ticket_holders integer not null default 0,
  recorded_at timestamptz not null default now()
);

create table if not exists football_competitor_metrics (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  competitor_name text not null,
  avg_attendance integer,
  nps_score numeric,
  social_sentiment numeric,
  season_ticket_count integer,
  notes text,
  created_at timestamptz not null default now()
);

-- ─── DEMO SEED FOR lumio-dev-afc ──────────────────────────────────────────
do $$
declare
  afc uuid;
  d date;
  i integer;
begin
  select id into afc from football_clubs where slug = 'lumio-dev-afc';
  if afc is null then return; end if;

  -- 20 weeks of attendance + sentiment metrics (weekly)
  for i in 0..19 loop
    d := current_date - (i * 7);
    insert into football_fan_metrics (club_id, metric_date, metric_type, value, source)
      values (afc, d, 'attendance', 3800 + (random() * 900)::int + (i * 12), 'csv_import');
    insert into football_fan_metrics (club_id, metric_date, metric_type, value, source)
      values (afc, d, 'social_sentiment', 35 + (random() * 35)::int + (i * 1.2), 'api');
    insert into football_fan_metrics (club_id, metric_date, metric_type, value, source)
      values (afc, d, 'newsletter_opens', 1200 + (random() * 400)::int, 'api');
  end loop;

  -- 6 NPS surveys
  insert into football_nps_surveys (club_id, survey_date, match_type, promoters, passives, detractors, total_responses, nps_score, top_positive_themes, top_negative_themes, verbatim_comments) values
    (afc, current_date - 140, 'Home League', 95, 70, 60, 225, 15.6, array['matchday atmosphere','pre-match entertainment'], array['food queues','wifi'], array['Great atmosphere as always','Food queues were terrible']),
    (afc, current_date - 105, 'Home League', 110, 75, 50, 235, 25.5, array['atmosphere','team performance'], array['ticket prices','food queues'], array['Loved the new chants','Cheaper tickets please']),
    (afc, current_date - 70, 'Away Cup',  85, 65, 70, 220, 6.8, array['away travel coordination'], array['ticket allocation','away end view'], array['Ticket allocation too small']),
    (afc, current_date - 42, 'Home League', 130, 70, 45, 245, 34.7, array['team form','manager interviews'], array['concourse cleanliness'], array['Great win!','Concourse needs cleaning']),
    (afc, current_date - 21, 'Home League', 145, 65, 40, 250, 42.0, array['team form','wins','academy players'], array['parking'], array['Best season in years','Parking nightmare']),
    (afc, current_date - 7,  'Home League', 160, 60, 30, 250, 52.0, array['promotion push','academy graduates','atmosphere'], array['parking','concession prices'], array['Title race ON','Promotion fever']);

  -- 20 weeks across 5 platforms
  for i in 0..19 loop
    d := current_date - (i * 7);
    insert into football_social_mentions (club_id, mention_date, platform, mention_count, positive_count, negative_count, neutral_count, sentiment_score, top_keywords) values
      (afc, d, 'Twitter',   180 + (random() * 60)::int, 110 + (random() * 30)::int, 25 + (random() * 15)::int, 40 + (random() * 15)::int, 45 + (i * 1.0), array['promotion','marcus browne','great win','atmosphere']),
      (afc, d, 'Instagram', 120 + (random() * 50)::int,  90 + (random() * 25)::int, 10 + (random() * 8)::int,  20 + (random() * 10)::int, 60 + (i * 1.2), array['matchday','academy','dele adeyemi']),
      (afc, d, 'Facebook',   80 + (random() * 30)::int,  50 + (random() * 15)::int, 12 + (random() * 8)::int,  18 + (random() * 8)::int,  35 + (i * 0.8), array['away travel','tickets','jamie torres']),
      (afc, d, 'TikTok',    220 + (random() * 80)::int, 170 + (random() * 30)::int, 15 + (random() * 10)::int, 35 + (random() * 12)::int, 70 + (i * 0.9), array['goals','celebrations','academy']),
      (afc, d, 'Reddit',     45 + (random() * 20)::int,  25 + (random() * 10)::int,  8 + (random() * 6)::int,  12 + (random() * 6)::int,  25 + (i * 1.0), array['tactics','transfers','manager']);
  end loop;

  -- 3 seasons of season tickets
  insert into football_season_tickets (club_id, season, total_sold, total_capacity, renewal_rate, new_purchasers, lapsed_purchasers, revenue_total, sale_date, avg_price, geo_local_pct, geo_regional_pct, geo_travelling_pct) values
    (afc, '2022/23', 1620, 4000, 74.0, 220, 180, 712800, current_date - 800, 440, 62, 28, 10),
    (afc, '2023/24', 1840, 4000, 78.0, 280, 160, 846400, current_date - 440, 460, 60, 30, 10),
    (afc, '2024/25', 2100, 4000, 82.0, 320, 140, 987000, current_date - 80, 470, 58, 32, 10);

  -- Fan journey
  insert into football_fan_journey (club_id, social_followers, app_downloads, newsletter_subscribers, match_attendees, season_ticket_holders) values
    (afc, 48000, 12500, 8200, 4200, 2100);

  -- 2 competitor rows
  insert into football_competitor_metrics (club_id, competitor_name, avg_attendance, nps_score, social_sentiment, season_ticket_count, notes) values
    (afc, 'Stockport County', 5800, 38, 55, 2400, 'Local rival'),
    (afc, 'Charlton Athletic', 14500, 41, 48, 6500, 'Higher tier crowd');
end $$;
