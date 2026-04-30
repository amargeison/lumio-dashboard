// Rugby Director-of-Rugby dashboard demo data. Mirrors the cricket v2
// data.ts shape (cricket reads modules from import) so the rugby
// dashboard modules can consume it the same way. Names are invented or
// match the existing rugby demo shell (Hartfield RFC).

export const RUGBY_ORG = {
  product:           'Lumio Rugby',
  club:              'Hartfield RFC',
  clubShort:         'Hartfield RFC',
  director:          'Steve Whitfield',
  greetingName:      'Director of Rugby',
  greetingNameShort: 'Steve',
  date:              'Sat, 11 Apr 2026',
  weekOf:            'Round 24 · 2025/26',
  weather: { tempC: 11, cond: 'Light rain', wind: '14 mph SW', firstWhistle: '15:00' },
  season:  { played: 18, won: 11, lost: 6, drawn: 1, position: 4, league: 'Champ Rugby' },
} as const

// ─── StatTiles ───────────────────────────────────────────────────────────
export type RugbyStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type RugbyStatTile = { label: string; value: string | number; sub: string; tone: RugbyStatTone; kind: string }

export const RUGBY_TOP_STATS: RugbyStatTile[] = [
  { label: 'Inbox',       value: 22,      sub: '5 urgent',  tone: 'urgent', kind: 'inbox' },
  { label: 'Approvals',   value: 4,       sub: 'awaiting',  tone: 'warn',   kind: 'approve' },
  { label: 'On bench',    value: 3,       sub: 'injured',   tone: 'danger', kind: 'injury' },
  { label: 'Today',       value: 6,       sub: 'sessions',  tone: 'ok',     kind: 'sessions' },
  { label: 'League pts',  value: 52,      sub: '+3 last R', tone: 'accent', kind: 'pts' },
]

// ─── Inbox ───────────────────────────────────────────────────────────────
export type RugbyInboxChannel = {
  ch: string
  count: number
  tone: 'green' | 'red' | 'purple' | 'amber' | 'navy' | 'orange'
  urgent: boolean
  last: string
  time: string
}

export const RUGBY_INBOX: RugbyInboxChannel[] = [
  { ch: 'SMS · Coaches',      count: 2, tone: 'red',    urgent: true,  last: 'Ellison: confirm Saturday XV',          time: '07:14' },
  { ch: 'WhatsApp · Squad',   count: 5, tone: 'green',  urgent: false, last: 'Captain group chat — bus details',      time: '07:42' },
  { ch: 'Email · Selectors',  count: 4, tone: 'red',    urgent: true,  last: 'Henderson cleared by physio',           time: '06:58' },
  { ch: 'Agent messages',     count: 2, tone: 'red',    urgent: true,  last: 'Patel — contract renewal terms',        time: '06:45' },
  { ch: 'Board messages',     count: 1, tone: 'navy',   urgent: false, last: 'Q3 financial summary',                  time: 'Yesterday' },
  { ch: 'Medical Hub',        count: 3, tone: 'red',    urgent: true,  last: 'Williams — concussion Day 4 of 6',      time: '07:02' },
  { ch: 'Media & Press',      count: 2, tone: 'orange', urgent: false, last: 'Northbridge Sport — pre-match',         time: '07:11' },
  { ch: 'Academy',            count: 1, tone: 'green',  urgent: false, last: 'Okonkwo — England U20 call-up',         time: 'Yesterday' },
  { ch: 'Slack · Coaches',    count: 4, tone: 'purple', urgent: false, last: 'New lineout call — review Friday',      time: '07:30' },
]

// ─── Fixtures ────────────────────────────────────────────────────────────
export type RugbyFixture = {
  day: string; date: string; opp: string; comp: string; venue: string;
  time: string; kickoff?: string; forecast?: string;
  state: 'today' | 'tomorrow' | 'upcoming'; side: string
}

export const RUGBY_FIXTURES: RugbyFixture[] = [
  { day: 'Sat', date: '11 Apr', opp: 'Jersey Reds',  comp: 'Champ Rugby',  venue: 'Home · The Grange',     time: '15:00', kickoff: '15:00', forecast: '☔ 11° · light rain', state: 'today',    side: '1st XV' },
  { day: 'Sat', date: '18 Apr', opp: 'Bath RFC',     comp: 'Champ Rugby',  venue: 'Away · The Rec',        time: '14:30', state: 'upcoming', side: '1st XV' },
  { day: 'Sat', date: '25 Apr', opp: 'Coventry',     comp: 'Champ Rugby',  venue: 'Home · The Grange',     time: '15:00', state: 'upcoming', side: '1st XV' },
  { day: 'Sat', date: '02 May', opp: 'Doncaster',    comp: 'Champ Rugby',  venue: 'Away · Castle Park',    time: '15:00', state: 'upcoming', side: '1st XV' },
  { day: 'Sat', date: '09 May', opp: 'Saracens',     comp: 'Premiership Cup', venue: 'Home · The Grange',  time: '14:00', state: 'upcoming', side: '1st XV' },
]

