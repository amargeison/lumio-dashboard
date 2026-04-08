-- 085: Club branding (white-label)

alter table football_clubs
  add column if not exists accent_colour text,
  add column if not exists text_on_primary text default '#FFFFFF',
  add column if not exists text_on_secondary text default '#000000',
  add column if not exists kit_home_colour text,
  add column if not exists kit_away_colour text,
  add column if not exists font_preference text default 'Inter'
    check (font_preference in ('Inter','Roboto','Poppins','Montserrat','Lato')),
  add column if not exists badge_shape text default 'shield'
    check (badge_shape in ('shield','circle','crest','square','hexagon')),
  add column if not exists dark_mode_only boolean default true;

update football_clubs set
  primary_colour    = '#6C63FF',
  secondary_colour  = '#FFFFFF',
  accent_colour     = '#F59E0B',
  text_on_primary   = '#FFFFFF',
  text_on_secondary = '#1a1a2e',
  kit_home_colour   = '#6C63FF',
  kit_away_colour   = '#FFFFFF'
where slug = 'lumio-dev';

update football_clubs set
  primary_colour    = '#0033A0',
  secondary_colour  = '#FFD700',
  accent_colour     = '#FFFFFF',
  text_on_primary   = '#FFFFFF',
  text_on_secondary = '#0033A0',
  kit_home_colour   = '#0033A0',
  kit_away_colour   = '#FFD700'
where slug = 'lumio-dev-afc';
