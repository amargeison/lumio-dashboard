// ─── TEN PROJECT DEMO DATA ───────────────────────────────────────────────────
// All schools, venues, children, parents, coaches and TENORs in this file are
// FICTIONAL (Pattern 1 — see docs/brand-universe.md). Ten Project itself is the
// real prospective partner this demo portal is built for. Do not add real
// third-party brands (trusts, sponsors) — use the Meridian/Apex/Crown universe.
// Curriculum facts (weeks, sticker areas) come from the real Activity Booklet.

export const TP_RED = '#D7262C'
export const TP_BLACK = '#111114'
export const TP_DARK = '#1B1B21'
export const TP_PAPER = '#F7F5F2'

export const CURRICULUM: { weeks: string; skill: string; tip: string; didYouKnow: string }[] = [
  { weeks: '1 & 2', skill: 'FOREHAND', tip: 'Keep your eye on the ball… hit low to high… one bounce only', didYouKnow: 'A forehand is usually a tennis player’s favourite shot — and the easiest to master.' },
  { weeks: '3 & 4', skill: 'BACKHAND', tip: 'Hold the racket with two hands, favourite hand at the bottom of the grip', didYouKnow: 'The backhand can be played with one or two hands!' },
  { weeks: '5 & 6', skill: 'VOLLEY', tip: 'Hold the racket at the bottom of the grip and keep the racket up', didYouKnow: 'To be a successful volleyer you need quick reflexes.' },
  { weeks: '7 & 8', skill: 'SERVE', tip: 'The serve is a throwing action — try throwing the ball first', didYouKnow: 'The fastest serve ever recorded is 163 mph.' },
  { weeks: '9', skill: 'GAME PLAY', tip: 'Keep the score and say it nice and loud after each point', didYouKnow: 'The longest tennis match lasted over 11 hours — at Wimbledon.' },
  { weeks: '10', skill: 'TEN PROJECT FESTIVAL', tip: 'Bring your family and celebrate everything you have learnt!', didYouKnow: 'Every child completing the festival receives their Ten Project certificate.' },
]

export const STICKER_AREAS = [
  { id: 'abc', label: 'Warm Up & ABC’s', desc: 'Agility, Balance, Coordination' },
  { id: 'shots', label: 'The Shots', desc: 'Forehand, backhand, volley, serve' },
  { id: 'games', label: 'Fun Games & Competition', desc: 'Games, challenges, competitions' },
  { id: 'gameplay', label: 'Game Play / Scoring', desc: 'Hit, move, rally, score' },
  { id: 'together', label: 'Teamwork & Respect', desc: 'Communication, respect, fair play' },
  { id: 'festival', label: 'The Festival', desc: 'The week-10 celebration' },
] as const

export type SchoolStatus = 'enquiry' | 'fundraising' | 'confirmed' | 'running' | 'complete'

export interface DemoSchool {
  id: string
  name: string
  borough: string
  status: SchoolStatus
  week?: number
  children?: number
  cohorts?: number
  coach?: string
  headTeacher: string
  activation?: number // % of parents activated
  note?: string
}

export const SCHOOLS: DemoSchool[] = [
  { id: 'oakridge', name: 'Oakridge Primary', borough: 'Kingsbridge', status: 'running', week: 4, children: 58, cohorts: 2, coach: 'Natalie Brooks', headTeacher: 'Mrs L. Carter', activation: 62, note: 'Week 4 of 10 — backhand block' },
  { id: 'stclements', name: 'St Clement’s Primary', borough: 'Kingsbridge', status: 'fundraising', headTeacher: 'Mr D. Whitmore', note: 'Unfunded for 2026/27 — campaign live' },
  { id: 'meridianpark', name: 'Meridian Park Primary', borough: 'Ashwell', status: 'confirmed', children: 45, cohorts: 2, coach: 'Tom Hale', headTeacher: 'Ms P. Osei', note: 'Starts w/c 14 Sept' },
  { id: 'harrowfield', name: 'Harrowfield Primary', borough: 'Ashwell', status: 'enquiry', headTeacher: 'Mrs J. Lindley', note: 'Bring-to-your-area request, 3 Jul' },
  { id: 'willowbrook', name: 'Willowbrook Primary', borough: 'Kingsbridge', status: 'complete', children: 61, cohorts: 2, coach: 'Natalie Brooks', headTeacher: 'Mr S. Faulkner', activation: 71, note: 'Renewal conversation due — unfunded risk' },
]

export interface DemoVenue {
  id: string
  name: string
  day: string
  time: string
  tenors: number
  external?: boolean // linked venue — books via partner platform
  lastCount?: number
}

export const VENUES: DemoVenue[] = [
  { id: 'kingsmead', name: 'Kingsmead Rec Ground', day: 'Saturday', time: '1.30–2.30pm', tenors: 3, lastCount: 19 },
  { id: 'bramley', name: 'Bramley Green Courts', day: 'Saturday', time: '11.30am–12.30pm', tenors: 2, lastCount: 14 },
  { id: 'elmwood', name: 'Elmwood Park Courts', day: 'Sunday', time: '10–11am', tenors: 2, external: true, lastCount: 11 },
]

export interface DemoChild {
  id: string
  name: string
  year: string
  stickers: number // 0-6 areas earned so far
  present?: boolean
}

// Oakridge Y3 Falcons cohort — coach register demo
export const COHORT_CHILDREN: DemoChild[] = [
  { id: 'c1', name: 'Mia Whitfield', year: 'Y3', stickers: 3, present: true },
  { id: 'c2', name: 'Alfie Danbury', year: 'Y3', stickers: 3, present: true },
  { id: 'c3', name: 'Isla Renwick', year: 'Y3', stickers: 2, present: true },
  { id: 'c4', name: 'Noah Petford', year: 'Y3', stickers: 3, present: false },
  { id: 'c5', name: 'Ava Okonkwo', year: 'Y3', stickers: 3, present: true },
  { id: 'c6', name: 'Leo Marchbank', year: 'Y3', stickers: 1, present: true },
  { id: 'c7', name: 'Freya Aldous', year: 'Y3', stickers: 3, present: true },
  { id: 'c8', name: 'Oscar Tilbrook', year: 'Y3', stickers: 2, present: true },
  { id: 'c9', name: 'Poppy Nazari', year: 'Y3', stickers: 3, present: true },
  { id: 'c10', name: 'Ethan Colefax', year: 'Y3', stickers: 2, present: false },
  { id: 'c11', name: 'Grace Middlemiss', year: 'Y3', stickers: 3, present: true },
  { id: 'c12', name: 'Rory Vance', year: 'Y3', stickers: 2, present: true },
]

