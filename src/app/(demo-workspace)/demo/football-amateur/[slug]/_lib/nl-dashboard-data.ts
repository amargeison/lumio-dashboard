// Non-League dashboard demo data. Mirrors the v2 shape used by other team
// sport portals (cricket / rugby / football / women's). Demo: Harfield FC.

export const NL_ORG = {
  product:        'Lumio Non-League',
  club:           'Harfield FC',
  clubShort:      'Harfield FC',
  manager:        'Steve Whitlock',
  greetingNameShort: 'Steve',
  date:           'Sat, 03 May 2026',
  formation:      '4-4-2',
  ground:         'Harfield Community Stadium',
  weather:        { tempC: 11, cond: 'Heavy rain overnight', wind: '15 mph SW', kickoff: '15:00' },
  season:         { played: 27, won: 14, drawn: 7, lost: 6, position: 5, league: 'National League South', points: 49, gd: '+12' },
} as const

// ─── StatTiles ───────────────────────────────────────────────────────────
export type NlStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type NlStatTile = { label: string; value: string | number; sub: string; tone: NlStatTone }

export const NL_TOP_STATS: NlStatTile[] = [
  { label: 'Inbox',            value: 17, sub: '3 urgent',            tone: 'urgent' },
  { label: 'Squad available',  value: 17, sub: '3 unavail · 2 inj', tone: 'warn' },
  { label: 'Today',            value: 7,  sub: 'sessions',            tone: 'ok' },
  { label: 'League',           value: '5th', sub: '49 pts · GD +12', tone: 'accent' },
  { label: 'Pitch status',     value: 'Inspect', sub: '09:00',        tone: 'warn' },
]

// ─── Inbox ───────────────────────────────────────────────────────────────
export type NlInboxChannel = {
  ch: string
  count: number
  tone: 'green' | 'red' | 'purple' | 'amber' | 'navy' | 'orange'
  urgent: boolean
  last: string
  time: string
}

export const NL_INBOX: NlInboxChannel[] = [
  { ch: 'WhatsApp · Squad',   count: 8, tone: 'green',  urgent: true,  last: '3 players unavailable Saturday — call-ups needed',  time: '07:14' },
  { ch: 'Email · League',     count: 3, tone: 'red',    urgent: true,  last: 'NLS — fixture amendment confirmed',                  time: '06:58' },
  { ch: 'Committee',          count: 2, tone: 'navy',   urgent: false, last: 'Budget review Thursday · bar takings down',          time: 'Yesterday' },
  { ch: 'Referees',           count: 1, tone: 'purple', urgent: false, last: 'Official confirmed Saturday · M. Carter',            time: '07:30' },
  { ch: 'Ground Staff',       count: 1, tone: 'amber',  urgent: true,  last: 'Pitch heavy after rain · 3G backup at Ridgefield',   time: '07:42' },
  { ch: 'Local Press',        count: 1, tone: 'orange', urgent: false, last: 'Pre-match quote requested by 12:00',                 time: '07:11' },
  { ch: 'Sponsors',           count: 1, tone: 'amber',  urgent: false, last: 'Crown Wagers banner needs replacing — order made',   time: 'Yesterday' },
]

// ─── Fixtures ────────────────────────────────────────────────────────────
export type NlFixture = {
  day: string; date: string; opp: string; comp: string; venue: string;
  time: string; state: 'today' | 'upcoming'; side: string;
  competitionTone?: 'league' | 'cup'
}

