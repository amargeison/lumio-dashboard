// Tennis dashboard demo data. Mirrors the cricket / rugby / football v2 shape.
// Tennis is INDIVIDUAL ATHLETE — squad-grid is replaced by MyTeam (support
// staff card list). Right player-profile card stays in page.tsx.

export const TENNIS_ORG = {
  product:           'Lumio Tennis',
  player:            'Alex Rivera',
  playerShort:       'Alex',
  coach:             'Marco Bianchi',
  greetingNameShort: 'Alex',
  date:              'Tue, 22 Apr 2026',
  nationality:       'British',
  tour:              'ATP Tour',
  ranking:           67,
  raceRanking:       54,
  points:            1847,
  careerHigh:        44,
  season:            { wins: 24, losses: 11, titles: 2, race: 54, position: 67 },
} as const

// ─── StatTiles ───────────────────────────────────────────────────────────
export type TnStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type TnStatTile = { label: string; value: string | number; sub: string; tone: TnStatTone }

export const TENNIS_TOP_STATS: TnStatTile[] = [
  { label: 'Match today',  value: '13:00',   sub: 'QF · Court 4',  tone: 'urgent' },
  { label: 'ATP Rank',     value: '#67',     sub: '1,847 pts',     tone: 'accent' },
  { label: 'Race · Turin', value: '#54',     sub: 'top 8 qualify', tone: 'warn' },
  { label: 'Season',       value: '24-11',   sub: '2 titles',      tone: 'ok' },
  { label: 'Clay',         value: '68%',     sub: 'best surface',  tone: 'accent' },
]

// ─── Inbox ───────────────────────────────────────────────────────────────
export type TnInboxChannel = {
  ch: string
  count: number
  tone: 'green' | 'red' | 'purple' | 'amber' | 'navy' | 'orange'
  urgent: boolean
  last: string
  time: string
}

export const TENNIS_INBOX: TnInboxChannel[] = [
  { ch: 'Coach · Bianchi',     count: 2, tone: 'purple', urgent: false, last: 'Vega returns wide on deuce — work backhand early',  time: '07:14' },
  { ch: 'Tournament Desk',     count: 3, tone: 'red',    urgent: true,  last: 'Court time moved 30 min — confirm receipt',          time: '07:42' },
  { ch: 'Agent · Wright',      count: 2, tone: 'navy',   urgent: false, last: 'Meridian Watches renewal — discuss this week',       time: '06:58' },
  { ch: 'Media & Sponsor',     count: 4, tone: 'orange', urgent: false, last: 'Apex Performance post due before 12:00',             time: '06:45' },
  { ch: 'Physio & Medical',    count: 1, tone: 'red',    urgent: true,  last: 'Shoulder inflammation — see Dr Lee 12:30',           time: '07:02' },
  { ch: 'Travel desk',         count: 2, tone: 'amber',  urgent: false, last: 'Madrid hotel confirmed · RG deposit due 1 May',      time: 'Yesterday' },
  { ch: 'Stringer · Carlos',   count: 1, tone: 'green',  urgent: false, last: '55lbs mains, 52 crosses ready for match',            time: '07:30' },
  { ch: 'WhatsApp',            count: 3, tone: 'green',  urgent: false, last: 'Hitting partner Tom confirmed 10:00',                time: '07:11' },
]

// ─── Tournament schedule ────────────────────────────────────────────────
export type TnFixture = {
  day: string; date: string; opp: string; comp: string; venue: string;
  time: string; surface: 'Clay' | 'Hard' | 'Grass' | 'Indoor'; tier: string;
  entry: 'Confirmed' | 'Submitted' | 'Pending';
  state: 'today' | 'upcoming'; side: string
}

export const TENNIS_FIXTURES: TnFixture[] = [
  { day: 'Tue', date: '22 Apr', opp: 'C. Vega',         comp: 'Monte-Carlo Masters · QF', venue: 'Court 4 · MC Country Club',  time: '13:00', surface: 'Clay',   tier: 'Masters 1000', entry: 'Confirmed', state: 'today',    side: 'Singles' },
  { day: 'Mon', date: '28 Apr', opp: 'TBD R32',         comp: 'Barcelona Open',           venue: 'RC Barcelona',                time: 'TBC',   surface: 'Clay',   tier: 'ATP 500',      entry: 'Confirmed', state: 'upcoming', side: 'Singles' },
  { day: 'Sun', date: '03 May', opp: 'TBD R64',         comp: 'Madrid Open',              venue: 'Caja Mágica',                 time: 'TBC',   surface: 'Clay',   tier: 'Masters 1000', entry: 'Confirmed', state: 'upcoming', side: 'Singles' },
  { day: 'Mon', date: '11 May', opp: 'TBD R64',         comp: 'Italian Open · Rome',      venue: 'Foro Italico',                time: 'TBC',   surface: 'Clay',   tier: 'Masters 1000', entry: 'Submitted', state: 'upcoming', side: 'Singles' },
  { day: 'Sun', date: '24 May', opp: 'TBD R128',        comp: 'Roland-Garros',            venue: 'Stade Roland-Garros',         time: 'TBC',   surface: 'Clay',   tier: 'Grand Slam',   entry: 'Pending',   state: 'upcoming', side: 'Singles' },
]

