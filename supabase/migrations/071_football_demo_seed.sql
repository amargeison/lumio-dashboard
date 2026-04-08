-- ═══════════════════════════════════════════════════════════════════════════════
-- 071: Football demo seed — AFC Wimbledon (slug: lumio-dev)
-- Mirrors the existing SQUAD/CONTRACT_DATA/FIXTURES constants in
-- src/app/(football)/football/[slug]/page.tsx
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Club ───────────────────────────────────────────────────────────────────

insert into football_clubs (slug, name, short_name, logo_url, primary_colour, secondary_colour, league, team_id_api_football)
values ('lumio-dev', 'AFC Wimbledon', 'AFCW', null, '#003DA5', '#F1C40F', 'League One', 663);

-- ─── Players (21) ───────────────────────────────────────────────────────────

insert into football_players (club_id, name, position, squad_number, nationality, date_of_birth, status)
select id, name, position, squad_number, nationality, date_of_birth::date, status
from (values
  -- Goalkeepers
  ('Nathan Bishop',       'GK',  1,  'England', '1999-10-15', 'fit'),
  ('Joe McDonnell',       'GK',  20, 'England', '1994-05-20', 'fit'),
  -- Defenders
  ('Steve Seddon',        'DEF', 3,  'England', '1997-11-26', 'fit'),
  ('Ryan Johnson',        'DEF', 6,  'Ireland', '1996-07-04', 'fit'),
  ('Patrick Bauer',       'DEF', 15, 'Germany', '1992-10-28', 'fit'),
  ('Isaac Ogundere',      'DEF', 33, 'England', '2002-09-12', 'fit'),
  ('Joe Lewis',           'DEF', 31, 'Wales',   '1999-08-15', 'fit'),
  ('Nathan Asiimwe',      'DEF', 2,  'Uganda',  '2004-03-22', 'fit'),
  ('Brodi Hughes',        'DEF', 17, 'England', '2004-11-08', 'doubt'),
  -- Midfielders
  ('Callum Maycock',      'MID', 8,  'England', '1997-12-05', 'fit'),
  ('Jake Reeves',         'MID', 4,  'England', '1993-06-04', 'fit'),
  ('Alistair Smith',      'MID', 12, 'England', '1999-04-18', 'fit'),
  ('Sam Hutchinson',      'MID', 5,  'England', '1989-08-03', 'fit'),
  ('Myles Hippolyte',     'MID', 21, 'Grenada', '1994-11-05', 'fit'),
  ('Zack Nelson',         'MID', 37, 'England', '2005-01-12', 'fit'),
  ('Delano McCoy-Splatt', 'MID', 16, 'England', '2004-07-30', 'fit'),
  ('James Tilley',        'MID', 19, 'England', '1998-09-21', 'fit'),
  -- Forwards
  ('Marcus Browne',       'FWD', 11, 'England', '1997-12-18', 'fit'),
  ('Mathew Stevens',      'FWD', 10, 'Wales',   '1999-02-15', 'fit'),
  ('Omar Bugiel',         'FWD', 9,  'Lebanon', '1995-04-19', 'injured'),
  ('Antwoine Hackford',   'FWD', 18, 'England', '2003-08-11', 'fit')
) as p(name, position, squad_number, nationality, date_of_birth, status)
cross join (select id from football_clubs where slug = 'lumio-dev') as c;

-- Update injury details for Bugiel
update football_players
set injury_details = 'Calf strain — Rehabilitation phase. 4 matches missed since Mar 2026.',
    return_date = '2026-04-30'
where name = 'Omar Bugiel'
  and club_id = (select id from football_clubs where slug = 'lumio-dev');

-- ─── Contracts (21) ─────────────────────────────────────────────────────────

insert into football_contracts (player_id, club_id, start_date, end_date, weekly_wage, option_to_extend)
select p.id, p.club_id, '2023-07-01'::date, c.end_date::date, c.weekly_wage, false
from football_players p
join (values
  ('Nathan Bishop',        '2027-06-30',  3500),
  ('Joe McDonnell',        '2026-06-30',  2800),
  ('Steve Seddon',         '2027-06-30',  4200),
  ('Ryan Johnson',         '2027-06-30',  3800),
  ('Patrick Bauer',        '2026-06-30',  3500),
  ('Isaac Ogundere',       '2027-06-30',  3000),
  ('Joe Lewis',            '2026-06-30',  2500),
  ('Nathan Asiimwe',       '2026-06-30',  2200),
  ('Brodi Hughes',         '2026-06-30',  2000),
  ('Callum Maycock',       '2027-06-30',  4000),
  ('Jake Reeves',          '2026-06-30',  4500),
  ('Alistair Smith',       '2027-06-30',  4000),
  ('Sam Hutchinson',       '2026-06-30',  3200),
  ('Myles Hippolyte',      '2026-06-30',  4000),
  ('Zack Nelson',          '2026-06-30',  1800),
  ('Delano McCoy-Splatt',  '2027-06-30',  1500),
  ('James Tilley',         '2026-06-30',  3500),
  ('Marcus Browne',        '2027-06-30',  5500),
  ('Mathew Stevens',       '2026-06-30',  5500),
  ('Omar Bugiel',          '2026-06-30',  5000),
  ('Antwoine Hackford',    '2027-06-30',  3200)
) as c(player_name, end_date, weekly_wage)
  on p.name = c.player_name
where p.club_id = (select id from football_clubs where slug = 'lumio-dev');

-- ─── Fixtures (5 upcoming) ──────────────────────────────────────────────────

insert into football_fixtures (club_id, opponent, venue, competition, kickoff_time)
select id, opponent, venue, 'League One', kickoff::timestamptz
from (values
  ('Stockport County',     'Away', '2026-04-05 15:00:00+01'),
  ('Huddersfield Town',    'Home', '2026-04-12 15:00:00+01'),
  ('Peterborough United',  'Away', '2026-04-18 19:45:00+01'),
  ('Cardiff City',         'Home', '2026-04-21 15:00:00+01'),
  ('Reading',              'Away', '2026-04-26 15:00:00+01')
) as f(opponent, venue, kickoff)
cross join (select id from football_clubs where slug = 'lumio-dev') as c;

-- ─── Finance ────────────────────────────────────────────────────────────────

insert into football_finance (id, wage_budget_total, wage_budget_used, transfer_budget, transfer_budget_used)
select id, 10400000, 9724000, 4200000, 1850000
from football_clubs where slug = 'lumio-dev';
