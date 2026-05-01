// Women's FC dashboard demo data. Mirrors the cricket / rugby / football v2
// shape so the womens dashboard modules can read it the same way.
// Tier: WSL Championship · Club: Oakridge Women FC.

export const WOMENS_ORG = {
  product:        'Lumio Women',
  club:           'Oakridge Women FC',
  clubShort:      'Oakridge Women FC',
  manager:        'Sarah Frost',
  director:       'Kate Brennan',
  greetingNameShort: 'Sarah',
  date:           'Sun, 03 May 2026',
  formation:      '4-3-3',
  weather:        { tempC: 13, cond: 'Light cloud', wind: '9 mph SW', kickoff: '14:00' },
  season:         { played: 18, won: 11, drawn: 3, lost: 4, position: 3, league: 'WSL Championship', points: 36, gd: '+18' },
} as const

// ─── StatTiles — includes FSR Score (the differentiator) ────────────────
export type WfStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent' | 'pink'
export type WfStatTile = { label: string; value: string | number; sub: string; tone: WfStatTone }

export const WOMENS_TOP_STATS: WfStatTile[] = [
  { label: 'Inbox',          value: 24, sub: '4 urgent',                tone: 'urgent' },
  { label: 'Approvals',      value: 4,  sub: 'awaiting',                tone: 'warn' },
  { label: 'Out · doubt',    value: 3,  sub: '2 inj · 1 protocol',     tone: 'danger' },
  { label: 'Today',          value: 8,  sub: 'sessions',                tone: 'ok' },
  { label: 'FSR Score',      value: '82%', sub: 'Compliant · 3 items', tone: 'accent' },
]

// ─── Inbox — includes Player Welfare + Sponsorship channels ─────────────
export type WfInboxChannel = {
  ch: string
  count: number
  tone: 'green' | 'red' | 'purple' | 'amber' | 'navy' | 'orange' | 'pink'
  urgent: boolean
  last: string
  time: string
}

export const WOMENS_INBOX: WfInboxChannel[] = [
  { ch: 'SMS · Coaches',         count: 2, tone: 'red',    urgent: true,  last: 'Carter cleared to play, scan negative',                 time: '07:14' },
  { ch: 'WhatsApp · Squad',      count: 5, tone: 'green',  urgent: false, last: 'Captain: morale high, good session today',              time: '07:42' },
  { ch: 'Email · Selectors',     count: 4, tone: 'red',    urgent: false, last: "WSL Championship — fixture amendment confirmed",       time: '06:58' },
  { ch: 'Agent messages',        count: 3, tone: 'navy',   urgent: false, last: 'Williams contract extension — deadline end of month',  time: '06:45' },
  { ch: 'Board messages',        count: 2, tone: 'navy',   urgent: false, last: 'Quarterly review Thursday',                              time: 'Yesterday' },
  { ch: 'Medical Hub',           count: 2, tone: 'red',    urgent: true,  last: 'Davies knee assessment — MRI results back',             time: '07:02' },
  { ch: 'Media & Press',         count: 3, tone: 'orange', urgent: false, last: "Northbridge Sport — women's game growth feature",       time: '07:11' },
  { ch: 'Player Welfare',        count: 1, tone: 'pink',   urgent: false, last: 'Quarterly wellbeing survey — 2 outstanding',            time: 'Yesterday' },
  { ch: 'Sponsorship',           count: 2, tone: 'amber',  urgent: false, last: 'Apex Performance activation — content shoot Friday',    time: '07:30' },
]

// ─── Fixtures ────────────────────────────────────────────────────────────
export type WfFixture = {
  day: string; date: string; opp: string; comp: string; venue: string;
  time: string; state: 'today' | 'tomorrow' | 'upcoming'; side: string;
  competitionTone?: 'league' | 'cup'
}