// ─── Fundraising (St Clement's campaign) ────────────────────────────────────
export interface FundraisingEvent {
  id: string
  name: string
  type: string
  date: string
  status: 'complete' | 'live' | 'planned'
  raised: number
  target: number
}

export const CAMPAIGN = {
  school: 'St Clement’s Primary',
  target: 3200,
  raised: 2150,
  matchPartner: 'Apex Tennis Trust', // fictional cameo — brand universe
  matchNote: 'Apex Tennis Trust will top up the final 20% (£640) once the campaign passes £2,560.',
  supporters: 84,
}

export const FUND_EVENTS: FundraisingEvent[] = [
  { id: 'f1', name: 'Summer Fair stall', type: 'School fair', date: '21 Jun', status: 'complete', raised: 480, target: 400 },
  { id: 'f2', name: 'Y4 Cake Sale', type: 'Cake sale', date: '4 Jul', status: 'complete', raised: 215, target: 200 },
  { id: 'f3', name: 'Sponsored Ball Hit', type: 'Sponsored ball hit', date: '10 Oct', status: 'live', raised: 1455, target: 1800, },
  { id: 'f4', name: 'Autumn Quiz Night', type: 'Quiz night', date: '14 Nov', status: 'planned', raised: 0, target: 600 },
]

export const AI_EVENT_PACK = {
  event: 'Sponsored Ball Hit',
  items: [
    'Step-by-step checklist — 6 weeks out to event day (booking the hall/courts, pledge forms home in book bags, tally sheets for teachers)',
    'Poster + school-newsletter copy, ready to print (A4/A5, Ten Project branding)',
    'Letter to parents explaining the pledge — per-ball or flat amount, online collection link',
    'Risk-assessment prompt list to complete with the school office',
    'Local-business sponsorship ask — three tiers (£50 / £150 / £350) with what each funds',
    'On-the-day run sheet: warm-up, 10-minute hit windows per class, live tally in the app',
  ],
}

// ─── Parent persona ─────────────────────────────────────────────────────────
export const PARENT = {
  name: 'Sarah Whitfield',
  children: [
    { name: 'Mia', age: 7, school: 'Oakridge Primary', stickers: 3 },
    { name: 'Tom', age: 5, school: 'Oakridge Primary', stickers: 2 },
  ],
  venue: VENUES[0],
  consents: { data: true, photo: true, emergency: 'Gran (Pat) — 07700 900123' },
}

export const PARENT_MESSAGES = [
  { id: 'm1', from: 'Coach Natalie', when: 'Today, 3.05pm', text: 'Great session today — Mia earned her Shots sticker for the backhand! Ask her to show you the two-handed grip. 🎾' },
  { id: 'm2', from: 'Ten Project HQ', when: 'Mon, 9.00am', text: 'Week 4 — BACKHAND week! Your family session this Saturday is at Kingsmead Rec Ground, 1.30–2.30pm. Tap to confirm you’re coming.' },
  { id: 'm3', from: 'TENOR David', when: 'Sat, 2.41pm', text: 'Lovely session everyone — 19 of us on court! Photos (consented families only) are in this week’s gallery.' },
]

// ─── HQ dashboard numbers ───────────────────────────────────────────────────
export const HQ_STATS = {
  childrenThisWeek: 214,
  schoolsRunning: 2,
  schoolsPipeline: 3,
  weekendVisitsThisTerm: 312,
  registersOutstanding: 1,
  dbsExpiring: 1,
}

export const FUNNEL = [
  { stage: 'Reached in school', n: 214, pct: 100 },
  { stage: 'Parent activated', n: 121, pct: 57 },
  { stage: 'Engaged weekly', n: 89, pct: 42 },
  { stage: 'Converted to weekend', n: 46, pct: 21 },
  { stage: 'Retained (3+ visits)', n: 31, pct: 14 },
]

export const IMPACT_AREAS = ['Health', 'Family', 'Exercise', 'Confidence', 'Focus', 'Self-Esteem', 'Socialising', 'Academic Attainment', 'Well-Being', 'Concentration']

export const NEEDS_ATTENTION = [
  { id: 'a1', text: 'Willowbrook renewal at risk — school reports no 2026/27 funding. Suggest: switch to fundraising status.', kind: 'warn' },
  { id: 'a2', text: 'Bramley Green register not submitted for Sat 11 Jul — chase TENOR team.', kind: 'warn' },
  { id: 'a3', text: 'Coach Tom Hale’s First Aid certificate expires in 6 weeks.', kind: 'info' },
  { id: 'a4', text: 'St Clement’s campaign is £410 from its match-funding trigger.', kind: 'info' },
]

// ─── TENOR session plan — Week 4 (backhand) ─────────────────────────────────
export const WEEK4_SESSION_PLAN = {
  week: 4,
  skill: 'BACKHAND',
  duration: '60 min + 10 min setup',
  blocks: [
    { time: '1.20pm', mins: 10, title: 'Arrival & setup', detail: 'Cones out, 4 mini nets up, red balls in feeder buckets, QR sign on the gate. One TENOR greets at the gate while families scan in.' },
    { time: '1.30pm', mins: 10, title: 'Warm-up — ABCs', detail: 'Traffic-lights running game (agility) → ball-balance-on-racket relay (balance) → throw-catch-clap in pairs (coordination). Everyone moving, parents included.' },
    { time: '1.40pm', mins: 5, title: 'Skill intro — the backhand', detail: 'Show the two-handed grip: favourite hand at the BOTTOM of the grip. Demo the low-to-high swing, sideways stance. Play the video on your phone if helpful.' },
    { time: '1.45pm', mins: 15, title: 'Drills — in pairs (parent + child)', detail: 'Balloon backhands (5m): keep the balloon up, backhand side only → Drop-feed rallies (10m): parent drop-feeds, child hits backhand over the mini net. Swap so parents hit too!' },
    { time: '2.00pm', mins: 20, title: 'Games', detail: '“Beat the parent” — child scores a point for every backhand over the net, parent has to catch it (5 catches wins) → Team rally: families in two teams, longest combined rally wins.' },
    { time: '2.20pm', mins: 10, title: 'Together time & pack down', detail: 'Family rally challenge (best of the day gets a cheer), remind everyone to log practice in the app / booklet, mention next week is backhand week two. Kit back in the green store box.' },
  ],
  coachingPoints: ['Favourite hand at the bottom of the grip', 'Swing low to high — finish over the shoulder', 'Sideways stance, step towards the ball', 'One bounce only — call it out loud'],
  equipment: ['24 rackets (19"–23" — small ones at the front of the box)', '40 red felt balls (2 feeder buckets)', '20 cones', '4 mini nets', 'Balloons (drill bag, side pocket)', 'First-aid kit (green store box lid)'],
  safety: ['Court sweep before setup — glass/litter', 'First-aid kit in the green box; nearest defib at the pavilion', 'Photos: check the family’s consent flag in the register BEFORE any photos — amber badge = no photos', 'Any safeguarding concern: do not investigate — call the HQ safeguarding lead (number in Resources)'],
  videos: [
    { title: 'The Backhand — main skill video', length: '2:40' },
    { title: 'Balloon backhand drill', length: '1:15' },
    { title: 'ABC warm-ups (all 3 games)', length: '3:05' },
  ],
}

