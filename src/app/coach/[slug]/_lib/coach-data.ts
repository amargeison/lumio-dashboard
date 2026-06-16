// Lumio Tennis — COACH portal demo data.
// Mirrors the tennis (player) portal shape, but the persona is a COACH running
// a tennis academy. Squad/athlete modules are replaced by coach modules:
// Lesson Summaries, Player Development, the Belt Progression system (a Kyu-Dan
// style ranking adapted for tennis skills), Booking Calendar and Resource Centre.
//
// All names/players are fictional. Coach persona "Jordan Hayes" is intentional.

// ─── Org / coach persona ──────────────────────────────────────────────────
// Coach demo persona headshot (served from /public). Falls back to initials
// if the image fails to load.
export const COACH_PHOTO = '/pete.jpeg'

export const COACH_ORG = {
  product:    'Lumio Coach',
  coach:      'Pete Griffiths',
  coachShort: 'Pete',
  academy:    'Lumio Tennis Academy',
  cert:       'LTA Accredited+ Coach · Performance',
  date:       'Thu, 11 Jun 2026',
  venue:      'Riverside Tennis Centre · Courts 1–6',
  season:     { activePlayers: 34, lessonsThisWeek: 41, retention: 92, beltsAwarded: 7 },
} as const

// ─── Demo date anchor ────────────────────────────────────────────────────────
// Deterministic "today" for the demo — fixed constants, never new Date(), so the
// portal renders identically regardless of the real clock. The demo week runs
// Mon 8 Jun → Sun 14 Jun 2026; "today" is Thursday the 11th (= COACH_ORG.date).
export const WEEK_START = '2026-06-08'   // Monday of the demo week
export const TODAY = '2026-06-11'        // Thursday — the portal's "today"

// Calendar date for a weekday index (0=Mon … 6=Sun) within the demo week. Pure
// string arithmetic (no Date()) — valid because the whole week sits inside June.
export function dateForDay(dayIndex: number): string {
  const [y, m, d] = WEEK_START.split('-').map(Number)
  return `${y}-${String(m).padStart(2, '0')}-${String(d + dayIndex).padStart(2, '0')}`
}

// ─── Top stat tiles ────────────────────────────────────────────────────────
export type CoachStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type CoachStatTile = { label: string; value: string | number; sub: string; tone: CoachStatTone }

export const COACH_TOP_STATS: CoachStatTile[] = [
  { label: 'Sessions today', value: 7,       sub: '2 group · 5 private', tone: 'accent' },
  { label: 'Next lesson',    value: '09:00', sub: 'Mia Chen · Court 2',  tone: 'urgent' },
  { label: 'Active players', value: 34,      sub: '+3 this month',       tone: 'ok' },
  { label: 'Rackets due',    value: 4,       sub: 'assessments pending', tone: 'warn' },
  { label: 'Utilisation',    value: '88%',   sub: 'court hours booked',  tone: 'accent' },
]

// ════════════════════════════════════════════════════════════════════════════
// BELT PROGRESSION SYSTEM  (Kyu-Dan adapted for tennis)
// ════════════════════════════════════════════════════════════════════════════
// Nine belts, light → dark, each unlocking a cluster of tennis skills. A skill is
// scored 0–4:  0 Not started · 1 Learning · 2 Developing · 3 Consistent · 4 Mastered.
// A belt is AWARDED when every skill in it reaches Consistent (3) or higher.
// The mapping below is a sensible default — coaches can re-order skills per belt.

export type Belt = {
  id: string
  name: string
  theme: string            // pedagogical theme of the belt
  colour: string           // swatch colour
  ageGuide: string         // rough age / stage guide (LTA ball-stage aligned)
  ball: 'Red' | 'Orange' | 'Green' | 'Yellow'
  skills: { id: string; name: string; note: string }[]
}

export const BELTS: Belt[] = [
  {
    id: 'white', name: 'White', theme: 'Foundations', colour: '#E8EAEE',
    ageGuide: 'Ages 5–7 · first racket', ball: 'Red',
    skills: [
      { id: 'ready',     name: 'Ready position & split-step', note: 'Athletic base, balanced, on toes before each ball' },
      { id: 'fh-drive',  name: 'Forehand groundstroke',       note: 'Low-to-high swing, contact out front' },
      { id: 'grips',     name: 'Grips — eastern & continental', note: 'Find and change grip without looking' },
      { id: 'rally-co',  name: 'Cooperative rally',            note: 'Keep 3–5 balls going with a partner' },
    ],
  },
  {
    id: 'yellow', name: 'Yellow', theme: 'Rallying', colour: '#E5C76B',
    ageGuide: 'Ages 6–8 · red ball', ball: 'Red',
    skills: [
      { id: 'bh-drive',  name: 'Two-handed backhand',  note: 'Shoulder turn, two clean hands, follow through' },
      { id: 'footwork',  name: 'Footwork & recovery',  note: 'Small adjusting steps, recover to centre' },
      { id: 'rally-10',  name: 'Sustained rally (10+)', note: 'Rally 10+ balls cross-court with control' },
      { id: 'tracking',  name: 'Ball tracking & timing', note: 'Read bounce early, meet the ball cleanly' },
    ],
  },
  {
    id: 'orange', name: 'Orange', theme: 'Net & Touch', colour: '#E08A3C',
    ageGuide: 'Ages 8–9 · orange ball', ball: 'Orange',
    skills: [
      { id: 'fh-volley', name: 'Forehand volley',  note: 'Punch, firm wrist, short backswing at the net' },
      { id: 'bh-volley', name: 'Backhand volley',  note: 'Continental grip, block forward through contact' },
      { id: 'slice',     name: 'Backhand slice',   note: 'High-to-low, stable face, ball stays low' },
      { id: 'net-pos',   name: 'Net positioning',  note: 'Close the net, cut angles, ready hands' },
    ],
  },
  {
    id: 'green', name: 'Green', theme: 'The Serve', colour: '#4FAE72',
    ageGuide: 'Ages 9–10 · green ball', ball: 'Green',
    skills: [
      { id: 'serve-flat', name: 'Flat first serve',     note: 'Trophy pose, toss, pronate, land inside' },
      { id: 'toss',       name: 'Toss & rhythm',        note: 'Consistent toss, smooth service motion' },
      { id: 'return',     name: 'Return of serve',      note: 'Split on contact, short take-back, block deep' },
      { id: 'placement',  name: 'Serve placement',      note: 'Hit wide / body / T targets on demand' },
    ],
  },
  {
    id: 'blue', name: 'Blue', theme: 'Spin & Shape', colour: '#3A8EE0',
    ageGuide: 'Ages 10–12 · yellow ball', ball: 'Yellow',
    skills: [
      { id: 'topspin-fh', name: 'Topspin forehand',   note: 'Brush up the back, heavy net clearance' },
      { id: 'topspin-bh', name: 'Topspin backhand',   note: 'Drive through with spin, depth and shape' },
      { id: 'second',     name: 'Second serve (kick)', note: 'Spin-first, high margin, reliable under pressure' },
      { id: 'depth',      name: 'Depth & heavy ball', note: 'Land balls in the back third consistently' },
    ],
  },
  {
    id: 'purple', name: 'Purple', theme: 'Specialty Shots', colour: '#a855f7',
    ageGuide: 'Ages 11–14 · developing', ball: 'Yellow',
    skills: [
      { id: 'overhead', name: 'Overhead smash',           note: 'Turn, point, finish high balls with authority' },
      { id: 'drop',     name: 'Drop shot',                note: 'Disguised touch, soft hands, dies short' },
      { id: 'lob',      name: 'Offensive & defensive lob', note: 'Clear the net player, reset from defence' },
      { id: 'half-v',   name: 'Half-volley',              note: 'Short hop pick-up in transition, stable face' },
    ],
  },
  {
    id: 'brown', name: 'Brown', theme: 'Weapons', colour: '#9A6B4F',
    ageGuide: 'Ages 13+ · competitive', ball: 'Yellow',
    skills: [
      { id: 'kick-serve',  name: 'Kick serve',          note: 'Heavy topspin serve that jumps off the court' },
      { id: 'slice-serve', name: 'Slice serve',         note: 'Curve the ball wide to open the court' },
      { id: 'inside-out',  name: 'Inside-out forehand', note: 'Run around the backhand, attack with the FH' },
      { id: 'approach',    name: 'Approach & transition', note: 'Approach off short balls, close behind it' },
    ],
  },
  {
    id: 'red', name: 'Red', theme: 'Tactics', colour: '#C75A5A',
    ageGuide: 'Tournament player', ball: 'Yellow',
    skills: [
      { id: 'construction', name: 'Point construction', note: 'Build the point, open space, finish the right ball' },
      { id: 'patterns',     name: 'Pattern play',        note: 'Serve+1 and return+1 go-to patterns' },
      { id: 'variation',    name: 'Disguise & variation', note: 'Change spin, pace and height to disrupt' },
      { id: 'scouting',     name: 'Reading opponents',   note: 'Spot and exploit weaknesses live' },
    ],
  },
  {
    id: 'black', name: 'Black', theme: 'Mastery', colour: '#2A3142',
    ageGuide: 'Performance / elite', ball: 'Yellow',
    skills: [
      { id: 'management', name: 'Match management',     note: 'Manage score, momentum and game state' },
      { id: 'mental',     name: 'Pressure & mental game', note: 'Routines, resets, compete on big points' },
      { id: 'adapt',      name: 'In-match adaptation',  note: 'Change a losing plan, adjust on the fly' },
      { id: 'closing',    name: 'Closing out matches',  note: 'Serve out sets, convert when ahead' },
    ],
  },
]

export const MASTERY_LABELS = ['Not started', 'Learning', 'Developing', 'Consistent', 'Mastered'] as const

// ─── LTA alignment ──────────────────────────────────────────────────────────
// Maps each Kyu-Dan belt to the LTA Youth pathway. The LTA Youth programme has
// five official ball-colour stages — Blue → Red → Orange → Green → Yellow —
// after which players move into the LTA Youth Compete grades and the
// performance pathway. (Note: LTA stage colours differ from the martial-arts
// belt colours; the belt is the academy's own ladder, the LTA stage is the
// national-framework equivalent.)
export type LtaStage = { stage: string; colour: string; ages: string; focus: string }

export const LTA_MAP: Record<string, LtaStage> = {
  white:  { stage: 'LTA Youth · Blue',          colour: '#3A8EE0', ages: '4–6',   focus: 'Balance, coordination, agility, racket & ball skills' },
  yellow: { stage: 'LTA Youth · Red',           colour: '#C75A5A', ages: '6–8',   focus: 'Serve, rally and score on red courts' },
  orange: { stage: 'LTA Youth · Orange',        colour: '#E08A3C', ages: '8–9',   focus: 'A rounded game — develop the different shots' },
  green:  { stage: 'LTA Youth · Green',         colour: '#4FAE72', ages: '9–10',  focus: 'Full court — refine and test technique' },
  blue:   { stage: 'LTA Youth · Yellow',        colour: '#E5C76B', ages: '10–16', focus: 'Real balls, full court — game styles & spin' },
  purple: { stage: 'LTA Youth Compete',         colour: '#a855f7', ages: '11–14', focus: 'Start & build competing — Youth Grades' },
  brown:  { stage: 'LTA Youth Compete · County', colour: '#9A6B4F', ages: '13+',  focus: 'County-level competition & match weapons' },
  red:    { stage: 'Performance · County–Regional', colour: '#C75A5A', ages: 'Junior', focus: 'Tactical match-play on the performance pathway' },
  black:  { stage: 'Performance · Regional–National', colour: '#2A3142', ages: 'Elite', focus: 'National-level performance & mastery' },
}

// ─── Playing standard ───────────────────────────────────────────────────────
// The "standard" is the LTA pathway stage that the belt maps to. Belt ⇄ standard
// are 1:1, so picking one syncs the other (see NewSession).
export const STANDARDS: { id: string; label: string; belt: string }[] =
  BELTS.map(b => ({ id: b.id, label: LTA_MAP[b.id].stage, belt: b.id }))

export const beltIndexOf = (id: string) => Math.max(0, BELTS.findIndex(b => b.id === id))

