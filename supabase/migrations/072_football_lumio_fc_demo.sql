-- ═══════════════════════════════════════════════════════════════════════════════
-- 072: Rebrand lumio-dev → Lumio FC, add lumio-dev-afc (AFC Wimbledon) clone
-- ═══════════════════════════════════════════════════════════════════════════════

update football_clubs
set name = 'Lumio FC',
    short_name = 'LFC',
    primary_colour = '#6C63FF',
    secondary_colour = '#FFFFFF',
    league = 'Sky Bet League One',
    logo_url = null
where slug = 'lumio-dev';

insert into football_clubs (slug, name, short_name, logo_url, primary_colour, secondary_colour, league, team_id_api_football)
values ('lumio-dev-afc', 'AFC Wimbledon', 'AFCW', null, '#0033A0', '#FFD700', 'Sky Bet League One', 663)
on conflict (slug) do nothing;

-- Clone players from lumio-dev → lumio-dev-afc, mapping old→new ids via temp table.
do $$
declare
  src_club uuid;
  dst_club uuid;
begin
  select id into src_club from football_clubs where slug = 'lumio-dev';
  select id into dst_club from football_clubs where slug = 'lumio-dev-afc';

  if not exists (select 1 from football_players where club_id = dst_club) then
    create temporary table _player_map (old_id uuid, new_id uuid, name text) on commit drop;

    with inserted as (
      insert into football_players (club_id, name, position, squad_number, nationality, date_of_birth, photo_url, status, injury_details, return_date)
      select dst_club, name, position, squad_number, nationality, date_of_birth, photo_url, status, injury_details, return_date
      from football_players
      where club_id = src_club
      returning id, name
    )
    insert into _player_map (old_id, new_id, name)
    select op.id, ip.id, ip.name
    from inserted ip
    join football_players op on op.club_id = src_club and op.name = ip.name;

    insert into football_contracts (player_id, club_id, start_date, end_date, weekly_wage, release_clause, option_to_extend)
    select pm.new_id, dst_club, c.start_date, c.end_date, c.weekly_wage, c.release_clause, c.option_to_extend
    from football_contracts c
    join _player_map pm on pm.old_id = c.player_id
    where c.club_id = src_club;
  end if;

  if not exists (select 1 from football_fixtures where club_id = dst_club) then
    insert into football_fixtures (club_id, opponent, venue, competition, kickoff_time, result_home, result_away)
    select dst_club, opponent, venue, competition, kickoff_time, result_home, result_away
    from football_fixtures
    where club_id = src_club;
  end if;

  if not exists (select 1 from football_finance where id = dst_club) then
    insert into football_finance (id, wage_budget_total, wage_budget_used, transfer_budget, transfer_budget_used)
    select dst_club, wage_budget_total, wage_budget_used, transfer_budget, transfer_budget_used
    from football_finance
    where id = src_club;
  end if;
end $$;