export const TENOR_RESOURCES = {
  weeks: CURRICULUM.map((c, i) => ({
    label: `Weeks ${c.weeks} — ${c.skill}`,
    videos: i < 4 ? 3 : 2,
    current: i === 1,
  })),
  guides: [
    { title: 'TENOR handbook', desc: 'Everything about running a family session — 12 pages' },
    { title: 'Safeguarding basics for volunteers', desc: 'What to do (and not do) — 2 pages' },
    { title: 'Photography & Filming policy', desc: 'The consent rules in plain English' },
    { title: 'Session cards — all 10 weeks', desc: 'Printable A5 cards, one per week' },
  ],
  contacts: [
    { name: 'Natalie Brooks', role: 'Your linked coach', note: 'Messages tab or 07700 900456' },
    { name: 'Ten Project HQ', role: 'Safeguarding lead', note: '07700 900789 — always answered on session days' },
  ],
}

// ─── HQ Insights (funder-facing demo data) ──────────────────────────────────
export const INSIGHTS = {
  headline: [
    { label: 'Children reached this term', value: '2,140' },
    { label: 'Unique families engaged', value: '612' },
    { label: 'Sessions delivered', value: '74' },
    { label: 'Attendance rate', value: '91%' },
    { label: 'Weekend conversion', value: '21%' },
    { label: 'Schools renewing', value: '4 of 5' },
  ],
  termGrowth: [
    { term: 'Sum 25', children: 640 },
    { term: 'Aut 25', children: 980 },
    { term: 'Spr 26', children: 1310 },
    { term: 'Sum 26', children: 1780 },
    { term: 'Aut 26', children: 2140 },
  ],
  weekendTrend: [14, 18, 22, 19, 26, 31, 28, 34, 38, 44], // family visits per week, this term
  conversionBySchool: [
    { school: 'Willowbrook Primary', pct: 26 },
    { school: 'Oakridge Primary', pct: 21 },
    { school: 'Meridian Park Primary', pct: 0 },
  ],
  impactSurvey: [
    { area: 'Confidence', pct: 88 },
    { area: 'Exercise', pct: 84 },
    { area: 'Family', pct: 81 },
    { area: 'Socialising', pct: 74 },
    { area: 'Well-Being', pct: 71 },
    { area: 'Focus', pct: 63 },
    { area: 'Self-Esteem', pct: 61 },
    { area: 'Concentration', pct: 55 },
    { area: 'Health', pct: 52 },
    { area: 'Academic Attainment', pct: 38 },
  ],
  inclusion: { inclusiveVenuePct: 33, boroughs: 2, freeSessions: '100%', girls: '48%' },
}

// ─── Coach stats, schedule & resources ──────────────────────────────────────
export const COACH_STATS = {
  headline: [
    { label: 'Children coached this term', value: 118 },
    { label: 'Sessions delivered', value: 22 },
    { label: 'Avg attendance', value: '92%' },
    { label: 'Stickers awarded', value: 214 },
    { label: 'Cohorts', value: 4 },
    { label: 'Weekend sessions supported', value: 4 },
  ],
  cohortProgress: [
    { cohort: 'Oakridge — Y3 Falcons', week: 4, attendance: 94, stickers: 34 },
    { cohort: 'Oakridge — Y4 Kestrels', week: 4, attendance: 91, stickers: 31 },
    { cohort: 'Willowbrook — Y2 Robins', week: 10, attendance: 89, stickers: 68 },
    { cohort: 'Willowbrook — Y5 Hawks', week: 10, attendance: 93, stickers: 72 },
  ],
  attendanceTrend: [88, 90, 93, 92, 94, 91, 95, 92, 90, 94], // % by session, last 10
  compliance: [
    { item: 'DBS (Enhanced, via LTA)', status: 'valid', note: 'to Mar 2027' },
    { item: 'LTA Safeguarding & Protection', status: 'valid', note: 'to Nov 2026' },
    { item: 'First Aid certificate', status: 'expiring', note: 'expires 30 Aug — book renewal' },
    { item: 'Insurance (£5m)', status: 'valid', note: 'to Jan 2027' },
  ],
  weekSchedule: [
    { day: 'Tue', what: 'Oakridge Primary — Y3 Falcons, Week 4', time: '1.15–2.15pm', kind: 'school' },
    { day: 'Tue', what: 'Oakridge Primary — Y4 Kestrels, Week 4', time: '2.20–3.20pm', kind: 'school' },
    { day: 'Thu', what: 'Teacher hand-over session — Mrs Patel (Oakridge)', time: '3.30–4.00pm', kind: 'school' },
    { day: 'Sat', what: 'Kingsmead Rec Ground — family session (lead)', time: '1.30–2.30pm', kind: 'weekend' },
    { day: 'Sun', what: 'Elmwood Park — family session (TENOR support visit)', time: '10–11am', kind: 'weekend' },
  ],
}

export const COACH_WEEKEND = {
  lead: { venue: 'Kingsmead Rec Ground', day: 'Saturday', time: '1.30–2.30pm', role: 'Session lead', tenors: ['David Okafor', 'Priya Shah', 'Mark Renwick'], lastCount: 19, note: 'Week-4 backhand plan loaded. Equipment check due — 2 rackets reported cracked last week.' },
  support: { venue: 'Elmwood Park Courts', day: 'Sunday', time: '10–11am', role: 'TENOR support visit', tenors: ['Ana Kovač', 'Tom Whittle'], lastCount: 11, note: 'Monthly quality visit — observe, coach the TENORs, sign off the session card.' },
  setupDuty: 'Week 1 duty: deliver equipment to the venue, set up with the TENORs, and run the first session alongside them — they take over from week 2 with your support.',
}

