// Golf v2 dashboard demo data — James Harrington persona, DP World Tour.
// Mirrors the rugby/cricket v2 shape so module components stay consistent.

export const GOLF_ORG = {
  player:        'James Harrington',
  playerShort:   'J. Harrington',
  owgr:          87,
  pointsAvg:     4.82,
  raceToDubai:   { pos: 43, points: 1240 },
  homeCourse:    'Glenmoor Golf Club',
  tour:          'DP World Tour',
  date:          'Sat, 26 Apr 2026',
  weekOf:        'Week 17 · 2026',
  quote:         '"You swing your best when you have the fewest things to think about."',
  quoteAuthor:   '— Bobby Jones',
  weather:       { tempC: 12, cond: 'Partly cloudy', wind: '8 mph NW' },
  season:        { earnings: 412000, cutsMade: 11, cutsTotal: 14 },
}

// ─── Tournament fixtures ────────────────────────────────────────────────
export type GolfFixture = {
  state: 'today' | 'upcoming'
  day: string; date: string; event: string; course: string
  tour: string; purse: string; cut: string; status: string
  time?: string
}

export const GOLF_FIXTURES: GolfFixture[] = [
  { state: 'today',    day: 'Sat', date: '26 Apr', event: 'Halden Motors International Open',  course: 'Munich GC',          tour: 'DP World Tour', purse: '€7.5M',  cut: 'Projected +1', status: 'R2 · Tee 09:24', time: '09:24' },
  { state: 'upcoming', day: 'Thu', date: '01 May', event: 'Halden Motors Championship',         course: 'Glenmoor GC',        tour: 'DP World Tour', purse: '€8.0M',  cut: 'TBD',         status: 'Confirmed entry' },
  { state: 'upcoming', day: 'Thu', date: '08 May', event: 'Meridian Series — Madrid',           course: 'Club de Campo',      tour: 'Meridian Series', purse: '€2.5M', cut: 'TBD',         status: 'Confirmed entry' },
  { state: 'upcoming', day: 'Thu', date: '15 May', event: 'DP World Tour Championship',         course: 'Earth Course, Dubai', tour: 'DP World Tour', purse: '€10M',  cut: 'Top 50 only', status: 'Race to Dubai gate' },
  { state: 'upcoming', day: 'Thu', date: '22 May', event: 'The Ashbourne Invitational',         course: 'Ashbourne National', tour: 'DP World Tour', purse: '€5.0M',  cut: 'TBD',         status: 'Reserved · pending' },
]

// ─── Today's schedule ──────────────────────────────────────────────────
export type GolfScheduleItem = { t: string; what: string; where: string; highlight?: boolean }

export const GOLF_TODAY: GolfScheduleItem[] = [
  { t: '06:00', what: 'Gym + warm-up routine',                    where: 'Hotel gym' },
  { t: '07:00', what: 'Breakfast',                                 where: 'Hotel restaurant' },
  { t: '07:30', what: 'Range — driver + 7-iron carry distance',    where: 'Range A' },
  { t: '08:30', what: 'Putting green — speed drills',              where: 'Practice green' },
  { t: '09:00', what: 'Course walk — front 9 pin positions',        where: 'Course' },
  { t: '09:24', what: 'TEE TIME — R2 with T. Hartwell + J. Donovan', where: 'Hole 1', highlight: true },
  { t: '14:30', what: 'Post-round physio + debrief',                where: 'Treatment room' },
  { t: '16:00', what: 'Coach session — review round, plan R3',      where: 'Range B' },
]

// ─── Inbox ──────────────────────────────────────────────────────────────
export type GolfInboxChannel = {
  ch: string; count: number; urgent: boolean; last: string; time: string
}

