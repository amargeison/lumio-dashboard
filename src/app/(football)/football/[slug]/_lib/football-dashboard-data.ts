// Football Pro dashboard demo data. Mirrors the rugby/cricket v2 shape so
// the football dashboard modules can read it the same way. Names invented;
// no real club/player names beyond Oakridge FC (the existing demo).

export const FOOTBALL_ORG = {
  product:        'Lumio Football',
  club:           'Oakridge FC',
  clubShort:      'Oakridge FC',
  manager:        'Steve Whitlock',
  greetingNameShort: 'Steve',
  date:           'Sat, 02 May 2026',
  formation:      '4-3-3',
  weather:        { tempC: 12, cond: 'Light cloud', wind: '11 mph SW', kickoff: '15:00' },
  season:         { played: 38, won: 16, drawn: 9, lost: 13, position: 8, league: 'League One', points: 57, gd: '+8' },
} as const

// ─── StatTiles ───────────────────────────────────────────────────────────
export type FbStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type FbStatTile = { label: string; value: string | number; sub: string; tone: FbStatTone }

export const FOOTBALL_TOP_STATS: FbStatTile[] = [
  { label: 'Inbox',          value: 28, sub: '7 urgent',  tone: 'urgent' },
  { label: 'Approvals',      value: 5,  sub: 'awaiting',  tone: 'warn' },
  { label: 'Out · doubt',    value: 4,  sub: '1 susp · 3 inj', tone: 'danger' },
  { label: 'Today',          value: 8,  sub: 'sessions',  tone: 'ok' },
  { label: 'League',         value: '8th', sub: '57 pts · GD +8', tone: 'accent' },
]

// ─── Inbox ───────────────────────────────────────────────────────────────
export type FbInboxChannel = {
  ch: string
  count: number
  tone: 'green' | 'red' | 'purple' | 'amber' | 'navy' | 'orange'
  urgent: boolean
  last: string
  time: string
}

export const FOOTBALL_INBOX: FbInboxChannel[] = [
  { ch: 'SMS · Coaches',       count: 3, tone: 'red',    urgent: true,  last: 'Walsh ban served — available Saturday',          time: '07:14' },
  { ch: 'WhatsApp · Squad',    count: 6, tone: 'green',  urgent: false, last: 'Captain: pitch walk done, firm, 4G studs',        time: '07:42' },
  { ch: 'Email · Selectors',   count: 5, tone: 'red',    urgent: true,  last: 'Henderson scan — Grade 1, 10 days',               time: '06:58' },
  { ch: 'Agent messages',      count: 4, tone: 'red',    urgent: true,  last: 'Okafor — contract expires June, decision Fri',    time: '06:45' },
  { ch: 'Board messages',      count: 2, tone: 'navy',   urgent: false, last: 'Q3 financial summary attached',                   time: 'Yesterday' },
  { ch: 'Medical Hub',         count: 2, tone: 'red',    urgent: true,  last: 'Osei — ACL review, consultant report',            time: '07:02' },
  { ch: 'Media & Press',       count: 3, tone: 'orange', urgent: false, last: 'Northbridge Sport — pre-match request',           time: '07:11' },
  { ch: 'Scouting',            count: 2, tone: 'purple', urgent: false, last: 'Okafor (Ridgefield) watched twice — strong',      time: 'Yesterday' },
  { ch: 'Academy',             count: 1, tone: 'green',  urgent: false, last: 'U18s won 3-1 — two prospects flagged',            time: '07:30' },
]

// ─── Fixtures ────────────────────────────────────────────────────────────
export type FbFixture = {
  day: string; date: string; opp: string; comp: string; venue: string;
  time: string; state: 'today' | 'tomorrow' | 'upcoming'; side: string;
  competitionTone?: 'league' | 'cup'
}