// ─── Today schedule ──────────────────────────────────────────────────────
export type RugbyScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const RUGBY_TODAY: RugbyScheduleItem[] = [
  { t: '07:00', what: 'Gym & S&C — forwards',         where: 'High-performance suite' },
  { t: '08:30', what: 'Team meeting — weekly review', where: 'Boardroom' },
  { t: '09:30', what: 'Unit session — lineout + scrum', where: 'Pitch 2' },
  { t: '11:00', what: 'Full squad training',          where: 'The Grange', highlight: true },
  { t: '13:00', what: 'Media session · Northbridge',  where: 'Press box' },
  { t: '14:30', what: 'Recovery — pool session',      where: 'Aquatics centre' },
  { t: '15:30', what: 'Video review — last match',    where: 'Analysis room' },
  { t: '16:30', what: '1-to-1 player meetings',       where: "DoR's office" },
]

// ─── Morning brief ───────────────────────────────────────────────────────
export type RugbyAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const RUGBY_AI_BRIEF: RugbyAIBriefItem[] = [
  { tag: 'select',  pri: 'high', txt: 'Henderson cleared by physio — available for Saturday. Decision: start or bench?' },
  { tag: 'tactic',  pri: 'med',  txt: 'Lineout success 68% last 3 matches — below 75% target. Review throwing options with Jones.' },
  { tag: 'medical', pri: 'high', txt: 'Williams concussion protocol — Day 4 of 6. No contact training until Thursday earliest.' },
  { tag: 'risk',    pri: 'high', txt: 'Scrum penalty count 4.2/match — referee Saturday is strict on engagement. Drill bind timing.' },
  { tag: 'op',      pri: 'med',  txt: 'Academy flanker Okonkwo called up to England U20 camp — confirm release by Wednesday.' },
  { tag: 'tactic',  pri: 'low',  txt: 'Jersey Reds breakdown speed averaging 3.4s — slow our jackal target to 3.0s under pressure.' },
]

// ─── Performance signals ─────────────────────────────────────────────────
export type RugbyPerfItem = { txt: string; delta?: string; tone?: 'good' | 'bad' | 'neutral' }

export const RUGBY_PERF_INTEL: RugbyPerfItem[] = [
  { txt: 'Tackle success 89% — season avg 91%, trending down',         delta: '−2 pp', tone: 'bad' },
  { txt: 'Metres gained 412/match — above league avg (385)',            delta: '+7%',  tone: 'good' },
  { txt: 'Lineout win 68% last 3 — below 75% target',                   delta: '−7 pp', tone: 'bad' },
  { txt: 'Scrum penalty rate 4.2/match — above 3.0 threshold',          delta: '+40%', tone: 'bad' },
  { txt: 'Discipline 12.3 pen/match — worst run last 4 weeks',          delta: '+1.8', tone: 'bad' },
  { txt: 'Carry dominance 58% — 1st in division',                       delta: '+3 pp', tone: 'good' },
]

// ─── Recents ─────────────────────────────────────────────────────────────
export type RugbyResult = { vs: string; res: 'W' | 'L' | 'D'; score: string; date: string }

export const RUGBY_RECENTS: RugbyResult[] = [
  { vs: 'Bedford Blues',     res: 'W', score: '27 – 18',  date: 'Sat 04 Apr' },
  { vs: 'Cornish Pirates',   res: 'L', score: '14 – 31',  date: 'Sat 28 Mar' },
  { vs: 'London Scottish',   res: 'W', score: '34 – 10',  date: 'Sat 21 Mar' },
  { vs: 'Ealing Trailfinders',res: 'W', score: '21 – 17', date: 'Sat 14 Mar' },
  { vs: 'Caldy RFC',         res: 'D', score: '20 – 20',  date: 'Sat 07 Mar' },
]

export const RUGBY_SEASON_FORM: ('W' | 'L' | 'D')[] = ['W','W','D','L','W','W','L','W','D','W','L','W','W','W','L','W','W','D']

// ─── Squad availability ──────────────────────────────────────────────────
// 15 starters numbered 1-15 + 8 bench numbered 16-23. Rugby positional.
export type RugbyPlayerSlot = {
  num: number
  initials: string
  name: string
  pos: string
  group: 'forwards' | 'backs' | 'bench'
  status: 'ok' | 'doubt' | 'out' | 'cleared'
}