// ─── Session-focus catalogue ────────────────────────────────────────────────
// A categorised list of coachable focuses, each tagged with the belt it most
// naturally aligns to. Rendered as grouped <optgroup>s in the New session form;
// choosing a belt jumps to that belt's headline focus.
export type FocusOpt = { label: string; belt: string }
export const FOCUS_CATALOGUE: { category: string; options: FocusOpt[] }[] = [
  { category: 'Foundations & rallying', options: [
    { label: 'Ready position & split-step',        belt: 'white' },
    { label: 'Forehand groundstroke — low to high', belt: 'white' },
    { label: 'Grips — eastern & continental',       belt: 'white' },
    { label: 'Cooperative rally (3–5 balls)',       belt: 'white' },
    { label: 'Two-handed backhand drive',           belt: 'yellow' },
    { label: 'Sustained rally — 10+ cross-court',   belt: 'yellow' },
    { label: 'Footwork & recovery to centre',       belt: 'yellow' },
    { label: 'Ball tracking & timing',              belt: 'yellow' },
  ] },
  { category: 'Net & touch', options: [
    { label: 'Forehand volley — punch & firm wrist', belt: 'orange' },
    { label: 'Backhand volley — block forward',      belt: 'orange' },
    { label: 'Backhand slice — stable, low',         belt: 'orange' },
    { label: 'Net positioning & cutting angles',     belt: 'orange' },
    { label: 'Half-volley pick-up in transition',    belt: 'purple' },
  ] },
  { category: 'Serve & return', options: [
    { label: 'Flat first serve — trophy & pronation', belt: 'green' },
    { label: 'Toss & service rhythm',                 belt: 'green' },
    { label: 'Return of serve — split & block deep',  belt: 'green' },
    { label: 'Serve placement — wide / body / T',     belt: 'green' },
    { label: 'Second serve — reliable kick',          belt: 'blue' },
    { label: 'Kick serve — heavy topspin',            belt: 'brown' },
    { label: 'Slice serve — curve it wide',           belt: 'brown' },
  ] },
  { category: 'Spin & shape', options: [
    { label: 'Topspin forehand — brush up & clear',  belt: 'blue' },
    { label: 'Topspin backhand — drive with shape',  belt: 'blue' },
    { label: 'Depth & heavy ball — back third',      belt: 'blue' },
    { label: 'Net clearance & margin',               belt: 'blue' },
  ] },
  { category: 'Specialty shots', options: [
    { label: 'Overhead smash — turn & finish',       belt: 'purple' },
    { label: 'Drop shot — disguised touch',          belt: 'purple' },
    { label: 'Lob — offensive & defensive',          belt: 'purple' },
    { label: 'Inside-out forehand — run around BH',  belt: 'brown' },
    { label: 'Approach & transition off short balls', belt: 'brown' },
  ] },
  { category: 'Tactics & match play', options: [
    { label: 'Point construction — open & finish',   belt: 'red' },
    { label: 'Pattern play — serve+1 / return+1',    belt: 'red' },
    { label: 'Disguise & variation — spin/pace/height', belt: 'red' },
    { label: 'Reading opponents — spot weaknesses',  belt: 'red' },
    { label: 'Match management — score & momentum',  belt: 'black' },
    { label: 'In-match adaptation — change the plan', belt: 'black' },
    { label: 'Closing out matches — serve it out',   belt: 'black' },
  ] },
  { category: 'Movement & mindset', options: [
    { label: 'Court movement & agility',             belt: 'yellow' },
    { label: 'Speed & change of direction',          belt: 'green' },
    { label: 'Match-play fitness & recovery',        belt: 'red' },
    { label: 'Pressure & mental routines',           belt: 'black' },
  ] },
]

// Headline focus for a belt — used to auto-match the focus dropdown to a belt.
export function focusForBelt(beltId: string): string {
  for (const g of FOCUS_CATALOGUE) {
    const hit = g.options.find(o => o.belt === beltId)
    if (hit) return hit.label
  }
  return FOCUS_CATALOGUE[0].options[0].label
}

// ─── Onboarding → belt mapping ──────────────────────────────────────────────
// Maps a new player's onboarding answers (experience level, years playing, age)
// to a sensible starting belt index. This is the "read the onboarding doc and
// place them" step the coach would otherwise do by hand.
export const ONBOARDING_LEVELS: { id: string; label: string; base: number }[] = [
  { id: 'new',          label: 'Brand new to tennis',              base: 0 },
  { id: 'recreational', label: 'Recreational / casual hitter',     base: 1 },
  { id: 'club',         label: 'Club / social player',             base: 2 },
  { id: 'school',       label: 'School team player',               base: 3 },
  { id: 'improver',     label: 'Improver — solid all-court game',  base: 4 },
  { id: 'county',       label: 'County junior',                    base: 5 },
  { id: 'regional',     label: 'Regional / tournament player',     base: 6 },
  { id: 'performance',  label: 'Performance / national',           base: 8 },
  { id: 'adult-return', label: 'Adult returning after a break',    base: 2 },
]

export function mapOnboardingToBelt(level: string, years: number, age: number): number {
  const base = (ONBOARDING_LEVELS.find(l => l.id === level)?.base) ?? 0
  let idx = base
  if (years >= 6) idx += 2
  else if (years >= 3) idx += 1
  // Young children stay on the early ball stages regardless of keenness.
  if (age && age <= 7) idx = Math.min(idx, 1)
  else if (age && age <= 9) idx = Math.min(idx, 3)
  return Math.max(0, Math.min(BELTS.length - 1, idx))
}

// Flat list of every skill with its belt index — used to compute progress.
export const ALL_SKILLS = BELTS.flatMap((b, bi) =>
  b.skills.map((s, si) => ({ ...s, beltIndex: bi, beltId: b.id, globalIndex: bi * 10 + si })))

// Deterministic per-player skill score so the demo looks alive without hand-
// authoring a score for every player × skill. Scores below the player's current
// belt are high (learned), the current belt is mixed, beyond is 0.
export function skillScore(playerSeed: number, beltIndex: number, skillIdx: number, currentBelt: number): number {
  if (beltIndex < currentBelt) {
    // Already-earned belts: mostly mastered, occasionally consistent.
    return ((playerSeed * 7 + beltIndex * 3 + skillIdx) % 5 === 0) ? 3 : 4
  }
  if (beltIndex === currentBelt) {
    // Current working belt: a spread of learning → consistent.
    return 1 + ((playerSeed * 5 + skillIdx * 3 + beltIndex) % 3) // 1..3
  }
  if (beltIndex === currentBelt + 1) {
    // Next belt: occasional early exposure.
    return ((playerSeed + skillIdx) % 3 === 0) ? 1 : 0
  }
  return 0
}

// ─── Players (roster) ──────────────────────────────────────────────────────
export type Player = {
  id: string
  name: string
  initials: string
  age: number
  group: 'Junior' | 'Performance' | 'Adult'
  beltIndex: number          // index into BELTS
  seed: number               // drives deterministic skill scores
  goal: string
  attendance: number         // % last 8 weeks
  nextSession: string
  parent?: string
  status: 'green' | 'amber' | 'red'   // development flag
  trend: 'up' | 'flat' | 'down'
  coachId: string            // the coach this player is assigned to (id in COACHES)
}

// Pete's assigned players. PLAYERS stays his roster so his roster/dashboard/right-rail
// are unchanged; the rest of the club's players live in coaches-data.ts (STAFF_PLAYERS).
export const PLAYERS: Player[] = [
  { id: 'p1', name: 'Mia Chen',        initials: 'MC', age: 9,  group: 'Junior',      beltIndex: 2, seed: 3, goal: 'First serve over the net consistently', attendance: 96, nextSession: 'Today 09:00', parent: 'Lily Chen',    status: 'green', trend: 'up',   coachId: 'pete' },
  { id: 'p2', name: 'Tom Okafor',      initials: 'TO', age: 12, group: 'Performance', beltIndex: 4, seed: 7, goal: 'Reliable kick second serve',             attendance: 91, nextSession: 'Today 10:30', parent: 'Grace Okafor', status: 'green', trend: 'up',   coachId: 'pete' },
  { id: 'p3', name: 'Ava Romero',      initials: 'AR', age: 8,  group: 'Junior',      beltIndex: 1, seed: 2, goal: 'Rally 10 balls cross-court',            attendance: 88, nextSession: 'Today 16:00', parent: 'Sofia Romero', status: 'amber', trend: 'flat', coachId: 'pete' },
  { id: 'p4', name: 'Leo Whitfield',   initials: 'LW', age: 14, group: 'Performance', beltIndex: 6, seed: 5, goal: 'Build serve+1 forehand pattern',        attendance: 94, nextSession: 'Tomorrow 17:00', status: 'green', trend: 'up',   coachId: 'pete' },
  { id: 'p5', name: 'Hannah Berg',     initials: 'HB', age: 11, group: 'Junior',      beltIndex: 3, seed: 9, goal: 'Add topspin shape to forehand',         attendance: 79, nextSession: 'Fri 15:30',   parent: 'Mark Berg',    status: 'red',   trend: 'down', coachId: 'pete' },
  { id: 'p6', name: 'Daniel Cruz',     initials: 'DC', age: 16, group: 'Performance', beltIndex: 7, seed: 4, goal: 'Win first county-level match',          attendance: 97, nextSession: 'Today 18:00', status: 'green', trend: 'up',   coachId: 'pete' },
  { id: 'p7', name: 'Priya Patel',     initials: 'PP', age: 38, group: 'Adult',       beltIndex: 3, seed: 6, goal: 'Consistent doubles serve & volley',     attendance: 85, nextSession: 'Sat 11:00',   status: 'green', trend: 'flat', coachId: 'pete' },
  { id: 'p8', name: 'James Whitlock',  initials: 'JW', age: 10, group: 'Junior',      beltIndex: 2, seed: 8, goal: 'Backhand volley at the net',            attendance: 90, nextSession: 'Fri 16:30',   parent: 'Anna Whitlock', status: 'amber', trend: 'up',   coachId: 'pete' },
]

// ─── Lesson summaries ──────────────────────────────────────────────────────
export type Lesson = {
  id: string
  playerId: string
  player: string
  date: string
  time: string
  duration: number          // minutes
  type: 'Private' | 'Group' | 'Cardio' | 'Match play'
  court: string
  focus: string
  covered: string[]
  takeaways: string[]
  drills: string[]
  skillsWorked: string[]    // skill ids from BELTS
  homework: string
  nextFocus: string
  coachNote: string
  rating: number            // session quality / effort 1–5
}

export const LESSONS: Lesson[] = [
  {
    id: 'l1', playerId: 'p2', player: 'Tom Okafor', date: '10 Jun 2026', time: '10:30', duration: 60, type: 'Private', court: 'Court 2',
    focus: 'Second serve — kick & reliability',
    covered: [
      'Service toss height and consistency (slightly more over the head for kick)',
      'Brushing up the back of the ball 7→1 o\'clock for topspin',
      'Targeting the backhand side of the ad court',
      'Live points starting from second serve only',
    ],
    takeaways: [
      'Kick serve clearing the net by 1m+ — much safer margin',
      'When rushed, toss drifts forward → flatter, riskier serve',
    ],
    drills: ['Spin-only serve ladder (10 in a row)', 'Target cones — ad-court backhand', 'Second-serve-only points to 11'],
    skillsWorked: ['second', 'toss', 'placement'],
    homework: 'Shadow-serve 30 reps/day focusing on the up-and-over brush; film one set.',
    nextFocus: 'Carry the kick serve into serve+1 forehand patterns.',
    coachNote: 'Real progress today — confidence on the second ball is the difference-maker for his level. Hold him to the higher toss.',
    rating: 5,
  },
  {
    id: 'l2', playerId: 'p1', player: 'Mia Chen', date: '09 Jun 2026', time: '09:00', duration: 45, type: 'Private', court: 'Court 1',
    focus: 'First serve fundamentals',
    covered: [
      'Trophy position and a relaxed toss',
      'Continental grip — held it the whole session',
      'Serving from the service line, then back to the baseline',
    ],
    takeaways: [
      'Getting the ball in the box 6/10 from the baseline — up from 2/10',
      'Loses the continental grip when she tries to hit hard',
    ],
    drills: ['Toss-and-catch (10 reps)', 'Down-the-ladder serve from service line', 'Serve & rally to 5'],
    skillsWorked: ['serve-flat', 'toss', 'grips'],
    homework: 'Practise 20 tosses a day against a wall mark; keep the continental grip.',
    nextFocus: 'Add a target (wide vs T) once the box rate is steady at 7/10.',
    coachNote: 'Lovely attitude. Close to her Green racket serve criteria — one more good week.',
    rating: 4,
  },
  {
    id: 'l3', playerId: 'p5', player: 'Hannah Berg', date: '06 Jun 2026', time: '15:30', duration: 60, type: 'Private', court: 'Court 4',
    focus: 'Topspin forehand shape',
    covered: [
      'Low-to-high swing path with a relaxed arm',
      'Net clearance targets (over the high rope)',
      'Rallying with margin rather than flat and flat',
    ],
    takeaways: [
      'Generating spin in drills, but reverts to flat under live pressure',
      'Attendance dipped — missed two sessions, affecting rhythm',
    ],
    drills: ['High-rope cross-court rally', 'Spin-only mini-tennis', 'Drop-feed brush-up reps'],
    skillsWorked: ['topspin-fh', 'depth'],
    homework: 'Wall rally 15 min focusing only on brushing up; aim above a taped line.',
    nextFocus: 'Bridge the gap between drill spin and match spin with live rally targets.',
    coachNote: 'Flag for parents: consistency of attendance is the main blocker right now.',
    rating: 3,
  },
  {
    id: 'l4', playerId: 'p4', player: 'Leo Whitfield', date: '05 Jun 2026', time: '17:00', duration: 75, type: 'Match play', court: 'Court 3',
    focus: 'Inside-out forehand & approach',
    covered: [
      'Running around the backhand to attack with the forehand',
      'Recognising the short ball cue to approach',
      'Closing the net behind the approach',
    ],
    takeaways: [
      'Inside-out forehand is becoming a genuine weapon',
      'Sometimes over-runs around makeable backhands — balance needed',
    ],
    drills: ['3-ball inside-out feed → approach → volley', 'Short-ball reaction approach', 'Approach & pass points'],
    skillsWorked: ['inside-out', 'approach', 'fh-volley'],
    homework: 'Watch the clip — note 3 moments to approach earlier.',
    nextFocus: 'Pattern: serve+1 inside-out forehand to the open court.',
    coachNote: 'Brown racket tactics coming together. Ready to compete more.',
    rating: 5,
  },
]

// ─── Booking calendar ──────────────────────────────────────────────────────
export type Booking = {
  id: string
  day: number                // 0=Mon … 6=Sun
  date: string               // 'YYYY-MM-DD' — derived from day via dateForDay()
  start: string              // 'HH:MM'
  end: string
  player: string
  type: 'Private' | 'Group' | 'Cardio' | 'Match play' | 'Block'
  court: string
  status: 'confirmed' | 'pending' | 'cancelled'
  coachId: string            // which coach owns this booking (id in COACHES; see coaches-data.ts)
}

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_DATES = ['8', '9', '10', '11', '12', '13', '14']  // Jun 2026 week
export const CAL_HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']