export const NL_FIXTURES: NlFixture[] = [
  { day: 'Sat', date: '03 May', opp: 'Thornvale United',     comp: 'National League South', venue: 'Home · Harfield Community Stadium', time: '15:00', state: 'today',    side: '1st team', competitionTone: 'league' },
  { day: 'Tue', date: '06 May', opp: 'Kingsmere Town',       comp: 'NL South Play-off Eligibility',venue: 'Away · Kingsmere Park',         time: '19:45', state: 'upcoming', side: '1st team', competitionTone: 'league' },
  { day: 'Sat', date: '10 May', opp: 'Ashbourne Athletic',   comp: 'FA Trophy SF',          venue: 'Neutral · The Grange',              time: '15:00', state: 'upcoming', side: '1st team', competitionTone: 'cup' },
  { day: 'Sat', date: '17 May', opp: 'Ridgefield Borough',   comp: 'National League South', venue: 'Away · Ridgefield Stadium',         time: '15:00', state: 'upcoming', side: '1st team', competitionTone: 'league' },
  { day: 'Mon', date: '26 May', opp: 'Westcliff FC',         comp: 'County Cup Final',      venue: 'Neutral · The Grange',              time: '15:00', state: 'upcoming', side: '1st team', competitionTone: 'cup' },
]

// ─── Today schedule ──────────────────────────────────────────────────────
export type NlScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const NL_TODAY: NlScheduleItem[] = [
  { t: '09:00', what: 'Pitch inspection · rain overnight',   where: 'Main pitch' },
  { t: '10:00', what: 'Team meeting · match review',         where: 'Clubhouse' },
  { t: '10:30', what: 'Training · set pieces',               where: 'Training pitch' },
  { t: '12:00', what: 'Kit prep · home strip',               where: 'Kit room', highlight: true },
  { t: '14:00', what: 'Opposition scout · Thornvale video',  where: "Manager's office" },
  { t: '15:00', what: 'Committee meeting · budget review',   where: 'Boardroom' },
  { t: '17:00', what: 'Confirm team sheet to league',        where: 'Online portal' },
]

// ─── Morning brief ───────────────────────────────────────────────────────
export type NlAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const NL_AI_BRIEF: NlAIBriefItem[] = [
  { tag: 'select',  pri: 'high', txt: '3 players unavailable Saturday — call-ups needed from reserves. Jenkins and Osei both available.' },
  { tag: 'tactic',  pri: 'med',  txt: "Saturday's opponent sit deep counter-attack. Play patient, switch the play, don't commit too many forward." },
  { tag: 'ground',  pri: 'high', txt: 'Pitch heavy after overnight rain. Inspect 09:00. 3G backup at Ridgefield available if waterlogged.' },
  { tag: 'budget',  pri: 'med',  txt: 'Monthly budget meeting Thursday. Bar takings down 12%. Sponsor banner revenue due. Confirm matchday programme printing.' },
  { tag: 'op',      pri: 'high', txt: 'Team sheet deadline 17:00 today. Confirm to league office. Referee confirmed for Saturday.' },
]

// ─── Performance signals ─────────────────────────────────────────────────
export type NlPerfItem = { txt: string; delta?: string; tone?: 'good' | 'bad' | 'neutral' }

export const NL_PERF_INTEL: NlPerfItem[] = [
  { txt: 'Win rate 54% — 3rd in league form table',                      delta: '+5%',   tone: 'good' },
  { txt: 'Goals from set pieces: 8 (31% of total — strong)',             delta: '+3',    tone: 'good' },
  { txt: 'Goals conceded from corners: 6 — worst in top half',           delta: '+2',    tone: 'bad' },
  { txt: 'Home record: W8 L2 D1 — fortress',                              delta: '0.85',  tone: 'good' },
  { txt: 'Away record: W3 L5 D3 — needs improvement',                    delta: 'PPG 0.82', tone: 'bad' },
  { txt: 'Clean sheets: 10 in 27 — best in division',                    delta: '+2',    tone: 'good' },
]

// ─── Recents ─────────────────────────────────────────────────────────────
export type NlResult = { vs: string; res: 'W' | 'L' | 'D'; score: string; date: string; comp: string }

export const NL_RECENTS: NlResult[] = [
  { vs: 'Glossop North End',   res: 'W', score: '2 – 0', date: 'Sat 26 Apr', comp: 'NLS' },
  { vs: 'Prescot Cables',       res: 'L', score: '1 – 3', date: 'Sat 19 Apr', comp: 'NLS' },
  { vs: 'Bamber Bridge',        res: 'W', score: '1 – 0', date: 'Sat 12 Apr', comp: 'NLS' },
  { vs: 'Hyde United',          res: 'D', score: '2 – 2', date: 'Sat 05 Apr', comp: 'NLS' },
  { vs: 'Marine FC',            res: 'W', score: '3 – 1', date: 'Tue 01 Apr', comp: 'FA Trophy QF' },
]