export const FOOTBALL_FIXTURES: FbFixture[] = [
  { day: 'Sat', date: '02 May', opp: 'Hartwell Town',     comp: 'League One',           venue: 'Home · Oakridge Park', time: '15:00', state: 'today',    side: '1st team', competitionTone: 'league' },
  { day: 'Tue', date: '05 May', opp: 'Ashbourne United',  comp: 'EFL Cup R3',           venue: 'Away · Riverside Park',time: '19:45', state: 'upcoming', side: '1st team', competitionTone: 'cup' },
  { day: 'Sat', date: '09 May', opp: 'Thornvale FC',      comp: 'League One',           venue: 'Away · Thornvale Stadium', time: '15:00', state: 'upcoming', side: '1st team', competitionTone: 'league' },
  { day: 'Sat', date: '16 May', opp: 'Kingsmere City',    comp: 'League One',           venue: 'Home · Oakridge Park', time: '15:00', state: 'upcoming', side: '1st team', competitionTone: 'league' },
  { day: 'Wed', date: '20 May', opp: 'Ridgefield Athletic',comp: 'County Cup Final',     venue: 'Neutral · The Hive',    time: '19:30', state: 'upcoming', side: '1st team', competitionTone: 'cup' },
]

// ─── Today schedule ──────────────────────────────────────────────────────
export type FbScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const FOOTBALL_TODAY: FbScheduleItem[] = [
  { t: '08:00', what: 'Staff meeting · match review',     where: 'Boardroom' },
  { t: '09:30', what: 'First team training · shape work', where: 'Pitch 1' },
  { t: '10:30', what: 'Set pieces · corners + free kicks',where: 'Pitch 1' },
  { t: '11:30', what: 'Small-sided games',                where: 'Pitch 2', highlight: true },
  { t: '13:00', what: 'Lunch + recovery',                 where: 'Pavilion' },
  { t: '14:00', what: 'Press conference · pre-match',     where: 'Press box' },
  { t: '15:00', what: 'Video analysis · upcoming opp',    where: 'Analysis room' },
  { t: '16:00', what: '1-to-1 meetings · contract players',where: "Manager's office" },
]

// ─── Morning brief ───────────────────────────────────────────────────────
export type FbAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const FOOTBALL_AI_BRIEF: FbAIBriefItem[] = [
  { tag: 'select',   pri: 'high', txt: 'Walsh served 3-match ban — available Saturday. Start him, or keep Wilson?' },
  { tag: 'tactic',   pri: 'med',  txt: 'Hartwell press high from goal kicks — work short build-up. Their LB pushes high, space behind.' },
  { tag: 'medical',  pri: 'high', txt: 'Henderson hamstring tightness — light training only. Scan results 14:00.' },
  { tag: 'transfer', pri: 'high', txt: 'Agent for Okafor called — contract expires June. £8k/week. Within budget if Henderson restructured.' },
  { tag: 'risk',     pri: 'high', txt: 'Pitch inspection Sat 08:00 — heavy rain forecast. Backup venue Glenmoor Park (3G) confirmed.' },
  { tag: 'op',       pri: 'med',  txt: 'Academy U18s won 3-1 last night. Two prospects recommended for first-team training next week.' },
]

// ─── Performance signals ─────────────────────────────────────────────────
export type FbPerfItem = { txt: string; delta?: string; tone?: 'good' | 'bad' | 'neutral' }

export const FOOTBALL_PERF_INTEL: FbPerfItem[] = [
  { txt: 'xG differential +0.4 / match',                                delta: '+0.2', tone: 'good' },
  { txt: 'Pass completion 82% — below 85% target',                      delta: '−1.3 pp', tone: 'bad' },
  { txt: 'Clean sheets 3 / 8 — vs 5 / 8 last year',                     delta: '−2',    tone: 'bad' },
  { txt: 'Set-piece goals 22% of total — above league avg 18%',         delta: '+4 pp', tone: 'good' },
  { txt: 'PPDA 9.8 — top quartile pressing',                            delta: '+0.6', tone: 'good' },
  { txt: 'High-speed running 2.1 km/match — top 3 in division',         delta: '+0.3', tone: 'good' },
]

// ─── Recents ─────────────────────────────────────────────────────────────
export type FbResult = { vs: string; res: 'W' | 'L' | 'D'; score: string; date: string; comp: string }

export const FOOTBALL_RECENTS: FbResult[] = [
  { vs: 'Northgate City',     res: 'L', score: '1 – 2',  date: 'Sat 26 Apr', comp: 'League One' },
  { vs: 'Plymouth Argyle',    res: 'L', score: '1 – 2',  date: 'Sat 19 Apr', comp: 'League One' },
  { vs: 'Fernbrook Athletic', res: 'D', score: '1 – 1',  date: 'Sat 12 Apr', comp: 'League One' },
  { vs: 'Castleton Rovers',   res: 'W', score: '2 – 0',  date: 'Sat 05 Apr', comp: 'League One' },
  { vs: 'Glenmoor Wanderers', res: 'W', score: '3 – 0',  date: 'Sat 29 Mar', comp: 'EFL Cup R2' },
]

