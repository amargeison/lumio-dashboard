// Boxing v2 dashboard data — Marcus Cole "The Machine".
//
// Mirrors rugby/cricket v2 data shape so the v2 module components consume it
// the same way. Names are stable demo values; the live demo persona reads its
// fight stats from the BoxingFighter object in page.tsx, but the v2 modules
// (HeroToday, FightCampStatus, AIBrief, Inbox, MyTeam, Perf, Recents) source
// their copy from this file so the dashboard stays self-contained.

export const BOXING_ORG = {
  product:           'Lumio Boxing',
  fighterShort:      'Marcus Cole',
  fighterFull:       'Marcus Cole',
  nickname:          'The Machine',
  greetingNameShort: 'Marcus',
  date:              'Wed, 29 Apr 2026',
  weekOf:            'Camp Day 22 / 70',
  trainer:           'Jim Bevan',
  manager:           'Danny Walsh',
  rankings: { wbc: 6, ibf: 12, wba: 9, wbo: 8 },
  weight:  { current: 97.8, target: 92.7, unit: 'kg' as const },
  camp:    { day: 22, total: 70 },
  record:  { wins: 28, losses: 2, ko: 19 },
} as const

export const BOXING_NEXT_FIGHT = {
  opponent:        'Viktor Petrov',
  opponentRanking: 'WBC #3',
  venue:           'Crown Park Stadium',
  city:            'London',
  daysAway:        48,
  broadcast:       'DAZN PPV',
  acwr:            1.12,
  weightCutPerDay: 0.11,
} as const

// ─── StatTiles ───────────────────────────────────────────────────────────
export type BoxingStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type BoxingStatTile = { label: string; value: string | number; sub: string; tone: BoxingStatTone; kind: string }

export const BOXING_TOP_STATS: BoxingStatTile[] = [
  { label: 'WBC',       value: '#6',      sub: 'World ranking',  tone: 'accent', kind: 'wbc' },
  { label: 'IBF',       value: '#12',     sub: 'Federation',     tone: 'warn',   kind: 'ibf' },
  { label: 'Weight',    value: '97.8kg',  sub: '→ 92.7kg target', tone: 'warn',  kind: 'weight' },
  { label: 'Camp Day',  value: '22/70',   sub: '31% complete',   tone: 'ok',     kind: 'camp' },
  { label: 'Fight',     value: '48d',     sub: 'Crown Park',     tone: 'urgent', kind: 'fight' },
]

// ─── Inbox ───────────────────────────────────────────────────────────────
export type BoxingInboxChannel = {
  ch: string
  count: number
  tone: 'red' | 'orange' | 'green' | 'amber' | 'cyan' | 'pink' | 'purple' | 'navy'
  urgent: boolean
  last: string
  time: string
}

export const BOXING_INBOX: BoxingInboxChannel[] = [
  { ch: 'Manager · Danny Walsh',    count: 2, tone: 'red',    urgent: true,  last: 'DAZN contract confirmed — PPV deal',                  time: '07:14' },
  { ch: 'Promoter Desk',            count: 1, tone: 'orange', urgent: true,  last: 'Crown Park venue confirmed · 4 nights hotel block',   time: '06:58' },
  { ch: 'Physio & Medical',         count: 1, tone: 'pink',   urgent: true,  last: 'Jim flagged right hand rewrap — book Dr Mitchell 09:00', time: '07:02' },
  { ch: 'Media & Sponsor',          count: 2, tone: 'amber',  urgent: false, last: 'Apex Performance camp video — outstanding from March', time: '07:11' },
  { ch: 'Weight Check',             count: 1, tone: 'green',  urgent: false, last: 'Daily cut 0.11kg/day · log before 09:00',             time: '07:00' },
  { ch: 'Travel & Camp',            count: 2, tone: 'cyan',   urgent: false, last: 'Corner team flights booked BA LHR→LCY',               time: '06:40' },
  { ch: 'Agent · James Wright',     count: 1, tone: 'navy',   urgent: false, last: 'Apex Performance deal — £85k camp ambassador',        time: 'Yesterday' },
  { ch: 'Fan Mail',                 count: 4, tone: 'purple', urgent: false, last: '4 new messages — signed glove requests',              time: 'Yesterday' },
]

// ─── Today schedule ──────────────────────────────────────────────────────
export type BoxingScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const BOXING_TODAY: BoxingScheduleItem[] = [
  { t: '07:00', what: 'Weight log + breakfast',                where: 'Camp HQ' },
  { t: '09:00', what: 'Pad work — Jim Bevan',                  where: 'Main gym',                                  highlight: true },
  { t: '11:00', what: 'Sparring 8 rds vs Darnell Hughes',      where: 'Ring 2 · southpaw rounds',                  highlight: true },
  { t: '13:00', what: 'Lunch + recovery',                      where: 'Athlete kitchen' },
  { t: '14:00', what: 'DAZN interview prep — talking points',  where: 'Media room' },
  { t: '15:00', what: 'Strength — upper body power',           where: 'S&C suite — Ricky Dunn' },
  { t: '16:30', what: 'Film study — Petrov last 3 fights',     where: 'Analysis room' },
  { t: '18:00', what: 'Physio — shoulder + ice bath',          where: 'Recovery suite' },
]

