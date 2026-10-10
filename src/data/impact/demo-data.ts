// ─── LUMIO IMPACT — FICTIONAL DEMO DATA (/impact/demo) ───────────────────────
// Northvale Sport Foundation runs "Rally Ten", a 10-week in-school tennis
// programme with free weekend family sessions. EVERYTHING here is fictional —
// the foundation, programme, schools, venues, people and places (Pattern 1,
// docs/brand-universe.md §D). Cameos come from the Meridian/Apex/Crown
// universe; DfE, PE & Sport Premium, PESSPN, LTA qualifications and Sport
// England are kept as factual governing-body references (Pattern 2).
// Same shape as src/data/tenproject/demo-data.ts (which still powers the
// legacy /tenproject route) so the shared portal views render either set.

import type {
  SchoolStatus, DemoSchool, DemoVenue, DemoChild, FundraisingEvent, CommsCampaign, CommsAudience,
  CommsJourney, SocialPost, SocialPublished, CalEvent, TpCoach, TpTenor, TpAssignment, TpPersonDetail,
  TpSchoolDetail, TpVenueDetail, PesspnCriterion, PesspnStatus, PesspnVerdict, SchoolReadiness,
} from '@/data/tenproject/demo-data'

export const CURRICULUM: { weeks: string; skill: string; tip: string; didYouKnow: string }[] = [
  { weeks: '1 & 2', skill: 'FOREHAND', tip: 'Keep your eye on the ball… hit low to high… one bounce only', didYouKnow: 'A forehand is usually a tennis player’s favourite shot — and the easiest to master.' },
  { weeks: '3 & 4', skill: 'BACKHAND', tip: 'Hold the racket with two hands, favourite hand at the bottom of the grip', didYouKnow: 'The backhand can be played with one or two hands!' },
  { weeks: '5 & 6', skill: 'VOLLEY', tip: 'Hold the racket at the bottom of the grip and keep the racket up', didYouKnow: 'To be a successful volleyer you need quick reflexes.' },
  { weeks: '7 & 8', skill: 'SERVE', tip: 'The serve is a throwing action — try throwing the ball first', didYouKnow: 'The fastest serve ever recorded is 163 mph.' },
  { weeks: '9', skill: 'GAME PLAY', tip: 'Keep the score and say it nice and loud after each point', didYouKnow: 'The longest tennis match ever played lasted over 11 hours!' },
  { weeks: '10', skill: 'RALLY TEN FESTIVAL', tip: 'Bring your family and celebrate everything you have learnt!', didYouKnow: 'Every child completing the festival receives their Rally Ten certificate.' },
]

export const STICKER_AREAS = [
  { id: 'abc', label: 'Move & ABCs', desc: 'Agility, Balance, Coordination' },
  { id: 'shots', label: 'The Shots', desc: 'Forehand, backhand, volley, serve' },
  { id: 'games', label: 'Games & Challenges', desc: 'Games, challenges, competitions' },
  { id: 'gameplay', label: 'Rally & Score', desc: 'Hit, move, rally, score' },
  { id: 'together', label: 'Teamwork & Respect', desc: 'Communication, respect, fair play' },
  { id: 'festival', label: 'The Festival', desc: 'The week-10 celebration' },
] as const

export const SCHOOLS: DemoSchool[] = [
  { id: 'hollinsmere', name: 'Hollinsmere Primary', borough: 'Northvale', status: 'running', week: 4, children: 58, cohorts: 2, coach: 'Hannah Moreton', headTeacher: 'Mrs H. Sandford', activation: 62, note: 'Week 4 of 10 — backhand block' },
  { id: 'staldrics', name: 'St Aldric’s C of E Primary', borough: 'Northvale', status: 'fundraising', headTeacher: 'Mr G. Ashworth', note: 'Unfunded for 2026/27 — campaign live' },
  { id: 'thornleigh', name: 'Thornleigh Green Primary', borough: 'Ashgrove', status: 'confirmed', children: 45, cohorts: 2, coach: 'Owen Pryce', headTeacher: 'Ms F. Grant', note: 'Starts w/c 14 Sept' },
  { id: 'copperwick', name: 'Copperwick Primary', borough: 'Ashgrove', status: 'enquiry', headTeacher: 'Mrs K. Doyle', note: 'Bring-to-your-area request, 3 Jul' },
  { id: 'fernleypark', name: 'Fernley Park Primary', borough: 'Northvale', status: 'complete', children: 61, cohorts: 2, coach: 'Hannah Moreton', headTeacher: 'Mr P. Rowntree', activation: 71, note: 'Renewal conversation due — unfunded risk' },
]

export const VENUES: DemoVenue[] = [
  { id: 'northvale', name: 'Northvale Rec Ground', day: 'Saturday', time: '1.30–2.30pm', tenors: 3, lastCount: 19 },
  { id: 'copperfield', name: 'Copperfield Green Courts', day: 'Saturday', time: '11.30am–12.30pm', tenors: 2, lastCount: 14 },
  { id: 'ellisford', name: 'Ellisford Park Courts', day: 'Sunday', time: '10–11am', tenors: 2, external: true, lastCount: 11 },
]

// Hollinsmere Y3 Otters cohort — coach register demo
export const COHORT_CHILDREN: DemoChild[] = [
  { id: 'c1', name: 'Ella Ashby', year: 'Y3', stickers: 3, present: true },
  { id: 'c2', name: 'Finn Carver', year: 'Y3', stickers: 3, present: true },
  { id: 'c3', name: 'Maisie Dalby', year: 'Y3', stickers: 2, present: true },
  { id: 'c4', name: 'Theo Barrow', year: 'Y3', stickers: 3, present: false },
  { id: 'c5', name: 'Zara Mensah', year: 'Y3', stickers: 3, present: true },
  { id: 'c6', name: 'Archie Pemberton', year: 'Y3', stickers: 1, present: true },
  { id: 'c7', name: 'Ruby Calloway', year: 'Y3', stickers: 3, present: true },
  { id: 'c8', name: 'Harvey Quinn', year: 'Y3', stickers: 2, present: true },
  { id: 'c9', name: 'Lily Haddad', year: 'Y3', stickers: 3, present: true },
  { id: 'c10', name: 'Jack Hartley', year: 'Y3', stickers: 2, present: false },
  { id: 'c11', name: 'Evie Thornton', year: 'Y3', stickers: 3, present: true },
  { id: 'c12', name: 'Max Penhale', year: 'Y3', stickers: 2, present: true },
]

// ─── Fundraising (St Aldric's campaign) ────────────────────────────────────

export const CAMPAIGN = {
  school: 'St Aldric’s C of E Primary',
  target: 3200,
  raised: 2150,
  matchPartner: 'Meridian Community Fund', // fictional cameo — brand universe
  matchNote: 'Meridian Community Fund will top up the final 20% (£640) once the campaign passes £2,560.',
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
    'Poster + school-newsletter copy, ready to print (A4/A5, Rally Ten branding)',
    'Letter to parents explaining the pledge — per-ball or flat amount, online collection link',
    'Risk-assessment prompt list to complete with the school office',
    'Local-business sponsorship ask — three tiers (£50 / £150 / £350) with what each funds',
    'On-the-day run sheet: warm-up, 10-minute hit windows per class, live tally in the app',
  ],
}

// ─── Parent persona ─────────────────────────────────────────────────────────
export const PARENT = {
  name: 'Rachel Ashby',
  children: [
    { name: 'Ella', age: 7, school: 'Hollinsmere Primary', stickers: 3 },
    { name: 'Sam', age: 5, school: 'Hollinsmere Primary', stickers: 2 },
  ],
  venue: VENUES[0],
  consents: { data: true, photo: true, emergency: 'Grandad (Ray) — 07700 900123' },
}

