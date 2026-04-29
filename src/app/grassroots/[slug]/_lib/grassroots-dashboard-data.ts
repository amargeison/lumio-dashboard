// Grassroots v2 dashboard demo data — Sunday Rovers FC.
// Tone: warm, informal, real. Dave's mate. Pub lunch. Steve's car.
// This is Sunday league, not the Premier League. Keep it human.

export const GRASSROOTS_ORG = {
  club:        'Sunday Rovers FC',
  clubShort:   'Sunday Rovers',
  league:      'Westshire Sunday League · Div 2',
  manager:     'Dave Hopkins',
  date:        'Sat, 26 Apr 2026',
  weekOf:      'Match week · Round 18',
  quote:       '"The best teams have the most fun."',
  quoteAuthor: '— Grassroots wisdom',
  weather:     { tempC: 9, cond: 'Light rain', wind: '12 mph east' },
  season:      { played: 17, won: 6, drawn: 4, lost: 7, gd: -4, points: 22, position: 6, of: 12 },
}

// ─── Fixtures ───────────────────────────────────────────────────────────
export type GrassrootsFixture = {
  state: 'today' | 'upcoming'
  day: string; date: string; opp: string; venue: string; ko: string; comp: string
  status: string
  noteworthy?: string
}

export const GRASSROOTS_FIXTURES: GrassrootsFixture[] = [
  { state: 'today',    day: 'Sun', date: '27 Apr', opp: 'Red Lion FC',          venue: 'Oakridge Rec Pitch 3', ko: '10:30', comp: 'League',  status: 'Ref booked · pitch confirmed', noteworthy: 'Their #9 scored a hat-trick last week' },
  { state: 'upcoming', day: 'Sun', date: '04 May', opp: 'Station Arms',         venue: 'Westshire Park 1',     ko: '10:30', comp: 'League',  status: 'Away · need 2 cars' },
  { state: 'upcoming', day: 'Sun', date: '11 May', opp: 'Park View Rangers',     venue: 'Oakridge Rec Pitch 3', ko: '10:30', comp: 'League',  status: 'Home' },
  { state: 'upcoming', day: 'Sun', date: '18 May', opp: 'Oakridge Sunday',      venue: 'Crown Fields',         ko: '11:00', comp: 'League',  status: 'Away · derby' },
  { state: 'upcoming', day: 'Sun', date: '25 May', opp: 'Crown & Anchor FC',     venue: 'Oakridge Rec Pitch 3', ko: '10:30', comp: 'League',  status: 'Home · last game of season' },
]

// ─── Today (Sunday matchday) ───────────────────────────────────────────
export type GrassrootsScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const GRASSROOTS_TODAY: GrassrootsScheduleItem[] = [
  { t: '08:00', what: 'Check WhatsApp — who\'s available?',   where: 'Squad chat' },
  { t: '09:00', what: 'Pick up kit from lock-up',              where: 'Steve\'s garage' },
  { t: '09:30', what: 'Arrive at pitch — check conditions',     where: 'Oakridge Rec' },
  { t: '10:00', what: 'Warm-up',                                 where: 'Pitch 3' },
  { t: '10:30', what: 'KICK-OFF vs Red Lion FC',                 where: 'Pitch 3', highlight: true },
  { t: '12:30', what: 'Pub lunch — Red Lion (tradition)',         where: 'The Red Lion pub' },
]

// ─── Inbox ──────────────────────────────────────────────────────────────
export type GrassrootsInboxChannel = {
  ch: string; count: number; urgent: boolean; last: string; time: string
}

export const GRASSROOTS_INBOX: GrassrootsInboxChannel[] = [
  { ch: 'WhatsApp · Squad', count: 12, urgent: false, last: '4 can\'t make it, 2 maybes',                  time: '07:42' },
  { ch: 'Manager',          count: 1,  urgent: true,  last: 'Need to collect subs — 3 outstanding',         time: '07:14' },
  { ch: 'League',           count: 1,  urgent: false, last: 'Updated table — we\'re 6th',                   time: 'Yesterday' },
  { ch: 'Referee',          count: 1,  urgent: false, last: 'Ref confirmed for Sunday · changing rooms 09:30', time: '06:55' },
  { ch: 'Pitch booking',    count: 1,  urgent: false, last: 'Oakridge Pitch 3 confirmed Sunday 10:30',      time: 'Tuesday' },
]