export const RUGBY_STARTERS: RugbyPlayerSlot[] = [
  { num: 1,  initials:'TH', name:'Tom Harrison',  pos:'Loosehead',   group:'forwards', status:'ok' },
  { num: 2,  initials:'JB', name:'James Briggs',  pos:'Hooker',      group:'forwards', status:'ok' },
  { num: 3,  initials:'PD', name:'Phil Dowd',     pos:'Tighthead',   group:'forwards', status:'ok' },
  { num: 4,  initials:'MW', name:'Marcus Webb',   pos:'Lock',        group:'forwards', status:'ok' },
  { num: 5,  initials:'CP', name:'Chris Palmer',  pos:'Lock',        group:'forwards', status:'ok' },
  { num: 6,  initials:'KF', name:'Karl Foster',   pos:'Blindside',   group:'forwards', status:'ok' },
  { num: 7,  initials:'JW', name:'Josh White',    pos:'Openside',    group:'forwards', status:'ok' },
  { num: 8,  initials:'DF', name:'Danny Foster',  pos:'No.8',        group:'forwards', status:'out' },
  { num: 9,  initials:'SE', name:'Sam Ellis',     pos:'Scrum-half',  group:'backs',    status:'ok' },
  { num: 10, initials:'DC', name:'Danny Cole',    pos:'Fly-half',    group:'backs',    status:'doubt' },
  { num: 11, initials:'BT', name:'Ben Taylor',    pos:'Wing',        group:'backs',    status:'ok' },
  { num: 12, initials:'MJ', name:'Matt Jones',    pos:'Inside Centre',group:'backs',   status:'ok' },
  { num: 13, initials:'DO', name:'David Obi',     pos:'Outside Centre',group:'backs',  status:'ok' },
  { num: 14, initials:'RP', name:'Ryan Patel',    pos:'Wing',        group:'backs',    status:'doubt' },
  { num: 15, initials:'LB', name:'Luke Barnes',   pos:'Fullback',    group:'backs',    status:'ok' },
]

export const RUGBY_BENCH: RugbyPlayerSlot[] = [
  { num: 16, initials:'NH', name:'Nathan Hollis', pos:'Hooker',      group:'bench', status:'ok' },
  { num: 17, initials:'JR', name:'Jake Rawlings', pos:'Prop',        group:'bench', status:'ok' },
  { num: 18, initials:'CD', name:'Craig Dunne',   pos:'Prop',        group:'bench', status:'ok' },
  { num: 19, initials:'TF', name:'Tom Foley',     pos:'Lock',        group:'bench', status:'ok' },
  { num: 20, initials:'AR', name:'Ali Rashid',    pos:'Flanker',     group:'bench', status:'cleared' },
  { num: 21, initials:'OG', name:'Oliver Grant',  pos:'Scrum-half',  group:'bench', status:'ok' },
  { num: 22, initials:'CW', name:'Connor Walsh',  pos:'Fly-half',    group:'bench', status:'ok' },
  { num: 23, initials:'JS', name:'Jack Summers',  pos:'Centre',      group:'bench', status:'ok' },
]

export const RUGBY_INJURIES = [
  { name: 'D. Williams',  issue: 'Concussion protocol Day 4', back: 'Thu',     status: 'rehab'    as const },
  { name: 'M. Trescott',  issue: 'Ankle ligament',            back: 'May 14',  status: 'imaging'  as const },
  { name: 'D. Foster',    issue: 'HIA — Day 8',               back: '19 Apr',  status: 'rehab'    as const },
  { name: 'R. Osei',      issue: 'Calf — cleared',            back: 'cleared', status: 'cleared'  as const },
]

// ─── Sidebar nav (v2 visual layout) ──────────────────────────────────────
// IDs MUST match the existing rugby `activeSection` switch in page.tsx
// (line 5723 in v1). Icons are Lucide name strings.
export type RugbyNavItem  = { id: string; label: string; icon: string; badge?: string }
export type RugbyNavGroup = { g: string; items: RugbyNavItem[] }