export const GOLF_INBOX: GolfInboxChannel[] = [
  { ch: 'Coach Messages',     count: 2, urgent: false, last: 'Work on 7-iron carry today — TrackMan attached',     time: '06:42' },
  { ch: 'Agent Messages',     count: 2, urgent: true,  last: 'Meridian Watches renewal — reply by Friday',         time: '07:14' },
  { ch: 'Media & Sponsor',    count: 4, urgent: true,  last: 'Vanta Sports post due before 12:00',                 time: '07:28' },
  { ch: 'Tournament Office',  count: 1, urgent: false, last: 'R2 tee time confirmed 09:24',                        time: '06:55' },
  { ch: 'Caddie',             count: 1, urgent: false, last: 'Carlos: front 9 pins tucked. Safe on 7+12, attack 3+15', time: '07:33' },
  { ch: 'Travel',             count: 2, urgent: false, last: 'Madrid hotel confirmed · Halden Champ TBC',          time: 'Yesterday' },
  { ch: 'Equipment',          count: 1, urgent: false, last: 'New Vanta Sports 3-wood ready Thursday',             time: 'Yesterday' },
  { ch: 'Physio',             count: 1, urgent: false, last: 'Lower back tight after R1 — extra stretch',           time: '06:30' },
]

export const GOLF_INBOX_BODIES: Record<string, { sender: string; body: string }> = {
  'Coach Messages': {
    sender: 'Marco Bianchi · Swing Coach',
    body: 'Work on 7-iron carry distance today — TrackMan data attached. Yesterday averaged 168y vs target 172y. Strike pattern shows you\'re catching it half a groove low on out-to-in approach. Pre-round drill: 10 balls 7-iron at 90% to a single target. Want to see 170y+ before the tee.',
  },
  'Agent Messages': {
    sender: 'Sarah Chen · Agent',
    body: 'Meridian Watches renewal proposal in inbox — they want a 3-year extension at +12% on current. Need your sign-off by Friday. Also: Vanta Sports flagged the matchday post obligation again, please prioritise. Quick call after R2?',
  },
  'Media & Sponsor': {
    sender: 'Vanta Sports · Brand Manager',
    body: 'Matchday Instagram post due before 12:00 — Carlos has the photo brief. Please tag @vantasports and use #VantaTour. Also confirming Northbridge Sport want a 5-min greenside interview after R2 (Thursday). They\'ll be ready at the 18th from 14:15.',
  },
  'Tournament Office': {
    sender: 'Halden Motors International — Tournament Office',
    body: 'R2 tee time confirmed 09:24 from Hole 1, group with T. Hartwell and J. Donovan. Range opens 06:00, putting green 07:00. Please report to starter\'s tent by 09:09.',
  },
  'Caddie': {
    sender: 'Carlos Mendez · Caddie',
    body: 'Pin sheet ready, dropped on the lock at 06:30. Front 9 pins tucked — play safe on 7 and 12 (sucker pins, miss centre), attack 3 and 15 where the green opens up. Wind 8 mph NW so adjust club selection on 11–14 (the exposed stretch). Range balls at the back-left bay.',
  },
  'Travel': {
    sender: 'Tour Travel Desk',
    body: 'Madrid hotel confirmed: NH Eurobuilding, check-in Sun 26 Apr 14:00. Halden Motors Championship accommodation still pending — three options sent for your review (all within 4km of Glenmoor GC). Please pick one by Wed.',
  },
  'Equipment': {
    sender: 'James Wright · Equipment',
    body: 'New Vanta Sports 3-wood (10.5° head, X-stiff) ready for fitting Thursday next week. Will need ~45 minutes on TrackMan to dial in launch + spin. Suggesting 10:00 at the workshop. Old 3-wood still in the bag for this week.',
  },
  'Physio': {
    sender: 'Dr Patel · Physio',
    body: 'Lower back tight after R1 — extra stretching before the range today, 15 mins minimum. Booked you in for 14:30 post-round (mobilisation + soft-tissue). Don\'t skip it. If anything feels off mid-round signal me at the 9th.',
  },
}