// ─── Today schedule ──────────────────────────────────────────────────────
export type TnScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const TENNIS_TODAY: TnScheduleItem[] = [
  { t: '07:30', what: 'AI Morning Briefing',          where: 'Phone' },
  { t: '08:30', what: 'Physio · right shoulder',      where: 'Player lounge' },
  { t: '10:00', what: 'Practice · serve patterns',    where: 'Practice court 7' },
  { t: '11:45', what: 'Stringing with Carlos',        where: 'Stringers room' },
  { t: '13:00', what: 'QF vs C. Vega',                where: 'Court 4', highlight: true },
  { t: '15:30', what: 'Post-match physio',            where: 'Medical centre' },
  { t: '17:00', what: 'Coach debrief · Bianchi',      where: 'Players lounge' },
  { t: '18:00', what: 'Sponsor content · Apex kit',   where: 'Press tent' },
]

// ─── Morning brief ───────────────────────────────────────────────────────
export type TnAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const TENNIS_AI_BRIEF: TnAIBriefItem[] = [
  { tag: 'match',   pri: 'high', txt: 'QF vs C. Vega — 13:00 Court 4. Clay. H2H 3-1 in your favour. Kick serve to backhand on deuce court.' },
  { tag: 'tactic',  pri: 'med',  txt: 'Vega returns crosscourt 73% on second serve. Inside-out forehand to deuce side on break points.' },
  { tag: 'medical', pri: 'high', txt: 'Shoulder inflammation flagged by physio — see Dr Lee at 12:30 before match.' },
  { tag: 'sponsor', pri: 'high', txt: 'Apex Performance post due before 12:00. Carlos needs kit photo from range. Reply to agent re Meridian Watches renewal.' },
  { tag: 'travel',  pri: 'med',  txt: 'Madrid hotel confirmed (NH Eurobuilding, 26 Apr). RG apartment deposit due 1 May — travel desk waiting.' },
  { tag: 'op',      pri: 'med',  txt: 'Court time moved 30 min by Tournament Desk — confirm receipt. Barcelona entry submitted.' },
]

// ─── My Team — replaces Squad grid for individual athlete ───────────────
export type TnTeamMember = {
  initials: string
  name: string
  role: string
  status: 'green' | 'amber' | 'red'
  next: string
}

export const TENNIS_MY_TEAM: TnTeamMember[] = [
  { initials: 'MB', name: 'Marco Bianchi',  role: 'Head Coach',          status: 'green', next: 'Debrief 17:00' },
  { initials: 'SL', name: 'Dr Sarah Lee',   role: 'Physio',              status: 'amber', next: 'Shoulder check 12:30' },
  { initials: 'JW', name: 'James Wright',   role: 'Agent',               status: 'green', next: 'Meridian renewal call' },
  { initials: 'CM', name: 'Carlos Mendez',  role: 'Stringer',            status: 'green', next: 'Rackets 55/52 ready' },
  { initials: 'TE', name: 'Tom Ellis',      role: 'Hitting Partner',     status: 'green', next: 'Practice 10:00' },
  { initials: 'AS', name: 'Dr Amir Shah',   role: 'Sports Psychologist', status: 'green', next: 'Session Thursday' },
  { initials: 'MS', name: 'Maria Santos',   role: 'Nutritionist',        status: 'green', next: 'Match-day plan sent' },
]

// ─── Performance signals ─────────────────────────────────────────────────
export type TnPerfItem = { txt: string; delta?: string; tone?: 'good' | 'bad' | 'neutral' }

export const TENNIS_PERF_INTEL: TnPerfItem[] = [
  { txt: 'Serve % up to 64% last 5 matches — vs season avg 58%',      delta: '+6 pp', tone: 'good' },
  { txt: 'Ranking points risk: 312 pts drop after MC. Win = hold #67', delta: 'risk',  tone: 'bad' },
  { txt: 'Clay win rate 68% — above ATP avg 61%. Best surface',        delta: '+7 pp', tone: 'good' },
  { txt: 'Race to Turin #54 — top 8 qualifies. Madrid + RG key',        delta: '−14',   tone: 'bad' },
  { txt: 'Break-point conversion 38% — below top-50 avg 44%',           delta: '−6 pp', tone: 'bad' },
  { txt: '1st-serve return points won 32% — top quartile vs top-100',   delta: '+3 pp', tone: 'good' },
]