export const NL_SEASON_FORM: ('W' | 'L' | 'D')[] = ['W','D','W','L','W','W','D','L','W','W','L','W','D','L','W','W','D','W']

// ─── Squad availability — 20 players grouped GK / DEF / MID / FWD ──────
export type NlPlayerSlot = {
  num: number
  initials: string
  name: string
  pos: string
  group: 'gk' | 'def' | 'mid' | 'fwd'
  status: 'ok' | 'doubt' | 'out' | 'cleared'
}

export const NL_SQUAD: NlPlayerSlot[] = [
  // Goalkeepers (2)
  { num: 1,  initials:'RC', name:'Ryan Calloway',    pos:'GK',  group:'gk',  status:'ok' },
  { num: 13, initials:'NH', name:'Nathan Hollis',    pos:'GK',  group:'gk',  status:'ok' },
  // Defenders (6)
  { num: 2,  initials:'JM', name:'Jake Morley',      pos:'RB',  group:'def', status:'ok' },
  { num: 3,  initials:'SO', name:'Sam Okonkwo',      pos:'LB',  group:'def', status:'ok' },
  { num: 4,  initials:'DP', name:'Danny Prescott',   pos:'CB',  group:'def', status:'ok' },
  { num: 5,  initials:'LC', name:'Lewis Cartwright', pos:'CB',  group:'def', status:'ok' },
  { num: 16, initials:'CP', name:'Chris Platt',      pos:'CB',  group:'def', status:'out' },
  { num: 18, initials:'CD', name:'Craig Dunne',      pos:'CB',  group:'def', status:'ok' },
  // Midfielders (7)
  { num: 6,  initials:'TB', name:'Tom Brennan',      pos:'CDM', group:'mid', status:'ok' },
  { num: 8,  initials:'JW', name:'Josh Whitmore',    pos:'CM',  group:'mid', status:'ok' },
  { num: 14, initials:'CD', name:'Callum Deakin',    pos:'CM',  group:'mid', status:'ok' },
  { num: 17, initials:'JM', name:'Jordan Mellor',    pos:'CM',  group:'mid', status:'out' },
  { num: 20, initials:'TR', name:'Tyler Rooney',     pos:'AM',  group:'mid', status:'ok' },
  { num: 21, initials:'KP', name:'Kai Pearson',      pos:'CDM', group:'mid', status:'ok' },
  { num: 24, initials:'OB', name:'Owen Bright',      pos:'AM',  group:'mid', status:'ok' },
  // Forwards (5)
  { num: 7,  initials:'RF', name:'Ryan Fletcher',    pos:'RW',  group:'fwd', status:'doubt' },
  { num: 9,  initials:'LG', name:'Liam Grady',       pos:'ST',  group:'fwd', status:'ok' },
  { num: 10, initials:'HS', name:'Harry Simcox',     pos:'ST',  group:'fwd', status:'ok' },
  { num: 11, initials:'MW', name:'Marcus Webb',      pos:'LW',  group:'fwd', status:'ok' },
  { num: 19, initials:'DN', name:'Declan Nash',      pos:'LW',  group:'fwd', status:'out' },
]

export const NL_INJURIES = [
  { name: 'C. Platt',    issue: 'Calf strain',                back: '12 Apr',  status: 'rehab'    as const },
  { name: 'J. Mellor',   issue: 'Knee ligament — 3 weeks',    back: 'May 14',  status: 'imaging'  as const },
  { name: 'D. Nash',     issue: 'Suspended (3 matches)',      back: '17 May',  status: 'rehab'    as const },
]

export const NL_ACCENT = {
  hex:    '#D97706',
  dim:    'rgba(217,119,6,0.16)',
  border: 'rgba(217,119,6,0.45)',
}