export const COACH_RESOURCES = {
  curriculum: [
    { title: 'Scheme of work — all 10 weeks', desc: 'The full Ten Project curriculum with session plans, progressions and differentiation for ages 4–10' },
    { title: 'Week 4 session plan — BACKHAND (school)', desc: 'Timed run-sheet, drills, STEP adaptations, teacher hand-over notes' },
    { title: 'Week 4 session plan — BACKHAND (family)', desc: 'Weekend variant — parent-child pairings, TENOR briefing card' },
    { title: 'Festival pack — Week 10', desc: 'Stations, certificates, family invites, photography checklist' },
  ],
  development: [
    { title: 'LTA Youth alignment map', desc: 'How booklet skills map to the LTA pathway — for talent-spotting conversations' },
    { title: 'CPD: coaching 4–7s', desc: 'Video series — fundamental movement first, technique second' },
    { title: 'Talent pathway referral guide', desc: 'When and how to refer a child to a feeder club' },
  ],
  admin: [
    { title: 'Safeguarding: quick reference', desc: 'Reporting flow, HQ safeguarding lead contact' },
    { title: 'Kit & equipment checklist', desc: 'Per-venue inventory, damage reporting, reorder requests' },
    { title: 'Photography & Filming policy', desc: 'Consent flags and what they mean courtside' },
  ],
}

// ─── School programme stats (governor/sponsor/parent-facing) ────────────────
// St Clement's story: ran Ten Project in 2025/26, lost funding for 2026/27,
// now fundraising — last year's results ARE the case for the campaign.
export const SCHOOL_STATS = {
  term: 'Summer term 2025/26 (completed)',
  headline: [
    { label: 'Children took part', value: 62 },
    { label: 'Attendance rate', value: '93%' },
    { label: 'Stickers earned', value: 287 },
    { label: 'Completed all 10 weeks', value: '58 of 62' },
    { label: 'Families activated the app', value: '58%' },
    { label: 'Went on to weekend sessions', value: 11 },
  ],
  weeklyAttendance: [91, 94, 95, 92, 94, 93, 90, 95, 94, 96], // % by week
  yearGroups: [
    { year: 'Y2', children: 20 },
    { year: 'Y3', children: 22 },
    { year: 'Y4', children: 20 },
  ],
  stickerAreas: [
    { area: 'Warm Up & ABC’s', pct: 100 },
    { area: 'The Shots', pct: 89 },
    { area: 'Fun Games & Competition', pct: 95 },
    { area: 'Game Play / Scoring', pct: 82 },
    { area: 'Teamwork & Respect', pct: 97 },
    { area: 'Festival', pct: 94 },
  ],
  outcomes: ['Physical literacy (PE National Curriculum)', 'Fundamental movement skills', 'Communication & teamwork', 'Family engagement', 'School-community link'],
  quotes: [
    { q: 'The progress in their coordination and confidence has been incredible — it’s a highlight of the year for many of the children.', who: 'Class teacher, Y3' },
    { q: 'Our daughter loved every week and we’ve carried on at the weekend sessions as a family.', who: 'Parent, Y4' },
  ],
}

// ─── Upcoming calendar (per role) — demo of Gmail/365-synced schedule ───────
export interface CalEvent {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  time: string
  title: string
  where?: string
  kind: 'school' | 'weekend' | 'admin' | 'fundraising'
}

export const CAL_EVENTS: Record<'school' | 'coach' | 'tenor', CalEvent[]> = {
  school: [
    { day: 'Mon', time: '8.30', title: 'Kit delivery — green store', where: 'Reception', kind: 'admin' },
    { day: 'Tue', time: '13.15', title: 'Ten Project — Y3 Falcons (W4)', where: 'School hall', kind: 'school' },
    { day: 'Tue', time: '14.20', title: 'Ten Project — Y4 Kestrels (W4)', where: 'School hall', kind: 'school' },
    { day: 'Thu', time: '15.30', title: 'Teacher hand-over — Mrs Patel', where: 'Staff room', kind: 'admin' },
    { day: 'Fri', time: '9.00', title: 'Assembly — festival save-the-date', kind: 'admin' },
    { day: 'Sat', time: '13.30', title: 'Family session — your families', where: 'Kingsmead Rec', kind: 'weekend' },
    { day: 'Sat', time: '10.00', title: 'Sponsored Ball Hit planning call', kind: 'fundraising' },
  ],
  coach: [
    { day: 'Mon', time: '9.00', title: 'Admin / session prep', kind: 'admin' },
    { day: 'Tue', time: '13.15', title: 'Oakridge — Y3 Falcons (W4)', where: 'School hall', kind: 'school' },
    { day: 'Tue', time: '14.20', title: 'Oakridge — Y4 Kestrels (W4)', where: 'School hall', kind: 'school' },
    { day: 'Thu', time: '15.30', title: 'Teacher hand-over — Mrs Patel', where: 'Oakridge', kind: 'school' },
    { day: 'Fri', time: '16.00', title: 'Kit check + repairs', where: 'Kingsmead store', kind: 'admin' },
    { day: 'Sat', time: '13.30', title: 'Family session — LEAD', where: 'Kingsmead Rec', kind: 'weekend' },
    { day: 'Sun', time: '10.00', title: 'TENOR support visit', where: 'Elmwood Park', kind: 'weekend' },
  ],
  tenor: [
    { day: 'Fri', time: '17.30', title: 'Equipment check + QR sign out', where: 'Kingsmead store', kind: 'admin' },
    { day: 'Sat', time: '13.10', title: 'TENOR briefing — week 4 card', where: 'Courtside', kind: 'admin' },
    { day: 'Sat', time: '13.30', title: 'Family session — register duty', where: 'Kingsmead Rec', kind: 'weekend' },
    { day: 'Sun', time: '10.00', title: 'Cover request — Elmwood (optional)', where: 'Elmwood Park', kind: 'weekend' },
  ],
}

// ─── HQ people: coaches + TENORs (maps from the Lumio Coaches module) ───────
export interface TpCoach {
  id: string
  name: string
  role: 'Lead' | 'Coach' | 'Assistant' | 'Apprentice'
  qual: string
  dbs: 'valid' | 'due-soon' | 'expired' | 'missing'
  dbsNote: string
  firstAid: string
  specialisms: string[]
  schools: string
  sessionsWeek: number
  childrenCovered: number
  online?: boolean
}