// ─── AI Brief ────────────────────────────────────────────────────────────
export type BoxingAIBriefCategory = 'fight' | 'weight' | 'training' | 'medical' | 'sponsor' | 'op'
export type BoxingAIBriefItem = { tag: BoxingAIBriefCategory; pri: 'high' | 'med' | 'low'; txt: string }

export const BOXING_AI_BRIEF: BoxingAIBriefItem[] = [
  { tag: 'fight',    pri: 'high', txt: 'Fight 48 days away — Viktor Petrov (WBC #3) at Crown Park Stadium, London. Camp day 22/70. On track for power peak.' },
  { tag: 'weight',   pri: 'high', txt: 'Weight 97.8kg → 92.7kg target. Daily cut: 0.11kg/day. Log today before 09:00.' },
  { tag: 'training', pri: 'med',  txt: 'Sparring 8 rds vs Darnell Hughes at 11:00 — southpaw rounds to prep for Petrov. Jim flagged right hand rewrap.' },
  { tag: 'medical',  pri: 'high', txt: 'Jim Bevan flagged right hand rewrap — book Dr Mitchell 09:00. Shoulder mobility session 18:00.' },
  { tag: 'sponsor',  pri: 'med',  txt: 'DAZN interview prep today — talking points needed by 14:00. Apex Performance camp video content outstanding from March.' },
  { tag: 'op',       pri: 'low',  txt: 'Crown Park fight week hotel confirmed — Canary Wharf Marriott, 4 nights. Corner team flights booked BA LHR→LCY.' },
]

// ─── My Team — corner team ───────────────────────────────────────────────
export type BoxingTeamMember = {
  name: string
  role: string
  status: string
  initials: string
  tone: 'red' | 'orange' | 'amber' | 'cyan' | 'green' | 'purple' | 'pink'
}

export const BOXING_MY_TEAM: BoxingTeamMember[] = [
  { name: 'Jim Bevan',       role: 'Trainer',          status: 'Sparring review 16:00',          initials: 'JB', tone: 'red' },
  { name: 'Danny Walsh',     role: 'Manager',          status: 'DAZN contract confirmed',        initials: 'DW', tone: 'orange' },
  { name: 'Dr Amir Patel',   role: 'Physio',           status: 'Shoulder check tomorrow',        initials: 'AP', tone: 'amber' },
  { name: 'James Wright',    role: 'Agent',            status: 'Apex Performance deal £85k',     initials: 'JW', tone: 'cyan' },
  { name: 'Darnell Hughes',  role: 'Sparring Partner', status: '11:00 southpaw rounds',          initials: 'DH', tone: 'green' },
  { name: 'Dr Mitchell',     role: 'Ring Doctor',      status: 'Hand rewrap 09:00',              initials: 'DM', tone: 'pink' },
  { name: 'Ricky Dunn',      role: 'S&C Coach',        status: 'Adding 2nd interval block Thu',  initials: 'RD', tone: 'purple' },
]

// ─── Performance signals ─────────────────────────────────────────────────
export type BoxingPerfItem = { txt: string; delta?: string; tone?: 'good' | 'bad' | 'neutral' }

export const BOXING_PERF_INTEL: BoxingPerfItem[] = [
  { txt: 'Sparring power output up 8% last 5 sessions',                  delta: '+3% vs season avg', tone: 'good' },
  { txt: 'Weight cut on track — 5.1kg to go in 48 days',                  delta: '0.11kg/day',       tone: 'neutral' },
  { txt: 'ACWR 1.12 — optimal zone, load ramping correctly',              delta: 'optimal',          tone: 'good' },
  { txt: 'WBC #6 / IBF #12 — win opens mandatory shot Q4',                delta: '+1 ranking',       tone: 'good' },
  { txt: 'Round 9-12 work rate dipped 4% vs earlier camps',               delta: '−4%',              tone: 'bad' },
]

// ─── Recents — last 5 fights ─────────────────────────────────────────────
export type BoxingFightResult = {
  vs: string
  res: 'W' | 'L' | 'D'
  method: string
  date: string
}

export const BOXING_RECENTS: BoxingFightResult[] = [
  { vs: 'D. Merrick',  res: 'W', method: 'TKO R7',      date: 'Feb 2026' },
  { vs: 'T. Hartwell', res: 'W', method: 'UD 12',       date: 'Nov 2025' },
  { vs: 'J. Donovan',  res: 'W', method: 'KO R3',       date: 'Aug 2025' },
  { vs: 'L. Brenner',  res: 'L', method: 'SD 12',       date: 'Apr 2025' },
  { vs: 'M. Ashby',    res: 'W', method: 'UD 10',       date: 'Dec 2024' },
]

export const BOXING_FORM_LAST5: ('W' | 'L' | 'D')[] = ['W','W','W','L','W']