// ─── AI Morning Brief ──────────────────────────────────────────────────
export type GolfAIBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const GOLF_AI_BRIEF: GolfAIBriefItem[] = [
  { tag: 'round',   pri: 'high', txt: 'R2 tee 09:24 with Hartwell (#42) + Donovan (#31). Cut projected +1, you\'re E par — solid round needed.' },
  { tag: 'tactic',  pri: 'high', txt: 'Front 9 pins tucked. Safe on 7 + 12, attack 3 + 15. Wind 8 mph NW — club up on 11–14.' },
  { tag: 'medical', pri: 'med',  txt: 'Lower back tight after R1. Extra stretching before range. Physio 14:30 — don\'t skip.' },
  { tag: 'sponsor', pri: 'med',  txt: 'Vanta Sports post due 12:00. Reply to Sarah re: Meridian Watches renewal.' },
  { tag: 'travel',  pri: 'low',  txt: 'Madrid hotel confirmed (NH Eurobuilding 26 Apr). Halden Champ accom TBC — choose by Wed.' },
  { tag: 'op',      pri: 'low',  txt: 'R2 forecast 12°C partly cloudy, wind 8 mph NW. Afternoon wave may catch rain from 15:00.' },
]

// ─── Support team ──────────────────────────────────────────────────────
export type GolfTeamMember = { name: string; role: string; status: string; accent: 'green' | 'teal' | 'amber' | 'red' | 'blue' | 'purple' }

export const GOLF_MY_TEAM: GolfTeamMember[] = [
  { name: 'Sarah Chen',     role: 'Agent',         status: 'Meridian renewal call this week',    accent: 'amber' },
  { name: 'Carlos Mendez',  role: 'Caddie',        status: 'Pin sheet ready · front 9 tucked',   accent: 'green' },
  { name: 'Marco Bianchi',  role: 'Swing Coach',   status: '7-iron carry review after round',    accent: 'teal' },
  { name: 'Dr Patel',       role: 'Physio',        status: 'Lower back session 14:30',           accent: 'red' },
  { name: 'Tom Ellis',      role: 'Fitness Coach', status: 'Gym 06:00 done',                     accent: 'blue' },
  { name: 'James Wright',   role: 'Equipment',     status: 'New 3-wood fitting Thursday',         accent: 'purple' },
  { name: 'Maria Santos',   role: 'Nutritionist',  status: 'Tournament meal plan sent',           accent: 'green' },
]

// ─── Performance signals ───────────────────────────────────────────────
export type GolfPerfItem = { txt: string; delta?: string }

export const GOLF_PERF_INTEL: GolfPerfItem[] = [
  { txt: 'OWGR #87 · pts avg 4.82 — top-20 this week projected to break top 80', delta: '+5 places' },
  { txt: 'Race to Dubai #43 / 1,240 pts — on track for top 50 season target',     delta: '+3 vs LM' },
  { txt: 'SG: Approach +0.8 — best category, above tour avg',                      delta: '+0.2' },
  { txt: 'SG: Putting -0.3 — below tour avg, 3rd consecutive negative week',       delta: '−0.1' },
  { txt: 'Driving accuracy 62% — below 65% target',                                delta: '−2%' },
]

// ─── Recents ────────────────────────────────────────────────────────────
export type GolfResult = { event: string; finish: string; score: string; date: string }

export const GOLF_RECENTS: GolfResult[] = [
  { event: 'Halden Motors International Open', finish: 'In play', score: 'E (R1)',          date: 'This week' },
  { event: 'Meridian Series — Lisbon',          finish: 'T-8',     score: '−7 (271)',         date: '19 Apr' },
  { event: 'Ashbourne Invitational',             finish: 'MC',     score: '+3 (147)',          date: '12 Apr' },
  { event: 'DP World Tour Open Spain',           finish: 'T-22',   score: '−4 (276)',         date: '5 Apr' },
  { event: 'European Open',                       finish: 'T-5',    score: '−10 (270)',        date: '29 Mar' },
]