export const TP_COACHES: TpCoach[] = [
  { id: 'nb', name: 'Natalie Brooks', role: 'Lead', qual: 'LTA Level 3', dbs: 'valid', dbsNote: 'to Mar 2027', firstAid: 'expires 30 Aug ⚠', specialisms: ['Mini/Red', 'Schools'], schools: 'Oakridge · Kingsmead (Sat)', sessionsWeek: 5, childrenCovered: 118, online: true },
  { id: 'th', name: 'Tom Hale', role: 'Coach', qual: 'LTA Level 2', dbs: 'valid', dbsNote: 'to Nov 2026', firstAid: 'expires in 6 wks ⚠', specialisms: ['Mini/Red', 'Inclusive'], schools: 'Meridian Park (Sept) · Elmwood (Sun)', sessionsWeek: 2, childrenCovered: 45 },
  { id: 'lt', name: 'Lucy Tran', role: 'Coach', qual: 'LTA Level 2', dbs: 'due-soon', dbsNote: 'expires in 32 days', firstAid: 'valid to Feb 2027', specialisms: ['Junior', 'Festivals'], schools: 'Willowbrook (complete)', sessionsWeek: 1, childrenCovered: 61 },
  { id: 'mw', name: 'Marcus Webb', role: 'Assistant', qual: 'LTA Assistant', dbs: 'valid', dbsNote: 'to Jan 2028', firstAid: 'valid to Sep 2026', specialisms: ['Mini/Red'], schools: 'Oakridge (assist)', sessionsWeek: 3, childrenCovered: 58 },
  { id: 'ev', name: 'Eleanor Vance', role: 'Coach', qual: 'LTA Level 2', dbs: 'valid', dbsNote: 'to Jun 2027', firstAid: 'valid to Mar 2027', specialisms: ['Inclusive', 'Adult+family'], schools: 'Bramley Green (Sat)', sessionsWeek: 1, childrenCovered: 32, online: true },
  { id: 'jm', name: 'Jordan Miles', role: 'Apprentice', qual: 'In training', dbs: 'missing', dbsNote: 'application submitted', firstAid: 'booked 12 Aug', specialisms: ['Mini/Red'], schools: 'Shadowing — Oakridge', sessionsWeek: 2, childrenCovered: 0 },
]

export const TP_COACH_STATS_ROW = [
  { label: 'COACHES', value: '6' },
  { label: 'ON PROGRAMMES', value: '4' },
  { label: 'CHILDREN COVERED', value: '214' },
  { label: 'SESSIONS THIS WEEK', value: '11' },
  { label: 'DBS VALID', value: '4/6' },
  { label: 'CERTS EXPIRING', value: '3' },
]

export const TP_COACH_ATTENTION = 'Natalie Brooks (First Aid expires 30 Aug), Tom Hale (First Aid, 6 wks), Lucy Tran (DBS expires in 32d), Jordan Miles (No DBS on file — cannot deliver unsupervised)'

export interface TpTenor {
  id: string
  name: string
  venue: string
  inducted: boolean
  dbs: 'valid' | 'pending' | 'n/a'
  sessionsCovered: number
  since: string
  note?: string
}

export const TP_TENORS: TpTenor[] = [
  { id: 't1', name: 'David Okafor', venue: 'Kingsmead Rec Ground', inducted: true, dbs: 'valid', sessionsCovered: 14, since: 'Sep 2025', note: 'Venue lead — holds the store key' },
  { id: 't2', name: 'Priya Shah', venue: 'Kingsmead Rec Ground', inducted: true, dbs: 'valid', sessionsCovered: 11, since: 'Jan 2026' },
  { id: 't3', name: 'Mark Renwick', venue: 'Kingsmead Rec Ground', inducted: true, dbs: 'pending', sessionsCovered: 6, since: 'Apr 2026' },
  { id: 't4', name: 'Ana Kovač', venue: 'Elmwood Park Courts', inducted: true, dbs: 'valid', sessionsCovered: 12, since: 'Sep 2025', note: 'Runs the inclusive-session adaptations' },
  { id: 't5', name: 'Tom Whittle', venue: 'Elmwood Park Courts', inducted: true, dbs: 'valid', sessionsCovered: 9, since: 'Feb 2026' },
  { id: 't6', name: 'Gemma Colefax', venue: 'Bramley Green Courts', inducted: true, dbs: 'valid', sessionsCovered: 8, since: 'Mar 2026' },
  { id: 't7', name: 'Sofia Nazari', venue: 'Bramley Green Courts', inducted: false, dbs: 'pending', sessionsCovered: 0, since: 'Jul 2026', note: 'Induction booked for 6 Sept' },
]

export const TP_TENOR_STATS_ROW = [
  { label: 'TENORS', value: '7' },
  { label: 'VENUES COVERED', value: '3' },
  { label: 'VENUES SESSION-READY', value: '3/3' },
  { label: 'SESSIONS COVERED (TERM)', value: '28' },
  { label: 'INDUCTIONS PENDING', value: '1' },
  { label: 'RECRUITMENT PIPELINE', value: '3' },
]

// ─── Person detail (coach/TENOR profile pages — maps from Lumio coach view) ─
export interface TpAssignment {
  name: string
  kind: 'school' | 'venue'
  detail: string
  status?: string
}

export interface TpPersonDetail {
  email: string
  phone: string
  availability: string
  dbsNumber?: string
  dbsIssued?: string
  dbsExpiry?: string
  safeguardingDate?: string
  firstAid?: string
  insurance?: string
  assignments: TpAssignment[]
  cal: CalEvent[]
}