// Pete's own bookings (the logged-in head coach). BOOKINGS stays his slice so all
// his existing views are unchanged; the wider team's bookings live in coaches-data.ts.
const BOOKINGS_SEED: Omit<Booking, 'date'>[] = [
  { id: 'b1', day: 3, start: '09:00', end: '09:45', player: 'Mia Chen',      type: 'Private',    court: 'Court 1', status: 'confirmed', coachId: 'pete' },
  { id: 'b2', day: 3, start: '10:30', end: '11:30', player: 'Tom Okafor',    type: 'Private',    court: 'Court 2', status: 'confirmed', coachId: 'pete' },
  { id: 'b3', day: 3, start: '12:00', end: '13:00', player: 'Junior Squad',  type: 'Group',      court: 'Court 1', status: 'confirmed', coachId: 'pete' },
  { id: 'b4', day: 3, start: '16:00', end: '16:45', player: 'Ava Romero',    type: 'Private',    court: 'Court 3', status: 'confirmed', coachId: 'pete' },
  { id: 'b5', day: 3, start: '18:00', end: '19:00', player: 'Daniel Cruz',   type: 'Match play', court: 'Court 3', status: 'confirmed', coachId: 'pete' },
  { id: 'b6', day: 0, start: '15:30', end: '16:30', player: 'Performance Sq', type: 'Group',     court: 'Court 2', status: 'confirmed', coachId: 'pete' },
  { id: 'b7', day: 1, start: '17:00', end: '18:15', player: 'Leo Whitfield', type: 'Match play', court: 'Court 3', status: 'confirmed', coachId: 'pete' },
  { id: 'b8', day: 4, start: '15:30', end: '16:30', player: 'Hannah Berg',   type: 'Private',    court: 'Court 4', status: 'pending',   coachId: 'pete' },
  { id: 'b9', day: 4, start: '16:30', end: '17:15', player: 'James Whitlock',type: 'Private',    court: 'Court 1', status: 'confirmed', coachId: 'pete' },
  { id: 'b10', day: 5, start: '09:00', end: '10:30', player: 'Cardio Tennis', type: 'Cardio',    court: 'Court 1', status: 'confirmed', coachId: 'pete' },
  { id: 'b11', day: 5, start: '11:00', end: '12:00', player: 'Priya Patel',  type: 'Private',    court: 'Court 2', status: 'confirmed', coachId: 'pete' },
  { id: 'b12', day: 2, start: '12:00', end: '14:00', player: 'Admin / Planning', type: 'Block',  court: '—',       status: 'confirmed', coachId: 'pete' },
  { id: 'b13', day: 0, start: '17:00', end: '18:00', player: 'Adult Group',  type: 'Group',      court: 'Court 4', status: 'confirmed', coachId: 'pete' },
  { id: 'b14', day: 6, start: '10:00', end: '11:00', player: 'Open coaching', type: 'Block',     court: 'Court 1', status: 'pending',   coachId: 'pete' },
]

// Bookings are the canonical schedule record. Each row's calendar date is derived
// from its weekday index so we never hand-type dates.
export const BOOKINGS: Booking[] = BOOKINGS_SEED.map(b => ({ ...b, date: dateForDay(b.day) }))

// ─── Resource centre ────────────────────────────────────────────────────────
export type Resource = {
  id: string
  title: string
  category: 'Drill' | 'Technique' | 'Training plan' | 'Fitness' | 'Mental'
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All levels'
  format: 'Video' | 'PDF' | 'Plan' | 'Worksheet'
  duration: string
  belt?: string             // belt id this resource supports
  tags: string[]
  desc: string
  video?: string            // YouTube id — embeds an in-app player on the card
}

export const RESOURCES: Resource[] = [
  { id: 'r1',  title: 'Split-step & first-move reaction',  category: 'Drill',        level: 'Beginner',     format: 'Video',     duration: '4 min',  belt: 'white',  tags: ['movement','warm-up'],        desc: 'Reaction-cue split-step ladder for foundation movers.', video: 'J1UhPl1UrYs' },
  { id: 'r2',  title: 'Low-to-high topspin forehand',      category: 'Technique',    level: 'Intermediate', format: 'Video',     duration: '7 min',  belt: 'blue',   tags: ['forehand','spin'],           desc: 'Frame-by-frame swing path for heavy topspin.', video: 'KV9DTSNkLAg' },
  { id: 'r3',  title: 'Kick serve in 5 steps',             category: 'Technique',    level: 'Advanced',     format: 'Video',     duration: '9 min',  belt: 'brown',  tags: ['serve','spin'],              desc: 'Build a reliable kick serve from toss to pronation.' },
  { id: 'r4',  title: '8-week Green-racket block',         category: 'Training plan',level: 'Intermediate', format: 'Plan',      duration: '8 weeks',belt: 'green',  tags: ['serve','periodisation'],     desc: 'Periodised plan to earn the Green racket serve criteria.' },
  { id: 'r5',  title: 'Cross-court rally targets',         category: 'Drill',        level: 'All levels',   format: 'PDF',       duration: '—',      belt: 'yellow', tags: ['consistency','rally'],       desc: 'Printable court targets for rally depth & direction.' },
  { id: 'r6',  title: 'Net play & volley progression',     category: 'Drill',        level: 'Intermediate', format: 'Video',     duration: '6 min',  belt: 'orange', tags: ['volley','net'],              desc: 'Feed sequence from block volley to closing the net.' },
  { id: 'r7',  title: 'Footwork agility ladder set',       category: 'Fitness',      level: 'All levels',   format: 'PDF',       duration: '15 min', tags: ['movement','warm-up'],        desc: 'Off-court ladder routine for split-step speed.' },
  { id: 'r8',  title: 'Compete: reset routine card',       category: 'Mental',       level: 'Advanced',     format: 'Worksheet', duration: '—',      belt: 'black',  tags: ['mental','routines'],         desc: 'Between-points reset & breathing routine worksheet.' },
  { id: 'r9',  title: 'Serve+1 forehand patterns',         category: 'Drill',        level: 'Advanced',     format: 'Video',     duration: '8 min',  belt: 'red',    tags: ['patterns','tactics'],        desc: 'Three go-to serve+1 patterns and how to drill them.' },
  { id: 'r10', title: 'Parent guide: ball stages',         category: 'Training plan',level: 'Beginner',     format: 'PDF',       duration: '—',      tags: ['parents','red-orange-green'], desc: 'Explains the red/orange/green/yellow ball pathway for parents.' },
  { id: 'r11', title: 'Drop shot & touch session',         category: 'Technique',    level: 'Intermediate', format: 'Video',     duration: '5 min',  belt: 'purple', tags: ['touch','specialty'],         desc: 'Disguised drop shot mechanics and feel drills.' },
  { id: 'r12', title: 'Match-play tactics worksheet',      category: 'Mental',       level: 'Advanced',     format: 'Worksheet', duration: '—',      belt: 'red',    tags: ['tactics','scouting'],        desc: 'Pre-match plan and opponent-read worksheet.' },
]

// ─── Drill library ──────────────────────────────────────────────────────────
// A printable, court-diagrammed drill for every session focus, organised by
// skill category and tagged to the belt system. Opened as A4 drill sheets from
// the Resource Centre "Drills" tab. The `court` key chooses a reusable diagram.
export type DrillCourt = 'rally' | 'baseline' | 'serve' | 'net' | 'movement' | 'target' | 'fullcourt'
export type Drill = {
  id: string
  focus: string          // matches a FOCUS_CATALOGUE label
  belt: string
  category: string       // matches a FOCUS_CATALOGUE category
  court: DrillCourt
  setup: string
  levels: [string, string, string, string]
  cue: string
  tags: string[]
}

export function drillLevel(beltId: string): 'Beginner' | 'Intermediate' | 'Advanced' {
  const i = beltIndexOf(beltId)
  return i <= 1 ? 'Beginner' : i <= 4 ? 'Intermediate' : 'Advanced'
}

