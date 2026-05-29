// Junior Football dashboard demo data — grassroots-appropriate.
// Demo content only, no real club references.
//
// Fictional opponents drawn from the Meridian / Apex / Crown / Hartfield
// fictional universe (see docs/brand-universe.md). Home teams are the
// Oakridge Juniors age bands (U7 Eagles, U9 Tigers, U11 Lions, U12 Lions,
// U14 United). Numbers tuned to volunteer-led junior football scale:
// ~128 registered players across 8 age bands, ~46 sessions/month, 18
// DBS-cleared coaches.

export type JuniorStatTone = 'urgent' | 'warn' | 'ok' | 'accent' | 'info'
export type JuniorStatTile = { label: string; value: string | number; sub: string; tone: JuniorStatTone }

export const JUNIOR_TOP_STATS: JuniorStatTile[] = [
  { label: 'Inbox',             value: 24,    sub: '4 urgent',                      tone: 'urgent' },
  { label: 'Approvals',         value: 4,     sub: 'awaiting',                      tone: 'warn'   },
  { label: 'Sessions',          value: 46,    sub: 'this month',                    tone: 'ok'     },
  { label: 'Charter Standard',  value: '5/6', sub: 'criteria green',                tone: 'accent' },
  { label: 'Safeguarding',      value: '98%', sub: 'consents + DBS combined',       tone: 'ok'     },
]

export type JuniorAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const JUNIOR_AI_BRIEF: JuniorAIBriefItem[] = [
  { tag: 'Squad',        pri: 'med',  txt: 'U11 Lions 18/20 fit. U9 Tigers 13/15 fit. Tom Reece returns from ankle next week — light training only.' },
  { tag: 'Training',     pri: 'med',  txt: '6 sessions this week across all age bands. U14 United GPS load nominal. U7–U9 focusing on ball control drills.' },
  { tag: 'Safeguarding', pri: 'high', txt: '128/128 consents current. 1 DBS renewal due before 14 Jun (M. Hutchings) — renewal window open now.' },
  { tag: 'Welfare',      pri: 'med',  txt: 'No open welfare flags. Quarterly wellbeing check-in due next week — schedule parent 1-to-1s for U11–U16.' },
  { tag: 'Compliance',   pri: 'high', txt: 'FA Charter Standard renewal — 5/6 criteria green. Insurance renewal due 31 May. Affiliation active.' },
  { tag: 'Comms',        pri: 'low',  txt: '312 parent messages sent this month. Match-day reminders auto-send Fri 17:00. Newsletter due Friday.' },
]

export type JuniorInboxItem = {
  id: string
  channel: string
  from: string
  preview: string
  time: string
  urgent?: boolean
}

export const JUNIOR_INBOX: JuniorInboxItem[] = [
  { id: '1', channel: 'Safeguarding', from: 'System alert',         preview: 'DBS renewal due 14 Jun — M. Hutchings (Lead Coach).',                   time: '12 min ago', urgent: true },
  { id: '2', channel: 'Parent',       from: 'Sarah Bell (U9 Tigers)', preview: 'Kit collection — can I pick up on Wednesday after training?',         time: '38 min ago' },
  { id: '3', channel: 'Fixture',      from: 'Meridian Town Youth',  preview: 'U10 fixture confirmed — Sat 09:30, Apex Park, ref booked.',             time: '2 hours ago' },
  { id: '4', channel: 'Registration', from: 'P. Khouri (U7 enquiry)', preview: 'New U7 registration — consent forms pending. Welcome pack sent.',     time: '4 hours ago', urgent: true },
  { id: '5', channel: 'Kit',          from: 'Crown Sportswear',     preview: 'Mid-season top-up order — 4 items outstanding (shorts U11, socks U14).', time: 'Yesterday' },
]

export type JuniorScheduleItem = { time: string; what: string; where: string; note?: string }

export const JUNIOR_TODAY_SCHEDULE: JuniorScheduleItem[] = [
  { time: '17:30', what: 'U7 Eagles training',            where: 'Pitch 2',     note: 'Coach: J. Lawford' },
  { time: '18:00', what: 'U11 Lions training',            where: 'Pitch 1',     note: 'Coach: M. Hutchings' },
  { time: '19:00', what: 'Welfare check-in',              where: 'Clubhouse',   note: 'All age-band leads' },
  { time: '19:30', what: 'DBS renewal — M. Hutchings',    where: '1-to-1',      note: '20 min' },
  { time: '20:00', what: 'Parent comms — match reminders', where: 'Auto-send',  note: 'Fri 17:00 default' },
]

export type JuniorFixture = {
  id: string
  ageBand: string
  homeTeam: string
  awayTeam: string
  venue: 'H' | 'A'
  date: string
  time: string
  ground: string
  competition: string
}

export const JUNIOR_FIXTURES: JuniorFixture[] = [
  { id: 'f1', ageBand: 'U8',  homeTeam: 'Oakridge U8 Eagles',  awayTeam: 'Meridian Town Youth U8',   venue: 'H', date: 'Sat 24 May', time: '09:30', ground: 'Pitch 2',         competition: 'U8 League' },
  { id: 'f2', ageBand: 'U10', homeTeam: 'Apex United Juniors U10', awayTeam: 'Oakridge U10 Tigers',  venue: 'A', date: 'Sat 24 May', time: '11:00', ground: 'Apex Park',       competition: 'U10 League' },
  { id: 'f3', ageBand: 'U12', homeTeam: 'Oakridge U12 Lions',  awayTeam: 'Crown Park U12',           venue: 'H', date: 'Sun 25 May', time: '09:30', ground: 'Pitch 1',         competition: 'U12 League' },
  { id: 'f4', ageBand: 'U14', homeTeam: 'Hartfield Athletic U14', awayTeam: 'Oakridge U14 United',   venue: 'A', date: 'Sun 25 May', time: '11:30', ground: 'Hartfield Ground', competition: 'U14 Cup' },
]