// ─── Recents ─────────────────────────────────────────────────────────────
export type TnResult = { vs: string; res: 'W' | 'L'; score: string; date: string; comp: string }

export const TENNIS_RECENTS: TnResult[] = [
  { vs: 'F. Caballero',     res: 'W', score: '6-3 6-4',         date: '20 Apr', comp: 'MC R1' },
  { vs: 'B. Sutton',        res: 'W', score: '7-5 6-3',         date: '21 Apr', comp: 'MC R2' },
  { vs: 'C. Hadley',        res: 'W', score: '6-4 3-6 7-6',     date: '21 Apr', comp: 'MC R3' },
  { vs: 'L. Brenner',       res: 'L', score: '4-6 6-7',         date: '14 Apr', comp: 'Barcelona SF' },
  { vs: 'A. Romero',        res: 'W', score: '6-2 6-1',         date: '22 Apr', comp: 'MC R4' },
]

export const TENNIS_FORM: ('W' | 'L')[] = ['W','W','W','L','W','W','L','W','W','W','L','W','W','W','L']

// ─── Sidebar nav (v2 visual) — IDs MUST match v1 SIDEBAR_ITEMS ids ──────
export type TnNavItem  = { id: string; label: string; icon: string; badge?: string }
export type TnNavGroup = { g: string; items: TnNavItem[] }

export const TENNIS_NAV_GROUPS: TnNavGroup[] = [
  { g: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard',         icon: 'home' },
    { id: 'briefing',  label: 'Morning Briefing',  icon: 'sun' },
    { id: 'insights',  label: 'Insights',          icon: 'bars' },
  ]},
  { g: 'Match Day', items: [
    { id: 'matchprep', label: 'Match Prep',       icon: 'flag' },
    { id: 'scout',     label: 'Opponent Scout',   icon: 'eye' },
    { id: 'draw',      label: 'Draw & Bracket',   icon: 'crosshair' },
  ]},
  { g: 'Performance', items: [
    { id: 'matchcentre', label: 'Match Centre',      icon: 'flag' },
    { id: 'video',       label: 'Video Analysis',    icon: 'play' },
    { id: 'stats',       label: 'Performance Stats', icon: 'bars' },
    { id: 'surface',     label: 'Surface Analysis',  icon: 'grid',     badge: 'NEW' },
    { id: 'rankings',    label: 'Rankings Tracker',  icon: 'trophy',   badge: 'NEW' },
  ]},
  { g: 'Team', items: [
    { id: 'team',       label: 'Team Hub',     icon: 'people' },
    { id: 'coachnotes', label: 'Coach Notes',  icon: 'note' },
    { id: 'doubles',    label: 'Doubles',      icon: 'people' },
  ]},
  { g: 'Health', items: [
    { id: 'physio',    label: 'Physio & Recovery',  icon: 'medical' },
    { id: 'nutrition', label: 'Nutrition',          icon: 'medical' },
    { id: 'mental',    label: 'Mental Performance', icon: 'sparkles', badge: 'NEW' },
    { id: 'racket',    label: 'Racket & Strings',   icon: 'crosshair' },
  ]},
  { g: 'Commercial', items: [
    { id: 'sponsorship', label: 'Sponsorship',     icon: 'briefcase' },
    { id: 'finance',     label: 'Financial',       icon: 'pound' },
    { id: 'media',       label: 'Media & Content', icon: 'newspaper' },
    { id: 'agent',       label: 'Agent Pipeline',  icon: 'briefcase' },
  ]},
  { g: 'Tour', items: [
    { id: 'travel',    label: 'Travel & Logistics', icon: 'plane' },
    { id: 'entries',   label: 'Entry Manager',      icon: 'note' },
    { id: 'prize',     label: 'Prize Forecaster',   icon: 'pound',  badge: 'NEW' },
    { id: 'court',     label: 'Court Booking',      icon: 'calendar' },
    { id: 'partners',  label: 'Playing Partners',   icon: 'people' },
  ]},
  { g: 'Career', items: [
    { id: 'career',  label: 'Career Planning', icon: 'arrow-up-right' },
    { id: 'academy', label: 'Academy & Dev',   icon: 'arrow-up-right' },
    { id: 'data',    label: 'Data Hub',        icon: 'bars' },
  ]},
  { g: 'Tools', items: [
    { id: 'federation',     label: 'Federation',      icon: 'shield' },
    { id: 'exhibitions',    label: 'Exhibitions',     icon: 'trophy' },
    { id: 'accreditations', label: 'Accreditations',  icon: 'note' },
  ]},
]

export const TENNIS_ACCENT = {
  hex:    '#a855f7',
  dim:    'rgba(168,85,247,0.16)',
  border: 'rgba(168,85,247,0.45)',
}