export const FOOTBALL_SEASON_FORM: ('W' | 'L' | 'D')[] = ['W','D','W','L','W','W','D','L','W','W','L','W','D','L','L','W','W','D']

// ─── Squad availability — 25 players grouped GK / DEF / MID / FWD ────────
export type FbPlayerSlot = {
  num: number
  initials: string
  name: string
  pos: string
  group: 'gk' | 'def' | 'mid' | 'fwd'
  status: 'ok' | 'doubt' | 'out' | 'cleared'
}

export const FOOTBALL_SQUAD: FbPlayerSlot[] = [
  // Goalkeepers (3)
  { num: 1,  initials:'JH', name:'Jordan Hayes',     pos:'GK',  group:'gk',  status:'ok' },
  { num: 20, initials:'JM', name:'Joe McDonnell',    pos:'GK',  group:'gk',  status:'ok' },
  { num: 30, initials:'AR', name:'Ali Rashid',       pos:'GK',  group:'gk',  status:'ok' },
  // Defenders (8)
  { num: 2,  initials:'KO', name:'Kyle Osei',        pos:'RB',  group:'def', status:'ok' },
  { num: 3,  initials:'TF', name:'Tom Fletcher',     pos:'LB',  group:'def', status:'ok' },
  { num: 5,  initials:'PG', name:'Paul Granger',     pos:'CB',  group:'def', status:'ok' },
  { num: 6,  initials:'DW', name:'Daniel Webb',      pos:'CB',  group:'def', status:'ok' },
  { num: 15, initials:'MR', name:'Marcus Reid',      pos:'CB',  group:'def', status:'ok' },
  { num: 17, initials:'BC', name:'Brodi Chen',       pos:'CB',  group:'def', status:'doubt' },
  { num: 31, initials:'JL', name:'Joe Lewis',        pos:'CB',  group:'def', status:'ok' },
  { num: 33, initials:'IK', name:'Isaac Kemp',       pos:'CB',  group:'def', status:'ok' },
  // Midfielders (8)
  { num: 4,  initials:'CW', name:'Connor Walsh',     pos:'CM',  group:'mid', status:'cleared' },
  { num: 8,  initials:'LB', name:'Liam Barker',      pos:'CM',  group:'mid', status:'ok' },
  { num: 12, initials:'RC', name:'Ryan Cole',        pos:'CM',  group:'mid', status:'ok' },
  { num: 16, initials:'DA', name:'Delano Ashton',    pos:'CM',  group:'mid', status:'ok' },
  { num: 19, initials:'JT', name:'James Tilley',     pos:'RW',  group:'mid', status:'ok' },
  { num: 21, initials:'MO', name:'Myles Okafor',     pos:'LW',  group:'mid', status:'ok' },
  { num: 23, initials:'JH', name:'J. Henderson',     pos:'CM',  group:'mid', status:'doubt' },
  { num: 37, initials:'ZB', name:'Zack Bright',      pos:'CM',  group:'mid', status:'ok' },
  // Forwards (6)
  { num: 7,  initials:'MO', name:'M. Osei',          pos:'ST',  group:'fwd', status:'out' },
  { num: 9,  initials:'CN', name:'Chris Nwosu',      pos:'ST',  group:'fwd', status:'out' },
  { num: 10, initials:'SP', name:'Sam Porter',       pos:'ST',  group:'fwd', status:'ok' },
  { num: 11, initials:'DM', name:'Dean Morris',      pos:'LW',  group:'fwd', status:'ok' },
  { num: 14, initials:'TW', name:'T. Walsh',         pos:'CF',  group:'fwd', status:'cleared' },
  { num: 18, initials:'AR', name:'Antwoine Rowe',    pos:'CF',  group:'fwd', status:'ok' },
]

