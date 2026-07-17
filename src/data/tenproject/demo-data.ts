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

// TENOR weekend register — Kingsmead
export const WEEKEND_FAMILIES = [
  { id: 'w1', family: 'Whitfield', children: 'Mia + Tom', checkedIn: true, via: 'QR' },
  { id: 'w2', family: 'Okonkwo', children: 'Ava', checkedIn: true, via: 'QR' },
  { id: 'w3', family: 'Renwick', children: 'Isla + Beth', checkedIn: true, via: 'TENOR' },
  { id: 'w4', family: 'Aldous', children: 'Freya', checkedIn: false, via: '—' },
  { id: 'w5', family: 'Tilbrook', children: 'Oscar', checkedIn: true, via: 'QR' },
  { id: 'w6', family: 'Nazari', children: 'Poppy + Sami', checkedIn: false, via: '—' },
]
