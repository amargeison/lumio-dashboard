'use client'
import { useRef, useState, useCallback } from 'react'

export type FootballCommandResult = { command: string; action: string; response: string; data?: Record<string, any> }

const PLAYERS = [
  { name: 'Walker', fullName: 'James Walker', pos: 'GK' },
  { name: 'Henderson', fullName: 'Callum Henderson', pos: 'RB' },
  { name: 'Martinez', fullName: 'Diego Martinez', pos: 'CB' },
  { name: 'O\'Brien', fullName: 'Sean O\'Brien', pos: 'LW' },
  { name: 'Santos', fullName: 'Lucas Santos', pos: 'ST' },
  { name: 'Thompson', fullName: 'Ryan Thompson', pos: 'CM' },
]

function findPlayer(text: string) { return PLAYERS.find(p => text.toLowerCase().includes(p.name.toLowerCase())) }

const CMDS: { patterns: RegExp[]; action: string; response: (m: RegExpMatchArray, t: string) => string; data?: (m: RegExpMatchArray, t: string) => Record<string, any> }[] = [
  // ─── EXISTING COMMANDS ────────────────────────────────────────────────────────
  { patterns: [/play.*brief/i, /morning brief/i], action: 'PLAY_BRIEFING', response: () => 'Starting your morning briefing now.' },
  { patterns: [/^stop$/i, /^pause$/i], action: 'STOP_AUDIO', response: () => 'Stopping.' },
  { patterns: [/who.*fit/i, /squad availability/i, /who.*available/i], action: 'SQUAD_FIT', response: () => '21 players are fit for selection. 3 injured: Martinez, O\'Brien, Santos. Thompson is suspended.' },
  { patterns: [/log injury/i, /injury for (\w+)/i, /(\w+).*injured/i], action: 'LOG_INJURY', response: (_m, t) => { const p = findPlayer(t); return p ? `Opening injury log for ${p.fullName}.` : 'Opening the injury log.' } },
  { patterns: [/transfer budget/i, /budget remaining/i, /how much.*spend/i], action: 'TRANSFER_BUDGET', response: () => 'Transfer budget: £4.2 million remaining of £8 million. Two active targets totalling £3.1 million.' },
  { patterns: [/agent message/i, /any.*agent/i], action: 'AGENT_MESSAGES', response: () => 'You have 3 agent messages today. 1 urgent from Stellar Group regarding Martinez contract.' },
  { patterns: [/target list/i, /show.*targets/i, /transfer targets/i], action: 'TARGET_LIST', response: () => 'Opening the transfer target list. 2 active targets: a left-back from Genk and a midfielder from Braga.' },
  { patterns: [/book.*video/i, /analysis room/i], action: 'BOOK_VIDEO', response: () => 'Video analysis room booked for 10am tomorrow.' },
  { patterns: [/call (\w+)/i, /phone (\w+)/i, /ring (\w+)/i], action: 'PHONE_CALL', response: (_m, t) => `Calling ${t.match(/(?:call|phone|ring)\s+(\w+)/i)?.[1] || 'contact'} now.` },
  { patterns: [/press conference/i, /presser/i], action: 'PRESS_CONF', response: () => 'Press conference is at 2pm today in the media suite. AI briefing notes are ready.' },
  { patterns: [/window clos/i, /days.*window/i, /transfer window/i], action: 'WINDOW_CLOSES', response: () => 'The transfer window closes in 11 days. Two targets are in active negotiation.' },
  { patterns: [/match.*doubt/i, /flag.*doubt/i, /doubt for/i], action: 'MATCH_DOUBT', response: (_m, t) => { const p = findPlayer(t); return p ? `${p.fullName} flagged as match-day doubt.` : 'Who would you like to flag?' } },
  { patterns: [/board report/i, /generate.*report/i], action: 'BOARD_REPORT', response: () => 'Generating board report now. Includes squad status, transfer activity, and financial summary.' },
  { patterns: [/team sheet/i, /lineup/i], action: 'TEAM_SHEET', response: () => 'Opening team sheet builder for Saturday\'s match.' },
  { patterns: [/training plan/i, /today.*training/i], action: 'TRAINING', response: () => 'Today\'s training: tactical session at 10am, set pieces at 11:30. Recovery group in the gym.' },
  { patterns: [/match report/i, /last.*result/i], action: 'MATCH_REPORT', response: () => 'Last match: Oakridge FC 2-1 Riverside United. Goals from Santos and Thompson. xG 1.8 vs 0.9.' },
  { patterns: [/scout report/i], action: 'SCOUT_REPORT', response: () => 'Opening scout report form. 3 reports submitted this week.' },
  { patterns: [/contract.*expir/i, /renewal/i], action: 'CONTRACTS', response: () => '4 contracts expiring in June. Martinez renewal is flagged urgent — board approval needed.' },
  { patterns: [/what.*time/i], action: 'TELL_TIME', response: () => `It's ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` },

  // ─── SQUAD & PLAYERS ────────────────────────────────────────────────────────
  { patterns: [/show.*squad/i, /squad list/i, /squad view/i], action: 'NAVIGATE', response: () => 'Opening the squad view.', data: () => ({ dept: 'squad' }) },
  { patterns: [/how many players/i, /squad count/i, /squad size/i], action: 'SQUAD_COUNT', response: () => 'You have 25 registered players in the first team squad.' },
  { patterns: [/show.*starting eleven/i, /starting.*xi/i, /starting lineup/i], action: 'NAVIGATE', response: () => 'Opening the tactics board.', data: () => ({ dept: 'tactics' }) },
  { patterns: [/show.*bench/i, /bench players/i], action: 'NAVIGATE', response: () => 'Opening the tactics view for bench selection.', data: () => ({ dept: 'tactics' }) },
  { patterns: [/show.*goalkeepers/i, /filter.*gk/i, /show.*keepers/i], action: 'SQUAD_FILTER', response: () => 'Filtering squad to goalkeepers.' },
  { patterns: [/show.*defenders/i, /filter.*defenders/i, /show.*centre.?backs/i], action: 'SQUAD_FILTER', response: () => 'Filtering squad to defenders.' },
  { patterns: [/show.*midfielders/i, /filter.*midfield/i], action: 'SQUAD_FILTER', response: () => 'Filtering squad to midfielders.' },
  { patterns: [/show.*forwards/i, /show.*strikers/i, /filter.*attack/i], action: 'SQUAD_FILTER', response: () => 'Filtering squad to forwards.' },
  { patterns: [/show.*loan players/i, /players.*on loan/i, /loan list/i], action: 'SQUAD_FILTER', response: () => 'Filtering to loan players.' },
  { patterns: [/out of contract/i, /expiring contracts/i, /contract.*expir.*players/i], action: 'SQUAD_FILTER', response: () => 'Showing players with expiring contracts.' },
  { patterns: [/players over thirty/i, /players over 30/i, /over.?30/i], action: 'SQUAD_FILTER', response: () => 'Filtering squad to players over 30.' },
  { patterns: [/young players/i, /under.*23/i, /youth.*players/i], action: 'SQUAD_FILTER', response: () => 'Showing players under 23.' },
  { patterns: [/player ratings/i, /show.*ratings/i], action: 'NAVIGATE', response: () => 'Opening player ratings.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/highest rated player/i, /best rated/i, /top rated/i], action: 'PLAYER_INFO', response: () => 'Marcus Browne is currently the highest rated player with an average of 7.8.' },
  { patterns: [/top scorer/i, /leading scorer/i, /most goals/i], action: 'PLAYER_INFO', response: () => 'Omar Bugiel leads the scoring charts with 9 goals this season.' },
  { patterns: [/most assists/i, /assist leader/i, /who.*assists/i], action: 'PLAYER_INFO', response: () => 'Marcus Browne leads with 7 assists this season.' },
  { patterns: [/player of the month/i, /potm/i], action: 'PLAYER_INFO', response: () => 'Player of the Month for March is Marcus Browne.' },
  { patterns: [/player contracts/i, /show.*contracts/i, /contract management/i], action: 'NAVIGATE', response: () => 'Opening contract management.', data: () => ({ dept: 'transfers' }) },
  { patterns: [/squad depth/i, /depth chart/i], action: 'NAVIGATE', response: () => 'Opening the squad depth planner.', data: () => ({ dept: 'squad-planner' }) },
  { patterns: [/show.*academy/i, /academy overview/i], action: 'NAVIGATE', response: () => 'Opening the academy.', data: () => ({ dept: 'academy' }) },
  { patterns: [/add a player/i, /add player/i, /register.*player/i], action: 'ADD_PLAYER', response: () => 'Opening the add player form.' },
  { patterns: [/player availability/i, /availability list/i], action: 'NAVIGATE', response: () => 'Opening player availability.', data: () => ({ dept: 'medical' }) },
  { patterns: [/disciplinary/i, /yellow cards/i, /red cards/i], action: 'NAVIGATE', response: () => 'Opening disciplinary records.', data: () => ({ dept: 'dynamics' }) },
  { patterns: [/who is suspended/i, /any suspensions/i, /suspended players/i], action: 'PLAYER_INFO', response: () => 'No players are currently suspended.' },
  { patterns: [/player ages/i, /age profile/i, /squad ages/i], action: 'SQUAD_FILTER', response: () => 'Showing squad age profile.' },
  { patterns: [/nationality breakdown/i, /nationality distribution/i, /nationalities/i], action: 'SQUAD_FILTER', response: () => 'Showing nationality distribution.' },
  { patterns: [/homegrown players/i, /home.?grown/i], action: 'SQUAD_FILTER', response: () => 'Filtering to homegrown players.' },
  { patterns: [/player values/i, /market value/i, /squad value/i], action: 'NAVIGATE', response: () => 'Opening market value tracker.', data: () => ({ dept: 'transfers' }) },
  { patterns: [/team talks archive/i, /team talks/i], action: 'NAVIGATE', response: () => 'Opening team talks.', data: () => ({ dept: 'dynamics' }) },

  // ─── MEDICAL & FITNESS ────────────────────────────────────────────────────────
  { patterns: [/show.*medical room/i, /medical department/i, /open.*medical/i], action: 'NAVIGATE', response: () => 'Opening the medical department.', data: () => ({ dept: 'medical' }) },
  { patterns: [/injury list/i, /full.*injury/i, /injury tracker/i], action: 'NAVIGATE', response: () => 'Opening the full injury tracker.', data: () => ({ dept: 'medical' }) },
  { patterns: [/fit.*saturday/i, /fit.*weekend/i, /fit.*match/i], action: 'SQUAD_FIT', response: () => '21 players are fit for selection this Saturday.' },
  { patterns: [/long.?term injur/i, /long.?term absent/i], action: 'INJURY_INFO', response: () => 'Showing long-term injuries.' },
  { patterns: [/acwr scores/i, /acute.*chronic/i, /acwr dashboard/i], action: 'NAVIGATE', response: () => 'Opening ACWR dashboard.', data: () => ({ dept: 'performance' }) },
  { patterns: [/injury risk/i, /at risk.*injur/i, /risk of injury/i], action: 'INJURY_INFO', response: () => 'Two players have ACWR above 1.3: Browne and Seddon. Consider managing their loads.' },
  { patterns: [/readiness scores/i, /today.*readiness/i], action: 'NAVIGATE', response: () => 'Opening today\'s readiness scores.', data: () => ({ dept: 'performance' }) },
  { patterns: [/training load this week/i, /weekly.*load/i, /load.*this week/i], action: 'NAVIGATE', response: () => 'Opening weekly load tracker.', data: () => ({ dept: 'performance' }) },
  { patterns: [/mark.*fit/i, /return.*fitness/i, /player.*fit again/i], action: 'MEDICAL_ACTION', response: () => 'Opening return to fitness form.' },
  { patterns: [/physio report/i, /physio.*report/i], action: 'NAVIGATE', response: () => 'Opening the physio report.', data: () => ({ dept: 'medical' }) },
  { patterns: [/rehabilitation schedule/i, /rehab.*schedule/i, /rehab.*tracker/i], action: 'NAVIGATE', response: () => 'Opening rehabilitation tracker.', data: () => ({ dept: 'medical' }) },
  { patterns: [/muscle injur/i, /muscle.*strain/i], action: 'INJURY_INFO', response: () => 'Filtering injuries by type: muscle.' },
  { patterns: [/knee injur/i, /knee.*problem/i], action: 'INJURY_INFO', response: () => 'Filtering injuries by type: knee.' },
  { patterns: [/this season.*injur/i, /injuries this season/i, /season.*injury/i], action: 'NAVIGATE', response: () => 'Showing all injuries this season.', data: () => ({ dept: 'medical' }) },
  { patterns: [/injury pattern/i, /injury analysis/i, /injury trend/i], action: 'NAVIGATE', response: () => 'Opening injury analysis.', data: () => ({ dept: 'medical' }) },
  { patterns: [/medical history/i, /medical record/i], action: 'NAVIGATE', response: () => 'Opening medical records.', data: () => ({ dept: 'medical' }) },
  { patterns: [/high speed running data/i, /hsr data/i], action: 'NAVIGATE', response: () => 'Opening high speed running data.', data: () => ({ dept: 'performance' }) },

  // ─── TACTICS & MATCH PREP ────────────────────────────────────────────────────
  { patterns: [/show.*tactics/i, /tactics board/i, /tactical view/i], action: 'NAVIGATE', response: () => 'Opening the tactics board.', data: () => ({ dept: 'tactics' }) },
  { patterns: [/show.*formation/i, /current formation/i, /what formation/i], action: 'NAVIGATE', response: () => 'Displaying current formation.', data: () => ({ dept: 'tactics' }) },
  { patterns: [/formation.*four.?four.?two/i, /change.*4.?4.?2/i, /switch.*4.?4.?2/i], action: 'FORMATION_CHANGE', response: () => 'Switching formation to 4-4-2.' },
  { patterns: [/formation.*four.?three.?three/i, /change.*4.?3.?3/i, /switch.*4.?3.?3/i], action: 'FORMATION_CHANGE', response: () => 'Switching formation to 4-3-3.' },
  { patterns: [/formation.*three.?five.?two/i, /change.*3.?5.?2/i, /switch.*3.?5.?2/i], action: 'FORMATION_CHANGE', response: () => 'Switching formation to 3-5-2.' },
  { patterns: [/formation.*four.?two.?three.?one/i, /change.*4.?2.?3.?1/i, /switch.*4.?2.?3.?1/i], action: 'FORMATION_CHANGE', response: () => 'Switching formation to 4-2-3-1.' },
  { patterns: [/show.*set pieces/i, /set piece/i], action: 'NAVIGATE', response: () => 'Opening set pieces.', data: () => ({ dept: 'set-pieces' }) },
  { patterns: [/corner routines/i, /attacking corners/i, /corner.*set/i], action: 'NAVIGATE', response: () => 'Opening attacking corners.', data: () => ({ dept: 'set-pieces' }) },
  { patterns: [/free kick routines/i, /free.?kick.*set/i], action: 'NAVIGATE', response: () => 'Opening free kick routines.', data: () => ({ dept: 'set-pieces' }) },
  { patterns: [/opposition analysis/i, /opposition.*report/i, /next opponent/i], action: 'NAVIGATE', response: () => 'Opening opposition analysis.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/press triggers/i, /pressing plan/i, /press.*plan/i], action: 'NAVIGATE', response: () => 'Opening pressing plan.', data: () => ({ dept: 'tactics' }) },
  { patterns: [/team talk$/i, /show.*team talk/i, /team talk builder/i], action: 'NAVIGATE', response: () => 'Opening team talk builder.', data: () => ({ dept: 'dynamics' }) },
  { patterns: [/match.?day plan/i, /matchday operations/i, /matchday ops/i], action: 'NAVIGATE', response: () => 'Opening matchday operations.', data: () => ({ dept: 'matchday' }) },
  { patterns: [/show.*training.*plan/i, /training schedule/i, /open.*training/i], action: 'NAVIGATE', response: () => 'Opening training schedule.', data: () => ({ dept: 'training' }) },
  { patterns: [/tactical video/i, /video analysis/i, /match.*video/i], action: 'NAVIGATE', response: () => 'Opening video analysis.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/heat zones/i, /heatmap/i, /heat map/i], action: 'NAVIGATE', response: () => 'Opening tactical heatmaps.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/pass maps/i, /pass network/i, /passing.*map/i], action: 'NAVIGATE', response: () => 'Opening pass network.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/shape.*in possession/i, /attacking shape/i], action: 'NAVIGATE', response: () => 'Showing attacking formation shape.', data: () => ({ dept: 'tactics' }) },
  { patterns: [/shape.*out of possession/i, /defensive shape/i], action: 'NAVIGATE', response: () => 'Showing defensive formation shape.', data: () => ({ dept: 'tactics' }) },
  { patterns: [/penalty taker/i, /who takes penalties/i], action: 'NAVIGATE', response: () => 'Opening penalty taker list.', data: () => ({ dept: 'set-pieces' }) },

  // ─── FIXTURES & RESULTS ────────────────────────────────────────────────────
  { patterns: [/upcoming fixtures/i, /next fixtures/i, /fixture list/i], action: 'NAVIGATE', response: () => 'Opening upcoming fixtures.', data: () => ({ dept: 'fixtures-results' }) },
  { patterns: [/recent results/i, /past results/i, /results.*list/i], action: 'NAVIGATE', response: () => 'Opening recent results.', data: () => ({ dept: 'fixtures-results' }) },
  { patterns: [/next match/i, /next game/i, /next fixture/i], action: 'FIXTURE_INFO', response: () => 'Next match is Saturday at 3pm, home.' },
  { patterns: [/when.*play next/i, /when.*next game/i], action: 'FIXTURE_INFO', response: () => 'Next match is Saturday at 3pm, home.' },
  { patterns: [/league table/i, /show.*table/i, /standings/i], action: 'NAVIGATE', response: () => 'Opening the league table.', data: () => ({ dept: 'leagues' }) },
  { patterns: [/league position/i, /where.*in.*league/i, /what position/i], action: 'LEAGUE_INFO', response: () => 'You are currently 14th in League One with 52 points.' },
  { patterns: [/games.*end.*season/i, /games remaining/i, /games left/i], action: 'FIXTURE_INFO', response: () => '8 league games remaining this season.' },
  { patterns: [/home form/i, /home record/i, /form.*home/i], action: 'FIXTURE_INFO', response: () => 'Home form: W4 D3 L2 from last 9 home matches.' },
  { patterns: [/away form/i, /away record/i, /form.*away/i], action: 'FIXTURE_INFO', response: () => 'Away form: W2 D4 L3 from last 9 away matches.' },
  { patterns: [/last five results/i, /last 5 results/i, /last.*five/i], action: 'FIXTURE_INFO', response: () => 'Last 5 results: W, D, L, W, D.' },
  { patterns: [/what is our form/i, /current form/i, /show.*form/i], action: 'FIXTURE_INFO', response: () => 'Current form over last 5: W-D-L-W-D.' },
  { patterns: [/head to head/i, /h2h/i], action: 'NAVIGATE', response: () => 'Opening head to head record.', data: () => ({ dept: 'fixtures-results' }) },
  { patterns: [/set piece goals conceded/i, /set piece.*concede/i], action: 'NAVIGATE', response: () => 'Opening set piece stats.', data: () => ({ dept: 'set-pieces' }) },
  { patterns: [/goals scored this season/i, /season.*goals/i, /how many goals/i], action: 'FIXTURE_INFO', response: () => '38 goals scored this season, 41 conceded.' },
  { patterns: [/clean sheets/i, /how many clean/i], action: 'FIXTURE_INFO', response: () => '7 clean sheets kept this season.' },
  { patterns: [/show.*match.*report/i, /open.*report/i], action: 'FIXTURE_INFO', response: () => 'Opening the last match report.' },
  { patterns: [/top scorers.*league/i, /league.*top scorer/i, /leading.*scorer.*league/i], action: 'NAVIGATE', response: () => 'Opening league top scorers.', data: () => ({ dept: 'leagues' }) },
  { patterns: [/goal difference/i, /goal.*diff/i], action: 'FIXTURE_INFO', response: () => 'Goal difference is minus 3. 38 scored, 41 conceded.' },
  { patterns: [/fa cup fixture/i, /fa cup/i, /cup fixture/i], action: 'FIXTURE_INFO', response: () => 'Opening FA Cup fixture information.' },
  { patterns: [/trophy cabinet/i, /club.*trophies/i, /honours/i], action: 'NAVIGATE', response: () => 'Opening club history.', data: () => ({ dept: 'club-profile' }) },

  // ─── TRANSFERS & RECRUITMENT ────────────────────────────────────────────────
  { patterns: [/transfer hub/i, /open.*transfer/i], action: 'NAVIGATE', response: () => 'Opening the transfer hub.', data: () => ({ dept: 'transfers' }) },
  { patterns: [/transfer pipeline/i, /pipeline/i], action: 'NAVIGATE', response: () => 'Opening transfer pipeline.', data: () => ({ dept: 'transfers' }) },
  { patterns: [/who.*scouting/i, /scouting database/i, /scouting db/i], action: 'NAVIGATE', response: () => 'Opening the scouting database.', data: () => ({ dept: 'scouting-db' }) },
  { patterns: [/show.*shortlist/i, /the shortlist/i, /shortlisted/i], action: 'NAVIGATE', response: () => 'Opening the shortlist.', data: () => ({ dept: 'scouting-db' }) },
  { patterns: [/free agents/i, /show.*free agent/i], action: 'NAVIGATE', response: () => 'Filtering to free agents.', data: () => ({ dept: 'scouting-db' }) },
  { patterns: [/loan targets/i, /loan.*options/i], action: 'NAVIGATE', response: () => 'Showing loan targets.', data: () => ({ dept: 'transfers' }) },
  { patterns: [/psr status/i, /psr compliance/i, /profitability.*sustainability/i], action: 'NAVIGATE', response: () => 'Opening PSR compliance dashboard.', data: () => ({ dept: 'psr' }) },
  { patterns: [/psr position/i, /psr headroom/i, /what.*psr/i], action: 'PSR_INFO', response: () => 'Current PSR headroom is £85,000. Within limits.' },
  { patterns: [/wage bill/i, /show.*wages/i, /total wages/i], action: 'NAVIGATE', response: () => 'Opening wage bill overview.', data: () => ({ dept: 'finance' }) },
  { patterns: [/salary cap/i, /wage cap/i], action: 'NAVIGATE', response: () => 'Opening salary cap information.', data: () => ({ dept: 'psr' }) },
  { patterns: [/agent.*contacts/i, /agents.*list/i], action: 'NAVIGATE', response: () => 'Opening agent contacts.', data: () => ({ dept: 'transfers' }) },
  { patterns: [/add.*transfer.*target/i, /new.*target/i], action: 'TRANSFER_ACTION', response: () => 'Opening add target form.' },
  { patterns: [/offload list/i, /offload/i, /players.*available.*transfer/i], action: 'NAVIGATE', response: () => 'Showing players available for transfer.', data: () => ({ dept: 'transfers' }) },
  { patterns: [/players.*can sell/i, /available.*sale/i, /sell.*players/i], action: 'NAVIGATE', response: () => 'Showing players available for sale.', data: () => ({ dept: 'transfers' }) },
  { patterns: [/academy.*step up/i, /academy pipeline/i, /academy.*ready/i], action: 'NAVIGATE', response: () => 'Opening academy pipeline.', data: () => ({ dept: 'academy' }) },
  { patterns: [/recruitment priorities/i, /recruitment brief/i], action: 'NAVIGATE', response: () => 'Opening recruitment brief.', data: () => ({ dept: 'scouting' }) },
  { patterns: [/find a player/i, /player search/i, /search.*player/i], action: 'NAVIGATE', response: () => 'Opening AI player search.', data: () => ({ dept: 'find-player' }) },

  // ─── FINANCE & PSR ────────────────────────────────────────────────────────
  { patterns: [/show.*finances/i, /finance department/i, /open.*finance/i], action: 'NAVIGATE', response: () => 'Opening the finance department.', data: () => ({ dept: 'finance' }) },
  { patterns: [/psr dashboard/i, /show.*psr/i], action: 'NAVIGATE', response: () => 'Opening PSR dashboard.', data: () => ({ dept: 'psr' }) },
  { patterns: [/financial position/i, /financial status/i, /how.*financ/i], action: 'FINANCE_INFO', response: () => 'Revenue this season is £2.1 million against costs of £1.9 million. Operating in a small surplus.' },
  { patterns: [/commercial revenue/i, /commercial income/i], action: 'NAVIGATE', response: () => 'Opening commercial income.', data: () => ({ dept: 'finance' }) },
  { patterns: [/matchday revenue/i, /matchday income/i, /gate receipts/i], action: 'NAVIGATE', response: () => 'Opening matchday income.', data: () => ({ dept: 'finance' }) },
  { patterns: [/broadcasting income/i, /broadcast revenue/i, /tv money/i], action: 'NAVIGATE', response: () => 'Opening broadcast revenue.', data: () => ({ dept: 'finance' }) },
  { patterns: [/player sales income/i, /transfer receipts/i, /sale.*income/i], action: 'NAVIGATE', response: () => 'Opening transfer receipts.', data: () => ({ dept: 'finance' }) },
  { patterns: [/operating costs/i, /running costs/i, /overheads/i], action: 'NAVIGATE', response: () => 'Opening operating costs.', data: () => ({ dept: 'finance' }) },
  { patterns: [/wage.*turnover/i, /turnover ratio/i], action: 'FINANCE_INFO', response: () => 'Wage to turnover ratio is currently 72 percent. Target is under 75 percent.' },
  { patterns: [/financial forecast/i, /financial projection/i], action: 'NAVIGATE', response: () => 'Opening financial projections.', data: () => ({ dept: 'finance' }) },
  { patterns: [/board pack/i, /board suite/i, /open.*board/i], action: 'NAVIGATE', response: () => 'Opening the board suite.', data: () => ({ dept: 'board' }) },
  { patterns: [/investor information/i, /investor report/i, /investor/i], action: 'NAVIGATE', response: () => 'Opening investor reporting.', data: () => ({ dept: 'board' }) },
  { patterns: [/sponsorship revenue/i, /sponsorship/i, /sponsor.*income/i], action: 'NAVIGATE', response: () => 'Opening sponsorship tracker.', data: () => ({ dept: 'finance' }) },
  { patterns: [/kit deal/i, /kit partner/i, /kit.*sponsor/i], action: 'NAVIGATE', response: () => 'Opening kit partnership details.', data: () => ({ dept: 'finance' }) },
  { patterns: [/naming rights/i, /stadium naming/i], action: 'NAVIGATE', response: () => 'Opening naming rights info.', data: () => ({ dept: 'finance' }) },
  { patterns: [/academy income/i, /academy.*revenue/i], action: 'NAVIGATE', response: () => 'Opening academy revenue.', data: () => ({ dept: 'finance' }) },
  { patterns: [/parachute payment/i, /parachute/i], action: 'FINANCE_INFO', response: () => 'No parachute payments are applicable.' },
  { patterns: [/three year plan/i, /3 year plan/i, /financial plan/i], action: 'NAVIGATE', response: () => 'Opening financial plan.', data: () => ({ dept: 'finance' }) },
  { patterns: [/financial fair play/i, /ffp.*rule/i, /ffp guide/i], action: 'NAVIGATE', response: () => 'Opening FFP guide.', data: () => ({ dept: 'psr' }) },
  { patterns: [/accounts payable/i, /payables/i], action: 'NAVIGATE', response: () => 'Opening accounts payable.', data: () => ({ dept: 'finance' }) },

  // ─── CLUB OPERATIONS ────────────────────────────────────────────────────────
  { patterns: [/chairman briefing/i, /chairman.*brief/i], action: 'NAVIGATE', response: () => 'Opening chairman briefing.', data: () => ({ dept: 'board' }) },
  { patterns: [/show.*facilities/i, /open.*facilities/i], action: 'NAVIGATE', response: () => 'Opening facilities.', data: () => ({ dept: 'facilities' }) },
  { patterns: [/show.*stadium/i, /stadium info/i], action: 'NAVIGATE', response: () => 'Opening stadium information.', data: () => ({ dept: 'facilities' }) },
  { patterns: [/ground grading/i, /grading.*ground/i], action: 'NAVIGATE', response: () => 'Opening ground grading.', data: () => ({ dept: 'facilities' }) },
  { patterns: [/training ground/i, /training facilit/i], action: 'NAVIGATE', response: () => 'Opening training facilities.', data: () => ({ dept: 'facilities' }) },
  { patterns: [/kit management/i, /kit.*room/i], action: 'NAVIGATE', response: () => 'Opening kit management.', data: () => ({ dept: 'matchday' }) },
  { patterns: [/media schedule/i, /media.*calendar/i], action: 'NAVIGATE', response: () => 'Opening media schedule.', data: () => ({ dept: 'media' }) },
  { patterns: [/press conference.*log/i, /press.*conferences/i], action: 'NAVIGATE', response: () => 'Opening press conference log.', data: () => ({ dept: 'media' }) },
  { patterns: [/social media/i, /show.*social/i], action: 'NAVIGATE', response: () => 'Opening social media.', data: () => ({ dept: 'social' }) },
  { patterns: [/fan engagement/i, /fan.*interact/i], action: 'NAVIGATE', response: () => 'Opening fan engagement.', data: () => ({ dept: 'social' }) },
  { patterns: [/ticketing/i, /ticket.*data/i, /ticket sales/i], action: 'NAVIGATE', response: () => 'Opening ticketing data.', data: () => ({ dept: 'matchday' }) },
  { patterns: [/academy structure/i, /academy.*overview/i], action: 'NAVIGATE', response: () => 'Opening academy overview.', data: () => ({ dept: 'academy' }) },
  { patterns: [/category status/i, /academy.*category/i], action: 'NAVIGATE', response: () => 'Opening academy category status.', data: () => ({ dept: 'academy' }) },
  { patterns: [/womens team/i, /women.*team/i, /women's team/i], action: 'CLUB_INFO', response: () => 'Women\'s team section coming soon.' },
  { patterns: [/youth teams/i, /youth development/i], action: 'NAVIGATE', response: () => 'Opening youth development.', data: () => ({ dept: 'academy' }) },
  { patterns: [/coaching staff/i, /show.*coaches/i, /backroom staff/i], action: 'NAVIGATE', response: () => 'Opening coaching staff.', data: () => ({ dept: 'staff' }) },
  { patterns: [/show.*dof/i, /director of football/i], action: 'NAVIGATE', response: () => 'Opening Director of Football section.', data: () => ({ dept: 'staff' }) },
  { patterns: [/club history/i, /our history/i, /club.*heritage/i], action: 'NAVIGATE', response: () => 'Opening club history.', data: () => ({ dept: 'club-profile' }) },
  { patterns: [/club handbook/i, /club policies/i, /handbook/i], action: 'NAVIGATE', response: () => 'Opening club policies.', data: () => ({ dept: 'settings' }) },

  // ─── MATCH DAY ────────────────────────────────────────────────────────────
  { patterns: [/match week/i, /show.*matchweek/i, /matchday view/i], action: 'NAVIGATE', response: () => 'Opening match week.', data: () => ({ dept: 'matchday' }) },
  { patterns: [/submit.*team sheet/i, /submit.*lineup/i], action: 'MATCHDAY_ACTION', response: () => 'Opening team sheet submission.' },
  { patterns: [/matchday checklist/i, /matchday.*check/i], action: 'NAVIGATE', response: () => 'Opening matchday checklist.', data: () => ({ dept: 'matchday' }) },
  { patterns: [/referee details/i, /who.*referee/i, /ref.*details/i], action: 'MATCHDAY_INFO', response: () => 'Referee details for the next fixture are available in matchday ops.' },
  { patterns: [/venue details/i, /venue info/i], action: 'MATCHDAY_INFO', response: () => 'Opening venue details.' },
  { patterns: [/travel arrangement/i, /travel logistics/i, /travel.*plan/i], action: 'NAVIGATE', response: () => 'Opening travel logistics.', data: () => ({ dept: 'matchday' }) },
  { patterns: [/match programme/i, /program.*notes/i], action: 'NAVIGATE', response: () => 'Opening match programme.', data: () => ({ dept: 'media' }) },
  { patterns: [/pre.?match data/i, /pre.?match brief/i], action: 'NAVIGATE', response: () => 'Opening pre-match briefing.', data: () => ({ dept: 'matchday' }) },
  { patterns: [/half.?time stats/i, /half.?time data/i, /live.*stats/i], action: 'NAVIGATE', response: () => 'Opening live match stats.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/log.*result/i, /record.*result/i, /enter.*result/i], action: 'MATCHDAY_ACTION', response: () => 'Opening result logging form.' },
  { patterns: [/player ratings.*last match/i, /post.*match.*rating/i], action: 'NAVIGATE', response: () => 'Opening post-match player ratings.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/match timeline/i, /match.*events/i], action: 'NAVIGATE', response: () => 'Opening match timeline.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/xg.*last match/i, /expected goals/i, /statsbomb.*xg/i], action: 'NAVIGATE', response: () => 'Opening Lumio Data Pro xG feed.', data: () => ({ dept: 'lumio-data-pro' }) },
  { patterns: [/shots on target/i, /shot.*target/i], action: 'FIXTURE_INFO', response: () => 'Last match: 6 shots on target from 14 total.' },
  { patterns: [/possession stats/i, /possession.*data/i, /how much possession/i], action: 'FIXTURE_INFO', response: () => 'Last match possession: 54 percent.' },
  { patterns: [/warm.?up plan/i, /warm.?up schedule/i], action: 'NAVIGATE', response: () => 'Opening warm-up schedule.', data: () => ({ dept: 'matchday' }) },
  { patterns: [/home captain/i, /who.*captain/i, /club captain/i], action: 'PLAYER_INFO', response: () => 'The club captain is Steve Seddon.' },

  // ─── GPS & PERFORMANCE ────────────────────────────────────────────────────
  { patterns: [/gps data/i, /show.*gps/i, /open.*gps/i], action: 'NAVIGATE', response: () => 'Opening GPS data.', data: () => ({ dept: 'performance' }) },
  { patterns: [/today.*session data/i, /session data.*today/i], action: 'NAVIGATE', response: () => 'Opening today\'s session data.', data: () => ({ dept: 'performance' }) },
  { patterns: [/high speed running/i, /hsr/i], action: 'NAVIGATE', response: () => 'Opening high speed running.', data: () => ({ dept: 'performance' }) },
  { patterns: [/sprint data/i, /sprint analysis/i, /sprint.*stats/i], action: 'NAVIGATE', response: () => 'Opening sprint analysis.', data: () => ({ dept: 'performance' }) },
  { patterns: [/player load/i, /load overview/i], action: 'NAVIGATE', response: () => 'Opening player load overview.', data: () => ({ dept: 'performance' }) },
  { patterns: [/acwr table/i, /show.*acwr/i], action: 'NAVIGATE', response: () => 'Opening ACWR table.', data: () => ({ dept: 'performance' }) },
  { patterns: [/most distance/i, /covered.*most/i, /furthest.*today/i], action: 'GPS_INFO', response: () => 'Marcus Browne covered the most distance today at 11.4 kilometres.' },
  { patterns: [/highest top speed/i, /fastest.*today/i, /top speed/i], action: 'GPS_INFO', response: () => 'Callum Maycock hit 34.2 kilometres per hour — highest in today\'s session.' },
  { patterns: [/show.*heatmaps/i, /positional heat/i], action: 'NAVIGATE', response: () => 'Opening positional heatmaps.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/session comparison/i, /compare.*session/i], action: 'NAVIGATE', response: () => 'Opening session comparison.', data: () => ({ dept: 'performance' }) },
  { patterns: [/weekly load trend/i, /load trend/i], action: 'NAVIGATE', response: () => 'Opening weekly load trends.', data: () => ({ dept: 'performance' }) },
  { patterns: [/pre.?season fitness/i, /pre.?season data/i], action: 'NAVIGATE', response: () => 'Opening pre-season fitness data.', data: () => ({ dept: 'performance' }) },
  { patterns: [/match load.*training load/i, /training.*vs.*match/i], action: 'NAVIGATE', response: () => 'Comparing match and training loads.', data: () => ({ dept: 'performance' }) },
  { patterns: [/deceleration data/i, /deceleration/i], action: 'NAVIGATE', response: () => 'Opening deceleration metrics.', data: () => ({ dept: 'performance' }) },
  { patterns: [/heart rate data/i, /heart rate/i, /hr data/i], action: 'NAVIGATE', response: () => 'Opening heart rate data.', data: () => ({ dept: 'performance' }) },
  { patterns: [/fitness test results/i, /fitness test/i], action: 'NAVIGATE', response: () => 'Opening fitness testing records.', data: () => ({ dept: 'performance' }) },
  { patterns: [/yo.?yo test/i, /yoyo test/i], action: 'NAVIGATE', response: () => 'Opening Yo-Yo test results.', data: () => ({ dept: 'performance' }) },
  { patterns: [/acceleration data/i, /acceleration/i], action: 'NAVIGATE', response: () => 'Opening acceleration data.', data: () => ({ dept: 'performance' }) },
  { patterns: [/power data/i, /power metrics/i], action: 'NAVIGATE', response: () => 'Opening power metrics.', data: () => ({ dept: 'performance' }) },
  { patterns: [/recovery scores/i, /recovery data/i], action: 'NAVIGATE', response: () => 'Opening recovery scores.', data: () => ({ dept: 'performance' }) },

  // ─── GENERAL & OVERVIEW ────────────────────────────────────────────────────
  { patterns: [/good morning/i, /morning$/i], action: 'PLAY_BRIEFING', response: () => 'Good morning. Starting your briefing now.' },
  { patterns: [/today.*priorities/i, /priority.*today/i], action: 'NAVIGATE', response: () => 'Opening today\'s priorities.', data: () => ({ dept: 'overview' }) },
  { patterns: [/what.*happening today/i, /today.*schedule/i], action: 'NAVIGATE', response: () => 'Here\'s what\'s happening today.', data: () => ({ dept: 'overview' }) },
  { patterns: [/show.*dashboard/i, /open.*dashboard/i, /main.*dashboard/i], action: 'NAVIGATE', response: () => 'Opening the dashboard.', data: () => ({ dept: 'overview' }) },
  { patterns: [/give.*summary/i, /executive brief/i, /brief me/i], action: 'PLAY_BRIEFING', response: () => 'Starting your executive briefing now.' },
  { patterns: [/show.*insights/i, /ai insights/i], action: 'NAVIGATE', response: () => 'Opening AI insights.', data: () => ({ dept: 'insights' }) },
  { patterns: [/key metrics/i, /show.*metrics/i], action: 'NAVIGATE', response: () => 'Opening key metrics.', data: () => ({ dept: 'analytics' }) },
  { patterns: [/urgent items/i, /any.*urgent/i, /anything urgent/i], action: 'OVERVIEW_INFO', response: () => 'Checking for urgent items now.' },
  { patterns: [/what.*missed/i, /recent activity/i, /catch me up/i], action: 'NAVIGATE', response: () => 'Showing recent activity.', data: () => ({ dept: 'overview' }) },
  { patterns: [/show.*settings/i, /open.*settings/i], action: 'NAVIGATE', response: () => 'Opening settings.', data: () => ({ dept: 'settings' }) },
  { patterns: [/show.*pyramid/i, /football pyramid/i], action: 'NAVIGATE', response: () => 'Opening Discover — football pyramid.', data: () => ({ dept: 'discover' }) },
  { patterns: [/find a club/i, /club search/i, /search.*club/i], action: 'NAVIGATE', response: () => 'Opening Discover — AI club search.', data: () => ({ dept: 'discover' }) },
  { patterns: [/show.*statsbomb/i, /statsbomb data/i, /open.*statsbomb/i], action: 'NAVIGATE', response: () => 'Opening Lumio Data Pro.', data: () => ({ dept: 'lumio-data-pro' }) },
  { patterns: [/show.*lumio vision/i, /open.*lumio vision/i, /video analysis/i], action: 'NAVIGATE', response: () => 'Opening Lumio Vision.', data: () => ({ dept: 'lumio-vision' }) },
  { patterns: [/opta data/i, /show.*opta/i, /open.*opta/i], action: 'NAVIGATE', response: () => 'Opening Lumio Data.', data: () => ({ dept: 'opta' }) },

  // ─── HELP ────────────────────────────────────────────────────────────────────
  { patterns: [/help/i, /what can you do/i, /commands/i], action: 'HELP', response: () => 'You can say things like: show me the squad, who\'s injured, show tactics, show set pieces, show upcoming fixtures, show the league table, transfer budget, show GPS data, show the board suite, show finances, or find a player. Say any department name to navigate there.' },
]

export function useFootballVoiceCommands() {
  const recRef = useRef<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [lastCommand, setLastCommand] = useState<FootballCommandResult | null>(null)

  const process = useCallback((text: string): FootballCommandResult => {
    for (const cmd of CMDS) for (const p of cmd.patterns) {
      const m = text.match(p)
      if (m) {
        const result: FootballCommandResult = { command: text, action: cmd.action, response: cmd.response(m, text) }
        if (cmd.data) result.data = cmd.data(m, text)
        return result
      }
    }
    return { command: text, action: 'UNKNOWN', response: `I heard "${text}" but I'm not sure what to do. Say "help" for commands.` }
  }, [])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR(); r.lang = 'en-GB'; r.interimResults = false; r.maxAlternatives = 1; r.continuous = false
    r.onresult = (e: any) => { const t = e.results[0][0].transcript; setTranscript(t); setLastCommand(process(t)) }
    r.onend = () => setIsListening(false); r.onerror = () => setIsListening(false)
    recRef.current = r; r.start(); setIsListening(true)
  }, [process])

  const stopListening = useCallback(() => { recRef.current?.stop(); setIsListening(false) }, [])
  return { isListening, transcript, lastCommand, startListening, stopListening }
}