export const COACH_DETAILS: Record<string, TpPersonDetail> = {
  nb: {
    email: 'natalie@tenproject.org.uk', phone: '07700 900456', availability: 'Mon–Sat · term time + weekends',
    dbsNumber: '0012 8891 4432', dbsIssued: '02/03/2024', dbsExpiry: '02/03/2027', safeguardingDate: '14/11/2025', firstAid: 'expires 30/08/2026 ⚠', insurance: '£5m · to 01/2027',
    assignments: [
      { name: 'Oakridge Primary', kind: 'school', detail: 'Y3 Falcons + Y4 Kestrels · Week 4 of 10 · 58 children', status: 'RUNNING' },
      { name: 'Kingsmead Rec Ground', kind: 'venue', detail: 'Saturday family session · session lead · 3 TENORs', status: 'SAT 1.30PM' },
    ],
    cal: CAL_EVENTS.coach,
  },
  th: {
    email: 'tom@tenproject.org.uk', phone: '07700 900457', availability: 'Tue–Sun · 24h/wk',
    dbsNumber: '0043 2210 9987', dbsIssued: '10/11/2023', dbsExpiry: '10/11/2026', safeguardingDate: '02/02/2026', firstAid: 'expires in 6 weeks ⚠', insurance: '£5m · to 03/2027',
    assignments: [
      { name: 'Meridian Park Primary', kind: 'school', detail: '2 cohorts · 45 children · starts w/c 14 Sept', status: 'CONFIRMED' },
      { name: 'Elmwood Park Courts', kind: 'venue', detail: 'Sunday family session · inclusive sessions · 2 TENORs', status: 'SUN 10AM' },
    ],
    cal: [
      { day: 'Tue', time: '10.00', title: 'Meridian Park — planning visit', where: 'School office', kind: 'school' },
      { day: 'Thu', time: '14.00', title: 'Inclusive-session CPD (video)', kind: 'admin' },
      { day: 'Sun', time: '10.00', title: 'Elmwood family session — lead', where: 'Elmwood Park', kind: 'weekend' },
    ],
  },
  lt: {
    email: 'lucy@tenproject.org.uk', phone: '07700 900458', availability: 'Mon–Fri · term time',
    dbsNumber: '0077 4451 2210', dbsIssued: '19/08/2023', dbsExpiry: '19/08/2026', safeguardingDate: '20/09/2025', firstAid: 'valid to 02/2027', insurance: '£5m · to 01/2027',
    assignments: [
      { name: 'Willowbrook Primary', kind: 'school', detail: 'Programme complete · renewal conversation open', status: 'COMPLETE' },
    ],
    cal: [
      { day: 'Wed', time: '15.30', title: 'Willowbrook — renewal meeting w/ head', where: 'School', kind: 'school' },
      { day: 'Fri', time: '9.00', title: 'DBS renewal — submit documents', kind: 'admin' },
    ],
  },
  mw: {
    email: 'marcus@tenproject.org.uk', phone: '07700 900459', availability: 'Tue + Thu + Sat',
    dbsNumber: '0091 3345 6678', dbsIssued: '05/01/2025', dbsExpiry: '05/01/2028', safeguardingDate: '11/01/2026', firstAid: 'valid to 09/2026', insurance: 'covered under programme policy',
    assignments: [
      { name: 'Oakridge Primary', kind: 'school', detail: 'Assisting Natalie — both cohorts', status: 'RUNNING' },
    ],
    cal: [
      { day: 'Tue', time: '13.15', title: 'Oakridge — assist Y3 + Y4', where: 'School hall', kind: 'school' },
      { day: 'Sat', time: '13.30', title: 'Kingsmead family session — support', where: 'Kingsmead Rec', kind: 'weekend' },
    ],
  },
  ev: {
    email: 'eleanor@tenproject.org.uk', phone: '07700 900460', availability: 'Sat + school holidays',
    dbsNumber: '0022 7789 0034', dbsIssued: '14/06/2024', dbsExpiry: '14/06/2027', safeguardingDate: '03/03/2026', firstAid: 'valid to 03/2027', insurance: '£5m · to 01/2027',
    assignments: [
      { name: 'Bramley Green Courts', kind: 'venue', detail: 'Saturday family session · adult+family focus · 2 TENORs', status: 'SAT 11.30AM' },
    ],
    cal: [
      { day: 'Sat', time: '11.30', title: 'Bramley Green family session — lead', where: 'Bramley Green', kind: 'weekend' },
    ],
  },
  jm: {
    email: 'jordan@tenproject.org.uk', phone: '07700 900461', availability: 'Tue + Sat (shadowing)',
    dbsNumber: '— application submitted', dbsIssued: '—', dbsExpiry: '—', safeguardingDate: 'booked 05/08/2026', firstAid: 'booked 12/08/2026', insurance: 'n/a until certified',
    assignments: [
      { name: 'Oakridge Primary', kind: 'school', detail: 'Shadowing Natalie — supervised only', status: 'TRAINING' },
    ],
    cal: [
      { day: 'Tue', time: '13.15', title: 'Oakridge — shadowing (supervised)', where: 'School hall', kind: 'school' },
    ],
  },
}

export const TENOR_DETAILS: Record<string, TpPersonDetail> = {
  t1: {
    email: 'david.o@familymail.example', phone: '07700 900489', availability: 'Saturdays',
    dbsNumber: '0055 6612 3390', dbsIssued: '20/09/2025', dbsExpiry: '20/09/2028', safeguardingDate: 'Volunteer induction 20/09/2025',
    assignments: [{ name: 'Kingsmead Rec Ground', kind: 'venue', detail: 'Venue lead · holds store key · register duty', status: 'SAT 1.30PM' }],
    cal: CAL_EVENTS.tenor,
  },
  t2: {
    email: 'priya.s@familymail.example', phone: '07700 900490', availability: 'Saturdays',
    dbsNumber: '0061 2298 4471', dbsIssued: '12/01/2026', dbsExpiry: '12/01/2029', safeguardingDate: 'Volunteer induction 12/01/2026',
    assignments: [{ name: 'Kingsmead Rec Ground', kind: 'venue', detail: 'Register + warm-up games', status: 'SAT 1.30PM' }],
    cal: [{ day: 'Sat', time: '13.10', title: 'TENOR briefing + session', where: 'Kingsmead Rec', kind: 'weekend' }],
  },
  t3: {
    email: 'mark.r@familymail.example', phone: '07700 900491', availability: 'Saturdays (fortnightly)',
    dbsNumber: 'pending — submitted 04/07/2026', dbsIssued: '—', dbsExpiry: '—', safeguardingDate: 'Volunteer induction 18/04/2026',
    assignments: [{ name: 'Kingsmead Rec Ground', kind: 'venue', detail: 'Equipment + gate QR sign', status: 'SAT 1.30PM' }],
    cal: [{ day: 'Fri', time: '17.30', title: 'Equipment check', where: 'Kingsmead store', kind: 'admin' }],
  },
  t4: {
    email: 'ana.k@familymail.example', phone: '07700 900492', availability: 'Sundays',
    dbsNumber: '0033 9987 1123', dbsIssued: '28/09/2025', dbsExpiry: '28/09/2028', safeguardingDate: 'Volunteer induction 28/09/2025 · inclusive-session training 11/2025',
    assignments: [{ name: 'Elmwood Park Courts', kind: 'venue', detail: 'Runs inclusive-session adaptations', status: 'SUN 10AM' }],
    cal: [{ day: 'Sun', time: '10.00', title: 'Elmwood family session', where: 'Elmwood Park', kind: 'weekend' }],
  },
  t5: {
    email: 'tom.w@familymail.example', phone: '07700 900493', availability: 'Sundays',
    dbsNumber: '0044 5561 8890', dbsIssued: '02/02/2026', dbsExpiry: '02/02/2029', safeguardingDate: 'Volunteer induction 02/02/2026',
    assignments: [{ name: 'Elmwood Park Courts', kind: 'venue', detail: 'Register duty', status: 'SUN 10AM' }],
    cal: [{ day: 'Sun', time: '10.00', title: 'Elmwood family session', where: 'Elmwood Park', kind: 'weekend' }],
  },
  t6: {
    email: 'gemma.c@familymail.example', phone: '07700 900494', availability: 'Saturdays',
    dbsNumber: '0072 3310 5567', dbsIssued: '15/03/2026', dbsExpiry: '15/03/2029', safeguardingDate: 'Volunteer induction 15/03/2026',
    assignments: [{ name: 'Bramley Green Courts', kind: 'venue', detail: 'Register + parent liaison', status: 'SAT 11.30AM' }],
    cal: [{ day: 'Sat', time: '11.30', title: 'Bramley Green family session', where: 'Bramley Green', kind: 'weekend' }],
  },
  t7: {
    email: 'sofia.n@familymail.example', phone: '07700 900495', availability: 'Saturdays (from Sept)',
    dbsNumber: 'pending — submitted 10/07/2026', dbsIssued: '—', dbsExpiry: '—', safeguardingDate: 'Induction booked 06/09/2026',
    assignments: [{ name: 'Bramley Green Courts', kind: 'venue', detail: 'Joining from September', status: 'PENDING' }],
    cal: [{ day: 'Sat', time: '9.00', title: 'Induction (booked 6 Sept)', kind: 'admin' }],
  },
}