// ─── Stat tiles ────────────────────────────────────────────────────────
export const GOLF_TOP_STATS = [
  { label: 'OWGR',          value: `#87`,     sub: 'top 100',          tone: 'accent' as const },
  { label: 'Race to Dubai', value: '#43',     sub: '1,240 pts',        tone: 'ok'     as const },
  { label: 'Pts avg',       value: '4.82',    sub: 'season',           tone: 'accent' as const },
  { label: 'Earnings',      value: '£412k',   sub: 'YTD',              tone: 'ok'     as const },
  { label: 'Cut line',      value: '+1',      sub: 'projected R2',     tone: 'warn'   as const },
]

// ─── Sidebar nav (presentation layer for v2 shell) ────────────────────
// Maps v1 SIDEBAR_ITEMS ids → v2 grouping + Lucide icon name + NEW badge.
// The page.tsx still drives role-based visibility from SIDEBAR_ITEMS; this
// file is purely the visual layer. IDs MUST match the v1 ids verbatim or
// the route switching breaks.
export type GolfNavItem = { id: string; label: string; icon: string; badge?: string }
export type GolfNavGroup = { g: string; items: GolfNavItem[] }

export const GOLF_NAV_GROUPS: GolfNavGroup[] = [
  { g: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard',          icon: 'home' },
    { id: 'briefing',  label: 'Morning Briefing',   icon: 'sun' },
    { id: 'insights',  label: 'Insights',           icon: 'bars' },
  ]},
  { g: 'Round Day', items: [
    { id: 'coursestrategy', label: 'Course Strategy', icon: 'crosshair' },
    { id: 'teetimes',       label: 'Tee Times',       icon: 'calendar' },
    { id: 'livescoring',    label: 'Live Scoring',    icon: 'dot' },
  ]},
  { g: 'Performance', items: [
    { id: 'owgr',           label: 'OWGR Tracker',     icon: 'bars',     badge: 'NEW' },
    { id: 'sganalysis',     label: 'Strokes Gained',    icon: 'bars',     badge: 'NEW' },
    { id: 'coursefit',      label: 'Course Fit',        icon: 'crosshair', badge: 'NEW' },
    { id: 'practice',       label: 'Practice Log',      icon: 'note' },
    { id: 'shotanalysis',   label: 'Shot Analysis',     icon: 'play' },
    { id: 'video',          label: 'Video Review',      icon: 'play' },
  ]},
  { g: 'Mental', items: [
    { id: 'mental',         label: 'Mental Performance', icon: 'sparkles', badge: 'NEW' },
    { id: 'preroundroutine', label: 'Pre-Round Routine', icon: 'check' },
  ]},
  { g: 'Commercial', items: [
    { id: 'sponsorship',    label: 'Sponsorship',        icon: 'briefcase' },
    { id: 'financial',      label: 'Financial',          icon: 'pound' },
    { id: 'media',          label: 'Media & Content',    icon: 'newspaper' },
    { id: 'agentpipeline',  label: 'Agent Pipeline',     icon: 'briefcase' },
  ]},
  { g: 'Tour', items: [
    { id: 'travel',         label: 'Travel & Logistics', icon: 'plane' },
    { id: 'tournamentcalendar', label: 'Tournament Calendar', icon: 'calendar' },
    { id: 'hotelfinder',    label: 'Hotel Finder',       icon: 'pin' },
    { id: 'entrymanager',   label: 'Entry Manager',      icon: 'note' },
    { id: 'prizeforecaster', label: 'Prize Forecaster',  icon: 'pound' },
    { id: 'courtbooking',   label: 'Court Booking',      icon: 'calendar' },
  ]},
  { g: 'Career', items: [
    { id: 'racetodubai',    label: 'Race to Dubai',      icon: 'trophy' },
    { id: 'careerplanning', label: 'Career Planning',    icon: 'arrow-up-right' },
    { id: 'datahub',        label: 'Data Hub',           icon: 'bars' },
  ]},
  { g: 'Tools', items: [
    { id: 'equipment',      label: 'Equipment Manager',  icon: 'wrench' },
    { id: 'caddienotes',    label: 'Caddie Notes',       icon: 'note' },
  ]},
]
