-- 081: Match Report Templates

create table if not exists football_report_templates (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references football_clubs(id) on delete cascade,
  template_name text not null,
  template_type text not null check (template_type in (
    'Board Report','Media Release','Internal Summary','Player Report','Fan Newsletter'
  )),
  sections jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists football_report_templates_club_idx
  on football_report_templates (club_id);

alter table football_match_reports
  add column if not exists template_id uuid references football_report_templates(id),
  add column if not exists published_at timestamptz,
  add column if not exists published_to text[],
  add column if not exists word_count integer,
  add column if not exists edited_content jsonb,
  add column if not exists version integer default 1;

alter table football_report_templates enable row level security;

-- Seed templates and historical reports
do $$
declare
  v_club_id uuid;
  v_board_id uuid;
begin
  select id into v_club_id from football_clubs where slug = 'lumio-dev-afc' limit 1;
  if v_club_id is null then return; end if;

  if exists (select 1 from football_report_templates where club_id = v_club_id) then
    return;
  end if;

  insert into football_report_templates (club_id, template_name, template_type, sections, is_default)
  values (v_club_id, 'Board Match Report', 'Board Report',
    '[
      {"id":"narrative","title":"Match Narrative","type":"narrative","enabled":true,"order":1},
      {"id":"stats","title":"Key Statistics","type":"stats_table","enabled":true,"order":2},
      {"id":"ratings","title":"Player Ratings","type":"player_ratings","enabled":true,"order":3},
      {"id":"timeline","title":"Key Moments","type":"timeline","enabled":true,"order":4},
      {"id":"quote","title":"Manager Quote","type":"quote","enabled":true,"order":5}
    ]'::jsonb, true)
  returning id into v_board_id;

  insert into football_report_templates (club_id, template_name, template_type, sections, is_default)
  values (v_club_id, 'Media Press Release', 'Media Release',
    '[
      {"id":"narrative","title":"Match Report","type":"narrative","enabled":true,"order":1},
      {"id":"quote","title":"Manager Reaction","type":"quote","enabled":true,"order":2},
      {"id":"image","title":"Match Photo","type":"image_placeholder","enabled":true,"order":3}
    ]'::jsonb, false);

  insert into football_report_templates (club_id, template_name, template_type, sections, is_default)
  values (v_club_id, 'Internal Summary', 'Internal Summary',
    '[
      {"id":"stats","title":"Statistics","type":"stats_table","enabled":true,"order":1},
      {"id":"ratings","title":"Performance Ratings","type":"player_ratings","enabled":true,"order":2},
      {"id":"narrative","title":"Coach Notes","type":"narrative","enabled":true,"order":3}
    ]'::jsonb, false);

  -- Historical reports
  insert into football_match_reports
    (club_id, match_date, opponent, venue, competition, our_score, opponent_score, our_formation, opponent_formation, report_data, approved, approved_at, template_id, word_count, version)
  values
  (v_club_id, current_date - interval '14 days', 'Exeter City', 'Home', 'EFL League One', 3, 1, '4-3-3', '4-2-3-1',
   '{"headline":"Clinical Lumio FC sweep aside Exeter","result":"Win","matchSummary":"A confident home performance saw Lumio FC dispatch Exeter City 3-1 with goals in either half and a dominant midfield display.","firstHalfSummary":"Lumio took early control through high pressing and went two ahead by the 35th minute.","secondHalfSummary":"Exeter pulled one back on the hour but a late third sealed the points.","keyMoments":[{"minute":12,"type":"Goal","description":"Header from corner","player":"Reid"},{"minute":35,"type":"Goal","description":"Counter-attack finish","player":"Cole"},{"minute":62,"type":"Goal","description":"Penalty conceded","player":"Exeter"},{"minute":84,"type":"Goal","description":"Tap-in from cross","player":"Webb"}],"playerRatings":[{"name":"Daniel Reid","position":"GK","rating":7.5,"comment":"Commanding presence"},{"name":"Marcus Webb","position":"CM","rating":8.2,"comment":"Box to box engine"},{"name":"Jamie Cole","position":"LB","rating":7.8,"comment":"Provided width"}],"manOfTheMatch":{"name":"Marcus Webb","rating":8.5,"reason":"Controlled the midfield and capped his display with a goal."},"tacticalAnalysis":"The 4-3-3 high-press disrupted Exeters build-up and forced turnovers in dangerous areas.","managerQuote":"Im delighted with the response from the lads — that was a complete performance.","lookingAhead":"Attention turns to a tough away trip next weekend.","performanceRating":8}'::jsonb,
   true, now() - interval '13 days', v_board_id, 180, 1),
  (v_club_id, current_date - interval '7 days', 'Bristol Rovers', 'Away', 'EFL League One', 0, 0, '4-3-3', '4-4-2',
   '{"headline":"Goalless stalemate at the Memorial Stadium","result":"Draw","matchSummary":"A hard-fought 0-0 draw away to Bristol Rovers in difficult conditions.","firstHalfSummary":"Both sides cancelled each other out in a cagey opening 45.","secondHalfSummary":"Half-chances at both ends but neither keeper was seriously tested.","keyMoments":[{"minute":22,"type":"Save","description":"Reid tipped over","player":"Reid"},{"minute":58,"type":"Yellow Card","description":"Late challenge","player":"Webb"},{"minute":77,"type":"Chance","description":"Header off the bar","player":"Cole"}],"playerRatings":[{"name":"Daniel Reid","position":"GK","rating":7.0,"comment":"Reliable"},{"name":"Marcus Webb","position":"CM","rating":6.8,"comment":"Industrious"}],"manOfTheMatch":{"name":"Daniel Reid","rating":7.2,"reason":"Two important saves kept the away point intact."},"tacticalAnalysis":"A pragmatic 4-3-3 setup prioritised defensive shape over attacking risk.","managerQuote":"A point on the road is never to be sniffed at.","lookingAhead":"We refocus for Stockport at home.","performanceRating":6}'::jsonb,
   true, now() - interval '6 days', v_board_id, 165, 1),
  (v_club_id, current_date - interval '2 days', 'Stockport County', 'Away', 'EFL League One', 1, 2, '4-3-3', '3-5-2',
   '{"headline":"Late Stockport sucker punch sinks Lumio","result":"Loss","matchSummary":"Lumio FC suffered a frustrating 2-1 defeat at Edgeley Park despite leading at the break.","firstHalfSummary":"A fine team move saw Webb open the scoring on 28 minutes.","secondHalfSummary":"Stockport equalised on 60 and snatched a 89th-minute winner from a corner.","keyMoments":[{"minute":28,"type":"Goal","description":"Curled finish","player":"Webb"},{"minute":60,"type":"Goal","description":"Tap-in","player":"Stockport"},{"minute":89,"type":"Goal","description":"Header from corner","player":"Stockport"},{"minute":92,"type":"Yellow Card","description":"Frustration foul","player":"Cole"}],"playerRatings":[{"name":"Marcus Webb","position":"CM","rating":7.8,"comment":"Took his goal well"},{"name":"Daniel Reid","position":"GK","rating":6.5,"comment":"Could do better with the winner"},{"name":"Jamie Cole","position":"LB","rating":6.0,"comment":"Off the pace late on"}],"manOfTheMatch":{"name":"Marcus Webb","rating":7.8,"reason":"The lone bright spot — controlled midfield and scored."},"tacticalAnalysis":"Set-piece weakness exposed again — both Stockport goals from dead balls.","managerQuote":"It hurts. We have to learn from these moments and be more ruthless.","lookingAhead":"Back to training Monday — Wrexham at home awaits.","performanceRating":5}'::jsonb,
   true, now() - interval '1 days', v_board_id, 195, 1);
end $$;