// ─── HQ school deep-dive detail ─────────────────────────────────────────────
export interface TpSchoolDetail {
  contacts: { name: string; role: string; email: string; phone: string }[]
  safeguardingLead: string
  funding: string
  address: string
  cohorts: { name: string; children: number; coach: string; week: number }[]
  attendanceTrend: number[]     // % per week so far
  activationPct: number
  conversionPct: number
  weekendVenue?: string
  kit: string
  fundraising?: { raised: number; target: number; supporters: number }
  notes: string[]
  nextActions: string[]
}

export const SCHOOL_DETAILS: Record<string, TpSchoolDetail> = {
  oakridge: {
    contacts: [
      { name: 'Mrs L. Carter', role: 'Headteacher', email: 'head@oakridge.example.sch.uk', phone: '020 7946 0301' },
      { name: 'Mrs A. Patel', role: 'PE lead (hand-over teacher)', email: 'a.patel@oakridge.example.sch.uk', phone: '020 7946 0302' },
    ],
    safeguardingLead: 'Mr J. Okafor (DSL)',
    funding: 'School budget — confirmed for 2026/27',
    address: 'Oakridge Lane, Kingsbridge',
    cohorts: [
      { name: 'Y3 Falcons', children: 28, coach: 'Natalie Brooks', week: 4 },
      { name: 'Y4 Kestrels', children: 30, coach: 'Natalie Brooks', week: 4 },
    ],
    attendanceTrend: [92, 95, 94, 94],
    activationPct: 62,
    conversionPct: 21,
    weekendVenue: 'Kingsmead Rec Ground (Sat 1.30pm)',
    kit: 'Delivered w/c 8 Jun · 2 rackets flagged cracked — replacement requested',
    notes: ['Head wants festival date before October half-term', 'Y4 teacher keen to lead sessions from week 7'],
    nextActions: ['Confirm festival date + family invites', 'Replace damaged rackets before Tue', 'Push parent activation — 22 families not yet in the app'],
  },
  stclements: {
    contacts: [
      { name: 'Mr D. Whitmore', role: 'Headteacher', email: 'head@stclements.example.sch.uk', phone: '020 7946 0311' },
      { name: 'Miss R. Adeyemi', role: 'PE lead', email: 'r.adeyemi@stclements.example.sch.uk', phone: '020 7946 0312' },
    ],
    safeguardingLead: 'Mrs T. Lund (DSL)',
    funding: 'UNFUNDED for 2026/27 — fundraising campaign live',
    address: 'Clement Road, Kingsbridge',
    cohorts: [
      { name: '2025/26 programme (complete)', children: 62, coach: 'Lucy Tran', week: 10 },
    ],
    attendanceTrend: [91, 94, 95, 92, 94, 93, 90, 95, 94, 96],
    activationPct: 58,
    conversionPct: 18,
    weekendVenue: 'Kingsmead Rec Ground (Sat 1.30pm)',
    kit: 'Equipment retained by school from 2025/26 — full set, good condition',
    fundraising: { raised: 2150, target: 3200, supporters: 84 },
    notes: ['Ran 2025/26 with excellent results — see Governor pack', 'PTA leading events; Sponsored Ball Hit 10 Oct is the big one'],
    nextActions: ['£410 to match-funding trigger — nudge the public page this week', 'Confirm receiving entity (PTA vs Ten Project) for Gift Aid', 'Pencil Spring term start date for when campaign closes'],
  },
  meridianpark: {
    contacts: [
      { name: 'Ms P. Osei', role: 'Headteacher', email: 'head@meridianpark.example.sch.uk', phone: '020 7946 0321' },
    ],
    safeguardingLead: 'Ms P. Osei (acting DSL)',
    funding: 'Borough grant — Ashwell active-schools fund',
    address: 'Meridian Way, Ashwell',
    cohorts: [
      { name: 'Y2 (from Sept)', children: 22, coach: 'Tom Hale', week: 0 },
      { name: 'Y3 (from Sept)', children: 23, coach: 'Tom Hale', week: 0 },
    ],
    attendanceTrend: [],
    activationPct: 0,
    conversionPct: 0,
    weekendVenue: 'Elmwood Park Courts (Sun 10am)',
    kit: 'Order placed — delivery due w/c 7 Sept',
    notes: ['First programme at this school — welcome-pack QR activation to be included from day one'],
    nextActions: ['Collect class lists + consents by 1 Sept', 'Week-1 venue setup: Tom + Elmwood TENORs', 'Send head the what-to-expect pack'],
  },
  harrowfield: {
    contacts: [
      { name: 'Mrs J. Lindley', role: 'Headteacher', email: 'head@harrowfield.example.sch.uk', phone: '020 7946 0331' },
    ],
    safeguardingLead: 'TBC at intake',
    funding: 'Exploring — school has no PE budget headroom; fundraising route offered',
    address: 'Harrow Field Road, Ashwell',
    cohorts: [],
    attendanceTrend: [],
    activationPct: 0,
    conversionPct: 0,
    kit: '—',
    notes: ['Enquiry via bring-to-your-area, 3 Jul', 'Head very keen; governors meet 10 Sept'],
    nextActions: ['Send intro pack + Willowbrook results', 'Offer fundraising campaign walkthrough before governors meet'],
  },
  willowbrook: {
    contacts: [
      { name: 'Mr S. Faulkner', role: 'Headteacher', email: 'head@willowbrook.example.sch.uk', phone: '020 7946 0341' },
    ],
    safeguardingLead: 'Mrs K. Douglas (DSL)',
    funding: 'PE & Sport Premium (final year) — 2026/27 UNFUNDED, renewal at risk',
    address: 'Willow Brook Lane, Kingsbridge',
    cohorts: [
      { name: 'Y2 Robins (complete)', children: 30, coach: 'Lucy Tran', week: 10 },
      { name: 'Y5 Hawks (complete)', children: 31, coach: 'Lucy Tran', week: 10 },
    ],
    attendanceTrend: [90, 92, 89, 91, 93, 92, 88, 94, 93, 95],
    activationPct: 71,
    conversionPct: 26,
    weekendVenue: 'Bramley Green Courts (Sat 11.30am)',
    kit: 'Retained by school — inventory checked 30 Jun',
    notes: ['Best conversion rate in the programme (26%)', 'Head open to fundraising route — suggested switching status'],
    nextActions: ['Switch to FUNDRAISING status and open a campaign', 'Reuse Governor-pack results as the campaign story'],
  },
}