export const DRILL_LIBRARY: Drill[] = [
  // ── Foundations & rallying ──
  { id: 'd1', focus: 'Ready position & split-step', belt: 'white', category: 'Foundations & rallying', court: 'movement',
    setup: 'Player at the centre mark in an athletic ready position. Coach feeds from the opposite service line and calls “split” just before each feed.',
    levels: [
      'Shadow split-steps to a clap — land balanced and wide as the coach’s hand drops.',
      'Split on the feed, touch the fed ball and recover to centre. 10 in a row.',
      'Coach feeds left or right at random — split, move, catch the ball in two hands.',
      'Live mini-rally; the player must visibly split-step before every ball or the point restarts.',
    ], cue: 'Small hop, land wide and low — be moving before the ball is hit, not after.', tags: ['movement','footwork','warm-up'] },
  { id: 'd2', focus: 'Forehand groundstroke — low to high', belt: 'white', category: 'Foundations & rallying', court: 'baseline',
    setup: 'Coach hand-feeds gentle balls to the player’s forehand from a basket at the service line. Player rallies into the open court.',
    levels: [
      'Drop-feed to self, swing low-to-high, finish over the shoulder. 10 reps.',
      'Coach feeds; player hits 8/10 over the net into the singles court.',
      'Add a cross-court target cone; count balls landing past the service line.',
      'Cooperative rally to 8 balls, every forehand finishing high.',
    ], cue: 'Start the racket below the ball and brush up — low to high, finish by your ear.', tags: ['forehand','technique'] },
  { id: 'd3', focus: 'Grips — eastern & continental', belt: 'white', category: 'Foundations & rallying', court: 'baseline',
    setup: 'Mark the eastern (groundstroke) and continental (serve/volley) grips. Player practises finding and swapping grips without looking down.',
    levels: [
      'Coach calls “eastern” / “continental”; player changes grip in under 2 seconds, eyes up.',
      'Shadow a forehand (eastern) then a volley (continental), changing between each.',
      'Coach feeds alternating groundstroke / volley feeds — change grip on the move.',
      'Live transition: rally, then approach and volley, holding the right grip at each stage.',
    ], cue: 'Find the bevel by feel — knuckle on the right edge for the forehand, the hammer grip for volleys.', tags: ['grips','technique','fundamentals'] },
  { id: 'd4', focus: 'Cooperative rally (3–5 balls)', belt: 'white', category: 'Foundations & rallying', court: 'rally',
    setup: 'Player and partner (or coach) rally cooperatively over the net from the service lines, aiming to keep the ball going.',
    levels: [
      'Catch-and-feed — feed, the partner catches and feeds back. Build the rhythm.',
      'Rally and count out loud; reach 3 in a row, then 5.',
      'Step back to the baseline; keep a 5-ball rally going with control.',
      'Co-op challenge — beat your best streak; one shared score for both players.',
    ], cue: 'Aim for the middle of the court a metre over the net — height buys you time.', tags: ['rally','consistency','co-op'] },
  { id: 'd5', focus: 'Two-handed backhand drive', belt: 'yellow', category: 'Foundations & rallying', court: 'baseline',
    setup: 'Feeds to the player’s backhand from the basket. Two hands on the racket, shoulders turned early.',
    levels: [
      'Drop-feed, turn the shoulders, drive low-to-high with both hands. 10 reps.',
      'Coach feeds; 8/10 land in the singles court cross-court.',
      'Alternate forehand / backhand feeds — recover to centre between each.',
      'Backhand cross-court rally to 8, then change one down the line.',
    ], cue: 'Turn both shoulders early, lead with the bottom hand, finish high with the top.', tags: ['backhand','technique'] },
  { id: 'd6', focus: 'Sustained rally — 10+ cross-court', belt: 'yellow', category: 'Foundations & rallying', court: 'rally',
    setup: 'Players rally cross-court only, both aiming past the service line into the deep corner.',
    levels: [
      'Cooperative cross-court forehands — reach 10 without a miss.',
      'Same on the backhand diagonal.',
      'Mix — coach calls “forehand” or “backhand” diagonal each ball.',
      'First pair to 15 cross-court in a row wins; reset to zero on a miss.',
    ], cue: 'Same shape every ball — aim a metre over the net into the back third.', tags: ['rally','consistency','depth'] },
  { id: 'd7', focus: 'Footwork & recovery to centre', belt: 'yellow', category: 'Foundations & rallying', court: 'movement',
    setup: 'Coach feeds wide to alternate corners. Player hits and recovers to a cone at the centre mark each time.',
    levels: [
      'Feed-touch-recover at walking pace; touch the centre cone every time.',
      'Hit the ball back, then side-shuffle to the cone before the next feed.',
      'Random feeds left/right; recover with a split-step at centre.',
      'Live point — coach moves the player, who must recover behind the baseline each shot.',
    ], cue: 'Hit and get back — quick adjusting steps and a split before the next ball.', tags: ['footwork','movement','recovery'] },
  { id: 'd8', focus: 'Ball tracking & timing', belt: 'yellow', category: 'Foundations & rallying', court: 'baseline',
    setup: 'Feeds of varied height and pace. Player calls the bounce and meets clean contact out front.',
    levels: [
      'Player says “bounce” then “hit” out loud on each feed.',
      'Vary the feed height; player adjusts to take it at the top of the bounce.',
      'Coach shouts a colour at the feed; player calls it before hitting.',
      'Live rally with the bounce-hit call kept going throughout.',
    ], cue: 'Watch the ball onto the strings — read the bounce early and meet it out front.', tags: ['timing','tracking','contact'] },

  // ── Net & touch ──
  { id: 'd9', focus: 'Forehand volley — punch & firm wrist', belt: 'orange', category: 'Net & touch', court: 'net',
    setup: 'Player at the service line in a continental grip. Coach feeds soft balls to the forehand volley.',
    levels: [
      'Catch the ball out front in the volley position to feel the contact point.',
      'Punch the volley deep — short backswing, firm wrist. 8/10 in.',
      'Coach feeds quicker; volley to alternating deep corners.',
      'Feed-and-rally — two volleys then a put-away into the open court.',
    ], cue: 'No backswing — meet it out front and punch, keep the wrist firm.', tags: ['volley','net','technique'] },
  { id: 'd10', focus: 'Backhand volley — block forward', belt: 'orange', category: 'Net & touch', court: 'net',
    setup: 'Continental grip, player at the net. Feeds to the backhand volley.',
    levels: [
      'Block-and-catch out front to set the contact point.',
      'Punch deep with a firm wrist; 8/10 land past the service line.',
      'Alternating forehand / backhand volley feeds — turn the shoulders each time.',
      'Reflex volleys — quick hands at the net, keep 6 going.',
    ], cue: 'Shoulder turn, block forward through the ball — short and firm, not a swing.', tags: ['volley','net','technique'] },
  { id: 'd11', focus: 'Backhand slice — stable, low', belt: 'orange', category: 'Net & touch', court: 'baseline',
    setup: 'Feeds to the backhand. Player slices high-to-low with a stable, slightly open face.',
    levels: [
      'Shadow the high-to-low path, then drop-feed slices over the net.',
      'Coach feeds; the slice stays below net-post height past the service line.',
      'Slice cross-court then down the line on call.',
      'Rally where the backhand must be sliced — keep it low and deep.',
    ], cue: 'High to low, hold the face steady — let the ball float and stay low.', tags: ['slice','backhand','touch'] },
  { id: 'd12', focus: 'Net positioning & cutting angles', belt: 'orange', category: 'Net & touch', court: 'net',
    setup: 'Player approaches and closes the net. Coach feeds passes and lobs to test position.',
    levels: [
      'Shadow the split-step at the net after each approach.',
      'Coach feeds a passing ball; player volleys into the open court.',
      'Two-ball pattern — first volley deep, close in, second volley angled away.',
      'Live point from a feed; player must finish at the net within three shots.',
    ], cue: 'Close the net behind your volley — take the ball early and cut off the angle.', tags: ['net','positioning','volley'] },
  { id: 'd13', focus: 'Half-volley pick-up in transition', belt: 'purple', category: 'Net & touch', court: 'net',
    setup: 'Player in no-man’s-land. Coach feeds at the feet to practise the half-volley pick-up.',
    levels: [
      'Soft feeds at the feet; cushion the half-volley back over the net.',
      'Pick-up, then recover forward to a closer position.',
      'Approach, get caught at the feet, half-volley deep, then close.',
      'Live transition point — half-volley once, then finish at the net.',
    ], cue: 'Low and still — short backswing, soft hands, let the racket do the work.', tags: ['half-volley','transition','touch'] },

  // ── Serve & return ──
  { id: 'd14', focus: 'Flat first serve — trophy & pronation', belt: 'green', category: 'Serve & return', court: 'serve',
    setup: 'Player serving from the baseline, target cones in the box. Continental grip throughout.',
    levels: [
      'Trophy-pose checks and toss-and-catch — groove the position.',
      'Serve from the service line, pronate through contact, into the box.',
      'Serve from the baseline; 6/10 first serves in.',
      'Serve + play out the point from your own serve.',
    ], cue: 'Up to the trophy, then drive up and pronate — reach up to the ball, don’t pull down.', tags: ['serve','technique'] },
  { id: 'd15', focus: 'Toss & service rhythm', belt: 'green', category: 'Serve & return', court: 'serve',
    setup: 'Focus on a consistent toss and a smooth, unbroken service motion.',
    levels: [
      'Toss and let it drop onto a target just inside the baseline.',
      'Toss-and-catch ten in a row landing in the same spot.',
      'Full serve with a one-two count — no pause at the trophy.',
      'Serve under a rhythm cue while hitting a target cone.',
    ], cue: 'Place the toss, don’t throw it — smooth tempo, one motion, no hitch.', tags: ['serve','toss','rhythm'] },
  { id: 'd16', focus: 'Return of serve — split & block deep', belt: 'green', category: 'Serve & return', court: 'serve',
    setup: 'Coach serves; the returner splits on contact and blocks the return deep.',
    levels: [
      'Shadow the split-step timed to the coach’s contact.',
      'Block the serve back deep down the middle with a short take-back.',
      'Return cross-court into a target zone.',
      'Return-and-rally — return deep then play the point.',
    ], cue: 'Split as they strike — short, firm block, send it back deep and central.', tags: ['return','serve','reaction'] },
  { id: 'd17', focus: 'Serve placement — wide / body / T', belt: 'green', category: 'Serve & return', court: 'serve',
    setup: 'Cones in the wide, body and T positions of each service box.',
    levels: [
      'Serve only to the T; 5/10 hit the target zone.',
      'Serve only wide; 5/10 in the wide zone.',
      'Coach calls the target before each serve.',
      'Serve + 1 — call the target, serve, then attack the likely reply.',
    ], cue: 'Same toss for every target — disguise it, then aim small.', tags: ['serve','placement','tactics'] },
  { id: 'd18', focus: 'Second serve — reliable kick', belt: 'blue', category: 'Serve & return', court: 'serve',
    setup: 'Develop a high-margin spin second serve that lands in under pressure.',
    levels: [
      'Brush up the back of the ball, exaggerate the spin over the net.',
      'Spin serve clears the net by a metre, lands in the box 7/10.',
      'Second-serve-only points — a double fault loses two.',
      '4-3 game from second serves only; manage the pressure.',
    ], cue: 'Spin first, not pace — high over the net, let it kick down into the box.', tags: ['serve','spin','second-serve'] },
  { id: 'd19', focus: 'Kick serve — heavy topspin', belt: 'brown', category: 'Serve & return', court: 'serve',
    setup: 'Toss slightly over the head; brush up and across for a serve that jumps.',
    levels: [
      '“Throw the racket up at the ball” feeling; brush from 7 to 1 across the ball.',
      'Kick serve clears the net high and lands in, 6/10.',
      'Kick to the backhand corner; make it jump above shoulder height.',
      'Kick second serve in points — earn a weak reply to attack.',
    ], cue: 'Toss over your head, brush up the back and across — finish on the same side.', tags: ['serve','kick','spin'] },
  { id: 'd20', focus: 'Slice serve — curve it wide', belt: 'brown', category: 'Serve & return', court: 'serve',
    setup: 'Continental grip; hit around the outside of the ball to curve it.',
    levels: [
      'Side-spin feeds — brush the outside of the ball, watch the curve.',
      'Slice serve out wide in the deuce court, pulling the returner off court.',
      'Mix slice-wide and body-jam serves on call.',
      'Slice-serve + 1 — open the court wide, attack the open side.',
    ], cue: 'Hit the 3 o’clock of the ball — carve around it and let it swing wide.', tags: ['serve','slice','placement'] },

  // ── Spin & shape ──
  { id: 'd21', focus: 'Topspin forehand — brush up & clear', belt: 'blue', category: 'Spin & shape', court: 'baseline',
    setup: 'Build heavy topspin with big net clearance and depth.',
    levels: [
      'Drop-feed, brush up sharply, exaggerate the clearance.',
      'Coach feeds; 8/10 land past the service line with shape.',
      'Aim a metre over the net into the deep cross-court zone.',
      'Topspin rally — keep it heavy and deep, change direction on a short ball.',
    ], cue: 'Low to high, brush up the back — heavy net clearance, let the spin bring it down.', tags: ['forehand','spin','depth'] },
  { id: 'd22', focus: 'Topspin backhand — drive with shape', belt: 'blue', category: 'Spin & shape', court: 'baseline',
    setup: 'Topspin backhand (one or two-handed) with depth and shape.',
    levels: [
      'Shadow then drop-feed the low-to-high drive.',
      'Coach feeds; 8/10 deep cross-court with clearance.',
      'Backhand line then cross-court on call.',
      'Backhand rally with shape — heavy and deep to 8.',
    ], cue: 'Drive up through the ball — finish high, keep the depth.', tags: ['backhand','spin','depth'] },
  { id: 'd23', focus: 'Depth & heavy ball — back third', belt: 'blue', category: 'Spin & shape', court: 'baseline',
    setup: 'Throw-down line across the court a metre inside the baseline; aim every ball beyond it.',
    levels: [
      'Co-op rally; count balls that land in the back third.',
      'First to 10 in the back third wins.',
      'Both players must land in the back third or lose the point.',
      'Live points where short balls inside the line must be attacked.',
    ], cue: 'Net clearance is depth — aim high and heavy into the back third.', tags: ['depth','consistency','spin'] },
  { id: 'd24', focus: 'Net clearance & margin', belt: 'blue', category: 'Spin & shape', court: 'rally',
    setup: 'Raise a rope or band a metre above the net; players must clear it.',
    levels: [
      'Co-op rally clearing the high line every ball.',
      'Count consecutive balls over the high line.',
      'Points where a ball under the line loses.',
      'Pressure rally — keep margin on every ball while moving.',
    ], cue: 'Aim well over the net — margin first, the spin keeps it in.', tags: ['margin','consistency','spin'] },

  // ── Specialty shots ──
  { id: 'd25', focus: 'Overhead smash — turn & finish', belt: 'purple', category: 'Specialty shots', court: 'net',
    setup: 'Coach lobs to the net player; turn sideways and finish the smash.',
    levels: [
      'Point-and-track lobs without hitting; turn and shuffle under the ball.',
      'Smash deep feeds into the open court, 7/10 in.',
      'Smash to a called corner.',
      'Lob-smash-lob rally — recover and finish under pressure.',
    ], cue: 'Turn sideways, point at the ball, reach up and finish — like a serve.', tags: ['overhead','net','finishing'] },
  { id: 'd26', focus: 'Drop shot — disguised touch', belt: 'purple', category: 'Specialty shots', court: 'target',
    setup: 'Short target zone just over the net on each side. Disguise the drop off a groundstroke shape.',
    levels: [
      'Feel-feeds — float the ball softly into the short zone.',
      'Drop from a feed; land it in the short zone 6/10.',
      'Disguise it — same prep as a drive, then drop.',
      'Live point — earn a short ball, drop, then close for the next.',
    ], cue: 'Same backswing as a drive — soft hands, open face, let it die short.', tags: ['drop-shot','touch','disguise'] },
  { id: 'd27', focus: 'Lob — offensive & defensive', belt: 'purple', category: 'Specialty shots', court: 'target',
    setup: 'Mark a deep zone behind the service line. Practise the high defensive lob and the offensive topspin lob.',
    levels: [
      'Defensive lob — high and deep over a net player from a feed.',
      'Offensive topspin lob over the net player into the deep zone.',
      'Coach calls “defend” or “attack”; choose the right lob.',
      'Live — the net player attacks, the baseliner mixes pass and lob.',
    ], cue: 'Defensive: high and deep to reset. Offensive: brush up, over their reach.', tags: ['lob','defence','specialty'] },
  { id: 'd28', focus: 'Inside-out forehand — run around BH', belt: 'brown', category: 'Specialty shots', court: 'baseline',
    setup: 'Feeds to the backhand corner; the player runs around to hit the forehand inside-out.',
    levels: [
      'Shadow the cross-step around the backhand into an open stance.',
      'Run-around forehand inside-out to the deep ad corner, 6/10.',
      'Inside-out then inside-in on call.',
      'Live — build the point to create the run-around forehand.',
    ], cue: 'Get round it early — open stance, hit inside-out into the open court.', tags: ['forehand','patterns','weapons'] },
  { id: 'd29', focus: 'Approach & transition off short balls', belt: 'brown', category: 'Specialty shots', court: 'baseline',
    setup: 'Coach feeds a short ball; the player approaches and closes the net.',
    levels: [
      'Approach deep down the line off a short feed, then split at the net.',
      'Approach + first volley into the open court.',
      'Read the short ball — approach down the line, cover the pass.',
      'Live point — must approach the first short ball and finish at the net.',
    ], cue: 'Down-the-line approach, deep and through — then close behind it and split.', tags: ['approach','transition','net'] },

  // ── Tactics & match play ──
  { id: 'd30', focus: 'Point construction — open & finish', belt: 'red', category: 'Tactics & match play', court: 'fullcourt',
    setup: 'Build points with a purpose — move the opponent, open the court, finish the right ball.',
    levels: [
      'Three-ball pattern: deep, wide, finish — to targets, no opponent.',
      'Co-op until a short ball appears, then finish to the open court.',
      'Live points where you must hit two corners before finishing.',
      'Full points scored — bonus for finishing off a constructed opening.',
    ], cue: 'Deep gets you neutral, wide opens the court, then finish the short ball.', tags: ['tactics','construction','patterns'] },
  { id: 'd31', focus: 'Pattern play — serve+1 / return+1', belt: 'red', category: 'Tactics & match play', court: 'fullcourt',
    setup: 'Drill the first-strike patterns: serve then the next forehand, return then the next ball.',
    levels: [
      'Serve wide + forehand into the open court (shadow, then live feed).',
      'Serve+1 to targets, both deuce and ad.',
      'Return+1 — block deep, then attack the next short ball.',
      'Points starting from serve; score double for executing the pattern.',
    ], cue: 'Serve to open the court, then the +1 forehand finishes it — know it before you serve.', tags: ['patterns','serve+1','tactics'] },
  { id: 'd32', focus: 'Disguise & variation — spin/pace/height', belt: 'red', category: 'Tactics & match play', court: 'fullcourt',
    setup: 'Mix the ball — change spin, pace and height to break the opponent’s rhythm.',
    levels: [
      'Rally alternating a heavy topspin ball then a slice.',
      'On call, change pace or height mid-rally.',
      'Points where you must use two different balls before finishing.',
      'Live — reward variation that forces the error.',
    ], cue: 'Don’t give the same ball twice — change the picture, take their timing away.', tags: ['variation','disguise','tactics'] },
  { id: 'd33', focus: 'Reading opponents — spot weaknesses', belt: 'red', category: 'Tactics & match play', court: 'fullcourt',
    setup: 'Scout live — find the weaker side and the patterns the opponent dislikes.',
    levels: [
      'Rally and report which wing is weaker.',
      'Play five points attacking only the weaker side.',
      'Test patterns — does the backhand break down under pace or under spin?',
      'Match-play set targeting the identified weakness.',
    ], cue: 'Probe early — find the weaker wing and the uncomfortable ball, then go there on the big points.', tags: ['scouting','tactics','match-play'] },
  { id: 'd34', focus: 'Match management — score & momentum', belt: 'black', category: 'Tactics & match play', court: 'fullcourt',
    setup: 'Play scenarios that train smart score and momentum decisions.',
    levels: [
      'Discuss high-percentage choices at 30-30, 40-30 and break point.',
      'Play from 30-30 each point; choose the right risk.',
      'Play a game from 0-30 down — claw it back.',
      'Tie-break focus — one big point at a time, reset between.',
    ], cue: 'Play the score, not the moment — big points, high-percentage tennis.', tags: ['match-management','mental','tactics'] },
  { id: 'd35', focus: 'In-match adaptation — change the plan', belt: 'black', category: 'Tactics & match play', court: 'fullcourt',
    setup: 'A losing plan must change — train the in-match adjustment.',
    levels: [
      'Name a plan, play three points, then change one thing.',
      'Down a break, switch tactics (target, spin, court position).',
      'Coach freezes a point and asks “what now?” — adjust live.',
      'Sets where you must change plan if two games slip.',
    ], cue: 'If it’s not working, change something — court position, target, or the ball you give.', tags: ['adaptation','tactics','problem-solving'] },
  { id: 'd36', focus: 'Closing out matches — serve it out', belt: 'black', category: 'Tactics & match play', court: 'fullcourt',
    setup: 'Serving for the set — train the nerve and routine to finish.',
    levels: [
      'Serve a game from 40-0 up; hold focus to the end.',
      'Serve out from 30-0; first-serve discipline.',
      'Serve for the set from 0-0, every game.',
      'Serve out under fatigue after a movement set.',
    ], cue: 'Trust your routine — first serve in, play the patterns that got you here.', tags: ['closing','serve','mental'] },

  // ── Movement & mindset ──
  { id: 'd37', focus: 'Court movement & agility', belt: 'yellow', category: 'Movement & mindset', court: 'movement',
    setup: 'Cone pattern around the court for first-step speed and recovery.',
    levels: [
      'Spider run to five cones at three-quarter pace.',
      'Split-step then explode to a called cone and back.',
      'Feed-and-move — hit, recover, react to the next call.',
      'Live point with a movement focus — visible recovery every ball.',
    ], cue: 'First step is everything — split, push off the outside foot, recover hard.', tags: ['movement','agility','footwork'] },
  { id: 'd38', focus: 'Speed & change of direction', belt: 'green', category: 'Movement & mindset', court: 'movement',
    setup: 'Short shuttle and reaction work for explosive direction changes.',
    levels: [
      '5-metre shuttles — plant and drive back.',
      'React to a hand signal — go left or right.',
      'Side-shuffle, plant, sprint to a cone on call.',
      'Movement game — touch the called cone before the coach counts to three.',
    ], cue: 'Low and balanced into the turn — plant the outside foot and explode out.', tags: ['speed','agility','conditioning'] },
  { id: 'd39', focus: 'Match-play fitness & recovery', belt: 'red', category: 'Movement & mindset', court: 'movement',
    setup: 'Point-based conditioning — play out demanding patterns with short recovery.',
    levels: [
      '6-ball side-to-side feeds, 20s rest, repeat ×4.',
      'Two-corner rally for 30s, walk-back recovery.',
      'Live points with a minimum rally length before they count.',
      'Three games back-to-back; manage breathing between points.',
    ], cue: 'Recover between points like a match — breathe, walk, reset, go again.', tags: ['fitness','conditioning','recovery'] },
  { id: 'd40', focus: 'Pressure & mental routines', belt: 'black', category: 'Movement & mindset', court: 'fullcourt',
    setup: 'Build a repeatable between-points routine that holds under pressure.',
    levels: [
      'Practise the reset routine after every feed (respond-relax-refocus-ready).',
      'Add a trigger word before each serve and return.',
      'Play points running the full routine between each.',
      'Pressure game — one routine slip loses the point.',
    ], cue: 'Same routine every point — breath, trigger word, then commit.', tags: ['mental','routines','pressure'] },
]

