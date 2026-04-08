-- 084: Tier/feature gates

do $$ begin
  create type club_tier as enum ('starter', 'professional', 'elite', 'enterprise');
exception when duplicate_object then null; end $$;

alter table football_clubs add column if not exists tier club_tier default 'starter';
alter table football_clubs add column if not exists tier_expires_at timestamptz;
alter table football_clubs add column if not exists trial_ends_at timestamptz;
alter table football_clubs add column if not exists avg_ticket_price numeric default 25;

create table if not exists football_tier_features (
  id uuid primary key default gen_random_uuid(),
  feature_key text unique not null,
  feature_name text not null,
  feature_description text,
  min_tier club_tier not null,
  category text not null check (category in ('data','ai','integrations','reporting','analytics','commercial')),
  icon text,
  created_at timestamptz not null default now()
);

insert into football_tier_features (feature_key, feature_name, feature_description, min_tier, category, icon) values
  -- STARTER
  ('squad_management','Squad Management','Squad & player profiles','starter','data','👥'),
  ('basic_fixtures','Fixtures & Results','Fixture list & results','starter','data','📅'),
  ('basic_insights','Dashboard Insights','Basic dashboard insights','starter','analytics','📊'),
  ('csv_gps_upload','CSV GPS Upload','CSV GPS upload','starter','data','📁'),
  ('ai_press_conference','AI Press Conference','AI press conference briefing','starter','ai','🎙️'),
  ('match_reports','Match Reports','Match report builder','starter','reporting','📋'),
  ('fan_hub_basic','Fan Hub (Basic)','Fan Hub manual data entry','starter','analytics','👥'),
  ('club_import_wizard','Club Import Wizard','Club data import wizard','starter','data','📥'),
  -- PROFESSIONAL
  ('api_football_live','API-Football Live Data','API-Football live data','professional','integrations','⚡'),
  ('ai_transfer_researcher','AI Transfer Researcher','AI transfer researcher','professional','ai','🔍'),
  ('ai_opposition_report','AI Opposition Report','AI opposition report','professional','ai','🎯'),
  ('ai_post_match','AI Post-Match Analysis','AI post-match analysis','professional','ai','📋'),
  ('transfer_pipeline','Transfer Pipeline','Transfer pipeline Kanban','professional','commercial','💼'),
  ('training_planner','Training Planner','Training load planner','professional','analytics','🏃'),
  ('fan_hub_advanced','Fan Hub Advanced','Fan Hub advanced analytics','professional','analytics','📈'),
  ('board_suite','Board Suite','Board suite & director reports','professional','reporting','👔'),
  ('pdf_export','PDF Export','PDF export on all dashboards','professional','reporting','📄'),
  ('white_label','White-Label','White-label club branding','professional','commercial','🎨'),
  -- ELITE
  ('gps_hardware_catapult','Catapult OpenField','Catapult OpenField API','elite','integrations','📡'),
  ('gps_hardware_statsports','STATSports Sonra','STATSports Sonra API','elite','integrations','📡'),
  ('opta_integration','Opta','Opta data integration','elite','integrations','📊'),
  ('statsbomb_integration','StatsBomb','StatsBomb integration','elite','integrations','⚽'),
  ('wyscout_integration','Wyscout','Wyscout player database','elite','integrations','🔎'),
  ('club_comparison','Club Comparison','Club comparison tool','elite','analytics','⚖️'),
  ('advanced_ai_scouting','AI Scouting Network','AI scouting network','elite','ai','🌐'),
  ('custom_reporting','Custom Reporting','Custom report templates','elite','reporting','📑'),
  -- ENTERPRISE
  ('multi_club','Multi-Club Management','Multi-club management','enterprise','commercial','🏢'),
  ('api_access','Public API Access','Lumio public API access','enterprise','data','🔌'),
  ('custom_integrations','Custom Integrations','Bespoke integrations','enterprise','integrations','🛠️'),
  ('dedicated_support','Dedicated Support','Dedicated success manager','enterprise','commercial','🤝'),
  ('data_warehouse','Data Warehouse','Data warehouse export','enterprise','data','🗄️')
on conflict (feature_key) do nothing;

update football_clubs set tier = 'elite' where slug = 'lumio-dev-afc';
update football_clubs set tier = 'professional' where slug = 'lumio-dev';