export const WOMENS_FIXTURES: WfFixture[] = [
  { day: 'Sun', date: '03 May', opp: 'Hartwell Women',         comp: 'WSL Championship',   venue: 'Home · Oakridge Stadium',  time: '14:00', state: 'today',    side: '1st team', competitionTone: 'league' },
  { day: 'Wed', date: '06 May', opp: 'Ashbourne Women FC',     comp: "Women's FA Cup R3",   venue: 'Away · Riverside Park',    time: '19:30', state: 'upcoming', side: '1st team', competitionTone: 'cup' },
  { day: 'Sun', date: '10 May', opp: 'Thornvale Ladies',       comp: 'WSL Championship',   venue: 'Away · Thornvale Stadium', time: '14:00', state: 'upcoming', side: '1st team', competitionTone: 'league' },
  { day: 'Sun', date: '17 May', opp: 'Kingsmere City Women',   comp: 'WSL Championship',   venue: 'Home · Oakridge Stadium',  time: '14:00', state: 'upcoming', side: '1st team', competitionTone: 'league' },
  { day: 'Wed', date: '20 May', opp: 'Ridgefield Athletic Women', comp: 'WSL Cup Semi-final', venue: 'Neutral · The Hive',     time: '19:45', state: 'upcoming', side: '1st team', competitionTone: 'cup' },
]

// ─── Today schedule (training day with welfare check-ins) ───────────────
export type WfScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const WOMENS_TODAY: WfScheduleItem[] = [
  { t: '08:00', what: 'Staff meeting · review + FSR check',     where: 'Boardroom' },
  { t: '09:30', what: 'First team training · possession',       where: 'Pitch 1' },
  { t: '10:30', what: 'Set pieces · corners + throw-ins',       where: 'Pitch 1' },
  { t: '11:30', what: 'Recovery · rotation management',         where: 'Gym + pool', highlight: true },
  { t: '13:00', what: 'Lunch + welfare check-ins',              where: 'Pavilion' },
  { t: '14:00', what: 'Media · pre-match interviews',           where: 'Press box' },
  { t: '15:00', what: 'Video analysis · opposition scout',      where: 'Analysis room' },
  { t: '16:00', what: 'Sponsorship meeting · Apex activation',  where: "Manager's office" },
]

// ─── Morning brief — WELFARE + COMPLIANCE are the differentiators ──────
export type WfAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const WOMENS_AI_BRIEF: WfAIBriefItem[] = [
  { tag: 'select',     pri: 'high', txt: 'Carter cleared after scan — returns to starting XI. Decision: partner with Davies or Williams in midfield?' },
  { tag: 'tactic',     pri: 'med',  txt: 'Sunday opponent sit deep, 5-4-1 block. Work on wide overloads + early crosses; their GK weak on high balls.' },
  { tag: 'medical',    pri: 'high', txt: 'Davies MRI — Grade 1 MCL, 2-3 weeks. Available for cup match if managed carefully.' },
  { tag: 'welfare',    pri: 'high', txt: 'Quarterly wellbeing survey 87% complete. 2 players amber on sleep quality — schedule 1-to-1s this week.' },
  { tag: 'compliance', pri: 'high', txt: 'FSR audit due end of month. 3 items outstanding: supporter forum minutes, diversity report, safeguarding refresher.' },
  { tag: 'op',         pri: 'med',  txt: 'Apex Performance content shoot Friday — 4 players needed. Check availability vs training schedule.' },
]

// ─── Performance signals ─────────────────────────────────────────────────
export type WfPerfItem = { txt: string; delta?: string; tone?: 'good' | 'bad' | 'neutral' }

export const WOMENS_PERF_INTEL: WfPerfItem[] = [
  { txt: 'xG differential +0.6 / match — best in division',                delta: '+0.1', tone: 'good' },
  { txt: 'Pass completion 84% — improving',                                delta: '+2.1 pp', tone: 'good' },
  { txt: 'Clean sheets 5 / 8 — best run this season',                       delta: '+2',   tone: 'good' },
  { txt: 'Pressing intensity PPDA 8.4 — 2nd in league',                    delta: '+0.8', tone: 'good' },
  { txt: 'Set-piece conversion 31% — above league avg 24%',                 delta: '+3 pp', tone: 'good' },
  { txt: 'Squad rotation: 18 of 23 players started this month',             delta: '+4',   tone: 'neutral' },
]

// ─── Recents ─────────────────────────────────────────────────────────────
export type WfResult = { vs: string; res: 'W' | 'L' | 'D'; score: string; date: string; comp: string }