// ─── Coach AI brief ─────────────────────────────────────────────────────────
export type CoachBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const COACH_AI_BRIEF: CoachBriefItem[] = [
  { tag: 'rackets',   pri: 'high', txt: 'Mia Chen is one good serving session from her Green racket — book a racket assessment this week.' },
  { tag: 'retention', pri: 'high', txt: 'Hannah Berg has missed 2 of the last 4 sessions and her trend is down. Suggest a check-in with parents.' },
  { tag: 'schedule',  pri: 'med',  txt: '7 sessions today (09:00–19:00). Court 3 double-booked risk at 18:00 — confirm with desk.' },
  { tag: 'payments',  pri: 'med',  txt: '3 lesson packages expire this month; 2 players have an outstanding balance.' },
  { tag: 'progress',  pri: 'low',  txt: 'Performance squad serve-percentage up 6pp over 4 weeks — share the win with players.' },
]

// ─── Messages / comms ───────────────────────────────────────────────────────
export type CoachMessage = { from: string; role: string; last: string; time: string; unread: number; urgent: boolean }

export const COACH_MESSAGES: CoachMessage[] = [
  { from: 'Grace Okafor', role: 'Parent · Tom',     last: 'Tom loved the serve session — can we add a Saturday slot?', time: '07:48', unread: 1, urgent: false },
  { from: 'Mark Berg',    role: 'Parent · Hannah',  last: 'Sorry we missed Tuesday — back this week.',                 time: '07:20', unread: 2, urgent: true  },
  { from: 'Riverside Desk', role: 'Venue',          last: 'Court 3 maintenance moved to Friday AM.',                  time: 'Yesterday', unread: 1, urgent: true },
  { from: 'Daniel Cruz',  role: 'Player',           last: 'Confirmed for match play at 18:00 👍',                     time: 'Yesterday', unread: 0, urgent: false },
  { from: 'Lily Chen',    role: 'Parent · Mia',     last: 'So excited about the racket assessment!',                    time: 'Yesterday', unread: 0, urgent: false },
  { from: 'Adult Group',  role: 'Group · 6 players', last: 'Anyone for an extra Sunday hit?',                         time: 'Tue',       unread: 0, urgent: false },
]

// ─── Payments / packages ────────────────────────────────────────────────────
export type Package = { id: string; player: string; plan: string; used: number; total: number; status: 'active' | 'expiring' | 'overdue'; renews: string }

export const PACKAGES: Package[] = [
  { id: 'pk-tom',    player: 'Tom Okafor',     plan: '10-lesson private pack', used: 7,  total: 10, status: 'active',   renews: '12 Jul' },
  { id: 'pk-mia',    player: 'Mia Chen',       plan: '10-lesson private pack', used: 9,  total: 10, status: 'expiring', renews: '20 Jun' },
  { id: 'pk-leo',    player: 'Leo Whitfield',  plan: 'Performance monthly',    used: 6,  total: 12, status: 'active',   renews: '01 Jul' },
  { id: 'pk-hannah', player: 'Hannah Berg',    plan: '5-lesson private pack',  used: 5,  total: 5,  status: 'overdue',  renews: '—'      },
  { id: 'pk-priya',  player: 'Priya Patel',    plan: 'Adult 8-lesson block',   used: 3,  total: 8,  status: 'active',   renews: '15 Aug' },
  { id: 'pk-daniel', player: 'Daniel Cruz',    plan: 'Performance monthly',    used: 9,  total: 12, status: 'active',   renews: '01 Jul' },
]

export const PAY_SUMMARY = { mtd: 4280, outstanding: 340, packagesActive: 28, expiringSoon: 3 }

// ─── Packages on offer (the coach's price list) ─────────────────────────────
export type PackageOffer = {
  id: string
  name: string
  type: 'Private' | 'Group' | 'Performance' | 'Adult' | 'Junior' | 'Cardio'
  sessions: number
  price: number
  per: 'pack' | 'month' | 'term'
  desc: string
  includes: string[]
}

export const PACKAGE_OFFERS: PackageOffer[] = [
  { id: 'of-priv10', name: '10-lesson private pack', type: 'Private', sessions: 10, price: 360, per: 'pack',
    desc: 'Ten 1-hour private lessons — best value for committed players.',
    includes: ['10 × 60-min private lessons', 'Racket progress tracking', 'Lesson summary after each session', 'Saves £20 vs pay-as-you-go'] },
  { id: 'of-priv5', name: '5-lesson private pack', type: 'Private', sessions: 5, price: 185, per: 'pack',
    desc: 'A five-lesson block to get started or work on a specific goal.',
    includes: ['5 × 60-min private lessons', 'Starting racket assessment', 'Lesson summaries', 'Flexible scheduling'] },
  { id: 'of-perf', name: 'Performance monthly', type: 'Performance', sessions: 12, price: 240, per: 'month',
    desc: 'Intensive monthly programme for competitive junior players.',
    includes: ['12 sessions per month', 'Match-play & tactical work', 'Fitness & movement block', 'Tournament planning'] },
  { id: 'of-adult8', name: 'Adult 8-lesson block', type: 'Adult', sessions: 8, price: 280, per: 'pack',
    desc: 'Eight lessons for adult improvers — technique and match craft.',
    includes: ['8 × 60-min lessons', 'Cardio & rally fitness option', 'Doubles tactics', 'Evening slots available'] },
  { id: 'of-group', name: 'Junior group — term', type: 'Group', sessions: 10, price: 150, per: 'term',
    desc: 'Weekly small-group coaching across a 10-week term.',
    includes: ['10 weekly group sessions', 'Max 6 players per court', 'Racket pathway curriculum', 'End-of-term report'] },
  { id: 'of-cardio', name: 'Cardio tennis — 6 pack', type: 'Cardio', sessions: 6, price: 60, per: 'pack',
    desc: 'High-energy, music-led tennis fitness — all levels welcome.',
    includes: ['6 × 45-min cardio sessions', 'All abilities', 'No booking needed — just turn up', 'Great for fitness'] },
]

// ─── Today's sessions (dashboard timeline) ──────────────────────────────────
export type CoachScheduleItem = { t: string; what: string; where: string; type: string; highlight?: boolean }

// Today's coaching sessions — the source for the Session Planner.
export type TodaySession = {
  id: string; time: string; end: string; player: string; playerId?: string
  type: 'Private' | 'Group' | 'Cardio' | 'Match play' | 'Mini / red ball'
  court: string; mins: number; focus: string; status: 'done' | 'now' | 'upcoming'
  date: string              // 'YYYY-MM-DD' — the day this session runs
  bookingId?: string        // the confirmed booking this session traces back to
  coachId?: string          // the coach running it (from the booking; defaults to the head)
  focusPoints?: string[]; drills?: string[]   // set when created via "New session"
}

// Internal seed for today's sessions. Preserves the demo content (focus, status,
// drills) AND the ts1–ts6 ids the AI Session Review (DEMO_REVIEWS) is keyed by.
// Bookings are the schedule source of truth; this seed only enriches the derived
// list below — it is not a parallel schedule.
const TODAY_SESSION_SEED: Omit<TodaySession, 'date' | 'bookingId'>[] = [
  { id: 'ts1', time: '09:00', end: '09:45', player: 'Mia Chen',     playerId: 'p1', type: 'Private',    court: 'Court 1', mins: 45, focus: 'First serve fundamentals', status: 'done' },
  { id: 'ts2', time: '10:30', end: '11:30', player: 'Tom Okafor',   playerId: 'p2', type: 'Private',    court: 'Court 2', mins: 60, focus: 'Second serve into serve+1 patterns', status: 'now' },
  { id: 'ts3', time: '12:00', end: '13:00', player: 'Junior Squad (6)',              type: 'Group',      court: 'Court 1', mins: 60, focus: 'Rally tolerance & match games', status: 'upcoming' },
  { id: 'ts4', time: '16:00', end: '16:45', player: 'Ava Romero',   playerId: 'p3', type: 'Private',    court: 'Court 3', mins: 45, focus: 'Rally control — 10-ball target', status: 'upcoming' },
  { id: 'ts5', time: '17:00', end: '18:00', player: 'Cardio Tennis (8)',            type: 'Cardio',     court: 'Court 4', mins: 60, focus: 'High-tempo fitness & live games', status: 'upcoming' },
  { id: 'ts6', time: '18:00', end: '19:15', player: 'Daniel Cruz',  playerId: 'p6', type: 'Match play', court: 'Court 3', mins: 75, focus: 'Competitive sets — serve+1 patterns', status: 'upcoming' },
]

// The confirmed booking a seed session traces back to: same date (today), same
// start time, and the booking's player name matches or is a prefix of the
// session's (bookings say 'Junior Squad'; the session shows 'Junior Squad (6)').
function bookingForSession(s: { time: string; player: string }): Booking | undefined {
  return BOOKINGS.find(b =>
    b.date === TODAY && b.status === 'confirmed' && b.start === s.time &&
    (b.player === s.player || s.player.startsWith(b.player)))
}

// Today's sessions — the source for the Session Planner. Derived from the dated
// schedule: each carries a real date and links to its booking where one exists
// (the 17:00 Cardio session has no Thursday booking, so its bookingId is unset).
export const TODAY_SESSIONS: TodaySession[] = TODAY_SESSION_SEED.map(s => ({
  ...s, date: TODAY, bookingId: bookingForSession(s)?.id, coachId: bookingForSession(s)?.coachId ?? 'pete',
}))