export const GRASSROOTS_INBOX_BODIES: Record<string, { sender: string; body: string }> = {
  'WhatsApp · Squad': {
    sender: 'Squad Chat (16 members)',
    body: 'Replies in: Dave (yes), Steve (yes — bringing the kit), Mike (yes), Tom (yes), Marcus (yes), Andy (yes), Pete (yes), Jamie (yes), Liam (yes), Carl (yes), Reece (yes), Aiden (yes), Sam (yes). Out: Joe (work), Olly (kid\'s birthday), Rich (dodgy back). Maybes: Nick (might be hungover), Rob (depends on the missus). 13 confirmed, need 1 more — try Dave\'s mate from last month?',
  },
  'Manager': {
    sender: 'You (notes to self)',
    body: 'Subs collection — Joe, Olly and Rich still owe £5 from the away game last month. Will catch them at training on Tuesday. League registration fee due next month — £120, kitty has £86. Need to get a fresh match ball — old one is bald.',
  },
  'League': {
    sender: 'Westshire Sunday League — Match Secretary',
    body: 'Updated league table attached. Sunday Rovers FC currently 6th of 12, 22 points, GD −4. Fixtures for the rest of April and May confirmed. Any postponements must be notified by 18:00 Friday. Disciplinary report — no further action against any of your players this week.',
  },
  'Referee': {
    sender: 'Ref Allocator · Westshire SL',
    body: 'Ref confirmed for Sunday: Mark Eldridge (Level 6). He\'ll be at the pitch from 09:30 for the changing rooms and warm-up. Match fee £30 cash on the day (kitty). His phone is in the league directory if anything goes wrong with travel.',
  },
  'Pitch booking': {
    sender: 'Oakridge Recreation Centre',
    body: 'Pitch 3 confirmed for Sunday 27 April, 10:00–12:30. Changing rooms 1 + 2 booked. Please leave the pitch as you found it — no studs in the changing rooms please. Any issues call the duty manager on the number on the gate.',
  },
}

// ─── AI Morning Brief ──────────────────────────────────────────────────
export type GrassrootsAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const GRASSROOTS_AI_BRIEF: GrassrootsAIBriefItem[] = [
  { tag: 'squad',  pri: 'high', txt: 'Only 13 confirmed for Sunday. Need 1 more — try Dave\'s mate who played last month.' },
  { tag: 'ground', pri: 'med',  txt: 'Pitch 3 at Oakridge Rec. Changing rooms confirmed. Corner flags in the boot of Steve\'s car.' },
  { tag: 'money',  pri: 'med',  txt: '3 players owe subs (£5 each). League registration fee due next month (£120). Kitty has £86.' },
  { tag: 'op',     pri: 'low',  txt: 'Ref confirmed. Kit washed (thanks Steve). Need to buy new match ball — old one is bald.' },
]

// ─── Squad availability (no position grouping at grassroots) ───────────
// 16 names, status: 'in' | 'maybe' | 'out'. Initials drive the grid.
export type GrassrootsAvail = { name: string; status: 'in' | 'maybe' | 'out'; note?: string }

export const GRASSROOTS_SQUAD: GrassrootsAvail[] = [
  { name: 'Dave Hopkins',  status: 'in',    note: 'Captain' },
  { name: 'Steve Marsh',   status: 'in',    note: 'In goal — reluctantly' },
  { name: 'Mike Tanner',   status: 'in' },
  { name: 'Tom Owens',     status: 'in' },
  { name: 'Marcus Hill',   status: 'in' },
  { name: 'Andy Reid',     status: 'in' },
  { name: 'Pete Sands',    status: 'in' },
  { name: 'Jamie Walsh',   status: 'in' },
  { name: 'Liam Burke',    status: 'in' },
  { name: 'Carl Donnelly', status: 'in' },
  { name: 'Reece Mooney',  status: 'in' },
  { name: 'Aiden Park',    status: 'in' },
  { name: 'Sam Clarke',    status: 'in',    note: 'Limped off last week' },
  { name: 'Nick Fenton',   status: 'maybe', note: 'Hungover from stag do' },
  { name: 'Rob Cassidy',   status: 'maybe', note: 'Depends on the missus' },
  { name: 'Joe Watts',     status: 'out',   note: 'Work' },
]

// ─── Performance signals (4 simple) ────────────────────────────────────
export type GrassrootsPerfItem = { txt: string; delta?: string }

export const GRASSROOTS_PERF_INTEL: GrassrootsPerfItem[] = [
  { txt: 'Won 3 of last 5 — best form since October',          delta: 'on the up' },
  { txt: 'Conceded 3+ goals in 4 of last 8 away games',         delta: '−4 GD' },
  { txt: 'Dave leads scoring with 8 goals (next: 3)',           delta: '⚽ 8' },
  { txt: 'Clean sheets: 2 all season — defence needs work',     delta: '2 / 17' },
]

// ─── Recents ────────────────────────────────────────────────────────────
export type GrassrootsResult = { vs: string; res: 'W' | 'L' | 'D'; score: string; venue: string; date: string }