export const WOMENS_RECENTS: WfResult[] = [
  { vs: 'Northgate Women',       res: 'W', score: '3 – 0', date: 'Sun 26 Apr', comp: 'WSL Champ' },
  { vs: 'Plymouth Argyle Women', res: 'W', score: '2 – 1', date: 'Sun 19 Apr', comp: 'WSL Champ' },
  { vs: 'Fernbrook Women',       res: 'D', score: '0 – 0', date: 'Sun 12 Apr', comp: 'WSL Champ' },
  { vs: 'Castleton Women',       res: 'W', score: '4 – 1', date: 'Sun 05 Apr', comp: "Women's FA Cup R2" },
  { vs: 'Glenmoor Wanderers W',  res: 'L', score: '1 – 2', date: 'Sun 29 Mar', comp: 'WSL Champ' },
]

export const WOMENS_SEASON_FORM: ('W' | 'L' | 'D')[] = ['W','D','W','W','L','W','D','W','W','L','D','W','W','L','W','W','D','W']

// ─── Squad availability — 23 players grouped GK / DEF / MID / FWD ──────
export type WfPlayerSlot = {
  num: number
  initials: string
  name: string
  pos: string
  group: 'gk' | 'def' | 'mid' | 'fwd'
  status: 'ok' | 'doubt' | 'out' | 'cleared'
}

export const WOMENS_SQUAD: WfPlayerSlot[] = [
  // Goalkeepers (3)
  { num: 1,  initials:'EH', name:'Ellie Hayes',     pos:'GK',  group:'gk',  status:'ok' },
  { num: 13, initials:'JM', name:'Jenna Marsh',     pos:'GK',  group:'gk',  status:'ok' },
  { num: 30, initials:'AP', name:'Amelia Parr',     pos:'GK',  group:'gk',  status:'ok' },
  // Defenders (7)
  { num: 2,  initials:'KO', name:'Kira Okonkwo',    pos:'RB',  group:'def', status:'ok' },
  { num: 3,  initials:'TF', name:'Tessa Foley',     pos:'LB',  group:'def', status:'ok' },
  { num: 4,  initials:'LB', name:'Lucy Brennan',    pos:'CB',  group:'def', status:'ok' },
  { num: 5,  initials:'MR', name:'Maya Reid',       pos:'CB',  group:'def', status:'ok' },
  { num: 15, initials:'CW', name:'Caitlin Webb',    pos:'CB',  group:'def', status:'ok' },
  { num: 17, initials:'BC', name:'Bea Chen',        pos:'CB',  group:'def', status:'doubt' },
  { num: 21, initials:'OM', name:'Olivia Marsh',    pos:'RB',  group:'def', status:'ok' },
  // Midfielders (7)
  { num: 6,  initials:'PG', name:'Priya Granger',   pos:'CDM', group:'mid', status:'ok' },
  { num: 8,  initials:'LB', name:'Lia Barker',      pos:'CM',  group:'mid', status:'ok' },
  { num: 10, initials:'NC', name:'Nia Carter',      pos:'CAM', group:'mid', status:'cleared' },
  { num: 12, initials:'RC', name:'Ria Cole',        pos:'CM',  group:'mid', status:'ok' },
  { num: 16, initials:'DA', name:'Demi Ashton',     pos:'CM',  group:'mid', status:'ok' },
  { num: 19, initials:'JT', name:'Jess Tilley',     pos:'RW',  group:'mid', status:'ok' },
  { num: 23, initials:'SD', name:'Sasha Davies',    pos:'CM',  group:'mid', status:'out' },
  // Forwards (6)
  { num: 7,  initials:'JM', name:'Jamie Morgan',    pos:'CF',  group:'fwd', status:'out' },
  { num: 9,  initials:'ZW', name:'Zara Williams',   pos:'ST',  group:'fwd', status:'ok' },
  { num: 11, initials:'DM', name:'Dani Morris',     pos:'LW',  group:'fwd', status:'ok' },
  { num: 14, initials:'RO', name:'Rita Okafor',     pos:'CF',  group:'fwd', status:'doubt' },
  { num: 18, initials:'AR', name:'Aria Rowe',       pos:'CF',  group:'fwd', status:'ok' },
  { num: 22, initials:'CP', name:'Carla Porter',    pos:'ST',  group:'fwd', status:'ok' },
]