export const COACH_TODAY: CoachScheduleItem[] = [
  { t: '08:00', what: 'Court setup & planning',        where: 'Courts 1–3', type: 'Admin' },
  { t: '09:00', what: 'Mia Chen — first serve',        where: 'Court 1',    type: 'Private', highlight: true },
  { t: '10:30', what: 'Tom Okafor — serve+1 patterns', where: 'Court 2',    type: 'Private' },
  { t: '12:00', what: 'Junior Squad (6)',              where: 'Court 1',    type: 'Group' },
  { t: '16:00', what: 'Ava Romero — rally control',    where: 'Court 3',    type: 'Private' },
  { t: '17:00', what: 'Racket assessment prep',        where: 'Office',     type: 'Admin' },
  { t: '18:00', what: 'Daniel Cruz — match play',      where: 'Court 3',    type: 'Match' },
]

// ─── Sidebar nav ────────────────────────────────────────────────────────────
export type CoachNavItem = { id: string; label: string; icon: string; group: string; badge?: string }

export const COACH_SIDEBAR: CoachNavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',          icon: 'home',         group: 'COACHING' },
  { id: 'planner',     label: 'Session Planner',    icon: 'flag',         group: 'COACHING' },
  { id: 'lessons',     label: 'Lesson Summaries',   icon: 'note',         group: 'COACHING' },
  { id: 'development', label: 'Player Development',  icon: 'arrow-up-right', group: 'COACHING' },
  { id: 'belts',       label: 'Racket Progression', icon: 'trophy',       group: 'COACHING', badge: 'NEW' },
  { id: 'calendar',    label: 'Booking Calendar',   icon: 'calendar',     group: 'SCHEDULE' },
  { id: 'venues',      label: 'Court Planner',      icon: 'pin',          group: 'SCHEDULE', badge: 'NEW' },
  { id: 'camps',       label: 'Training Camps',     icon: 'plane',        group: 'SCHEDULE', badge: 'NEW' },
  { id: 'roster',      label: 'Player Roster',      icon: 'people',       group: 'PLAYERS' },
  { id: 'messages',    label: 'Messages',           icon: 'megaphone',    group: 'PLAYERS' },
  { id: 'gpsvideo',    label: 'GPS & Video',        icon: 'crosshair',    group: 'PERFORMANCE', badge: 'NEW' },
  { id: 'equipment',   label: 'Equipment & Kit',    icon: 'wrench',       group: 'RESOURCES', badge: 'NEW' },
  { id: 'resources',   label: 'Resource Centre',    icon: 'grid',         group: 'RESOURCES', badge: 'NEW' },
  { id: 'payments',    label: 'Payments & Packs',   icon: 'pound',        group: 'BUSINESS' },
  { id: 'settings',    label: 'Settings',           icon: 'settings',     group: 'SETTINGS' },
]

export const COACH_GROUPS = ['COACHING', 'SCHEDULE', 'PLAYERS', 'PERFORMANCE', 'RESOURCES', 'BUSINESS', 'SETTINGS']

export const COACH_ACCENT = { hex: '#a855f7', dim: 'rgba(168,85,247,0.16)', border: 'rgba(168,85,247,0.45)' }

// ════════════════════════════════════════════════════════════════════════════
// TRAINING CAMP  (14-day paid camps in Spain / Portugal)
// ════════════════════════════════════════════════════════════════════════════
export type Camp = {
  id: string
  name: string
  country: 'Portugal' | 'Spain'
  location: string
  resort: string
  flag: string
  start: string             // display date
  end: string
  days: number
  status: 'upcoming' | 'in-progress' | 'completed'
  capacity: number
  booked: number
  pricePerHead: number      // GBP, full board + coaching
  deposit: number
  surfaces: string
  courts: number
  summary: string
}

export const CAMPS: Camp[] = [
  {
    id: 'camp-algarve', name: 'Algarve Performance Camp', country: 'Portugal', location: 'Algarve', resort: 'Vale do Lobo Tennis Academy', flag: '🇵🇹',
    start: '6 Jul 2026', end: '19 Jul 2026', days: 14, status: 'upcoming', capacity: 16, booked: 13,
    pricePerHead: 1850, deposit: 400, surfaces: 'Clay & hard', courts: 6,
    summary: '14-day performance camp on Algarve clay. Two on-court sessions a day, video review, fitness and a match-play ladder, with full board at the resort.',
  },
  {
    id: 'camp-costabrava', name: 'Costa Brava Junior Camp', country: 'Spain', location: 'Costa Brava', resort: 'Club Tennis Llafranc', flag: '🇪🇸',
    start: '3 Aug 2026', end: '16 Aug 2026', days: 14, status: 'upcoming', capacity: 20, booked: 9,
    pricePerHead: 1650, deposit: 350, surfaces: 'Clay', courts: 8,
    summary: 'Junior development camp for red→green ball players. Skills, games and a racket-assessment week, with parents accommodated nearby.',
  },
  {
    id: 'camp-marbella', name: 'Marbella Pre-Season Camp', country: 'Spain', location: 'Marbella', resort: 'Manolo Santana Racquets Club', flag: '🇪🇸',
    start: '12 Jan 2026', end: '25 Jan 2026', days: 14, status: 'completed', capacity: 14, booked: 14,
    pricePerHead: 1950, deposit: 400, surfaces: 'Clay & hard', courts: 10,
    summary: 'Sold-out pre-season block. Heavy fitness base, serve overhaul and 90 competitive sets per player across the fortnight.',
  },
]

export type CampAttendee = {
  campId: string
  name: string
  initials: string
  age: number
  beltIndex: number
  payment: 'paid' | 'deposit' | 'unpaid'
  balance: number          // outstanding GBP
  room: string
  arrival: string
  dietary?: string
  goal: string
}

export const CAMP_ATTENDEES: CampAttendee[] = [
  // Algarve (13 booked — list a representative set)
  { campId: 'camp-algarve', name: 'Tom Okafor',     initials: 'TO', age: 12, beltIndex: 4, payment: 'paid',    balance: 0,    room: 'Villa 2 · twin', arrival: '6 Jul · 14:20 FAO', dietary: 'None',          goal: 'Kick second serve under pressure' },
  { campId: 'camp-algarve', name: 'Leo Whitfield',  initials: 'LW', age: 14, beltIndex: 6, payment: 'paid',    balance: 0,    room: 'Villa 2 · twin', arrival: '6 Jul · 14:20 FAO', dietary: 'None',          goal: 'Serve+1 forehand patterns vs better players' },
  { campId: 'camp-algarve', name: 'Daniel Cruz',    initials: 'DC', age: 16, beltIndex: 7, payment: 'paid',    balance: 0,    room: 'Villa 3 · single',arrival: '6 Jul · 11:05 FAO', dietary: 'Lactose-free',  goal: 'Win the camp match-play ladder' },
  { campId: 'camp-algarve', name: 'Hannah Berg',    initials: 'HB', age: 11, beltIndex: 3, payment: 'deposit', balance: 1450, room: 'Villa 1 · twin', arrival: '6 Jul · 16:40 FAO', dietary: 'Vegetarian',    goal: 'Add topspin shape under match pressure' },
  { campId: 'camp-algarve', name: 'Sofia Marin',    initials: 'SM', age: 13, beltIndex: 5, payment: 'deposit', balance: 1450, room: 'Villa 1 · twin', arrival: '6 Jul · 09:30 FAO', dietary: 'None',          goal: 'Heavier ball, more depth' },
  { campId: 'camp-algarve', name: 'Jack Donnelly',  initials: 'JD', age: 15, beltIndex: 6, payment: 'paid',    balance: 0,    room: 'Villa 3 · single',arrival: '6 Jul · 11:05 FAO', dietary: 'Nut allergy',   goal: 'Net game & transition' },
  { campId: 'camp-algarve', name: 'Amelia Stone',   initials: 'AS', age: 12, beltIndex: 4, payment: 'paid',    balance: 0,    room: 'Villa 1 · twin', arrival: '6 Jul · 14:20 FAO', dietary: 'None',          goal: 'Consistent first serve %' },
  { campId: 'camp-algarve', name: 'Noah Pereira',   initials: 'NP', age: 14, beltIndex: 5, payment: 'unpaid',  balance: 1850, room: 'TBC',             arrival: 'TBC',               dietary: 'None',          goal: 'Compete without rushing points' },
  // Costa Brava (sample)
  { campId: 'camp-costabrava', name: 'Mia Chen',     initials: 'MC', age: 9,  beltIndex: 2, payment: 'paid',    balance: 0,    room: 'Family room', arrival: '3 Aug · BCN',       dietary: 'None',          goal: 'First green-ball matches' },
  { campId: 'camp-costabrava', name: 'James Whitlock',initials: 'JW',age: 10, beltIndex: 2, payment: 'deposit', balance: 1300, room: 'Family room', arrival: '3 Aug · BCN',       dietary: 'None',          goal: 'Backhand volley & net play' },
  { campId: 'camp-costabrava', name: 'Ava Romero',   initials: 'AR', age: 8,  beltIndex: 1, payment: 'paid',    balance: 0,    room: 'Family room', arrival: '3 Aug · GRO',       dietary: 'Vegetarian',    goal: 'Rally 10 balls in a game' },
]

export const CAMP_TARGETS: Record<string, { group: string[]; outcomes: string[] }> = {
  'camp-algarve': {
    group: [
      'Every attendee adds one new serve variation (kick or slice) to match play',
      'Two filmed video reviews per player — serve and a rally pattern',
      'Complete the 14-day match-play ladder (min. 30 competitive sets each)',
      'Build a heavy clay-court ball: depth target hit-rate up 15%',
    ],
    outcomes: [
      'Player development report emailed to each parent on day 14',
      'Racket re-assessment for any player who meets the criteria',
      'Personal off-season plan for the 4 weeks after camp',
    ],
  },
  'camp-costabrava': {
    group: [
      'All red-ball players progress to orange-ball criteria',
      'Each junior plays in the end-of-camp mini-tournament',
      'Daily skills awards to keep motivation high',
    ],
    outcomes: [
      'Racket assessment day on day 12',
      'Parent showcase session on the final morning',
    ],
  },
  'camp-marbella': {
    group: [
      'Serve overhaul completed and bedded into match play',
      'Aerobic base block — 14 days of fitness logged',
      '90 competitive sets per player',
    ],
    outcomes: ['Pre-season report delivered', 'Fitness benchmarks recorded for the season'],
  },
}

// 14-day itinerary built from day themes + a consistent AM/PM/EVE rhythm.
export type CampSession = { slot: 'AM' | 'PM' | 'EVE'; time: string; title: string; type: string; where: string }
export type CampDay = { day: number; date: string; theme: string; rest?: boolean; sessions: CampSession[] }

const ALGARVE_DAY_THEMES = [
  'Arrival & assessment', 'Serve foundations', 'Return & rally tolerance', 'Forehand patterns',
  'Backhand & slice', 'Net game & transition', 'Recovery & culture day', 'Serve variations',
  'Point construction', 'Defence to offence', 'Match-play ladder I', 'Match-play ladder II',
  'Pressure & tie-breaks', 'Finals, reviews & departure',
]

export function buildCampItinerary(startDay = 6, month = 'Jul'): CampDay[] {
  return ALGARVE_DAY_THEMES.map((theme, i) => {
    const day = i + 1
    const date = `${startDay + i} ${month}`
    const rest = day === 7
    if (rest) {
      return { day, date, theme, rest: true, sessions: [
        { slot: 'AM', time: '—',     title: 'Rest / optional pool recovery', type: 'Recovery', where: 'Resort' },
        { slot: 'PM', time: '14:00', title: 'Excursion — coastal walk',       type: 'Culture',  where: 'Off-site' },
        { slot: 'EVE',time: '20:00', title: 'Group dinner & week-1 awards',    type: 'Social',   where: 'Resort restaurant' },
      ] }
    }
    if (day === 1) {
      return { day, date, theme, sessions: [
        { slot: 'AM', time: '—',     title: 'Airport transfers & check-in',         type: 'Logistics', where: 'FAO → resort' },
        { slot: 'PM', time: '16:00', title: 'Baseline assessment & hit',            type: 'Technical', where: 'Courts 1–4' },
        { slot: 'EVE',time: '19:30', title: 'Welcome briefing & goal-setting',      type: 'Briefing',  where: 'Clubhouse' },
      ] }
    }
    if (day === 14) {
      return { day, date, theme, sessions: [
        { slot: 'AM', time: '09:00', title: 'Ladder finals & racket assessments',   type: 'Match play', where: 'Centre court' },
        { slot: 'PM', time: '13:00', title: '1:1 reviews & off-season plans',        type: 'Review',     where: 'Clubhouse' },
        { slot: 'EVE',time: '16:00', title: 'Departures & transfers',                type: 'Logistics',  where: 'Resort → FAO' },
      ] }
    }
    // Standard training day
    return { day, date, theme, sessions: [
      { slot: 'AM', time: '08:30', title: `Technical — ${theme.toLowerCase()}`, type: 'Technical', where: 'Courts 1–4' },
      { slot: 'PM', time: '15:30', title: day >= 11 ? 'Match-play ladder rounds' : 'Tactical drills & live points', type: day >= 11 ? 'Match play' : 'Tactical', where: 'Courts 1–6' },
      { slot: 'EVE',time: '18:30', title: day % 2 === 0 ? 'Video review & analysis' : 'Fitness & mobility', type: day % 2 === 0 ? 'Video' : 'Fitness', where: day % 2 === 0 ? 'Clubhouse' : 'Gym / track' },
    ] }
  })
}

// ─── Camp equipment / kit list ──────────────────────────────────────────────
export type EquipItem = { name: string; qty: string; status: 'ready' | 'order' | 'check'; note?: string }
export type EquipCategory = { category: string; icon: string; items: EquipItem[] }

