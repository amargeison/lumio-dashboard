// Darts dashboard demo data. Mirrors the cricket / rugby / football v2 shape.
// Individual athlete — squad-grid replaced by MyTeam (support staff).
// Right player-card column stays in page.tsx.

export const DARTS_ORG = {
  product:           'Lumio Darts',
  player:            'Jake "The Hammer" Morrison',
  playerShort:       'Jake Morrison',
  manager:           'Dave Askew',
  greetingNameShort: 'Jake',
  date:              'Thu, 23 Apr 2026',
  nationality:       'English',
  tour:              'PDC',
  ranking:           19,
  threeDartAvg:      97.8,
  checkout:          42.3,
  oneEighties:       4.2,
  floorAvg:          97.3,
  tvAvg:             99.1,
  doublesPct:        38.2,
  season:            { wins: 36, losses: 19, oneEighties: 312, prizeMoney: 687000, position: 19 },
} as const

// ─── StatTiles ───────────────────────────────────────────────────────────
export type DtStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type DtStatTile = { label: string; value: string | number; sub: string; tone: DtStatTone }

export const DARTS_TOP_STATS: DtStatTile[] = [
  { label: 'Tonight',        value: '18:30',    sub: 'Euro Champ R1', tone: 'urgent' },
  { label: 'PDC Rank',       value: '#19',      sub: '£687k career',  tone: 'accent' },
  { label: '3-dart avg',     value: 97.8,       sub: '+0.8 vs LW',    tone: 'ok' },
  { label: 'Checkout %',     value: '42.3%',    sub: '−1.8 pp',       tone: 'warn' },
  { label: '180s/match',     value: 4.2,        sub: 'tour avg 3.1',  tone: 'accent' },
]

// ─── Inbox ───────────────────────────────────────────────────────────────
export type DtInboxChannel = {
  ch: string
  count: number
  tone: 'green' | 'red' | 'purple' | 'amber' | 'navy' | 'orange'
  urgent: boolean
  last: string
  time: string
}

export const DARTS_INBOX: DtInboxChannel[] = [
  { ch: 'Sponsor · Vanta',       count: 2, tone: 'red',    urgent: true,  last: 'Barrel review video 14:00 — bring backup set',   time: '07:14' },
  { ch: 'Manager · Askew',       count: 1, tone: 'navy',   urgent: false, last: 'Crown Wagers deal — £85k, decision needed',       time: '07:42' },
  { ch: 'Agent messages',        count: 2, tone: 'navy',   urgent: false, last: 'Crown Wagers ambassador inquiry — respond Apr 25',time: '06:58' },
  { ch: 'Media & Press',         count: 1, tone: 'orange', urgent: false, last: 'Northbridge Sport pre-match interview request',   time: '06:45' },
  { ch: 'Travel desk',           count: 2, tone: 'amber',  urgent: false, last: 'Dortmund hotel confirmed · Prague flights pending',time: 'Yesterday' },
  { ch: 'Practice partner',      count: 1, tone: 'green',  urgent: false, last: 'Mark Webb: Board 4, 10:00 confirmed',              time: '07:02' },
  { ch: 'WhatsApp',              count: 3, tone: 'green',  urgent: false, last: 'Tour group chat — travel details for Prague',      time: '07:30' },
  { ch: 'Equipment · Tom',       count: 1, tone: 'purple', urgent: false, last: 'New barrel prototype arrived — test today',        time: '07:11' },
]

// ─── Tournament schedule ────────────────────────────────────────────────
export type DtFixture = {
  day: string; date: string; opp: string; comp: string; venue: string;
  time: string; format: string; prize: string; entry: 'Confirmed' | 'Submitted' | 'Pending';
  state: 'today' | 'upcoming'; side: string
}

export const DARTS_FIXTURES: DtFixture[] = [
  { day: 'Thu', date: '23 Apr', opp: 'D. Merrick',   comp: 'European Championship · R1', venue: 'Westfalenhallen, Dortmund',  time: '18:30', format: 'Bo11',  prize: '£110,000', entry: 'Confirmed', state: 'today',    side: 'Singles' },
  { day: 'Sat', date: '02 May', opp: 'TBD R32',      comp: 'Players Championship 12',     venue: 'Robin Park Arena, Wigan',    time: '12:00', format: 'Bo11',  prize: '£75,000',  entry: 'Confirmed', state: 'upcoming', side: 'Singles' },
  { day: 'Wed', date: '07 May', opp: 'TBD',          comp: 'European Tour Event 5',       venue: "Fortuna Arena, Prague",      time: '13:00', format: 'Bo11',  prize: '£140,000', entry: 'Confirmed', state: 'upcoming', side: 'Singles' },
  { day: 'Sat', date: '07 Jun', opp: 'TBD R64',      comp: 'World Series · Amsterdam',    venue: 'AFAS Live, Amsterdam',       time: 'TBC',   format: 'Bo15',  prize: '£200,000', entry: 'Submitted', state: 'upcoming', side: 'Singles' },
  { day: 'Sat', date: '08 Nov', opp: 'TBD',          comp: 'Grand Slam of Darts',         venue: 'Aldersley Leisure Village',  time: 'TBC',   format: 'Bo19',  prize: '£650,000', entry: 'Pending',   state: 'upcoming', side: 'Singles' },
]