// ─── Sidebar nav (v2 visual layout) ──────────────────────────────────────
// IDs MUST map to existing activeSection values in boxing/[slug]/page.tsx
// `renderView` switch (around line 10444). Items the spec called for that
// don't have a 1:1 view (Smart Flights, VADA/UKAD Check, Purse Breakdown,
// Camp Content) are surfaced via Quick Actions modals — they're omitted
// from the nav rather than routed to the closest neighbour.
export type BoxingNavItem  = { id: string; label: string; icon: string; badge?: string }
export type BoxingNavGroup = { g: string; items: BoxingNavItem[] }

export const BOXING_NAV_GROUPS: BoxingNavGroup[] = [
  { g: 'Overview', items: [
    { id: 'camp',             label: 'Dashboard',           icon: 'home' },
    { id: 'aibriefing',       label: 'Morning Briefing',    icon: 'sun' },
    { id: 'briefing',         label: 'Fighter Briefing',    icon: 'note' },
    { id: 'training',         label: 'Training Log',        icon: 'flame' },
  ]},
  { g: 'Fight Prep', items: [
    { id: 'fightcamp',        label: 'Fight Camp',          icon: 'flag' },
    { id: 'fight-night',      label: 'Fight Night Ops',     icon: 'flag' },
    { id: 'campcosts',        label: 'Camp Costs',          icon: 'pound' },
    { id: 'opposition',       label: 'Opponent Study',      icon: 'eye' },
    { id: 'sparring',         label: 'Sparring Log',        icon: 'note' },
    { id: 'opscout',          label: 'Opposition Scout',    icon: 'play' },
  ]},
  { g: 'Performance', items: [
    { id: 'punchanalytics',   label: 'Punch Analytics',     icon: 'lightning' },
    { id: 'gps-heatmaps',     label: 'Heatmaps',            icon: 'grid' },
    { id: 'gps',              label: 'GPS',                 icon: 'wave' },
  ]},
  { g: 'Weight & Health', items: [
    { id: 'weight',           label: 'Weight Tracker',      icon: 'wave' },
    { id: 'cut',              label: 'Cut Planner',         icon: 'flame' },
    { id: 'recovery',         label: 'Recovery & HRV',      icon: 'cloud' },
    { id: 'medical',          label: 'Medical Record',      icon: 'medical' },
    { id: 'physio-recovery',  label: 'Physio & Recovery',   icon: 'sparkles' },
  ]},
  { g: 'Rankings', items: [
    { id: 'rankings',         label: 'World Rankings',      icon: 'trophy' },
    { id: 'mandatory',        label: 'Mandatory Tracker',   icon: 'shield' },
    { id: 'pathtotitle',      label: 'Path to Title',       icon: 'crosshair' },
    { id: 'pursebid',         label: 'Purse Bid Alerts',    icon: 'bell' },
    { id: 'career',           label: 'Career Planning',     icon: 'arrow-up-right' },
  ]},
  { g: 'Financials', items: [
    { id: 'pursesim',         label: 'Purse Simulator',     icon: 'pound' },
    { id: 'earnings',         label: 'Fight Earnings',      icon: 'pound' },
    { id: 'tax',              label: 'Tax Tracker',         icon: 'bars' },
  ]},
  { g: 'Team', items: [
    { id: 'teamoverview',     label: 'Team Overview',       icon: 'people' },
    { id: 'trainernotes',     label: 'Trainer Notes',       icon: 'note' },
    { id: 'managerdash',      label: 'Manager Dashboard',   icon: 'briefcase' },
    { id: 'agentintel',       label: 'Agent Intel',         icon: 'briefcase' },
    { id: 'promoterpipeline', label: 'Promoter Pipeline',   icon: 'mic' },
  ]},
  { g: 'Commercial', items: [
    { id: 'sponsorships',     label: 'Sponsorships',        icon: 'briefcase' },
    { id: 'media',            label: 'Media & Content',     icon: 'newspaper' },
    { id: 'appearances',      label: 'Appearance Fees',     icon: 'mic' },
    { id: 'contracts',        label: 'Contract Tracker',    icon: 'note' },
  ]},
  { g: 'Career', items: [
    { id: 'fightrecord',      label: 'Fight Record',        icon: 'trophy' },
    { id: 'careerstats',      label: 'Career Stats',        icon: 'bars' },
  ]},
  { g: 'Intel', items: [
    { id: 'broadcasttracker', label: 'Broadcast Tracker',   icon: 'play' },
    { id: 'news',             label: 'Industry News',       icon: 'newspaper' },
  ]},
  { g: 'Tools', items: [
    { id: 'travel',           label: 'Travel & Logistics',  icon: 'plane' },
    { id: 'findpro',          label: 'Find a Pro',          icon: 'search' },
    { id: 'integrations',     label: 'Integrations',        icon: 'wrench' },
    { id: 'settings',         label: 'Settings',            icon: 'settings' },
  ]},
]

// Boxing accent (red).
export const BOXING_ACCENT = {
  hex:    '#ef4444',
  dim:    'rgba(239,68,68,0.14)',
  border: 'rgba(239,68,68,0.4)',
}