export const RUGBY_NAV_GROUPS: RugbyNavGroup[] = [
  { g: 'Overview', items: [
    { id: 'dashboard',     label: 'Club Dashboard',  icon: 'home' },
    { id: 'dorbriefing',   label: 'DoR Briefing',    icon: 'sun' },
    { id: 'insights',      label: 'Insights',        icon: 'bars' },
    { id: 'matchday',      label: 'Match Day Centre',icon: 'flag' },
    { id: 'calendar',      label: 'Club Calendar',   icon: 'calendar' },
    { id: 'preseason',     label: 'Pre-Season',      icon: 'calendar', badge: 'NEW' },
  ]},
  { g: 'Performance', items: [
    { id: 'video-analysis',  label: 'Video Analysis',     icon: 'play' },
    { id: 'match-stats',     label: 'Match Stats',        icon: 'bars' },
    { id: 'setpiece',        label: 'Set Piece Analytics',icon: 'crosshair' },
    { id: 'carryanalytics',  label: 'Carry Analytics',    icon: 'lightning' },
    { id: 'training-planner',label: 'Training Planner',   icon: 'note' },
    { id: 'periodisation',   label: 'Periodisation',      icon: 'bars' },
  ]},
  { g: 'Medical & Welfare', items: [
    { id: 'medical',         label: 'Medical Records',     icon: 'medical' },
    { id: 'concussion',      label: 'Concussion & HIA',    icon: 'shield', badge: 'NEW' },
    { id: 'rtp',             label: 'Return to Play',      icon: 'medical' },
    { id: 'welfareaudit',    label: 'Welfare Audit',       icon: 'shield' },
    { id: 'mentalperformance',label:'Mental Performance',  icon: 'sparkles', badge: 'NEW' },
  ]},
  { g: 'GPS & Load', items: [
    { id: 'gps-load',        label: 'GPS & Load',          icon: 'wave', badge: 'NEW' },
    { id: 'gps-heatmaps',    label: 'Heatmaps',            icon: 'grid', badge: 'NEW' },
  ]},
  { g: 'Squad', items: [
    { id: 'availability',    label: 'Squad Availability',  icon: 'people' },
    { id: 'selection',       label: 'Selection Planner',   icon: 'note' },
    { id: 'playerprofile',   label: 'Player Profiles',     icon: 'people' },
    { id: 'international',   label: 'International Duty',  icon: 'globe' },
    { id: 'loans',           label: 'Loan Management',     icon: 'arrow-up-right' },
  ]},
  { g: 'Salary Cap', items: [
    { id: 'capdashboard',    label: 'Cap Dashboard',       icon: 'pound' },
    { id: 'contracts',       label: 'Player Contracts',    icon: 'briefcase' },
    { id: 'scenario',        label: 'Scenario Modeller',   icon: 'bars' },
    { id: 'audittrail',      label: 'Audit Trail',         icon: 'note' },
  ]},
  { g: 'Recruitment', items: [
    { id: 'scouting',        label: 'Scouting Pipeline',   icon: 'eye' },
    { id: 'capimpact',       label: 'Cap Impact Modeller', icon: 'pound' },
    { id: 'agents',          label: 'Agent Contacts',      icon: 'briefcase' },
    { id: 'targets',         label: 'Targets Shortlist',   icon: 'crosshair' },
  ]},
  { g: 'Franchise', items: [
    { id: 'readiness',       label: 'Readiness Score',     icon: 'trophy' },
    { id: 'criteria',        label: 'Criteria Tracker',    icon: 'check' },
    { id: 'eoi',             label: 'Expression of Interest',icon: 'note' },
    { id: 'gapanalysis',     label: 'Gap Analysis',        icon: 'bars' },
  ]},
  { g: 'Commercial', items: [
    { id: 'sponsorship',     label: 'Sponsorship Pipeline',icon: 'briefcase' },
    { id: 'matchdayrev',     label: 'Matchday Revenue',    icon: 'pound' },
    { id: 'stadium',         label: 'Stadium & Venue',     icon: 'pin' },
    { id: 'activation',      label: 'Partnership Activation',icon: 'crosshair' },
    { id: 'mediahr',         label: 'Media & Content',     icon: 'newspaper' },
    { id: 'fanhub',          label: 'Fan Hub',             icon: 'people' },
  ]},
  { g: "Women's Rugby", items: [
    { id: 'womenssquad',     label: "Women's Squad",       icon: 'people' },
    { id: 'pwrcompliance',   label: 'PWR Compliance',      icon: 'shield' },
    { id: 'sharedfacilities',label: 'Shared Facilities',   icon: 'pin' },
    { id: 'womenscommercial',label: "Women's Commercial",  icon: 'briefcase' },
  ]},
  { g: 'Intelligence', items: [
    { id: 'aibriefing',      label: 'AI Morning Briefing', icon: 'sparkles' },
    { id: 'halftime',        label: 'AI Halftime Brief',   icon: 'sparkles' },
    { id: 'clubtocountry',   label: 'Club-to-Country',     icon: 'globe' },
    { id: 'opposition',      label: 'Opposition Analysis', icon: 'eye' },
    { id: 'industrynews',    label: 'Industry News',       icon: 'newspaper' },
  ]},
]

// Rugby accent (purple) for the v2 module styling.
export const RUGBY_ACCENT = {
  hex:    '#a855f7',
  dim:    'rgba(168,85,247,0.14)',
  border: 'rgba(168,85,247,0.4)',
}