// ─── Today schedule ──────────────────────────────────────────────────────
export type DtScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const DARTS_TODAY: DtScheduleItem[] = [
  { t: '08:00', what: 'Breakfast + travel review',           where: 'Hotel · Dortmund' },
  { t: '10:00', what: 'Practice · D16 checkout focus',       where: 'Hotel practice room' },
  { t: '12:00', what: 'Venue arrival · Westfalenhallen',     where: 'Players entrance' },
  { t: '13:00', what: 'Board allocation + throw practice',   where: 'Practice boards 4–6' },
  { t: '14:00', what: 'Vanta Sports · barrel review video',  where: 'Press tent' },
  { t: '16:00', what: 'Pre-match routine · Dr Marshall',     where: 'Players area' },
  { t: '18:30', what: 'Walk-on · vs D. Merrick (R1)',        where: 'Centre stage', highlight: true },
  { t: '21:00', what: 'Post-match media · if through',       where: 'Mixed zone' },
]

// ─── Morning brief ───────────────────────────────────────────────────────
export type DtAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const DARTS_AI_BRIEF: DtAIBriefItem[] = [
  { tag: 'match',    pri: 'high', txt: 'European Championship R1 tonight vs D. Merrick (#7) — Westfalenhallen. Win = £110,000 + ranking points. H2H: 2-1.' },
  { tag: 'practice', pri: 'high', txt: 'D16 checkout focus 10:00. Doubles % 38.2 — below 40% target. Last 3 sessions trending up (+1.4%).' },
  { tag: 'sponsor',  pri: 'med',  txt: 'Vanta Sports barrel review at 14:00 — bring backup set. Crown Wagers ambassador deal response due Apr 25.' },
  { tag: 'travel',   pri: 'med',  txt: 'Dortmund hotel confirmed. Prague flights need booking for Euro Tour next week — check Fortuna Arena practice times.' },
  { tag: 'ranking',  pri: 'high', txt: 'PDC #19. Win tonight + semi-final = move to #16. Order of Merit gap to #15: 2,400 pts.' },
  { tag: 'op',       pri: 'low',  txt: 'Walk-on music clearance confirmed — Northbridge Sport ✓, Crown TV ✓, Continental DE ✓.' },
]

// ─── My Team — replaces Squad grid for individual athlete ───────────────
export type DtTeamMember = {
  initials: string
  name: string
  role: string
  status: 'green' | 'amber' | 'red'
  next: string
}

export const DARTS_MY_TEAM: DtTeamMember[] = [
  { initials: 'DA', name: 'Dave Askew',         role: 'Manager',           status: 'green', next: 'Crown Wagers deal call' },
  { initials: 'MW', name: 'Mark Webb',          role: 'Practice Partner',  status: 'green', next: 'Board 4 · 10:00' },
  { initials: 'JM', name: 'Dr James Marshall',  role: 'Sports Psych',      status: 'green', next: 'Pre-match routine 16:00' },
  { initials: 'SC', name: 'Sarah Chen',         role: 'Media Manager',     status: 'amber', next: 'Vanta Sports shoot 14:00' },
  { initials: 'TR', name: 'Tom Richards',       role: 'Equipment Tech',    status: 'green', next: 'Barrel prototype ready' },
  { initials: 'CW', name: 'Coach Williams',     role: 'Throwing Coach',    status: 'green', next: 'D16 focus session' },
]

// ─── Performance signals ─────────────────────────────────────────────────
export type DtPerfItem = { txt: string; delta?: string; tone?: 'good' | 'bad' | 'neutral' }