export const CAMP_EQUIPMENT: EquipCategory[] = [
  { category: 'On-court coaching', icon: 'flag', items: [
    { name: 'Ball hoppers / baskets',     qty: '×6',      status: 'ready' },
    { name: 'Coaching balls — Yellow',    qty: '20 dozen', status: 'ready' },
    { name: 'Coaching balls — Green',     qty: '8 dozen',  status: 'ready' },
    { name: 'Coaching balls — Orange/Red', qty: '6 dozen', status: 'check', note: 'For any younger campers' },
    { name: 'Throw-down lines',           qty: '×4 sets', status: 'ready' },
    { name: 'Target cones',               qty: '×40',     status: 'ready' },
    { name: 'Agility ladders',            qty: '×4',      status: 'ready' },
    { name: 'Mini-nets',                  qty: '×4',      status: 'order', note: '2 damaged last camp' },
  ]},
  { category: 'Ball machine & power', icon: 'crosshair', items: [
    { name: 'Ball machine',               qty: '×2',      status: 'ready' },
    { name: 'Remote + spare batteries',   qty: '×2',      status: 'check' },
    { name: 'Extension leads (outdoor)',  qty: '×3',      status: 'ready' },
    { name: 'Machine ball stock',         qty: '4 dozen', status: 'ready' },
  ]},
  { category: 'Tech & video', icon: 'play', items: [
    { name: 'Camera + tripod',            qty: '×2',      status: 'ready' },
    { name: 'Tablet (instant replay)',    qty: '×3',      status: 'ready' },
    { name: 'Charging hub + cables',      qty: '×1',      status: 'check' },
    { name: 'SD cards / storage',         qty: '×6',      status: 'ready' },
  ]},
  { category: 'Medical & welfare', icon: 'medical', items: [
    { name: 'First aid kit',              qty: '×2',      status: 'ready' },
    { name: 'Ice packs + cool box',       qty: '×1',      status: 'ready' },
    { name: 'Sunscreen SPF50',            qty: '×6',      status: 'order' },
    { name: 'Electrolytes / hydration',   qty: '60 sachets', status: 'order' },
    { name: 'Water station + cups',       qty: '×2',      status: 'ready' },
  ]},
  { category: 'Player welcome pack', icon: 'trophy', items: [
    { name: 'Camp t-shirt',               qty: 'per camper', status: 'order', note: 'Confirm sizes from booking form' },
    { name: 'Lumio water bottle',         qty: 'per camper', status: 'ready' },
    { name: 'Drawstring bag',             qty: 'per camper', status: 'ready' },
    { name: 'Welcome booklet + schedule', qty: 'per camper', status: 'check' },
    { name: 'Wristband / lanyard',        qty: 'per camper', status: 'ready' },
  ]},
  { category: 'Admin & shade', icon: 'note', items: [
    { name: 'Coaching whiteboard + pens', qty: '×2',      status: 'ready' },
    { name: 'Scorecards / ladder sheets', qty: '×100',    status: 'ready' },
    { name: 'Bibs / pinnies',             qty: '×20',     status: 'ready' },
    { name: 'Gazebo / shade tent',        qty: '×2',      status: 'check', note: 'Check pole set complete' },
    { name: 'Registration clipboard',     qty: '×3',      status: 'ready' },
  ]},
]

// ─── Per-player camp pack (daily log + stats) ───────────────────────────────
export type CampLogDay = { day: number; date: string; theme: string; rest?: boolean; am: string; pm: string; nextAction: string; effort: number }

function seedOf(a: CampAttendee): number {
  return (a.name.length * 7 + a.beltIndex * 13 + a.age * 3 + a.initials.charCodeAt(0)) % 100
}

export function buildPlayerCampLog(a: CampAttendee, camp: Camp): CampLogDay[] {
  const start = parseInt(camp.start) || 6
  const month = camp.start.split(' ')[1] || 'Jul'
  const itin = buildCampItinerary(start, month)
  const goal = a.goal.toLowerCase()
  const s = seedOf(a)
  return itin.map((d, i) => {
    if (d.rest) return { day: d.day, date: d.date, theme: d.theme, rest: true, am: 'Active recovery + pool — kept the body fresh.', pm: 'Team excursion and week-1 awards evening.', nextAction: 'Recharge and reset goals for week two.', effort: 4 }
    if (d.day === 1) return { day: d.day, date: d.date, theme: d.theme, am: 'Arrived and settled in; baseline assessment hit and filmed.', pm: `Set personal camp goal: ${a.goal}.`, nextAction: 'Review baseline video tonight with the group.', effort: 4 }
    if (d.day === 14) return { day: d.day, date: d.date, theme: d.theme, am: 'Ladder finals and end-of-camp racket assessment.', pm: '1:1 review with coach and personal off-season plan agreed.', nextAction: 'Keep the off-season plan going — 4-week checkpoint set.', effort: 5 }
    const focus = d.theme.toLowerCase()
    const effort = 3 + ((s + d.day) % 3) // 3..5
    return {
      day: d.day, date: d.date, theme: d.theme,
      am: `Technical block on ${focus}; clear progress towards "${a.goal}".`,
      pm: d.day >= 11 ? 'Competitive ladder matches — applying it under pressure.' : 'Tactical drills and live points to lock it in.',
      nextAction: ((s + d.day) % 2 === 0)
        ? `Shadow-rep tonight: 20 reps focused on ${focus.split(' ')[0]}.`
        : 'Watch your clip and note one thing to keep, one to improve.',
      effort,
    }
  })
}

export type CampStats = {
  sessionsAttended: number; totalSessions: number; hours: number
  sets: number; setsWon: number
  serveStart: number; serveEnd: number
  consistencyStart: number; consistencyEnd: number
  attendancePct: number
  beltStart: number; beltEnd: number
  improvements: string[]
  highlight: string
}

// ─── Recommended books ──────────────────────────────────────────────────────
// Coach's reading recommendations for players & parents. These are real,
// well-known published works (factual references, like the governing-body
// refs) — swap for fictional titles if brand doctrine requires.
export type Book = {
  id: string; title: string; author: string
  topic: 'Mental' | 'Tactics' | 'Memoir' | 'Development' | 'Fitness'
  audience: string; year: number; why: string; spine: string
}

export const BOOKS: Book[] = [
  { id: 'b1', title: 'The Inner Game of Tennis', author: 'W. Timothy Gallwey', topic: 'Mental', audience: 'All players', year: 1974, spine: '#a855f7', why: 'The classic. Quiet the mind, trust your strokes — I give this to anyone who overthinks on court.' },
  { id: 'b2', title: 'Winning Ugly', author: 'Brad Gilbert', topic: 'Tactics', audience: 'Teen & adult', year: 1993, spine: '#3A8EE0', why: 'Match-play street smarts: how to win when you’re not at your best, and how to beat better players.' },
  { id: 'b3', title: 'Open', author: 'Andre Agassi', topic: 'Memoir', audience: 'Teen & adult', year: 2009, spine: '#C75A5A', why: 'A brutally honest autobiography — brilliant for perspective and motivation when the grind feels hard.' },
  { id: 'b4', title: 'Mindset', author: 'Carol S. Dweck', topic: 'Development', audience: 'Parents & juniors', year: 2006, spine: '#4FAE72', why: 'Growth vs fixed mindset. Essential reading for parents supporting a young player.' },
  { id: 'b5', title: 'The Talent Code', author: 'Daniel Coyle', topic: 'Development', audience: 'Parents & coaches', year: 2009, spine: '#E08A3C', why: 'Why deep practice grows skill. Helps players understand why we drill the way we do.' },
  { id: 'b6', title: 'The Champion’s Mind', author: 'Jim Afremow', topic: 'Mental', audience: 'Teen & adult', year: 2013, spine: '#8B5CF6', why: 'Practical sports-psychology routines for competing and handling pressure.' },
  { id: 'b7', title: 'Bounce', author: 'Matthew Syed', topic: 'Development', audience: 'Older juniors & parents', year: 2010, spine: '#0EA5A4', why: 'Myth-busting on talent and practice — an easy, inspiring read for motivated juniors.' },
  { id: 'b8', title: 'With Winning in Mind', author: 'Lanny Bassham', topic: 'Mental', audience: 'Tournament players', year: 1988, spine: '#C9A227', why: 'A mental-management system used by Olympians — ideal once a player is competing regularly.' },
]

// ─── Venues / Court Planner ─────────────────────────────────────────────────
// The sites a peripatetic coach works across. Distinct from the Booking
// Calendar (customer sessions) — this is the venue/supply side: who to call,
// what's there, and which courts are free right now.
export type CourtStatus = 'free' | 'lesson' | 'booked' | 'maintenance'
export type Court = { name: string; surface: 'Hard' | 'Clay' | 'Grass' | 'Carpet'; indoor: boolean; lights: boolean; status: CourtStatus; until?: string; who?: string }
export type Venue = {
  id: string
  name: string
  type: string
  primary?: boolean
  address: string
  distance: string          // from home base
  manager: string
  managerPhone: string
  managerEmail: string
  access: string
  facilities: string[]
  courts: Court[]
}

export const VENUES: Venue[] = [
  {
    id: 'riverside', name: 'Riverside Tennis Centre', type: 'LTA-registered tennis centre', primary: true,
    address: 'Riverside Park, Mill Lane, Riverside RV1 4TC', distance: 'Home base',
    manager: 'Karen Blythe', managerPhone: '01632 770100', managerEmail: 'karen@riversidetennis.example.com',
    access: 'Coach fob entry · gate code 4471 after 6pm',
    facilities: ['Café', 'Pro shop', 'Parking (40)', 'Changing rooms', 'Ball machine', 'Floodlights'],
    courts: [
      { name: 'Court 1', surface: 'Hard',  indoor: false, lights: true,  status: 'lesson',      until: '09:45', who: 'Mia Chen (you)' },
      { name: 'Court 2', surface: 'Hard',  indoor: false, lights: true,  status: 'lesson',      until: '11:30', who: 'Tom Okafor (you)' },
      { name: 'Court 3', surface: 'Hard',  indoor: false, lights: true,  status: 'booked',      until: '12:00', who: 'Member booking' },
      { name: 'Court 4', surface: 'Hard',  indoor: false, lights: true,  status: 'free' },
      { name: 'Indoor 1', surface: 'Carpet', indoor: true, lights: true, status: 'free' },
      { name: 'Indoor 2', surface: 'Carpet', indoor: true, lights: true, status: 'maintenance', until: 'Fri', who: 'Net + lighting repair' },
    ],
  },
  {
    id: 'parkside', name: 'Parkside Lawn Tennis Club', type: 'Members club',
    address: 'Parkside Avenue, Westbrook WB2 6LN', distance: '4.2 mi · 12 min',
    manager: 'Geoff Hartley', managerPhone: '01632 880255', managerEmail: 'office@parksideltc.example.com',
    access: 'Sign in at clubhouse · coaching slots Tue/Thu',
    facilities: ['Clubhouse bar', 'Parking (20)', 'Changing rooms', 'Floodlights (2 courts)'],
    courts: [
      { name: 'Clay 1', surface: 'Clay', indoor: false, lights: true,  status: 'lesson', until: '18:15', who: 'Leo Whitfield (you)' },
      { name: 'Clay 2', surface: 'Clay', indoor: false, lights: true,  status: 'free' },
      { name: 'Clay 3', surface: 'Clay', indoor: false, lights: false, status: 'booked', until: '19:00', who: 'Club doubles' },
      { name: 'Clay 4', surface: 'Clay', indoor: false, lights: false, status: 'free' },
    ],
  },
  {
    id: 'oakwood', name: 'Oakwood Grammar School', type: 'School courts (hired)',
    address: 'Oakwood Grammar, School Road, Riverside RV3 8GS', distance: '2.1 mi · 7 min',
    manager: 'Mr D. Holloway (PE dept)', managerPhone: '01632 660300', managerEmail: 'pe@oakwoodgrammar.example.com',
    access: 'Term-time only · book via PE office · no access during school hours',
    facilities: ['Parking (street)', 'Toilets', 'No lights'],
    courts: [
      { name: 'Court A', surface: 'Hard', indoor: false, lights: false, status: 'free' },
      { name: 'Court B', surface: 'Hard', indoor: false, lights: false, status: 'booked', until: '16:00', who: 'School club' },
      { name: 'Court C', surface: 'Hard', indoor: false, lights: false, status: 'free' },
    ],
  },
  {
    id: 'marina', name: 'Marina Indoor Tennis Dome', type: 'Indoor pay-and-play',
    address: 'Marina Quay, Dockside DK1 2QY', distance: '6.8 mi · 18 min',
    manager: 'Booking desk', managerPhone: '01632 990400', managerEmail: 'bookings@marinatennis.example.com',
    access: 'Pre-pay courts online · arrive 10 min early',
    facilities: ['Café', 'Parking (paid)', 'Changing rooms', 'Climate controlled', 'Floodlights'],
    courts: [
      { name: 'Dome 1', surface: 'Hard', indoor: true, lights: true, status: 'booked', until: '14:00', who: 'Pay-and-play' },
      { name: 'Dome 2', surface: 'Hard', indoor: true, lights: true, status: 'free' },
      { name: 'Dome 3', surface: 'Hard', indoor: true, lights: true, status: 'free' },
      { name: 'Dome 4', surface: 'Hard', indoor: true, lights: true, status: 'lesson', until: '20:00', who: 'Squad session (you)' },
    ],
  },
]

// ─── Equipment & Kit (all sessions) ─────────────────────────────────────────
// General coaching inventory so the coach never turns up short. Distinct from
// camp equipment (one trip) — this is the everyday kit across all sessions.
export type KitStatus = 'good' | 'low' | 'order' | 'repair'
export type KitItem = { name: string; qty: string; status: KitStatus; location: string; note?: string }
export type KitCategory = { category: string; icon: string; items: KitItem[] }