// ─── HQ venue deep-dive detail ──────────────────────────────────────────────
export interface TpVenueDetail {
  address: string
  postcode: string
  courts: string
  surface: string
  access: string
  storage: string
  sessions: { day: string; time: string; type: string }[]
  leadCoach: string
  tenorTeam: string[]
  inclusive: boolean
  external?: { partner: string; url: string }
  familiesRegistered: number
  attendanceTrend: number[]   // children per session, recent weeks
  feederSchools: string[]
  kit: string
  notes: string[]
  nextActions: string[]
}

export const VENUE_DETAILS: Record<string, TpVenueDetail> = {
  kingsmead: {
    address: 'Kingsmead Recreation Ground, Kings Road, Kingsbridge',
    postcode: 'KB2 4RG',
    courts: '3 courts (2 bookable for sessions)',
    surface: 'Tarmac, fenced · floodlights off at weekends',
    access: 'Gate code 2244 · QR gate sign on hook inside store',
    storage: 'Green store box by court 1 — David Okafor holds the key',
    sessions: [
      { day: 'Saturday', time: '1.30–2.30pm', type: 'Free Community Family Session' },
    ],
    leadCoach: 'Natalie Brooks',
    tenorTeam: ['David Okafor (lead)', 'Priya Shah', 'Mark Renwick'],
    inclusive: false,
    familiesRegistered: 34,
    attendanceTrend: [14, 16, 19, 17, 19],
    feederSchools: ['Oakridge Primary', 'St Clement’s Primary'],
    kit: '24 rackets · 40 red balls · 4 mini nets · cones — 2 rackets cracked, replacement requested',
    notes: ['Best-attended venue; families arrive early — open gate 1.15', 'Council re-lining courts over October half-term'],
    nextActions: ['Replace 2 cracked rackets', 'Print fresh QR gate sign (laminate fading)'],
  },
  bramley: {
    address: 'Bramley Green Courts, Green Lane, Kingsbridge',
    postcode: 'KB5 8TW',
    courts: '2 courts',
    surface: 'Macadam, part-fenced',
    access: 'Open access · QR sign zip-tied to gate',
    storage: 'Lock-up shared with bowls club — Gemma Colefax has fob',
    sessions: [
      { day: 'Saturday', time: '11.30am–12.30pm', type: 'Free Community Family Session' },
    ],
    leadCoach: 'Eleanor Vance',
    tenorTeam: ['Gemma Colefax', 'Sofia Nazari (from Sept)'],
    inclusive: false,
    familiesRegistered: 21,
    attendanceTrend: [11, 12, 14, 13, 14],
    feederSchools: ['Willowbrook Primary'],
    kit: 'Full set, good condition — checked 30 Jun',
    notes: ['Register submitted late twice — auto-submit fixed it', 'Only 2 TENORs — one absence risks the session'],
    nextActions: ['Recruit a third TENOR (2 parents interested)', 'Confirm Sofia’s induction 6 Sept'],
  },
  elmwood: {
    address: 'Elmwood Park Courts, Elmwood Avenue, Ashwell',
    postcode: 'AW3 6QL',
    courts: '4 courts (2 used)',
    surface: 'Acrylic hard court',
    access: 'Via partner booking platform · linked venue',
    storage: 'Park keeper’s store — arrange access via council',
    sessions: [
      { day: 'Sunday', time: '10–11am', type: 'Free Community Family Session (inclusive)' },
    ],
    leadCoach: 'Tom Hale',
    tenorTeam: ['Ana Kovač', 'Tom Whittle'],
    inclusive: true,
    external: { partner: 'Partner booking platform', url: 'https://clubspark.lta.org.uk' },
    familiesRegistered: 17,
    attendanceTrend: [8, 10, 11, 10, 11],
    feederSchools: ['Meridian Park Primary (from Sept)'],
    kit: 'Full set incl. sensory-friendly equipment',
    notes: ['Bookings run through the partner platform — portal links out, attendance still via QR scan-in', 'Inclusive sessions designed with Ana — families travel from 3 boroughs'],
    nextActions: ['Sync September restart date with partner platform listing', 'Meridian Park week-1 setup visit — Tom + TENORs'],
  },
}

export const TP_VENUE_READINESS = [
  { venue: 'Kingsmead Rec Ground', tenors: 3, min: 2, ready: true },
  { venue: 'Bramley Green Courts', tenors: 2, min: 2, ready: true },
  { venue: 'Elmwood Park Courts', tenors: 2, min: 2, ready: true, note: 'Tight — one absence cancels. Recruiting a third.' },
]

// TENOR weekend register — Kingsmead
export const WEEKEND_FAMILIES = [
  { id: 'w1', family: 'Whitfield', children: 'Mia + Tom', checkedIn: true, via: 'QR' },
  { id: 'w2', family: 'Okonkwo', children: 'Ava', checkedIn: true, via: 'QR' },
  { id: 'w3', family: 'Renwick', children: 'Isla + Beth', checkedIn: true, via: 'TENOR' },
  { id: 'w4', family: 'Aldous', children: 'Freya', checkedIn: false, via: '—' },
  { id: 'w5', family: 'Tilbrook', children: 'Oscar', checkedIn: true, via: 'QR' },
  { id: 'w6', family: 'Nazari', children: 'Poppy + Sami', checkedIn: false, via: '—' },
]
