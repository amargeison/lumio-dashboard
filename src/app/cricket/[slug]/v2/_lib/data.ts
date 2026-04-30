// Cricket portal redesign — demo data, ported from shared/data.jsx in the
// design handoff bundle. Field names map 1:1 to module props per the
// README's "Server data shape can be inferred from shared/data.jsx" note.
//
// Names already pass the demo-name scrub (no current pros, fictional staff).

export const ORG = {
  product:           'Lumio Cricket',
  club:              'Oakridge Cricket Club',
  clubShort:         'Oakridge CC',
  director:          'James Whitlock',
  greetingName:      'Director',
  greetingNameShort: 'James',
  date:              'Sat, 26 Apr 2026',
  weekOf:            'Week 17 · 2026',
  quote:             '"Cricket is a game which the British, not being a spiritual people, had to invent in order to give themselves some conception of eternity."',
  quoteAuthor:       '— Lord Mancroft',
  weather: { tempC: 9, cond: 'Partly cloudy', wind: '11 mph SW', sunrise: '06:03', sunset: '20:14', firstBall: '11:00' },
  season:  { played: 12, won: 8, lost: 3, drawn: 1, position: 2, league: 'County Championship Div 1' },
}

export type StatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type StatTile = { label: string; value: string | number; sub: string; tone: StatTone; kind: string }

export const TOP_STATS: StatTile[] = [
  { label: 'Inbox',        value: 18,      sub: '4 urgent',     tone: 'urgent', kind: 'inbox' },
  { label: 'Approvals',    value: 3,       sub: 'awaiting',     tone: 'warn',   kind: 'approve' },
  { label: 'On bench',     value: 2,       sub: 'injured',      tone: 'danger', kind: 'injury' },
  { label: 'Today',        value: 5,       sub: 'sessions',     tone: 'ok',     kind: 'sessions' },
  { label: 'Net runs',     value: '+0.42', sub: 'season',       tone: 'accent', kind: 'nrr' },
]

export type InboxChannel = {
  ch: string
  count: number
  tone: 'green' | 'red' | 'purple' | 'amber' | 'navy' | 'orange'
  urgent: boolean
  last: string
  time: string
}

export const INBOX: InboxChannel[] = [
  { ch: 'WhatsApp · Squad',    count: 12, tone: 'green',  urgent: false, last: 'Karan: pitch looks dry…',     time: '07:42' },
  { ch: 'Email · Selectors',   count: 4,  tone: 'red',    urgent: true,  last: 'Hartley availability for Sat', time: '06:58' },
  { ch: 'Slack · Coaches',     count: 6,  tone: 'purple', urgent: false, last: 'New bowling drill plan',       time: '07:11' },
  { ch: 'SMS · Players',       count: 2,  tone: 'amber',  urgent: false, last: 'Reed unavailable Wed',         time: '07:30' },
  { ch: 'Agent messages',      count: 3,  tone: 'red',    urgent: true,  last: 'Patel’s contract draft',  time: '06:45' },
  { ch: 'Board messages',      count: 1,  tone: 'navy',   urgent: false, last: 'Quarterly review docs',        time: 'Yesterday' },
  { ch: 'Media & Press',       count: 4,  tone: 'orange', urgent: false, last: 'Telegraph match preview',      time: '07:02' },
  { ch: 'Parents & families',  count: 7,  tone: 'red',    urgent: true,  last: 'U17 transport to away',        time: '07:18' },
  { ch: 'Membership',          count: 2,  tone: 'green',  urgent: false, last: 'Renewal flagged x2',           time: '06:30' },
  { ch: 'Academy',             count: 1,  tone: 'green',  urgent: false, last: 'Pathway update for Reed',      time: 'Yesterday' },
]

export type Fixture = {
  day: string; date: string; opp: string; comp: string; venue: string;
  time: string; toss?: string; forecast?: string; state: 'today' | 'tomorrow' | 'upcoming'; side: string
}

export const FIXTURES: Fixture[] = [
  { day: 'Sat', date: '26 Apr', opp: 'Loxwood CC', comp: 'County Championship', venue: 'Home · Oakridge Park', time: '11:00', toss: '10:30', forecast: '☁ 11° · light wind', state: 'today',    side: '1st XI' },
  { day: 'Sun', date: '27 Apr', opp: 'Highford County', comp: 'T20 Blast',     venue: 'Away · Crown Park Cricket Ground', time: '14:30',                              state: 'tomorrow', side: '1st XI' },
  { day: 'Wed', date: '30 Apr', opp: 'Crewe',      comp: 'One Day Cup',          venue: 'Home · Oakridge Park', time: '11:00',                                          state: 'upcoming', side: '1st XI' },
  { day: 'Sat', date: '03 May', opp: 'Westmarsh CC', comp: 'County Championship', venue: 'Away · Westmarsh Park', time: '11:00',                                       state: 'upcoming', side: '1st XI' },
]