export const EQUIPMENT_INVENTORY: KitCategory[] = [
  { category: 'Balls & baskets', icon: 'crosshair', items: [
    { name: 'Yellow balls',            qty: '24 dozen', status: 'good',   location: 'Main coaching bag' },
    { name: 'Green (transition) balls', qty: '6 dozen',  status: 'low',    location: 'Main coaching bag', note: 'Down to last 2 tubes — reorder' },
    { name: 'Orange balls',            qty: '5 dozen',  status: 'good',   location: 'Junior bag' },
    { name: 'Red / foam balls',        qty: '4 dozen',  status: 'good',   location: 'Junior bag' },
    { name: 'Ball baskets',            qty: '×3',       status: 'good',   location: 'Car boot' },
    { name: 'Ball tubes (pickup)',     qty: '×2',       status: 'repair', location: 'Car boot', note: 'One spring gone' },
  ]},
  { category: 'Coaching aids', icon: 'flag', items: [
    { name: 'Target cones',            qty: '×40',      status: 'good',   location: 'Main coaching bag' },
    { name: 'Throw-down lines',        qty: '×4 sets',  status: 'good',   location: 'Main coaching bag' },
    { name: 'Agility ladders',         qty: '×3',       status: 'good',   location: 'Car boot' },
    { name: 'Spin / brush trainer',    qty: '×2',       status: 'good',   location: 'Main coaching bag' },
    { name: 'Hand targets / hoops',    qty: '×6',       status: 'low',    location: 'Junior bag', note: '2 split' },
    { name: 'Rebound net',             qty: '×1',       status: 'good',   location: 'Club store' },
  ]},
  { category: 'Court equipment', icon: 'grid', items: [
    { name: 'Portable mini-nets',      qty: '×4',       status: 'order',  location: 'Club store', note: '2 damaged — replacements due' },
    { name: 'Singles sticks',          qty: '×2 pairs', status: 'good',   location: 'Court shed' },
    { name: 'Net measure stick',       qty: '×1',       status: 'good',   location: 'Main coaching bag' },
    { name: 'Scoreboard (portable)',   qty: '×1',       status: 'good',   location: 'Car boot' },
    { name: 'Line tape',               qty: '×3 rolls', status: 'low',    location: 'Club store' },
  ]},
  { category: 'Ball machine & tech', icon: 'play', items: [
    { name: 'Ball machine',            qty: '×1',       status: 'good',   location: 'Club store' },
    { name: 'Machine remote',          qty: '×1',       status: 'good',   location: 'Club store' },
    { name: 'Spare batteries',         qty: '×4',       status: 'low',    location: 'Main coaching bag', note: 'Recharge / restock' },
    { name: 'Camera + tripod',         qty: '×1',       status: 'good',   location: 'Car boot' },
    { name: 'Coaching tablet',         qty: '×1',       status: 'good',   location: 'Main coaching bag' },
  ]},
  { category: 'Medical & welfare', icon: 'medical', items: [
    { name: 'First aid kit',           qty: '×2',       status: 'good',   location: 'Main coaching bag', note: 'Check plasters' },
    { name: 'Ice packs',               qty: '×6',       status: 'good',   location: 'Cool box' },
    { name: 'Sunscreen SPF50',         qty: '×2',       status: 'order',  location: 'Main coaching bag' },
    { name: 'Electrolyte sachets',     qty: '20',       status: 'low',    location: 'Main coaching bag' },
    { name: 'Spare water bottles',     qty: '×6',       status: 'good',   location: 'Car boot' },
  ]},
  { category: 'Player merch & spares', icon: 'trophy', items: [
    { name: 'Overgrips',               qty: '×30',      status: 'good',   location: 'Main coaching bag' },
    { name: 'Vibration dampeners',     qty: '×20',      status: 'good',   location: 'Main coaching bag' },
    { name: 'Reward stickers (juniors)', qty: '2 packs', status: 'low',   location: 'Junior bag' },
    { name: 'Lumio wristbands',        qty: '×15',      status: 'good',   location: 'Junior bag' },
  ]},
  { category: 'Admin & bag', icon: 'note', items: [
    { name: 'Coaching whiteboard + pens', qty: '×1',    status: 'good',   location: 'Main coaching bag', note: 'Pens drying out' },
    { name: 'Register / clipboard',    qty: '×2',       status: 'good',   location: 'Main coaching bag' },
    { name: 'Lesson cards / score sheets', qty: '×100', status: 'good',   location: 'Office' },
    { name: 'Bibs / pinnies',          qty: '×20',      status: 'good',   location: 'Car boot' },
  ]},
  { category: 'Stringing', icon: 'wrench', items: [
    { name: 'String reels',            qty: '×3',       status: 'low',    location: 'Office', note: 'Down to one full reel' },
    { name: 'Grommets (assorted)',     qty: 'kit',      status: 'good',   location: 'Office' },
    { name: 'Stencil + marker',        qty: '×1',       status: 'good',   location: 'Office' },
    { name: 'Cutters / pliers',        qty: '×1',       status: 'good',   location: 'Office' },
  ]},
]

// What to bring for each session type — the on-court checklist.
export const SESSION_KITS: { type: string; icon: string; items: string[] }[] = [
  { type: 'Private lesson', icon: 'flag',     items: ['Ball basket (60+)', 'Cones ×8', 'Throw-down lines', 'Target hoops', 'Whiteboard + pen', 'Water'] },
  { type: 'Group / squad',  icon: 'people',   items: ['2× ball baskets', 'Cones ×20', 'Throw-down lines ×4', 'Bibs ×12', 'First aid kit', 'Spare balls (2 dozen)'] },
  { type: 'Cardio Tennis',  icon: 'flame',    items: ['Ball machine or 2 baskets', 'Cones ×16', 'Agility ladders', 'Music speaker', 'Water station', 'Heart-rate cones'] },
  { type: 'Match play',     icon: 'trophy',   items: ['New pressurised balls', 'Scoreboard', 'Net measure stick', 'Singles sticks', 'Shade / brolly'] },
  { type: 'Mini / red ball',icon: 'sparkles', items: ['Red & orange balls', 'Mini-nets ×4', 'Fun targets / hoops', 'Reward stickers', 'Foam balls'] },
]

// ─── Player contact details ─────────────────────────────────────────────────
export type PlayerContact = {
  playerEmail?: string; playerPhone?: string
  parentName?: string; parentEmail?: string; parentPhone?: string
  emergencyName: string; emergencyPhone: string
  address: string; comms: string; medical: string
}

export const PLAYER_CONTACTS: Record<string, PlayerContact> = {
  p1: { parentName: 'Lily Chen', parentEmail: 'lily.chen@example.com', parentPhone: '07700 900141', emergencyName: 'David Chen (father)', emergencyPhone: '07700 900142', address: '14 Maple Avenue, Riverside', comms: 'WhatsApp preferred', medical: 'No known allergies' },
  p2: { parentName: 'Grace Okafor', parentEmail: 'grace.okafor@example.com', parentPhone: '07700 900233', emergencyName: 'Grace Okafor (mother)', emergencyPhone: '07700 900233', address: '7 Oakwood Close, Riverside', comms: 'Email preferred', medical: 'Mild asthma — inhaler in bag' },
  p3: { parentName: 'Sofia Romero', parentEmail: 'sofia.romero@example.com', parentPhone: '07700 900318', emergencyName: 'Carlos Romero (father)', emergencyPhone: '07700 900319', address: '22 Birch Lane, Riverside', comms: 'WhatsApp preferred', medical: 'Nut allergy — carries EpiPen' },
  p4: { playerEmail: 'leo.whitfield@example.com', playerPhone: '07700 900404', parentName: 'Sarah Whitfield', parentPhone: '07700 900405', emergencyName: 'Sarah Whitfield (mother)', emergencyPhone: '07700 900405', address: '3 Cedar Court, Riverside', comms: 'Text Leo + cc parent', medical: 'No known allergies' },
  p5: { parentName: 'Mark Berg', parentEmail: 'mark.berg@example.com', parentPhone: '07700 900512', emergencyName: 'Mark Berg (father)', emergencyPhone: '07700 900512', address: '41 Elm Road, Riverside', comms: 'Phone call preferred', medical: 'No known allergies' },
  p6: { playerEmail: 'daniel.cruz@example.com', playerPhone: '07700 900606', parentName: 'Maria Cruz', parentPhone: '07700 900607', emergencyName: 'Maria Cruz (mother)', emergencyPhone: '07700 900607', address: '9 Willow Way, Riverside', comms: 'Text Daniel directly', medical: 'No known allergies' },
  p7: { playerEmail: 'priya.patel@example.com', playerPhone: '07700 900707', emergencyName: 'Raj Patel (husband)', emergencyPhone: '07700 900708', address: '18 Hawthorn Drive, Riverside', comms: 'Email or WhatsApp', medical: 'No known allergies' },
  p8: { parentName: 'Anna Whitlock', parentEmail: 'anna.whitlock@example.com', parentPhone: '07700 900818', emergencyName: 'Anna Whitlock (mother)', emergencyPhone: '07700 900818', address: '26 Rowan Gardens, Riverside', comms: 'WhatsApp preferred', medical: 'No known allergies' },
}

// Full lesson history for a player — the real logged summaries (rich) plus a
// generated earlier history so the profile reads as a complete record.
export type LessonHistItem = { id: string; date: string; focus: string; type: string; mins: number; takeaway: string; homework: string; detailed?: boolean }

export function playerLessons(p: Player): LessonHistItem[] {
  const real: LessonHistItem[] = LESSONS.filter(l => l.playerId === p.id).map(l => ({
    id: `r-${l.id}`, date: l.date, focus: l.focus, type: l.type, mins: l.duration,
    takeaway: l.takeaways[0], homework: l.homework, detailed: true,
  }))
  const skillNames: string[] = []
  for (let bi = 0; bi <= p.beltIndex; bi++) BELTS[bi].skills.forEach(s => skillNames.push(s.name))
  const types = ['Private', 'Private', 'Group', 'Private', 'Match play', 'Private', 'Group', 'Private']
  const dates = ['28 May 2026', '21 May 2026', '14 May 2026', '06 May 2026', '28 Apr 2026', '14 Apr 2026', '31 Mar 2026', '17 Mar 2026']
  const takeTpl = (s: string, k: number) => [
    `${s} — clear improvement, holding up well`,
    `Worked ${s.toLowerCase()}; consistency building nicely`,
    `${s} starting to click under a bit of pressure`,
    `Good session on ${s.toLowerCase()} — keep reinforcing`,
  ][k % 4]
  const generated: LessonHistItem[] = Array.from({ length: 7 }).map((_, i) => {
    const s = skillNames[(p.seed + i * 3) % skillNames.length] ?? 'Rally control'
    return {
      id: `g-${p.id}-${i}`, date: dates[i] ?? dates[dates.length - 1], focus: s,
      type: types[i % types.length], mins: i % 3 === 0 ? 45 : 60,
      takeaway: takeTpl(s, p.seed + i), homework: `10 min a day on ${s.toLowerCase()}; film one set`,
    }
  })
  return [...real, ...generated]
}

// Richer per-player development stats (deterministic) for the Player
// Development page — mirrors the camp player-pack stat boxes.
export type PlayerDevStats = {
  sessionsTerm: number; hoursTerm: number; lessonsLogged: number
  winPct: number; serveNow: number; serveGain: number; rally: number; streak: number
}
export function playerDevStats(p: Player): PlayerDevStats {
  const s = (p.seed * 9 + p.beltIndex * 7 + p.age) % 100
  const sessionsTerm = 16 + (s % 12)
  return {
    sessionsTerm,
    hoursTerm: Math.round(sessionsTerm * 0.9),
    lessonsLogged: 8 + (s % 8),
    winPct: 48 + (s % 30),
    serveNow: 52 + (s % 16),
    serveGain: 3 + (s % 8),
    rally: 60 + (s % 25),
    streak: 3 + (s % 8),
  }
}

export function playerCampStats(a: CampAttendee, _camp: Camp): CampStats {
  const s = seedOf(a)
  const total = 26
  const attended = total - (s % 3)               // 24..26
  const hours = 34 + (s % 9)                      // 34..42
  const sets = 26 + (s % 12)                      // 26..37
  const setsWon = Math.round(sets * (0.52 + (s % 18) / 100)) // ~52–69%
  const serveStart = 52 + (s % 8)                 // 52..59
  const serveEnd = serveStart + 6 + (s % 6)       // +6..+11
  const consistencyStart = 58 + (s % 7)
  const consistencyEnd = consistencyStart + 5 + (s % 7)
  // pick 3 improvements from current + next belt skills
  const belt = BELTS[a.beltIndex]
  const next = BELTS[Math.min(a.beltIndex + 1, BELTS.length - 1)]
  const pool = [...belt.skills, ...next.skills].map(x => x.name)
  const improvements = [pool[s % pool.length], pool[(s + 3) % pool.length], pool[(s + 6) % pool.length]]
    .filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 3)
  const progressed = (s % 5 < 2) && a.beltIndex < BELTS.length - 1
  return {
    sessionsAttended: attended, totalSessions: total, hours,
    sets, setsWon,
    serveStart, serveEnd, consistencyStart, consistencyEnd,
    attendancePct: Math.round((attended / total) * 100),
    beltStart: a.beltIndex, beltEnd: progressed ? a.beltIndex + 1 : a.beltIndex,
    improvements,
    highlight: progressed
      ? `Earned the ${BELTS[a.beltIndex + 1].name} racket on assessment day — a standout fortnight.`
      : `Biggest leap of the camp: ${improvements[0].toLowerCase()} now holding up under match pressure.`,
  }
}