export const FOOTBALL_INJURIES = [
  { name: 'J. Henderson', issue: 'Hamstring — assessment today',   back: '14:00 scan', status: 'rehab'    as const },
  { name: 'M. Osei',      issue: 'ACL reconstruction',             back: '4 months',   status: 'imaging'  as const },
  { name: 'T. Walsh',     issue: 'Suspended (3 matches served)',   back: 'Saturday',   status: 'cleared'  as const },
]

// ─── Sidebar nav (v2 visual) — IDs MUST match v1 SIDEBAR_ITEMS ids ───────
export type FbNavItem  = { id: string; label: string; icon: string; badge?: string }
export type FbNavGroup = { g: string; items: FbNavItem[] }

export const FOOTBALL_NAV_GROUPS: FbNavGroup[] = [
  { g: 'Overview', items: [
    { id: 'overview',  label: 'Dashboard',         icon: 'home' },
    { id: 'insights',  label: 'Insights',          icon: 'sparkles' },
    { id: 'board',     label: 'Board Suite',       icon: 'trophy' },
  ]},
  { g: 'Performance', items: [
    { id: 'matchday',   label: 'Match Day',        icon: 'flag' },
    { id: 'tactics',    label: 'Tactics',          icon: 'note' },
    { id: 'set-pieces', label: 'Set Pieces',       icon: 'crosshair' },
    { id: 'analytics',  label: 'Analytics',        icon: 'bars' },
    { id: 'training',   label: 'Training',         icon: 'lightning' },
    { id: 'preseason',  label: 'Pre-Season',       icon: 'calendar' },
  ]},
  { g: 'First Team', items: [
    { id: 'squad',      label: 'Squad',            icon: 'people' },
    { id: 'medical',    label: 'Medical',          icon: 'medical' },
    { id: 'dynamics',   label: 'Dynamics',         icon: 'medical' },
  ]},
  { g: 'GPS & Load', items: [
    { id: 'performance',  label: 'Performance & GPS', icon: 'wave',  badge: 'NEW' },
    { id: 'gps-heatmaps', label: 'Heatmaps',          icon: 'grid',  badge: 'NEW' },
    { id: 'gps-hardware', label: 'GPS Hardware',      icon: 'wave' },
  ]},
  { g: 'Recruitment', items: [
    { id: 'transfers',   label: 'Transfers',         icon: 'arrow-up-right' },
    { id: 'scouting',    label: 'Scouting',          icon: 'eye',   badge: 'NEW' },
    { id: 'wyscout',     label: 'Lumio Scout / Video',icon: 'play' },
    { id: 'scouting-db', label: 'Scouting Database', icon: 'search' },
    { id: 'academy',     label: 'Academy',           icon: 'arrow-up-right' },
  ]},
  { g: 'Commercial', items: [
    { id: 'media',     label: 'Media & PR',         icon: 'newspaper' },
    { id: 'social',    label: 'Social Media',       icon: 'mic' },
    { id: 'finance',   label: 'Finance',            icon: 'pound' },
    { id: 'psr',       label: 'Finance & PSR',      icon: 'pound' },
  ]},
  { g: 'Operations', items: [
    { id: 'staff',         label: 'Staff',           icon: 'people' },
    { id: 'facilities',    label: 'Facilities',      icon: 'pin' },
    { id: 'club-profile',  label: 'Club Profile',    icon: 'trophy' },
    { id: 'squad-planner', label: 'Squad Planner',   icon: 'note' },
  ]},
  { g: 'Data & Leagues', items: [
    { id: 'opta',             label: 'Lumio Data',           icon: 'bars' },
    { id: 'statsbomb',        label: 'Lumio Data',           icon: 'lightning' },
    { id: 'teams',            label: 'Teams',                icon: 'people' },
    { id: 'leagues',          label: 'Leagues & Tables',     icon: 'trophy' },
    { id: 'fixtures-results', label: 'Fixtures & Results',   icon: 'calendar' },
    { id: 'pyramid',          label: 'All Leagues',          icon: 'bars' },
    { id: 'find-club',        label: 'Find Club',            icon: 'search' },
    { id: 'find-player',      label: 'Find Player',          icon: 'crosshair' },
  ]},
  { g: 'Settings', items: [
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]},
]

export const FOOTBALL_ACCENT = {
  hex:    '#003DA5',
  dim:    'rgba(0,61,165,0.16)',
  border: 'rgba(0,61,165,0.45)',
}