export const DARTS_PERF_INTEL: DtPerfItem[] = [
  { txt: '3-dart avg 97.8 — up vs last week, form trending well',      delta: '+0.8',   tone: 'good' },
  { txt: 'Checkout % 38.2 — below 40% target',                          delta: '−1.8 pp', tone: 'bad' },
  { txt: '180s/match 4.2 — above tour avg 3.1',                         delta: '+0.4',   tone: 'good' },
  { txt: 'D16 hit rate 34% — worst double, drill target this week',     delta: '−6 pp',  tone: 'bad' },
  { txt: 'TV avg 99.1 vs floor 97.3 — performs better on stage',        delta: '+1.8',   tone: 'good' },
  { txt: 'First-9 avg 102.4 last 5 matches — top 10 in league',         delta: '+1.2',   tone: 'good' },
]

// ─── Recents ─────────────────────────────────────────────────────────────
export type DtResult = { vs: string; res: 'W' | 'L'; score: string; date: string; comp: string }

export const DARTS_RECENTS: DtResult[] = [
  { vs: 'T. Hartwell',  res: 'W', score: '6-3',     date: '21 Apr', comp: 'Euro Tour' },
  { vs: 'D. Merrick',   res: 'L', score: '4-6',     date: '14 Apr', comp: 'PC 11' },
  { vs: 'J. Donovan',   res: 'W', score: '6-2',     date: '13 Apr', comp: 'PC 11' },
  { vs: 'M. Ashby',     res: 'W', score: '6-1',     date: '08 Apr', comp: 'Euro Tour' },
  { vs: 'L. Brenner',   res: 'W', score: '6-4',     date: '06 Apr', comp: 'Grand Prix' },
]

export const DARTS_FORM: ('W' | 'L')[] = ['W','W','W','L','W','W','L','W','W','W','L','W','W','W','L']

// ─── Sidebar nav (v2 visual) — IDs MUST match v1 SIDEBAR_ITEMS ids ──────
export type DtNavItem  = { id: string; label: string; icon: string; badge?: string }
export type DtNavGroup = { g: string; items: DtNavItem[] }

export const DARTS_NAV_GROUPS: DtNavGroup[] = [
  { g: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard',         icon: 'home' },
    { id: 'briefing',  label: 'Morning Briefing',  icon: 'sun' },
    { id: 'insights',  label: 'Insights',          icon: 'bars' },
  ]},
  { g: 'Match Day', items: [
    { id: 'matchprep',   label: 'Match Prep',          icon: 'flag' },
    { id: 'opponent',    label: 'Opponent Intel',      icon: 'eye' },
    { id: 'checkout',    label: 'Checkout Analysis',   icon: 'crosshair' },
  ]},
  { g: 'Performance', items: [
    { id: 'rankings',    label: 'Rankings Tracker',    icon: 'trophy', badge: 'NEW' },
    { id: 'averages',    label: 'Averages & Stats',    icon: 'bars' },
    { id: 'practice',    label: 'Practice Log',        icon: 'note' },
    { id: 'oneeighties', label: '180s Analysis',       icon: 'lightning', badge: 'NEW' },
    { id: 'doubles',     label: 'Doubles Tracker',     icon: 'crosshair', badge: 'NEW' },
  ]},
  { g: 'Mental', items: [
    { id: 'mental',      label: 'Mental Performance',  icon: 'sparkles', badge: 'NEW' },
    { id: 'routine',     label: 'Pre-Match Routine',   icon: 'check' },
  ]},
  { g: 'Commercial', items: [
    { id: 'sponsorship', label: 'Sponsorship',         icon: 'briefcase' },
    { id: 'finance',     label: 'Financial',           icon: 'pound' },
    { id: 'media',       label: 'Media & Content',     icon: 'newspaper' },
  ]},
  { g: 'Tour', items: [
    { id: 'travel',          label: 'Travel & Logistics',  icon: 'plane' },
    { id: 'calendar',        label: 'Tournament Calendar', icon: 'calendar' },
    { id: 'hotel',           label: 'Hotel Finder',        icon: 'pin' },
    { id: 'accreditations',  label: 'Accreditations',      icon: 'note' },
    { id: 'walkon',          label: 'Walk-On Music',       icon: 'mic' },
  ]},
  { g: 'Career', items: [
    { id: 'orderofmerit', label: 'Order of Merit Tracker', icon: 'arrow-up-right' },
    { id: 'career',       label: 'Career Planning',        icon: 'briefcase' },
  ]},
  { g: 'Tools', items: [
    { id: 'equipment',     label: 'Equipment Manager', icon: 'crosshair' },
    { id: 'practicegames', label: 'Practice Games',    icon: 'play' },
  ]},
]

export const DARTS_ACCENT = {
  hex:    '#22c55e',
  dim:    'rgba(34,197,94,0.16)',
  border: 'rgba(34,197,94,0.45)',
}