export type ScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const TODAY: ScheduleItem[] = [
  { t: '07:00', what: 'Light fielding · 2nd XI', where: 'Nets 3' },
  { t: '08:30', what: 'Team breakfast',          where: 'Pavilion' },
  { t: '10:30', what: 'Toss — vs Loxwood',       where: 'Centre wicket', highlight: true },
  { t: '11:00', what: 'First ball · day 1',      where: 'Oakridge Park', highlight: true },
  { t: '13:00', what: 'Lunch interval',          where: 'Pavilion' },
  { t: '17:30', what: 'Press scrum',             where: 'Press box' },
]

export type AIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const AI_BRIEF: AIBriefItem[] = [
  { tag: 'select', pri: 'high', txt: 'Hartley flagged 6/10 fitness — likely 12th man for Sat.' },
  { tag: 'tactic', pri: 'med',  txt: 'Loxwood’s top-3 strike at 8.4 vs left-arm seam — open with Patel.' },
  { tag: 'op',     pri: 'med',  txt: 'Kit van scheduled 06:30 · driver confirmed.' },
  { tag: 'risk',   pri: 'high', txt: '34% chance of weather-shortened day after 16:00.' },
]

export type PerfItem = { txt: string; delta?: string }

export const PERF_INTEL: PerfItem[] = [
  { txt: 'Top season run scorer · Patel — 482 runs', delta: '+1.4σ' },
  { txt: 'Leading wicket taker · Reed — 18 wkts',     delta: '+0.9σ' },
  { txt: 'Last 5 batsmen avg 14 vs LA-spin — drill scheduled' },
  { txt: 'Catches: U16 +24% on rolling 6-week window' },
  { txt: 'Death over economy 9.2 — mark for review' },
]

export type Injury = { name: string; issue: string; back: string; status: 'rehab' | 'imaging' | 'cleared' }

export const INJURIES: Injury[] = [
  { name: 'D. Hartley',  issue: 'Hamstring grade I',     back: 'May 4',   status: 'rehab' },
  { name: 'M. Trescott', issue: 'Lumbar strain',         back: 'May 11',  status: 'imaging' },
  { name: 'A. Reed',     issue: 'Concussion protocol',   back: 'cleared', status: 'cleared' },
]

export type Result = { vs: string; res: 'W' | 'L' | 'D'; score: string; date: string }

export const RECENTS: Result[] = [
  { vs: 'Easthaven CCC 2nd XI', res: 'W', score: '262/8 (50) · 247 ao (49.2)', date: 'Mon 21 Apr' },
  { vs: 'Aldermount County',    res: 'W', score: '188/5 (T20) · 182/9',         date: 'Sat 19 Apr' },
  { vs: 'Tideford County',      res: 'L', score: '198 ao · 199/4',              date: 'Wed 16 Apr' },
  { vs: 'Calderbrook 2s',       res: 'W', score: '331 ao · 290 ao',             date: 'Sat 12 Apr' },
  { vs: 'Halden CCC',           res: 'D', score: '402/9 dec · 245/6',           date: 'Tue 08 Apr' },
]

export const SEASON_FORM: ('W' | 'L' | 'D')[] = ['W','W','L','W','D','W','W','L','W','W','L','W']

export const SQUAD_INITIALS = [
  'JW','AP','BR','TC','MK','LS','DH','RO','KP','TF','NB',
  'LC','MT','AR','EP','JH','SD','RG','HN','OF','TL','VS',
]