export const WOMENS_INJURIES = [
  { name: 'S. Davies', issue: 'MCL Grade 1',                       back: '2-3 weeks',  status: 'rehab'    as const },
  { name: 'R. Okafor', issue: 'Concussion protocol Day 3',          back: 'Next week',  status: 'imaging'  as const },
  { name: 'J. Morgan', issue: 'ACL reconstruction',                 back: '5 months',   status: 'rehab'    as const },
]

// ─── Sidebar nav (v2 visual) — IDs MUST match v1 SIDEBAR_ITEMS ids ──────
export type WfNavItem  = { id: string; label: string; icon: string; badge?: string }
export type WfNavGroup = { g: string; items: WfNavItem[] }

export const WOMENS_NAV_GROUPS: WfNavGroup[] = [
  { g: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard',         icon: 'home' },
    { id: 'briefing',  label: 'Morning Briefing',  icon: 'sun' },
    { id: 'insights',  label: 'Insights',          icon: 'bars' },
  ]},
  { g: 'FSR Compliance', items: [
    { id: 'fsr',     label: 'FSR Dashboard',       icon: 'shield', badge: 'NEW' },
    { id: 'salary',  label: 'Salary Compliance',   icon: 'pound' },
    { id: 'revenue', label: 'Revenue Attribution', icon: 'bars' },
  ]},
  { g: 'Player Welfare', items: [
    { id: 'welfare',   label: 'Welfare Hub',         icon: 'medical', badge: 'NEW' },
    { id: 'mental',    label: 'Mental Health',       icon: 'sparkles', badge: 'NEW' },
    { id: 'acl',       label: 'ACL Risk Monitor',    icon: 'medical' },
    { id: 'cycle',     label: 'Cycle Tracking',      icon: 'sparkles' },
    { id: 'maternity', label: 'Maternity Tracker',   icon: 'people' },
  ]},
  { g: 'First Team', items: [
    { id: 'squad',    label: 'Squad Management',     icon: 'people' },
    { id: 'dualreg',  label: 'Dual Registration',    icon: 'arrow-up-right' },
    { id: 'tactics',  label: 'Tactics & Set Pieces', icon: 'crosshair' },
    { id: 'match',    label: 'Match Preparation',    icon: 'flag' },
    { id: 'analytics',label: 'Analytics',            icon: 'bars' },
    { id: 'halftime', label: 'AI Halftime Brief',    icon: 'sparkles' },
  ]},
  { g: 'GPS & Load', items: [
    { id: 'gps-load',     label: 'GPS & Load',  icon: 'wave', badge: 'NEW' },
    { id: 'gps-heatmaps', label: 'Heatmaps',    icon: 'grid', badge: 'NEW' },
  ]},
  { g: 'Recruitment', items: [
    { id: 'transfers', label: 'Transfers',  icon: 'arrow-up-right' },
    { id: 'scouting',  label: 'Scouting',   icon: 'eye', badge: 'NEW' },
    { id: 'academy',   label: 'Academy',    icon: 'arrow-up-right' },
  ]},
  { g: 'Commercial', items: [
    { id: 'sponsorship', label: 'Sponsorship Pipeline', icon: 'briefcase' },
    { id: 'standalone',  label: 'Standalone Tracker',   icon: 'crosshair' },
    { id: 'board',       label: 'Board Suite',          icon: 'trophy' },
    { id: 'financial',   label: 'Financial Planning',   icon: 'pound' },
    { id: 'media',       label: 'Media & Content',      icon: 'newspaper' },
    { id: 'social',      label: 'Social Media',         icon: 'mic' },
    { id: 'fanhub',      label: 'Fan Hub',              icon: 'people' },
  ]},
  { g: 'Operations', items: [
    { id: 'team',      label: 'Staff Directory',  icon: 'people' },
    { id: 'medical',   label: 'Medical Records',  icon: 'medical' },
    { id: 'preseason', label: 'Pre-Season',       icon: 'calendar' },
    { id: 'settings',  label: 'Settings',         icon: 'settings' },
  ]},
]

export const WOMENS_ACCENT = {
  hex:    '#BE185D',
  dim:    'rgba(190,24,93,0.16)',
  border: 'rgba(190,24,93,0.45)',
}