export const GRASSROOTS_RECENTS: GrassrootsResult[] = [
  { vs: 'Park View Rangers', res: 'W', score: '3–1', venue: 'Home', date: '20 Apr' },
  { vs: 'Oakridge Sunday',   res: 'L', score: '2–5', venue: 'Away', date: '13 Apr' },
  { vs: 'Crown & Anchor FC',  res: 'W', score: '2–0', venue: 'Home', date: '06 Apr' },
  { vs: 'Station Arms',      res: 'L', score: '1–4', venue: 'Away', date: '30 Mar' },
  { vs: 'Red Lion FC',       res: 'D', score: '3–3', venue: 'Home', date: '23 Mar' },
]

// ─── Stat tiles ────────────────────────────────────────────────────────
export const GRASSROOTS_TOP_STATS = [
  { label: 'Available',  value: '13/16', sub: 'Sunday',          tone: 'ok'     as const },
  { label: 'Subs owed',  value: '£15',   sub: '3 players',       tone: 'warn'   as const },
  { label: 'League pos', value: '6th',   sub: 'of 12 · 22 pts',  tone: 'accent' as const },
  { label: 'Form',       value: 'WLWLD', sub: 'last 5',          tone: 'ok'     as const },
]

// ─── Sidebar nav (presentation layer for v2 shell) ────────────────────
// IDs MUST match the v1 SIDEBAR_ITEMS ids verbatim or routing breaks.
export type GrassrootsNavItem = { id: string; label: string; icon: string; badge?: string }
export type GrassrootsNavGroup = { g: string; items: GrassrootsNavItem[] }

export const GRASSROOTS_NAV_GROUPS: GrassrootsNavGroup[] = [
  { g: 'Overview', items: [
    { id: 'overview',         label: 'Dashboard',         icon: 'home' },
    { id: 'morning-roundup',  label: 'Morning Roundup',   icon: 'sparkles', badge: 'NEW' },
  ]},
  { g: 'Match day', items: [
    { id: 'fixtures',         label: 'Fixtures',          icon: 'calendar' },
    { id: 'matchday',         label: 'Match Prep',        icon: 'trophy' },
    { id: 'fa-sunday-cup',    label: 'FA Sunday Cup',     icon: 'trophy', badge: 'NEW' },
    { id: 'halftime-talk',    label: 'Halftime Talk',     icon: 'mic',    badge: 'NEW' },
    { id: 'tactics',          label: 'Tactics',           icon: 'note' },
    { id: 'set-pieces',       label: 'Set Pieces',        icon: 'crosshair' },
  ]},
  { g: 'Squad', items: [
    { id: 'squad',            label: 'Squad List',         icon: 'people' },
    { id: 'availability',     label: 'Availability',       icon: 'check' },
    { id: 'discipline',       label: 'Discipline',         icon: 'flag' },
    { id: 'dbs-tracker',      label: 'DBS Tracker',        icon: 'shield', badge: 'NEW' },
    { id: 'player-profiles',  label: 'Player Profiles',    icon: 'people' },
    { id: 'development',      label: 'Development Notes',  icon: 'arrow-up-right' },
  ]},
  { g: 'Money', items: [
    { id: 'subs-tracker',     label: 'Subs Tracker',       icon: 'pound', badge: 'NEW' },
    { id: 'finances',         label: 'Kit Fund',           icon: 'pound' },
    { id: 'league-reg',       label: 'League Registration', icon: 'note' },
  ]},
  { g: 'Social', items: [
    { id: 'communications',   label: 'WhatsApp & Comms',   icon: 'mic' },
    { id: 'media',            label: 'Match Photos',       icon: 'newspaper', badge: 'NEW' },
  ]},
  { g: 'Ground', items: [
    { id: 'pitch',            label: 'Pitch Booking',      icon: 'pin' },
    { id: 'kit',              label: 'Kit & Equipment',    icon: 'briefcase' },
    { id: 'referee-bookings', label: 'Referee Bookings',   icon: 'eye',    badge: 'NEW' },
  ]},
  { g: 'Admin', items: [
    { id: 'safeguarding',     label: 'Safeguarding',       icon: 'shield' },
    { id: 'volunteers',       label: 'Volunteers',         icon: 'people' },
    { id: 'documents',        label: 'Documents',          icon: 'note' },
    { id: 'travel',           label: 'Travel & Logistics', icon: 'plane' },
  ]},
  { g: 'Juniors', items: [
    { id: 'juniors',          label: 'Junior Section',     icon: 'arrow-up-right', badge: 'NEW' },
  ]},
  { g: 'Club info', items: [
    { id: 'club-profile',     label: 'Club Profile',       icon: 'pin' },
    { id: 'history',          label: 'Club History',       icon: 'note' },
    { id: 'welfare',          label: 'Welfare',            icon: 'shield' },
    { id: 'preseason',        label: 'Pre-Season',         icon: 'calendar' },
    { id: 'settings',         label: 'Settings',           icon: 'settings' },
  ]},
]