// Sidebar nav — flat groups → items, mirrors the LIVE cricket portal's
// SECTIONED_NAV (src/app/cricket/[slug]/page.tsx) so the redesign keeps
// every destination the live Director sees today (Insights, ECB
// Compliance, EDI, Safeguarding, Finance, Pre-Season, etc).
//
// IDs match the live page's section IDs verbatim — when the rest of the
// redesign rounds wire destination pages, role-based filtering can be
// lifted from CRICKET_ROLE_CONFIG.sidebar without rewriting any of this.
export type NavItem  = { id: string; label: string; icon: string; badge?: string }
export type NavGroup = { g: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  { g: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard',        icon: 'home' },
    { id: 'briefing',  label: 'Morning Briefing', icon: 'sun' },
    { id: 'insights',  label: 'Insights',         icon: 'bars' },
  ]},
  { g: 'Performance', items: [
    { id: 'match-centre',       label: 'Match Centre',         icon: 'flag' },
    { id: 'livescores',         label: 'Live Scores',          icon: 'dot' },
    { id: 'ai-innings-brief',   label: 'AI Innings Brief',     icon: 'sparkles', badge: 'NEW' },
    { id: 'batting-analytics',  label: 'Batting Analytics',    icon: 'bars' },
    { id: 'bowling-analytics',  label: 'Bowling Analytics',    icon: 'crosshair' },
    { id: 'video-analysis',     label: 'Video Analysis',       icon: 'play' },
    { id: 'opposition',         label: 'Opposition Scout',     icon: 'eye' },
    { id: 'practice-log',       label: 'Practice Log',         icon: 'note' },
    { id: 'declaration',        label: 'Declaration Planner',  icon: 'note' },
    { id: 'dls',                label: 'D/L Calculator',       icon: 'cloud' },
    { id: 'net-planner',        label: 'Net Session Planner',  icon: 'calendar' },
    { id: 'performance-stats',  label: 'Performance Stats',    icon: 'lightning' },
    { id: 'match-report',       label: 'Match Report',         icon: 'note' },
  ]},
  { g: 'Welfare', items: [
    { id: 'mental-performance', label: 'Mental Performance',   icon: 'sparkles', badge: 'NEW' },
  ]},
  { g: 'GPS & Load', items: [
    { id: 'gps',              label: 'GPS Tracking',     icon: 'wave',  badge: 'NEW' },
    { id: 'bowling-workload', label: 'Bowling Workload', icon: 'flame', badge: 'NEW' },
    { id: 'gps-heatmaps',     label: 'Heatmaps',         icon: 'grid',  badge: 'NEW' },
  ]},
  { g: 'Squad', items: [
    { id: 'squad',          label: 'Squad Manager',     icon: 'people' },
    { id: 'medical',        label: 'Medical Hub',       icon: 'medical' },
    { id: 'pathway',        label: 'Player Pathway',    icon: 'arrow-up-right' },
    { id: 'overseas',       label: 'Overseas Players',  icon: 'plane' },
    { id: 'contract-hub',   label: 'Contract Hub',      icon: 'briefcase' },
    { id: 'agent-pipeline', label: 'Agent Pipeline',    icon: 'briefcase' },
    { id: 'signings',       label: 'Signing Pipeline',  icon: 'crosshair' },
  ]},
  { g: 'Competitions', items: [
    { id: 'county-championship', label: 'County Championship', icon: 'trophy' },
    { id: 'vitality-blast',      label: 'T20 Blast',           icon: 'lightning' },
    { id: 'od-cup',              label: 'One Day Cup',         icon: 'trophy' },
    { id: 'the-hundred',         label: 'The Hundred',         icon: 'trophy' },
    { id: 'womens',              label: 'Women’s Cricket',     icon: 'trophy' },
    { id: 'academy',             label: 'Academy & Youth',     icon: 'arrow-up-right' },
  ]},
  { g: 'Grounds', items: [
    { id: 'grounds', label: 'Grounds & Facilities', icon: 'pin', badge: 'NEW' },
  ]},
  { g: 'Comms', items: [
    { id: 'media-hub', label: 'Media Hub', icon: 'megaphone', badge: 'NEW' },
  ]},
  { g: 'Operations', items: [
    { id: 'operations', label: 'Operations',          icon: 'wrench',   badge: 'NEW' },
    { id: 'staff',      label: 'Staff & HR',          icon: 'people' },
    { id: 'facilities', label: 'Facilities & Grounds',icon: 'pin' },
    { id: 'kit',        label: 'Kit & Equipment',     icon: 'briefcase' },
    { id: 'travel',     label: 'Travel & Logistics',  icon: 'plane' },
    { id: 'team-comms', label: 'Team Comms',          icon: 'mic' },
    { id: 'preseason',  label: 'Pre-Season',          icon: 'calendar', badge: 'NEW' },
  ]},
  { g: 'Commercial', items: [
    { id: 'commercial',      label: 'Commercial',           icon: 'briefcase' },
    { id: 'sponsorship',     label: 'Sponsorship Pipeline', icon: 'briefcase' },
    { id: 'media',           label: 'Media & Content',      icon: 'newspaper' },
    { id: 'ticket-matchday', label: 'Ticket & Match Day',   icon: 'ticket' },
    { id: 'fan-engagement',  label: 'Fan Engagement',       icon: 'people' },
  ]},
  { g: 'Governance', items: [
    { id: 'board',        label: 'Board Suite',     icon: 'bars' },
    { id: 'compliance',   label: 'ECB Compliance',  icon: 'note' },
    { id: 'edi',          label: 'EDI Dashboard',   icon: 'globe' },
    { id: 'safeguarding', label: 'Safeguarding',    icon: 'shield' },
    { id: 'finance',      label: 'Finance',         icon: 'pound' },
    { id: 'settings',     label: 'Settings',        icon: 'settings' },
  ]},
]