export type JuniorResult = { id: string; ageBand: string; vs: string; res: 'W' | 'D' | 'L'; score: string; date: string; comp: string }

export const JUNIOR_RECENTS: JuniorResult[] = [
  { id: 'r1', ageBand: 'U11', vs: 'Meridian Town Youth U11', res: 'W', score: '4–2', date: 'Sat 03 May', comp: 'U11 League' },
  { id: 'r2', ageBand: 'U9',  vs: 'Crown Park U9',           res: 'L', score: '1–3', date: 'Sat 03 May', comp: 'U9 League'  },
  { id: 'r3', ageBand: 'U14', vs: 'Apex United U14',         res: 'D', score: '2–2', date: 'Sun 04 May', comp: 'U14 Cup'    },
  { id: 'r4', ageBand: 'U7',  vs: 'Hartfield Athletic U7',   res: 'W', score: '3–1', date: 'Sat 26 Apr', comp: 'U7 Friendly' },
  { id: 'r5', ageBand: 'U12', vs: 'Meridian Town Youth U12', res: 'W', score: '2–0', date: 'Sat 26 Apr', comp: 'U12 League' },
]

export type JuniorSquadSummaryShape = {
  registered: number
  out: number
  dbsPending: number
  consents: string
}

export const JUNIOR_SQUAD_SUMMARY: JuniorSquadSummaryShape = {
  registered: 128,
  out:        6,
  dbsPending: 2,
  consents:   '124/128',
}

// ─── Accent tokens ──────────────────────────────────────────────────────
// Mirrors WOMENS_ACCENT shape. Junior green per CLAUDE.md / sidebar tokens.

export const JUNIOR_ACCENT = {
  hex:    '#16A34A',
  dim:    'rgba(22,163,74,0.16)',
  border: 'rgba(22,163,74,0.45)',
} as const

// ─── Club identity + season state ───────────────────────────────────────
// Single source of truth for match-day hero meta (club short, date,
// weather coords, season standing). `clubShort` is the U11 Lions
// framing — the canonical demo squad hosting the demo child Jack
// Carter, also the team featured in the new match-day hero.

export const JUNIOR_ORG = {
  clubShort:     'Oakridge U11 Lions',
  date:          'Sat, 24 May 2026',
  weatherCoords: { latitude: 51.24, longitude: -0.21 },
  season: {
    played:   14,
    won:      9,
    drawn:    3,
    lost:     2,
    position: '2nd',
    league:   'Surrey Youth League · U11',
    points:   18,
    gd:       '+11',
  },
} as const

// ─── Form string (most recent first) ────────────────────────────────────
// Drives the hero meta-row "Form" field. Hero slices first 5 for display.

export const JUNIOR_SEASON_FORM: ('W' | 'D' | 'L')[] = [
  'W', 'W', 'L', 'W', 'D', 'W', 'W', 'D', 'W', 'L', 'W', 'W', 'D', 'W',
]

// ─── Next fixture — drives match-day hero ───────────────────────────────
// Fictional opposition (Harfield Juniors) from the Meridian / Apex /
// Crown / Hartfield universe — see docs/brand-universe.md. `kickoffISO`
// drives the real-time countdown via computeCountdown() in junior-time.ts.

export const JUNIOR_NEXT_FIXTURE = {
  opp:         'Harfield Juniors U11',
  time:        '09:30',
  date:        '2026-05-24',
  kickoffISO:  '2026-05-24T09:30:00+01:00',
  venue:       'Oakridge Community Pitches',
  comp:        'U11 League',
  matchday:    15,
} as const

// ─── Performance signals ────────────────────────────────────────────────
// Six youth-football KPIs surfaced at the bottom of the dashboard. Mirrors
// the Women's WfPerfItem shape locally (do not import WfPerfItem — the
// shapes overlap but Junior owns its own type).
//
// Minus prefix on '−3 pp' is U+2212 (proper minus), matching Women's
// pattern — visually centred and typographically correct, not a hyphen.

export type JuniorPerfItem = {
  txt: string
  delta?: string
  tone?: 'good' | 'bad' | 'neutral'
}

export const JUNIOR_PERF_INTEL: JuniorPerfItem[] = [
  { txt: 'Equal-participation rate 94% — 17/18 U11 squad on target this term',                       delta: '+2 pp',   tone: 'good'    },
  { txt: '8 players moved up a development band — strongest term this year',                          delta: '+3',      tone: 'good'    },
  { txt: 'Parent highlight engagement 78% — 56/72 parents watched last weekend',                      delta: '+5 pp',   tone: 'good'    },
  { txt: 'Player retention 84% — 76/90 returners, 6 below last season',                               delta: '−3 pp',   tone: 'bad'     },
  { txt: 'Charter Standard 5/6 criteria green · 1 amber (insurance renewal due 31 May)',                                 tone: 'neutral' },
  { txt: 'Training attendance 87% across all age groups — week-over-week steady',                     delta: '+0.5 pp', tone: 'good'    },
]