export const PARENT_MESSAGES = [
  { id: 'm1', from: 'Coach Hannah', when: 'Today, 3.05pm', text: 'Great session today — Ella earned her Shots sticker for the backhand! Ask her to show you the two-handed grip. 🎾' },
  { id: 'm2', from: 'Rally Ten HQ', when: 'Mon, 9.00am', text: 'Week 4 — BACKHAND week! Your family session this Saturday is at Northvale Rec Ground, 1.30–2.30pm. Tap to confirm you’re coming.' },
  { id: 'm3', from: 'Court Captain Martin', when: 'Sat, 2.41pm', text: 'Lovely session everyone — 19 of us on court! Photos (consented families only) are in this week’s gallery.' },
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

export const NEEDS_ATTENTION: { id: string; text: string; kind: string; target: { tab: string; id?: string } }[] = [
  { id: 'a1', text: 'Fernley Park renewal at risk — school reports no 2026/27 funding. Suggest: switch to fundraising status.', kind: 'warn', target: { tab: 'schools', id: 'fernleypark' } },
  { id: 'a2', text: 'Copperfield Green register not submitted for Sat 11 Jul — chase Court Captain team.', kind: 'warn', target: { tab: 'venues', id: 'copperfield' } },
  { id: 'a3', text: 'Coach Owen Pryce’s First Aid certificate expires in 6 weeks.', kind: 'info', target: { tab: 'coaches' } },
  { id: 'a4', text: 'St Aldric’s campaign is £410 from its match-funding trigger.', kind: 'info', target: { tab: 'schools', id: 'staldrics' } },
]

// ─── Comms (HQ communications centre — mapped from tennis coach Send Message) ─
export const COMMS_INBOX = [
  { id: 'i1', from: 'Mrs H. Sandford', who: 'Head — Hollinsmere Primary', channel: 'email', when: '08:42', text: 'Festival date works — can we hold the hall from 1pm? Also 3 parents asked about weekend sessions after Friday’s assembly.', unread: true },
  { id: 'i2', from: 'Martin Adeyinka', who: 'Court Captain — Northvale', channel: 'whatsapp', when: '08:15', text: 'Two cracked rackets in the store box — flagged in the app. Do we swap Saturday or wait for the delivery?', unread: true },
  { id: 'i3', from: 'Rachel Ashby', who: 'Parent — Hollinsmere', channel: 'app', when: 'Yesterday', text: 'Ella lost her booklet 😅 is there a way to get a replacement before Saturday?', unread: true },
  { id: 'i4', from: 'Mr G. Ashworth', who: 'Head — St Aldric’s', channel: 'email', when: 'Yesterday', text: 'PTA confirmed the quiz night venue for 14 Nov. Can the portal page show it once the poster is ready?', unread: false },
  { id: 'i5', from: 'Hannah Moreton', who: 'Lead coach', channel: 'sms', when: 'Mon', text: 'Y4 Foxes flying — 3 more sticker awards today. AI summary sent to the school.', unread: false },
  { id: 'i6', from: 'Ashgrove Parks Team', who: 'Ellisford Park venue contact', channel: 'email', when: 'Mon', text: 'Courts resurfacing complete — happy to restart sessions from September.', unread: false },
]

export const COMMS_RECIPIENTS = [
  { id: 'r1', label: 'Hollinsmere Primary', desc: 'School · head + PE lead', icon: 'school' },
  { id: 'r2', label: 'St Aldric’s C of E Primary', desc: 'School · head + PTA', icon: 'school' },
  { id: 'r3', label: 'Northvale families', desc: 'Group · 34 families', icon: 'group' },
  { id: 'r4', label: 'Northvale Court Captain team', desc: 'Group · 3 Court Captains', icon: 'group' },
  { id: 'r5', label: 'All coaches', desc: 'Group · 6 coaches', icon: 'group' },
  { id: 'r6', label: 'All parents (term-time)', desc: 'Broadcast · 121 activated families', icon: 'broadcast' },
]

export const NEWSLETTERS = [
  { id: 'n1', title: 'September restart — venues & dates', status: 'draft', when: 'send w/c 1 Sept', opens: null },
  { id: 'n2', title: 'What a summer! Term wrap-up', status: 'sent', when: '15 Jul', opens: '61% opened · 24% clicked' },
  { id: 'n3', title: 'Week 4 — backhand week + Saturday sessions', status: 'sent', when: 'Mon', opens: '74% opened · 41% confirmed a session' },
]

// ─── Full comms suite (email-tool replacement) ──────────────────────────────
export const COMMS_STATS_NL = [
  { label: 'AVG OPEN RATE', value: '68%', sub: 'industry avg 37%' },
  { label: 'AVG CLICK RATE', value: '31%', sub: 'industry avg 3%' },
  { label: 'LIST SIZE', value: '121', sub: '+8 this month' },
  { label: 'UNSUBSCRIBES', value: '0.3%', sub: 'last 90 days' },
  { label: 'DELIVERABILITY', value: '99.1%', sub: 'bounce 0.9%' },
]

export const COMMS_CAMPAIGNS: CommsCampaign[] = [
  { id: 'c1', title: 'Week 4 — backhand week + Saturday sessions', status: 'sent', when: 'Mon 09:00', audience: 'All families', sent: 121, openRate: 74, clickRate: 41, bounceRate: 1, unsub: 0, replies: 6 },
  { id: 'c2', title: 'What a summer! Term wrap-up', status: 'sent', when: '15 Jul', audience: 'All families', sent: 118, openRate: 61, clickRate: 24, bounceRate: 2, unsub: 1, replies: 3 },
  { id: 'c3', title: 'St Aldric’s Sponsored Ball Hit — pledge now', status: 'sent', when: '8 Jul', audience: 'St Aldric’s families', sent: 62, openRate: 69, clickRate: 38, bounceRate: 0, unsub: 0, replies: 2 },
  { id: 'c4', title: 'A/B test — “We’re back!” vs “Your Sept sessions”', status: 'testing', when: 'sends Thu 17:00', audience: 'All families', variant: 'Variant A leading · 63% vs 57% open' },
  { id: 'c5', title: 'September restart — venues & dates', status: 'draft', when: 'scheduled w/c 1 Sept', audience: 'All families' },
]

export const COMMS_TEMPLATES = [
  { id: 't1', name: 'Weekly session confirmation', desc: 'Per-venue, auto-personalised', emoji: '📅' },
  { id: 't2', name: 'Term welcome / restart', desc: 'Hero + venue finder + CTAs', emoji: '🎾' },
  { id: 't3', name: 'Fundraising push', desc: 'Thermometer + donate button', emoji: '💷' },
  { id: 't4', name: 'Sticker celebration', desc: 'Progress + share prompt', emoji: '🌟' },
  { id: 't5', name: 'School / governor update', desc: 'Impact stats for heads', emoji: '📊' },
  { id: 't6', name: 'Blank — drag & drop', desc: 'Start from scratch', emoji: '✏️' },
]

export const COMMS_AUDIENCES: CommsAudience[] = [
  { id: 'all', name: 'All families', count: 121, growth: '+8 this month', desc: 'Every activated household, term-time', email: 96, sms: 71, app: 88 },
  { id: 'northvale', name: 'Northvale families', count: 34, desc: 'Linked to the Saturday venue', email: 97, sms: 74, app: 91 },
  { id: 'hollinsmere', name: 'Hollinsmere Primary', count: 58, desc: 'Current in-school programme', email: 95, sms: 69, app: 90 },
  { id: 'tenors', name: 'Court Captain volunteers', count: 7, desc: 'Weekend session leads', email: 100, sms: 100, app: 100 },
  { id: 'lapsed', name: 'Lapsed families', count: 23, desc: 'No weekend attendance 4+ weeks — win-back', email: 91, sms: 65, app: 78 },
  { id: 'highintent', name: 'High-intent (not yet weekend)', count: 31, desc: 'Engaged in-app, no weekend session yet', email: 94, sms: 68, app: 96 },
  { id: 'schools', name: 'School leads', count: 12, desc: 'Heads & PE leads — B2B pipeline', email: 100, sms: 0, app: 0 },
]

export const COMMS_JOURNEYS: CommsJourney[] = [
  { id: 'j1', name: 'New family welcome series', trigger: 'On registration', steps: ['Welcome + what to expect (instant)', 'Your first session details (day 1)', 'Meet your coach (day 3)', 'How the booklet works (day 7)'], active: true, inJourney: 14 },
  { id: 'j2', name: 'Weekend conversion nudge', trigger: 'Reached in school, no weekend visit by wk3', steps: ['“Try it together this Saturday” (wk3)', 'Reminder + map (wk4)', 'What other families say (wk5)'], active: true, inJourney: 31 },
  { id: 'j3', name: 'Win-back', trigger: 'No attendance for 4 weeks', steps: ['“We’ve missed you” (day 0)', 'This week’s session + skill (day 3)'], active: true, inJourney: 23 },
  { id: 'j4', name: 'Fundraising supporter journey', trigger: 'On donation', steps: ['Instant thank-you + receipt', 'Milestone update as target nears', '“We did it!” on unlock'], active: false, inJourney: 0 },
]

export const COMMS_EVENT_AUTOS = [
  { id: 'a1', label: 'Weekly session confirmations', desc: 'Mon + Thu in term time — each family gets THEIR venue only', meta: 'Last run Mon 09:00 · 121 sent · 74% opened' },
  { id: 'a2', label: 'Sticker notifications', desc: 'Parent notified the evening a Skill Sticker is awarded', meta: '34 sent this week' },
  { id: 'a3', label: 'Session change alerts', desc: 'Cancelled/moved → instant push + SMS fallback + calendar update', meta: 'Last fired 14 Jun (rain, Copperfield)' },
  { id: 'a4', label: 'Register chasing', desc: 'Missing register at 6pm → Court Captain lead + HQ nudged', meta: 'Fired Sat (Copperfield Green) — resolved' },
  { id: 'a5', label: 'Birthday & milestone messages', desc: 'A little message on a child’s birthday and on programme completion', meta: '5 queued this week' },
]

// ─── Social media (mapped from the tennis Media & Content module) ───────────
export const SOCIAL_STATS = [
  { platform: 'Instagram', handle: '@rallytenuk', followers: '4.8K', delta: '+6.2% vs last month' },
  { platform: 'Facebook', handle: '/rallytenuk', followers: '3.1K', delta: '+2.1% vs last month' },
  { platform: 'YouTube', handle: 'Rally Ten', followers: '1.9K', delta: '+9.4% vs last month' },
  { platform: 'X / Twitter', handle: '@rallytenuk', followers: '2.2K', delta: '+0.8% vs last month' },
]

export const SOCIAL_QUEUE: SocialPost[] = [
  { id: 's1', when: 'Today 17:00', platform: 'IG', status: 'scheduled', text: 'Backhand week at Hollinsmere! 58 children, two hands on the grip, zero swings missed (well, almost). EVERY CHILD. EVERY RALLY. 🎾 #rallyten', media: 'photo', hue: 8 },
  { id: 's2', when: 'Sat 15:30', platform: 'FB', status: 'scheduled', text: 'Saturday = family session day. Northvale Rec, 1.30pm, everything provided, everyone welcome — scan in at the gate and play. #rallyten', media: 'carousel', hue: 150 },
  { id: 's3', when: 'Sun 11:00', platform: 'YT', status: 'scheduled', text: '60 seconds of the Rally Ten Festival — every child a certificate, every family on court. 🎾', media: 'video', hue: 350 },
  { id: 's4', when: 'Sun 18:00', platform: 'IG', status: 'draft', text: 'Sticker of the week 🌟 — the moment a first backhand clears the net. Booklet out, sticker in. (Shared with family consent.)', media: 'photo', hue: 40 },
  { id: 's5', when: 'Mon 09:00', platform: 'X', status: 'needs approval', text: 'St Aldric’s is £410 from unlocking match funding for their 2026/27 programme. Local businesses — the Sponsored Ball Hit on 10 Oct has your name on it.', media: 'none', hue: 210 },
]

export const SOCIAL_PUBLISHED: SocialPublished[] = [
  { id: 'p1', when: 'Wed 18:00', platform: 'IG', text: 'What a summer! 950+ family visits, 100% would recommend us. Thank you for playing together. 🎾', media: 'carousel', hue: 8, reach: 4820, likes: 612, comments: 44, shares: 38, saves: 71, clicks: 190, top: true },
  { id: 'p2', when: 'Sat 20:00', platform: 'FB', text: 'Today at Northvale — 19 families, one very determined rally. See you next Saturday!', media: 'photo', hue: 150, reach: 2140, likes: 188, comments: 22, shares: 14, saves: 9, clicks: 63 },
  { id: 'p3', when: 'Thu 12:00', platform: 'YT', text: '45 seconds: how we teach the backhand to 5-year-olds (spoiler: balloons).', media: 'video', hue: 350, reach: 1310, likes: 96, comments: 11, shares: 7, saves: 18, clicks: 210 },
  { id: 'p4', when: 'Tue 09:00', platform: 'IG', text: 'Sticker moment 🌟 first backhand over the net. That face is the whole programme.', media: 'photo', hue: 40, reach: 1890, likes: 274, comments: 19, shares: 12, saves: 33, clicks: 41 },
]

export const SOCIAL_GROWTH = [ // total followers across channels, last 8 weeks
  { w: 'W1', n: 10200 }, { w: 'W2', n: 10480 }, { w: 'W3', n: 10910 }, { w: 'W4', n: 11250 },
  { w: 'W5', n: 11640 }, { w: 'W6', n: 12080 }, { w: 'W7', n: 12520 }, { w: 'W8', n: 12900 },
]

export const SOCIAL_BEST_TIMES: Record<string, string> = {
  IG: 'Best time: Sun 11am & Wed 6pm', FB: 'Best time: Sat 3pm', X: 'Best time: Mon 9am', YT: 'Best time: Sun 11am',
}

export const SOCIAL_HASHTAGS = ['#rallyten', '#EveryRally', '#SchoolTennis', '#FamilyTennis', '#FreeTennis', '#GrassrootsTennis', '#PrimaryPE', '#ActiveFamilies', '#CommunityTennis', '#MeridianOpen']

export const SOCIAL_AI_CAPTIONS = [
  'Week 4 = BACKHAND week 🎾 Two hands, favourite hand at the bottom, swing low to high. 58 children at Hollinsmere nailed it today — see you Saturday at Northvale, 1.30pm. Everything provided. #rallyten #EveryRally',
  'From school hall to community court: 44 families joined weekend sessions this term — our best yet. Free, all equipment provided, every family welcome. Find your venue at northvalesport.org.uk #rallyten',
  'One booklet. Six Skill Stickers. Ten weeks. The look on their face when sticker #3 goes in? That’s the whole point. 🎾 #rallyten #EveryRally',
]

// ─── Court Captain session plan — Week 4 (backhand) ─────────────────────────────────
export const WEEK4_SESSION_PLAN = {
  week: 4,
  skill: 'BACKHAND',
  duration: '60 min + 10 min setup',
  blocks: [
    { time: '1.20pm', mins: 10, title: 'Arrival & setup', detail: 'Cones out, 4 mini nets up, red balls in feeder buckets, QR sign on the gate. One Court Captain greets at the gate while families scan in.' },
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

// ─── Coach in-school session plan — Week 4 (backhand), Hollinsmere ─────────────
export const OAKRIDGE_ADDRESS = 'Hollinsmere Primary, Hollinsmere Lane, Northvale, NV1 2LN'

export const WEEK4_SCHOOL_PLAN = {
  week: 4,
  skill: 'BACKHAND',
  duration: '60 min per cohort + changeover',
  blocks: [
    { time: '1.00pm', mins: 15, title: 'Arrival & setup', detail: 'Sign in at reception (lanyard!), hall setup: 4 stations, mini nets, cones, red balls in feeder buckets. Mrs Bhatt joins for the hand-over segment.' },
    { time: '1.15pm', mins: 10, title: 'Warm-up — ABCs', detail: 'Traffic-lights (agility) → racket-balance relay (balance) → throw-catch-clap pairs (coordination). Whole class moving inside 60 seconds.' },
    { time: '1.25pm', mins: 10, title: 'Skill intro — the backhand', detail: 'Two-handed grip, favourite hand at the BOTTOM. Demo slow, then shadow swings in lines — look for the low-to-high finish over the shoulder.' },
    { time: '1.35pm', mins: 15, title: 'Drills — stations', detail: 'St 1: balloon backhands · St 2: drop-feed over mini net · St 3: target-zone backhands · St 4: teacher-led shadow + sticker spotting. Rotate every 4 minutes.' },
    { time: '1.50pm', mins: 15, title: 'Rally games', detail: '“Beat the coach” backhand points → team rally ladder. Names of sticker-standard backhands go on the board as you see them.' },
    { time: '2.05pm', mins: 10, title: 'Together time + sticker moments', detail: 'Award BACKHAND skill taps in the app (parents see it tonight); booklet reminder; plug Saturday’s family session at Northvale. Reset hall for Y4 Foxes, 2.20pm.' },
  ],
  coachingPoints: ['Favourite hand at the bottom of the grip', 'Low to high — finish over the shoulder', 'Sideways stance, step towards the ball', 'Mrs Bhatt leads the warm-up from week 5 — hand her the cards today'],
  equipment: ['24 rackets (19"–23")', '40 red felt balls (2 feeder buckets)', '20 cones · 4 mini nets', 'Throw-down lines', 'Sticker sheet + booklet trolley', 'First-aid kit (hall cupboard)'],
  safety: ['Hall floor swept; no water bottles on court area', 'School behaviour policy applies — teacher present throughout', 'Photos: school consent list is in the register — check flags first', 'Safeguarding concern: report to school DSL (Mr J. Ellery) AND HQ lead — never investigate'],
  videos: [
    { title: 'The Backhand — main skill video', length: '2:40' },
    { title: 'Station drills — backhand set', length: '1:55' },
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
    { title: 'Court Captain handbook', desc: 'Everything about running a family session — 12 pages' },
    { title: 'Safeguarding basics for volunteers', desc: 'What to do (and not do) — 2 pages' },
    { title: 'Photography & Filming policy', desc: 'The consent rules in plain English' },
    { title: 'Session cards — all 10 weeks', desc: 'Printable A5 cards, one per week' },
  ],
  contacts: [
    { name: 'Hannah Moreton', role: 'Your linked coach', note: 'Messages tab or 07700 900456' },
    { name: 'Rally Ten HQ', role: 'Safeguarding lead', note: '07700 900789 — always answered on session days' },
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
    { school: 'Fernley Park Primary', pct: 26 },
    { school: 'Hollinsmere Primary', pct: 21 },
    { school: 'Thornleigh Green Primary', pct: 0 },
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
  // ── Extra HQ insight datasets (headline feature) ──
  monthlyReach: [ // children per month across the year
    { m: 'Sep', n: 1180 }, { m: 'Oct', n: 1420 }, { m: 'Nov', n: 1510 }, { m: 'Dec', n: 990 },
    { m: 'Jan', n: 1350 }, { m: 'Feb', n: 1480 }, { m: 'Mar', n: 1720 }, { m: 'Apr', n: 1610 },
    { m: 'May', n: 1900 }, { m: 'Jun', n: 2050 }, { m: 'Jul', n: 2140 },
  ],
  retentionCohorts: [ // % still attending weekends, weeks after first visit
    { term: 'Autumn 25', w1: 100, w4: 62, w8: 48, w10: 41 },
    { term: 'Spring 26', w1: 100, w4: 68, w8: 54, w10: 47 },
    { term: 'Summer 26', w1: 100, w4: 71, w8: 58, w10: 52 },
  ],
  demographics: {
    gender: [{ label: 'Girls', pct: 48 }, { label: 'Boys', pct: 51 }, { label: 'Prefer not to say', pct: 1 }],
    age: [{ label: '4–5', pct: 22 }, { label: '6–7', pct: 41 }, { label: '8–10', pct: 37 }],
    fsm: 38,          // % eligible for free school meals (deprivation reach)
    sen: 14,          // % with SEND
    firstSport: 61,   // % for whom this is their first organised sport
    ethnicMinority: 44,
  },
  boroughs: [
    { name: 'Northvale', schools: 3, children: 940, venues: 1 },
    { name: 'Ashgrove', schools: 2, children: 520, venues: 1 },
    { name: 'Kestwick', schools: 1, children: 340, venues: 1 },
  ],
  compliance: { dbsValid: 94, safeguardingCurrent: 100, firstAidCurrent: 89, insured: 100 },
  socialValue: {
    perChild: 42,        // programme cost per child (£)
    svRatio: 4.7,        // social value £ returned per £1 spent
    volunteerHours: 1840, // Court Captain hours this year
    clubReferrals: 63,
  },
  quotesReel: [
    { q: 'The progress in their coordination, confidence and self-esteem has been incredible — a highlight of the year.', who: 'Class teacher, Y3' },
    { q: '100% of families said Rally Ten improved their family’s quality of life.', who: 'Summer 2026 family survey' },
    { q: 'It fits the aims of Sports Premium perfectly — sport in school and families active in the community.', who: 'Headteacher, Fernley Park' },
  ],
}

// ─── School Insights (governor/funder-facing, per-school deep dashboard) ─────
export const SCHOOL_INSIGHTS = {
  school: 'St Aldric’s C of E Primary',
  term: 'Summer term 2025/26 (completed)',
  headline: [
    { label: 'Children took part', value: '62', sub: 'across Y2–Y4, 100% of eligible classes' },
    { label: 'Attendance rate', value: '93%', sub: 'vs 88% school PE average' },
    { label: 'Completed all 10 weeks', value: '58', sub: '94% completion' },
    { label: 'Skill Stickers earned', value: '287', sub: 'avg 4.6 of 6 per child' },
    { label: 'App-activated families', value: '58%', sub: '36 of 62 households' },
    { label: 'Onto weekend sessions', value: '11', sub: 'families now active in the community' },
  ],
  weeklyAttendance: [91, 94, 95, 92, 94, 93, 90, 95, 94, 96],
  skillGrowth: [ // % of children at "secure" for each skill, start vs end
    { skill: 'Agility / balance / coord.', start: 34, end: 88 },
    { skill: 'Forehand', start: 8, end: 82 },
    { skill: 'Backhand', start: 5, end: 74 },
    { skill: 'Volley', start: 3, end: 69 },
    { skill: 'Serve', start: 2, end: 61 },
    { skill: 'Rally & scoring', start: 6, end: 71 },
  ],
  yearGroups: [
    { year: 'Y2', children: 20, attendance: 95, stickers: 4.8 },
    { year: 'Y3', children: 22, attendance: 92, stickers: 4.5 },
    { year: 'Y4', children: 20, attendance: 93, stickers: 4.4 },
  ],
  wellbeing: [ // teacher-rated, % of children improved
    { area: 'Confidence', pct: 88 },
    { area: 'Concentration in class', pct: 64 },
    { area: 'Teamwork & communication', pct: 79 },
    { area: 'Physical activity levels', pct: 91 },
    { area: 'Enjoyment of PE', pct: 96 },
  ],
  curriculum: ['Fundamental movement skills', 'Physical literacy (PE National Curriculum)', 'Healthy active lifestyles', 'Communication & teamwork', 'School–community links'],
  premiumSpend: {
    programmeCost: 3200,
    perChild: 52,
    outcomesHit: ['Engagement of all pupils in regular activity', 'Broader experience of sports offered', 'Increased confidence, knowledge & skills of staff'],
  },
  quotes: [
    { q: 'It has been wonderful to see the children’s confidence develop in all-round school life as the weeks progressed — and it gave me excellent ideas for my own PE lessons.', who: 'Miss Ellwood, Year 2 teacher' },
    { q: 'The children have absolutely loved it. The lessons are fully inclusive and the games are exciting and motivating!', who: 'Parent survey' },
  ],
  // How this school compares — your school vs the Rally Ten average vs the national baseline
  benchmarks: [
    { metric: 'Session attendance', you: 93, programme: 91, national: 88, unit: '%', note: 'vs your school’s PE average' },
    { metric: 'Girls taking part', you: 49, programme: 48, national: 42, unit: '%', note: 'girls as a share of participants' },
    { metric: 'Meeting 60 active mins/day', you: 41, programme: 33, national: 20, unit: '%', note: 'CMO guideline — measured start vs end' },
    { metric: 'Family engagement', you: 58, programme: 46, national: 12, unit: '%', note: 'households active in the parent app' },
  ],
  distanceTravelled: { start: 20, end: 41, label: 'children meeting the CMO 60-active-minutes guideline' },
  attendanceCompare: { you: 93, schoolPE: 88, delta: 5 },
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
    { cohort: 'Hollinsmere — Y3 Otters', week: 4, attendance: 94, stickers: 34 },
    { cohort: 'Hollinsmere — Y4 Foxes', week: 4, attendance: 91, stickers: 31 },
    { cohort: 'Fernley Park — Y2 Badgers', week: 10, attendance: 89, stickers: 68 },
    { cohort: 'Fernley Park — Y5 Owls', week: 10, attendance: 93, stickers: 72 },
  ],
  attendanceTrend: [88, 90, 93, 92, 94, 91, 95, 92, 90, 94], // % by session, last 10
  compliance: [
    { item: 'DBS (Enhanced, via LTA)', status: 'valid', note: 'to Mar 2027' },
    { item: 'LTA Safeguarding & Protection', status: 'valid', note: 'to Nov 2026' },
    { item: 'First Aid certificate', status: 'expiring', note: 'expires 30 Aug — book renewal' },
    { item: 'Insurance (£5m)', status: 'valid', note: 'to Jan 2027' },
  ],
  weekSchedule: [
    { day: 'Tue', what: 'Hollinsmere Primary — Y3 Otters, Week 4', time: '1.15–2.15pm', kind: 'school' },
    { day: 'Tue', what: 'Hollinsmere Primary — Y4 Foxes, Week 4', time: '2.20–3.20pm', kind: 'school' },
    { day: 'Thu', what: 'Teacher hand-over session — Mrs Bhatt (Hollinsmere)', time: '3.30–4.00pm', kind: 'school' },
    { day: 'Sat', what: 'Northvale Rec Ground — family session (lead)', time: '1.30–2.30pm', kind: 'weekend' },
    { day: 'Sun', what: 'Ellisford Park — family session (Court Captain support visit)', time: '10–11am', kind: 'weekend' },
  ],
}

export const COACH_WEEKEND = {
  lead: { venue: 'Northvale Rec Ground', day: 'Saturday', time: '1.30–2.30pm', role: 'Session lead', tenors: ['Martin Adeyinka', 'Nadia Rahman', 'Chris Dalby'], lastCount: 19, note: 'Week-4 backhand plan loaded. Equipment check due — 2 rackets reported cracked last week.' },
  support: { venue: 'Ellisford Park Courts', day: 'Sunday', time: '10–11am', role: 'Court Captain support visit', tenors: ['Lena Novak', 'Leon Barker'], lastCount: 11, note: 'Monthly quality visit — observe, coach the Court Captains, sign off the session card.' },
  setupDuty: 'Week 1 duty: deliver equipment to the venue, set up with the Court Captains, and run the first session alongside them — they take over from week 2 with your support.',
}

export const COACH_RESOURCES = {
  curriculum: [
    { title: 'Scheme of work — all 10 weeks', desc: 'The full Rally Ten curriculum with session plans, progressions and differentiation for ages 4–10' },
    { title: 'Week 4 session plan — BACKHAND (school)', desc: 'Timed run-sheet, drills, STEP adaptations, teacher hand-over notes' },
    { title: 'Week 4 session plan — BACKHAND (family)', desc: 'Weekend variant — parent-child pairings, Court Captain briefing card' },
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
// St Aldric's story: ran Rally Ten in 2025/26, lost funding for 2026/27,
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
    { area: 'Move & ABCs', pct: 100 },
    { area: 'The Shots', pct: 89 },
    { area: 'Games & Challenges', pct: 95 },
    { area: 'Rally & Score', pct: 82 },
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

export const CAL_EVENTS: Record<'school' | 'coach' | 'tenor', CalEvent[]> = {
  school: [
    { day: 'Mon', time: '8.30', title: 'Kit delivery — green store', where: 'Reception', kind: 'admin' },
    { day: 'Tue', time: '13.15', title: 'Rally Ten — Y3 Otters (W4)', where: 'School hall', kind: 'school' },
    { day: 'Tue', time: '14.20', title: 'Rally Ten — Y4 Foxes (W4)', where: 'School hall', kind: 'school' },
    { day: 'Thu', time: '15.30', title: 'Teacher hand-over — Mrs Bhatt', where: 'Staff room', kind: 'admin' },
    { day: 'Fri', time: '9.00', title: 'Assembly — festival save-the-date', kind: 'admin' },
    { day: 'Sat', time: '13.30', title: 'Family session — your families', where: 'Northvale Rec', kind: 'weekend' },
    { day: 'Sat', time: '10.00', title: 'Sponsored Ball Hit planning call', kind: 'fundraising' },
  ],
  coach: [
    { day: 'Mon', time: '9.00', title: 'Admin / session prep', kind: 'admin' },
    { day: 'Tue', time: '13.15', title: 'Hollinsmere — Y3 Otters (W4)', where: 'School hall', kind: 'school' },
    { day: 'Tue', time: '14.20', title: 'Hollinsmere — Y4 Foxes (W4)', where: 'School hall', kind: 'school' },
    { day: 'Thu', time: '15.30', title: 'Teacher hand-over — Mrs Bhatt', where: 'Hollinsmere', kind: 'school' },
    { day: 'Fri', time: '16.00', title: 'Kit check + repairs', where: 'Northvale store', kind: 'admin' },
    { day: 'Sat', time: '13.30', title: 'Family session — LEAD', where: 'Northvale Rec', kind: 'weekend' },
    { day: 'Sun', time: '10.00', title: 'Court Captain support visit', where: 'Ellisford Park', kind: 'weekend' },
  ],
  tenor: [
    { day: 'Fri', time: '17.30', title: 'Equipment check + QR sign out', where: 'Northvale store', kind: 'admin' },
    { day: 'Sat', time: '13.10', title: 'Court Captain briefing — week 4 card', where: 'Courtside', kind: 'admin' },
    { day: 'Sat', time: '13.30', title: 'Family session — register duty', where: 'Northvale Rec', kind: 'weekend' },
    { day: 'Sun', time: '10.00', title: 'Cover request — Ellisford (optional)', where: 'Ellisford Park', kind: 'weekend' },
  ],
}

// ─── HQ people: coaches + Court Captains (maps from the Lumio Coaches module) ───────

export const TP_COACHES: TpCoach[] = [
  { id: 'nb', name: 'Hannah Moreton', role: 'Lead', qual: 'LTA Level 3', dbs: 'valid', dbsNote: 'to Mar 2027', firstAid: 'expires 30 Aug ⚠', specialisms: ['Mini/Red', 'Schools'], schools: 'Hollinsmere · Northvale (Sat)', sessionsWeek: 5, childrenCovered: 118, online: true },
  { id: 'th', name: 'Owen Pryce', role: 'Coach', qual: 'LTA Level 2', dbs: 'valid', dbsNote: 'to Nov 2026', firstAid: 'expires in 6 wks ⚠', specialisms: ['Mini/Red', 'Inclusive'], schools: 'Thornleigh Green (Sept) · Ellisford (Sun)', sessionsWeek: 2, childrenCovered: 45 },
  { id: 'lt', name: 'Kezia Lowe', role: 'Coach', qual: 'LTA Level 2', dbs: 'due-soon', dbsNote: 'expires in 32 days', firstAid: 'valid to Feb 2027', specialisms: ['Junior', 'Festivals'], schools: 'Fernley Park (complete)', sessionsWeek: 1, childrenCovered: 61 },
  { id: 'mw', name: 'Dylan Frost', role: 'Assistant', qual: 'LTA Assistant', dbs: 'valid', dbsNote: 'to Jan 2028', firstAid: 'valid to Sep 2026', specialisms: ['Mini/Red'], schools: 'Hollinsmere (assist)', sessionsWeek: 3, childrenCovered: 58 },
  { id: 'ev', name: 'Imogen Reyes', role: 'Coach', qual: 'LTA Level 2', dbs: 'valid', dbsNote: 'to Jun 2027', firstAid: 'valid to Mar 2027', specialisms: ['Inclusive', 'Adult+family'], schools: 'Copperfield Green (Sat)', sessionsWeek: 1, childrenCovered: 32, online: true },
  { id: 'jm', name: 'Caleb Ward', role: 'Apprentice', qual: 'In training', dbs: 'missing', dbsNote: 'application submitted', firstAid: 'booked 12 Aug', specialisms: ['Mini/Red'], schools: 'Shadowing — Hollinsmere', sessionsWeek: 2, childrenCovered: 0 },
]

export const TP_COACH_STATS_ROW = [
  { label: 'COACHES', value: '6' },
  { label: 'ON PROGRAMMES', value: '4' },
  { label: 'CHILDREN COVERED', value: '214' },
  { label: 'SESSIONS THIS WEEK', value: '11' },
  { label: 'DBS VALID', value: '4/6' },
  { label: 'CERTS EXPIRING', value: '3' },
]

export const TP_COACH_ATTENTION = 'Hannah Moreton (First Aid expires 30 Aug), Owen Pryce (First Aid, 6 wks), Kezia Lowe (DBS expires in 32d), Caleb Ward (No DBS on file — cannot deliver unsupervised)'

export const TP_TENORS: TpTenor[] = [
  { id: 't1', name: 'Martin Adeyinka', venue: 'Northvale Rec Ground', inducted: true, dbs: 'valid', sessionsCovered: 14, since: 'Sep 2025', note: 'Venue lead — holds the store key' },
  { id: 't2', name: 'Nadia Rahman', venue: 'Northvale Rec Ground', inducted: true, dbs: 'valid', sessionsCovered: 11, since: 'Jan 2026' },
  { id: 't3', name: 'Chris Dalby', venue: 'Northvale Rec Ground', inducted: true, dbs: 'pending', sessionsCovered: 6, since: 'Apr 2026' },
  { id: 't4', name: 'Lena Novak', venue: 'Ellisford Park Courts', inducted: true, dbs: 'valid', sessionsCovered: 12, since: 'Sep 2025', note: 'Runs the inclusive-session adaptations' },
  { id: 't5', name: 'Leon Barker', venue: 'Ellisford Park Courts', inducted: true, dbs: 'valid', sessionsCovered: 9, since: 'Feb 2026' },
  { id: 't6', name: 'Zoe Hartley', venue: 'Copperfield Green Courts', inducted: true, dbs: 'valid', sessionsCovered: 8, since: 'Mar 2026' },
  { id: 't7', name: 'Amira Haddad', venue: 'Copperfield Green Courts', inducted: false, dbs: 'pending', sessionsCovered: 0, since: 'Jul 2026', note: 'Induction booked for 6 Sept' },
]

export const TP_TENOR_STATS_ROW = [
  { label: 'COURT CAPTAINS', value: '7' },
  { label: 'VENUES COVERED', value: '3' },
  { label: 'VENUES SESSION-READY', value: '3/3' },
  { label: 'SESSIONS COVERED (TERM)', value: '28' },
  { label: 'INDUCTIONS PENDING', value: '1' },
  { label: 'RECRUITMENT PIPELINE', value: '3' },
]

// ─── Person detail (coach/Court Captain profile pages — maps from Lumio coach view) ─

export const COACH_DETAILS: Record<string, TpPersonDetail> = {
  nb: {
    email: 'hannah@northvalesport.org.uk', phone: '07700 900456', availability: 'Mon–Sat · term time + weekends',
    dbsNumber: '0012 8891 4432', dbsIssued: '02/03/2024', dbsExpiry: '02/03/2027', safeguardingDate: '14/11/2025', firstAid: 'expires 30/08/2026 ⚠', insurance: '£5m · to 01/2027',
    assignments: [
      { name: 'Hollinsmere Primary', kind: 'school', detail: 'Y3 Otters + Y4 Foxes · Week 4 of 10 · 58 children', status: 'RUNNING' },
      { name: 'Northvale Rec Ground', kind: 'venue', detail: 'Saturday family session · session lead · 3 Court Captains', status: 'SAT 1.30PM' },
    ],
    cal: CAL_EVENTS.coach,
  },
  th: {
    email: 'owen@northvalesport.org.uk', phone: '07700 900457', availability: 'Tue–Sun · 24h/wk',
    dbsNumber: '0043 2210 9987', dbsIssued: '10/11/2023', dbsExpiry: '10/11/2026', safeguardingDate: '02/02/2026', firstAid: 'expires in 6 weeks ⚠', insurance: '£5m · to 03/2027',
    assignments: [
      { name: 'Thornleigh Green Primary', kind: 'school', detail: '2 cohorts · 45 children · starts w/c 14 Sept', status: 'CONFIRMED' },
      { name: 'Ellisford Park Courts', kind: 'venue', detail: 'Sunday family session · inclusive sessions · 2 Court Captains', status: 'SUN 10AM' },
    ],
    cal: [
      { day: 'Tue', time: '10.00', title: 'Thornleigh Green — planning visit', where: 'School office', kind: 'school' },
      { day: 'Thu', time: '14.00', title: 'Inclusive-session CPD (video)', kind: 'admin' },
      { day: 'Sun', time: '10.00', title: 'Ellisford family session — lead', where: 'Ellisford Park', kind: 'weekend' },
    ],
  },
  lt: {
    email: 'kezia@northvalesport.org.uk', phone: '07700 900458', availability: 'Mon–Fri · term time',
    dbsNumber: '0077 4451 2210', dbsIssued: '19/08/2023', dbsExpiry: '19/08/2026', safeguardingDate: '20/09/2025', firstAid: 'valid to 02/2027', insurance: '£5m · to 01/2027',
    assignments: [
      { name: 'Fernley Park Primary', kind: 'school', detail: 'Programme complete · renewal conversation open', status: 'COMPLETE' },
    ],
    cal: [
      { day: 'Wed', time: '15.30', title: 'Fernley Park — renewal meeting w/ head', where: 'School', kind: 'school' },
      { day: 'Fri', time: '9.00', title: 'DBS renewal — submit documents', kind: 'admin' },
    ],
  },
  mw: {
    email: 'dylan@northvalesport.org.uk', phone: '07700 900459', availability: 'Tue + Thu + Sat',
    dbsNumber: '0091 3345 6678', dbsIssued: '05/01/2025', dbsExpiry: '05/01/2028', safeguardingDate: '11/01/2026', firstAid: 'valid to 09/2026', insurance: 'covered under programme policy',
    assignments: [
      { name: 'Hollinsmere Primary', kind: 'school', detail: 'Assisting Hannah — both cohorts', status: 'RUNNING' },
    ],
    cal: [
      { day: 'Tue', time: '13.15', title: 'Hollinsmere — assist Y3 + Y4', where: 'School hall', kind: 'school' },
      { day: 'Sat', time: '13.30', title: 'Northvale family session — support', where: 'Northvale Rec', kind: 'weekend' },
    ],
  },
  ev: {
    email: 'imogen@northvalesport.org.uk', phone: '07700 900460', availability: 'Sat + school holidays',
    dbsNumber: '0022 7789 0034', dbsIssued: '14/06/2024', dbsExpiry: '14/06/2027', safeguardingDate: '03/03/2026', firstAid: 'valid to 03/2027', insurance: '£5m · to 01/2027',
    assignments: [
      { name: 'Copperfield Green Courts', kind: 'venue', detail: 'Saturday family session · adult+family focus · 2 Court Captains', status: 'SAT 11.30AM' },
    ],
    cal: [
      { day: 'Sat', time: '11.30', title: 'Copperfield Green family session — lead', where: 'Copperfield Green', kind: 'weekend' },
    ],
  },
  jm: {
    email: 'caleb@northvalesport.org.uk', phone: '07700 900461', availability: 'Tue + Sat (shadowing)',
    dbsNumber: '— application submitted', dbsIssued: '—', dbsExpiry: '—', safeguardingDate: 'booked 05/08/2026', firstAid: 'booked 12/08/2026', insurance: 'n/a until certified',
    assignments: [
      { name: 'Hollinsmere Primary', kind: 'school', detail: 'Shadowing Hannah — supervised only', status: 'TRAINING' },
    ],
    cal: [
      { day: 'Tue', time: '13.15', title: 'Hollinsmere — shadowing (supervised)', where: 'School hall', kind: 'school' },
    ],
  },
}

export const TENOR_DETAILS: Record<string, TpPersonDetail> = {
  t1: {
    email: 'martin.a@familymail.example', phone: '07700 900489', availability: 'Saturdays',
    dbsNumber: '0055 6612 3390', dbsIssued: '20/09/2025', dbsExpiry: '20/09/2028', safeguardingDate: 'Volunteer induction 20/09/2025',
    assignments: [{ name: 'Northvale Rec Ground', kind: 'venue', detail: 'Venue lead · holds store key · register duty', status: 'SAT 1.30PM' }],
    cal: CAL_EVENTS.tenor,
  },
  t2: {
    email: 'nadia.r@familymail.example', phone: '07700 900490', availability: 'Saturdays',
    dbsNumber: '0061 2298 4471', dbsIssued: '12/01/2026', dbsExpiry: '12/01/2029', safeguardingDate: 'Volunteer induction 12/01/2026',
    assignments: [{ name: 'Northvale Rec Ground', kind: 'venue', detail: 'Register + warm-up games', status: 'SAT 1.30PM' }],
    cal: [{ day: 'Sat', time: '13.10', title: 'Court Captain briefing + session', where: 'Northvale Rec', kind: 'weekend' }],
  },
  t3: {
    email: 'chris.d@familymail.example', phone: '07700 900491', availability: 'Saturdays (fortnightly)',
    dbsNumber: 'pending — submitted 04/07/2026', dbsIssued: '—', dbsExpiry: '—', safeguardingDate: 'Volunteer induction 18/04/2026',
    assignments: [{ name: 'Northvale Rec Ground', kind: 'venue', detail: 'Equipment + gate QR sign', status: 'SAT 1.30PM' }],
    cal: [{ day: 'Fri', time: '17.30', title: 'Equipment check', where: 'Northvale store', kind: 'admin' }],
  },
  t4: {
    email: 'lena.n@familymail.example', phone: '07700 900492', availability: 'Sundays',
    dbsNumber: '0033 9987 1123', dbsIssued: '28/09/2025', dbsExpiry: '28/09/2028', safeguardingDate: 'Volunteer induction 28/09/2025 · inclusive-session training 11/2025',
    assignments: [{ name: 'Ellisford Park Courts', kind: 'venue', detail: 'Runs inclusive-session adaptations', status: 'SUN 10AM' }],
    cal: [{ day: 'Sun', time: '10.00', title: 'Ellisford family session', where: 'Ellisford Park', kind: 'weekend' }],
  },
  t5: {
    email: 'leon.b@familymail.example', phone: '07700 900493', availability: 'Sundays',
    dbsNumber: '0044 5561 8890', dbsIssued: '02/02/2026', dbsExpiry: '02/02/2029', safeguardingDate: 'Volunteer induction 02/02/2026',
    assignments: [{ name: 'Ellisford Park Courts', kind: 'venue', detail: 'Register duty', status: 'SUN 10AM' }],
    cal: [{ day: 'Sun', time: '10.00', title: 'Ellisford family session', where: 'Ellisford Park', kind: 'weekend' }],
  },
  t6: {
    email: 'zoe.h@familymail.example', phone: '07700 900494', availability: 'Saturdays',
    dbsNumber: '0072 3310 5567', dbsIssued: '15/03/2026', dbsExpiry: '15/03/2029', safeguardingDate: 'Volunteer induction 15/03/2026',
    assignments: [{ name: 'Copperfield Green Courts', kind: 'venue', detail: 'Register + parent liaison', status: 'SAT 11.30AM' }],
    cal: [{ day: 'Sat', time: '11.30', title: 'Copperfield Green family session', where: 'Copperfield Green', kind: 'weekend' }],
  },
  t7: {
    email: 'amira.h@familymail.example', phone: '07700 900495', availability: 'Saturdays (from Sept)',
    dbsNumber: 'pending — submitted 10/07/2026', dbsIssued: '—', dbsExpiry: '—', safeguardingDate: 'Induction booked 06/09/2026',
    assignments: [{ name: 'Copperfield Green Courts', kind: 'venue', detail: 'Joining from September', status: 'PENDING' }],
    cal: [{ day: 'Sat', time: '9.00', title: 'Induction (booked 6 Sept)', kind: 'admin' }],
  },
}

// ─── HQ school deep-dive detail ─────────────────────────────────────────────

export const SCHOOL_DETAILS: Record<string, TpSchoolDetail> = {
  hollinsmere: {
    contacts: [
      { name: 'Mrs H. Sandford', role: 'Headteacher', email: 'head@hollinsmere.example.sch.uk', phone: '020 7946 0301' },
      { name: 'Mrs R. Bhatt', role: 'PE lead (hand-over teacher)', email: 'r.bhatt@hollinsmere.example.sch.uk', phone: '020 7946 0302' },
    ],
    safeguardingLead: 'Mr J. Ellery (DSL)',
    funding: 'School budget — confirmed for 2026/27',
    address: 'Hollinsmere Lane, Northvale',
    cohorts: [
      { name: 'Y3 Otters', children: 28, coach: 'Hannah Moreton', week: 4 },
      { name: 'Y4 Foxes', children: 30, coach: 'Hannah Moreton', week: 4 },
    ],
    attendanceTrend: [92, 95, 94, 94],
    activationPct: 62,
    conversionPct: 21,
    weekendVenue: 'Northvale Rec Ground (Sat 1.30pm)',
    kit: 'Delivered w/c 8 Jun · 2 rackets flagged cracked — replacement requested',
    notes: ['Head wants festival date before October half-term', 'Y4 teacher keen to lead sessions from week 7'],
    nextActions: ['Confirm festival date + family invites', 'Replace damaged rackets before Tue', 'Push parent activation — 22 families not yet in the app'],
  },
  staldrics: {
    contacts: [
      { name: 'Mr G. Ashworth', role: 'Headteacher', email: 'head@staldrics.example.sch.uk', phone: '020 7946 0311' },
      { name: 'Miss C. Obi', role: 'PE lead', email: 'c.obi@staldrics.example.sch.uk', phone: '020 7946 0312' },
    ],
    safeguardingLead: 'Mrs E. Marsh (DSL)',
    funding: 'UNFUNDED for 2026/27 — fundraising campaign live',
    address: 'Aldric Road, Northvale',
    cohorts: [
      { name: '2025/26 programme (complete)', children: 62, coach: 'Kezia Lowe', week: 10 },
    ],
    attendanceTrend: [91, 94, 95, 92, 94, 93, 90, 95, 94, 96],
    activationPct: 58,
    conversionPct: 18,
    weekendVenue: 'Northvale Rec Ground (Sat 1.30pm)',
    kit: 'Equipment retained by school from 2025/26 — full set, good condition',
    fundraising: { raised: 2150, target: 3200, supporters: 84 },
    notes: ['Ran 2025/26 with excellent results — see Governor pack', 'PTA leading events; Sponsored Ball Hit 10 Oct is the big one'],
    nextActions: ['£410 to match-funding trigger — nudge the public page this week', 'Confirm receiving entity (PTA vs Rally Ten) for Gift Aid', 'Pencil Spring term start date for when campaign closes'],
  },
  thornleigh: {
    contacts: [
      { name: 'Ms F. Grant', role: 'Headteacher', email: 'head@thornleigh.example.sch.uk', phone: '020 7946 0321' },
    ],
    safeguardingLead: 'Ms F. Grant (acting DSL)',
    funding: 'Borough grant — Ashgrove active-schools fund',
    address: 'Thornleigh Way, Ashgrove',
    cohorts: [
      { name: 'Y2 (from Sept)', children: 22, coach: 'Owen Pryce', week: 0 },
      { name: 'Y3 (from Sept)', children: 23, coach: 'Owen Pryce', week: 0 },
    ],
    attendanceTrend: [],
    activationPct: 0,
    conversionPct: 0,
    weekendVenue: 'Ellisford Park Courts (Sun 10am)',
    kit: 'Order placed — delivery due w/c 7 Sept',
    notes: ['First programme at this school — welcome-pack QR activation to be included from day one'],
    nextActions: ['Collect class lists + consents by 1 Sept', 'Week-1 venue setup: Owen + Ellisford Court Captains', 'Send head the what-to-expect pack'],
  },
  copperwick: {
    contacts: [
      { name: 'Mrs K. Doyle', role: 'Headteacher', email: 'head@copperwick.example.sch.uk', phone: '020 7946 0331' },
    ],
    safeguardingLead: 'TBC at intake',
    funding: 'Exploring — school has no PE budget headroom; fundraising route offered',
    address: 'Copperwick Road, Ashgrove',
    cohorts: [],
    attendanceTrend: [],
    activationPct: 0,
    conversionPct: 0,
    kit: '—',
    notes: ['Enquiry via bring-to-your-area, 3 Jul', 'Head very keen; governors meet 10 Sept'],
    nextActions: ['Send intro pack + Fernley Park results', 'Offer fundraising campaign walkthrough before governors meet'],
  },
  fernleypark: {
    contacts: [
      { name: 'Mr P. Rowntree', role: 'Headteacher', email: 'head@fernleypark.example.sch.uk', phone: '020 7946 0341' },
    ],
    safeguardingLead: 'Mrs S. Kerr (DSL)',
    funding: 'PE & Sport Premium (final year) — 2026/27 UNFUNDED, renewal at risk',
    address: 'Fernley Lane, Northvale',
    cohorts: [
      { name: 'Y2 Badgers (complete)', children: 30, coach: 'Kezia Lowe', week: 10 },
      { name: 'Y5 Owls (complete)', children: 31, coach: 'Kezia Lowe', week: 10 },
    ],
    attendanceTrend: [90, 92, 89, 91, 93, 92, 88, 94, 93, 95],
    activationPct: 71,
    conversionPct: 26,
    weekendVenue: 'Copperfield Green Courts (Sat 11.30am)',
    kit: 'Retained by school — inventory checked 30 Jun',
    notes: ['Best conversion rate in the programme (26%)', 'Head open to fundraising route — suggested switching status'],
    nextActions: ['Switch to FUNDRAISING status and open a campaign', 'Reuse Governor-pack results as the campaign story'],
  },
}

// ─── HQ venue deep-dive detail ──────────────────────────────────────────────

export const VENUE_DETAILS: Record<string, TpVenueDetail> = {
  northvale: {
    address: 'Northvale Recreation Ground, Vale Road, Northvale',
    postcode: 'NV2 4RG',
    courts: '3 courts (2 bookable for sessions)',
    surface: 'Tarmac, fenced · floodlights off at weekends',
    access: 'Gate code 2244 · QR gate sign on hook inside store',
    storage: 'Green store box by court 1 — Martin Adeyinka holds the key',
    sessions: [
      { day: 'Saturday', time: '1.30–2.30pm', type: 'Free Community Family Session' },
    ],
    leadCoach: 'Hannah Moreton',
    tenorTeam: ['Martin Adeyinka (lead)', 'Nadia Rahman', 'Chris Dalby'],
    inclusive: false,
    familiesRegistered: 34,
    attendanceTrend: [14, 16, 19, 17, 19],
    feederSchools: ['Hollinsmere Primary', 'St Aldric’s C of E Primary'],
    kit: '24 rackets · 40 red balls · 4 mini nets · cones — 2 rackets cracked, replacement requested',
    notes: ['Best-attended venue; families arrive early — open gate 1.15', 'Council re-lining courts over October half-term'],
    nextActions: ['Replace 2 cracked rackets', 'Print fresh QR gate sign (laminate fading)'],
  },
  copperfield: {
    address: 'Copperfield Green Courts, Green Lane, Northvale',
    postcode: 'NV5 8TW',
    courts: '2 courts',
    surface: 'Macadam, part-fenced',
    access: 'Open access · QR sign zip-tied to gate',
    storage: 'Lock-up shared with bowls club — Zoe Hartley has fob',
    sessions: [
      { day: 'Saturday', time: '11.30am–12.30pm', type: 'Free Community Family Session' },
    ],
    leadCoach: 'Imogen Reyes',
    tenorTeam: ['Zoe Hartley', 'Amira Haddad (from Sept)'],
    inclusive: false,
    familiesRegistered: 21,
    attendanceTrend: [11, 12, 14, 13, 14],
    feederSchools: ['Fernley Park Primary'],
    kit: 'Full set, good condition — checked 30 Jun',
    notes: ['Register submitted late twice — auto-submit fixed it', 'Only 2 Court Captains — one absence risks the session'],
    nextActions: ['Recruit a third Court Captain (2 parents interested)', 'Confirm Amira’s induction 6 Sept'],
  },
  ellisford: {
    address: 'Ellisford Park Courts, Ellisford Avenue, Ashgrove',
    postcode: 'AG3 6QL',
    courts: '4 courts (2 used)',
    surface: 'Acrylic hard court',
    access: 'Via partner booking platform · linked venue',
    storage: 'Park keeper’s store — arrange access via council',
    sessions: [
      { day: 'Sunday', time: '10–11am', type: 'Free Community Family Session (inclusive)' },
    ],
    leadCoach: 'Owen Pryce',
    tenorTeam: ['Lena Novak', 'Leon Barker'],
    inclusive: true,
    external: { partner: 'Partner booking platform', url: '#' },
    familiesRegistered: 17,
    attendanceTrend: [8, 10, 11, 10, 11],
    feederSchools: ['Thornleigh Green Primary (from Sept)'],
    kit: 'Full set incl. sensory-friendly equipment',
    notes: ['Bookings run through the partner platform — portal links out, attendance still via QR scan-in', 'Inclusive sessions designed with Lena — families travel from 3 boroughs'],
    nextActions: ['Sync September restart date with partner platform listing', 'Thornleigh Green week-1 setup visit — Owen + Court Captains'],
  },
}

// ─── PE & School Sport Partnership Network (PESSPN) readiness ────────────────
// Indicative framework: DfE confirms conditions of grant Sept 2026 and appoints
// the national delivery partner Nov 2026, so exact qualifying criteria are not
// yet published. This maps the published direction + the old PE & Sport
// Premium's five key indicators onto what Rally Ten's data already evidences.
export const PESSPN_CRITERIA: PesspnCriterion[] = [
  { id: 'data', label: 'Verifiable participation data', desc: 'Every child, every session — from digital registers, not estimates' },
  { id: 'regular', label: 'Regular activity sustained', desc: 'Attendance held across the term (target 85%+)' },
  { id: 'priority', label: 'Priority-group reach', desc: 'Girls, SEND, FSM and previously-inactive children engaged' },
  { id: 'cpd', label: 'Staff confidence & CPD', desc: 'Teachers upskilled to sustain delivery after the coach leaves' },
  { id: 'broader', label: 'Broader offer & competition', desc: 'Festival, talent pathways and weekend sessions beyond the core' },
  { id: 'wholeschool', label: 'Whole-school & family engagement', desc: 'Parents active and the PE profile raised across the school' },
  { id: 'impact', label: 'Impact evidence & reporting', desc: 'Funder-ready impact data produced automatically' },
  { id: 'partner', label: 'Active delivery partnership', desc: 'Working with an accredited provider (Rally Ten)' },
]

const R = (status: PesspnStatus, note: string) => ({ status, note })
export const SCHOOL_READINESS: Record<string, SchoolReadiness> = {
  hollinsmere: {
    verdict: 'on-track', score: 86, summary: 'Strong across the board — live registers, high attendance and staff hand-over underway. Keep the weekend conversion climbing.',
    items: {
      data: R('met', 'Named-child registers live, 94% capture'),
      regular: R('met', '94% attendance across the term so far'),
      priority: R('progress', 'Girls 49%; SEND + FSM tracked, reach growing'),
      cpd: R('progress', 'Mrs Bhatt (PE lead) leading warm-ups from week 5'),
      broader: R('met', 'Festival booked; weekend venue linked; pathway live'),
      wholeschool: R('progress', '62% parent activation — pushing toward 80%'),
      impact: R('met', 'Impact dashboard + governor pack generated'),
      partner: R('met', 'Delivered by Rally Ten (LTA-accredited)'),
    },
  },
  fernleypark: {
    verdict: 'nearly', score: 78, summary: 'Best delivery in the programme (26% conversion) — but 2026/27 is unfunded. Reaching the fundraising target secures continuity, the one gap to qualifying.',
    items: {
      data: R('met', 'Full registers retained; 71% activation'),
      regular: R('met', '92% attendance, strong retention'),
      priority: R('met', 'Best priority-group reach in the programme'),
      cpd: R('met', 'Two teachers trained to co-deliver'),
      broader: R('met', 'Festival delivered; 26% to weekend sessions'),
      wholeschool: R('met', 'High family engagement, PE profile raised'),
      impact: R('met', 'Full impact evidence available'),
      partner: R('gap', 'Continuity at risk — unfunded for 2026/27'),
    },
  },
  staldrics: {
    verdict: 'nearly', score: 72, summary: 'Excellent 2025/26 evidence base — the fundraising campaign is what carries it into the qualifying year. On track once the target is hit.',
    items: {
      data: R('met', '2025/26 registers complete'),
      regular: R('met', '93% attendance last term'),
      priority: R('progress', 'Good reach; refresh demographics at re-registration'),
      cpd: R('progress', 'PE lead engaged; refresher needed for new year'),
      broader: R('met', 'Festival delivered; weekend link established'),
      wholeschool: R('progress', '58% activation — grow with the campaign'),
      impact: R('met', 'Governor pack + impact dashboard ready'),
      partner: R('progress', 'Fundraising to re-engage Rally Ten for 2026/27'),
    },
  },
  thornleigh: {
    verdict: 'at-risk', score: 34, summary: 'Confirmed for September but no delivery data yet. Readiness will build fast once registers and parent activation go live in week 1 — the platform captures it from day one.',
    items: {
      data: R('gap', 'Programme starts Sept — no data yet'),
      regular: R('gap', 'Not started'),
      priority: R('progress', 'Class lists + consents being collected'),
      cpd: R('gap', 'Teacher hand-over planned from week 5'),
      broader: R('progress', 'Weekend venue (Ellisford) linked ready'),
      wholeschool: R('gap', 'Parent activation from welcome pack, week 1'),
      impact: R('gap', 'Reporting begins with delivery'),
      partner: R('met', 'Confirmed with Rally Ten (Owen Pryce)'),
    },
  },
  copperwick: {
    verdict: 'at-risk', score: 12, summary: 'Enquiry stage, no budget. The fundraising route is the way in — until a programme runs there is nothing to evidence for the Network.',
    items: {
      data: R('gap', 'No programme running'),
      regular: R('gap', 'Not started'),
      priority: R('gap', 'Not started'),
      cpd: R('gap', 'Not started'),
      broader: R('gap', 'Not started'),
      wholeschool: R('gap', 'Not started'),
      impact: R('gap', 'Nothing to report yet'),
      partner: R('progress', 'Bring-to-your-area enquiry; fundraising offered'),
    },
  },
}

export const PESSPN_TIMELINE: { when: string; label: string; done: boolean }[] = [
  { when: '2025/26', label: 'Final year of direct PE & Sport Premium payments to schools', done: true },
  { when: 'Jul 2026', label: 'Premium spending return due (31 Jul)', done: true },
  { when: 'Sept 2026', label: 'DfE publishes conditions of grant for the new Network', done: false },
  { when: '2026/27', label: '£150m transitional payment (median school ~£8,000)', done: false },
  { when: 'Nov 2026', label: 'National delivery partner appointed', done: false },
  { when: 'Apr 2027', label: 'PE & School Sport Partnership Network delivery begins', done: false },
]

export const PESSPN_GUIDANCE: { title: string; source: string; date: string; url: string }[] = [
  { title: 'PE & sport premium: conditions of grant 2025 to 2026', source: 'GOV.UK / DfE', date: 'updated 2026', url: 'https://www.gov.uk/guidance/pe-and-sport-premium-conditions-of-grant' },
  { title: 'PE & School Sport Partnership Network — announcement', source: 'GOV.UK / DfE', date: 'May 2026', url: 'https://www.gov.uk/government/news' },
  { title: 'Primary PE and sport premium: spending guidance', source: 'GOV.UK / DfE', date: '2025/26', url: 'https://www.gov.uk/guidance/pe-and-sport-premium-for-primary-schools' },
  { title: 'School Games & Active Partnerships network', source: 'Sport England', date: 'ongoing', url: 'https://www.sportengland.org' },
]

export const TP_VENUE_READINESS = [
  { venue: 'Northvale Rec Ground', tenors: 3, min: 2, ready: true },
  { venue: 'Copperfield Green Courts', tenors: 2, min: 2, ready: true },
  { venue: 'Ellisford Park Courts', tenors: 2, min: 2, ready: true, note: 'Tight — one absence cancels. Recruiting a third.' },
]

// ─── HQ Equipment & Kit (mapped from tennis coach Equipment module) ─────────
export const TP_EQUIP_STATS = [
  { label: 'ITEMS TRACKED', value: '46' },
  { label: 'IN STOCK', value: '33' },
  { label: 'NEED ATTENTION', value: '9' },
  { label: 'ON ORDER', value: '4' },
]

export const TP_RESTOCK: { id: string; name: string; where: string; status: 'running-low' | 'to-order' | 'repair' }[] = [
  { id: 'e1', name: 'Rackets 19" (mini)', where: 'Northvale store — 2 cracked, replacements due', status: 'repair' },
  { id: 'e2', name: 'Red felt balls', where: 'Copperfield Green — down to 22, reorder at 30', status: 'running-low' },
  { id: 'e3', name: 'T-shirts age 5–6', where: 'HQ welcome-pack stock — 14 left, Thornleigh needs 22', status: 'to-order' },
  { id: 'e4', name: 'Activity Booklets', where: 'HQ — 40 left; September intake needs 45+', status: 'to-order' },
  { id: 'e5', name: 'Skill Sticker sheets', where: 'HQ — half a term left at current award rate', status: 'running-low' },
  { id: 'e6', name: 'Mini-net tension cords', where: 'Ellisford — one net sagging', status: 'repair' },
  { id: 'e7', name: 'First-aid kit refills', where: 'All venues — plasters low after summer', status: 'running-low' },
  { id: 'e8', name: 'QR gate signs (laminated)', where: 'Northvale fading · Thornleigh needs printing', status: 'to-order' },
]

export const TP_KITS: { name: string; items: string[] }[] = [
  { name: 'In-school session', items: ['24 rackets (19"–23")', '40 red felt balls', '20 cones', '4 mini nets', 'Throw-down lines', 'First aid kit', 'Register tablet/phone'] },
  { name: 'Weekend family session', items: ['24 rackets', '40 red balls', 'Mini nets ×4', 'Balloon drill bag', 'QR gate sign', 'Live-count device', 'Water station'] },
  { name: 'Welcome pack (per child)', items: ['Rally Ten T-shirt (sized)', 'Tennis ball', 'Activity Booklet (Apex Performance edition)', 'Parent activation QR card'] },
  { name: 'Festival — Week 10', items: ['Station signage ×5', 'Certificates (printed from roster)', 'Festival stickers', 'Scoreboard', 'PA / music speaker', 'Bunting + finish arch'] },
  { name: 'Inclusive session add-on', items: ['Sensory-friendly balls', 'Bigger/lighter rackets', 'Visual timetable cards', 'Quiet-space sign'] },
]

export const TP_INVENTORY: { category: string; items: { name: string; where: string; qty: string; status: 'in-stock' | 'running-low' | 'to-order' | 'repair' }[] }[] = [
  {
    category: 'Rackets & balls',
    items: [
      { name: 'Rackets 19"–21" (mini)', where: 'Split across 3 venue stores', qty: '×38', status: 'repair' },
      { name: 'Rackets 23"', where: 'Venue stores + HQ spares', qty: '×24', status: 'in-stock' },
      { name: 'Red felt balls', where: 'All venues', qty: '×96', status: 'running-low' },
      { name: 'Foam / sensory balls', where: 'Ellisford (inclusive kit)', qty: '×20', status: 'in-stock' },
    ],
  },
  {
    category: 'Court equipment',
    items: [
      { name: 'Mini nets', where: '4 per venue', qty: '×12', status: 'repair' },
      { name: 'Cones', where: 'All venues', qty: '×60', status: 'in-stock' },
      { name: 'Throw-down lines', where: 'School kit bags', qty: '×8 sets', status: 'in-stock' },
      { name: 'Balloon drill bags', where: 'Weekend kits', qty: '×3', status: 'in-stock' },
    ],
  },
  {
    category: 'Welcome packs & print',
    items: [
      { name: 'T-shirts (by size)', where: 'HQ — age 4–5: 26 · 5–6: 14 · 7-8: 31 · 9-10: 28', qty: '×99', status: 'to-order' },
      { name: 'Activity Booklets', where: 'HQ print stock', qty: '×40', status: 'to-order' },
      { name: 'Skill Sticker sheets', where: 'HQ + coach bags', qty: '×55', status: 'running-low' },
      { name: 'Certificates (blank)', where: 'HQ — printed per roster at week 9', qty: '×120', status: 'in-stock' },
      { name: 'QR gate signs', where: 'One per venue + spares', qty: '×5', status: 'to-order' },
    ],
  },
  {
    category: 'Medical & welfare',
    items: [
      { name: 'First aid kits', where: 'One per venue + school bags', qty: '×6', status: 'running-low' },
      { name: 'Ice packs', where: 'Venue cool boxes', qty: '×12', status: 'in-stock' },
      { name: 'Hi-vis (Court Captain bibs)', where: 'Venue stores', qty: '×9', status: 'in-stock' },
      { name: 'Water station cups', where: 'Weekend kits', qty: '×200', status: 'in-stock' },
    ],
  },
]

// Court Captain weekend register — Northvale
export const WEEKEND_FAMILIES = [
  { id: 'w1', family: 'Ashby', children: 'Ella + Sam', checkedIn: true, via: 'QR' },
  { id: 'w2', family: 'Mensah', children: 'Zara', checkedIn: true, via: 'QR' },
  { id: 'w3', family: 'Dalby', children: 'Maisie + Rosa', checkedIn: true, via: 'Court Captain' },
  { id: 'w4', family: 'Calloway', children: 'Ruby', checkedIn: false, via: '—' },
  { id: 'w5', family: 'Quinn', children: 'Harvey', checkedIn: true, via: 'QR' },
  { id: 'w6', family: 'Haddad', children: 'Lily + Omar', checkedIn: false, via: '—' },
]
