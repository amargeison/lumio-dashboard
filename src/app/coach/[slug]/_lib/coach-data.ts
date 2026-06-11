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

// ─── Top stat tiles ────────────────────────────────────────────────────────
export type CoachStatTone = 'urgent' | 'warn' | 'danger' | 'ok' | 'accent'
export type CoachStatTile = { label: string; value: string | number; sub: string; tone: CoachStatTone }

export const COACH_TOP_STATS: CoachStatTile[] = [
  { label: 'Sessions today', value: 7,       sub: '2 group · 5 private', tone: 'accent' },
  { label: 'Next lesson',    value: '09:00', sub: 'Mia Chen · Court 2',  tone: 'urgent' },
  { label: 'Active players', value: 34,      sub: '+3 this month',       tone: 'ok' },
  { label: 'Belts due',      value: 4,       sub: 'assessments pending', tone: 'warn' },
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
}

export const PLAYERS: Player[] = [
  { id: 'p1', name: 'Mia Chen',        initials: 'MC', age: 9,  group: 'Junior',      beltIndex: 2, seed: 3, goal: 'First serve over the net consistently', attendance: 96, nextSession: 'Today 09:00', parent: 'Lily Chen',    status: 'green', trend: 'up'   },
  { id: 'p2', name: 'Tom Okafor',      initials: 'TO', age: 12, group: 'Performance', beltIndex: 4, seed: 7, goal: 'Reliable kick second serve',             attendance: 91, nextSession: 'Today 10:30', parent: 'Grace Okafor', status: 'green', trend: 'up'   },
  { id: 'p3', name: 'Ava Romero',      initials: 'AR', age: 8,  group: 'Junior',      beltIndex: 1, seed: 2, goal: 'Rally 10 balls cross-court',            attendance: 88, nextSession: 'Today 16:00', parent: 'Sofia Romero', status: 'amber', trend: 'flat' },
  { id: 'p4', name: 'Leo Whitfield',   initials: 'LW', age: 14, group: 'Performance', beltIndex: 6, seed: 5, goal: 'Build serve+1 forehand pattern',        attendance: 94, nextSession: 'Tomorrow 17:00', status: 'green', trend: 'up'   },
  { id: 'p5', name: 'Hannah Berg',     initials: 'HB', age: 11, group: 'Junior',      beltIndex: 3, seed: 9, goal: 'Add topspin shape to forehand',         attendance: 79, nextSession: 'Fri 15:30',   parent: 'Mark Berg',    status: 'red',   trend: 'down' },
  { id: 'p6', name: 'Daniel Cruz',     initials: 'DC', age: 16, group: 'Performance', beltIndex: 7, seed: 4, goal: 'Win first county-level match',          attendance: 97, nextSession: 'Today 18:00', status: 'green', trend: 'up'   },
  { id: 'p7', name: 'Priya Patel',     initials: 'PP', age: 38, group: 'Adult',       beltIndex: 3, seed: 6, goal: 'Consistent doubles serve & volley',     attendance: 85, nextSession: 'Sat 11:00',   status: 'green', trend: 'flat' },
  { id: 'p8', name: 'James Whitlock',  initials: 'JW', age: 10, group: 'Junior',      beltIndex: 2, seed: 8, goal: 'Backhand volley at the net',            attendance: 90, nextSession: 'Fri 16:30',   parent: 'Anna Whitlock', status: 'amber', trend: 'up'   },
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
    coachNote: 'Lovely attitude. Close to her Green belt serve criteria — one more good week.',
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
    coachNote: 'Brown belt tactics coming together. Ready to compete more.',
    rating: 5,
  },
]

// ─── Booking calendar ──────────────────────────────────────────────────────
export type Booking = {
  id: string
  day: number                // 0=Mon … 6=Sun
  start: string              // 'HH:MM'
  end: string
  player: string
  type: 'Private' | 'Group' | 'Cardio' | 'Match play' | 'Block'
  court: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_DATES = ['8', '9', '10', '11', '12', '13', '14']  // Jun 2026 week
export const CAL_HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']

export const BOOKINGS: Booking[] = [
  { id: 'b1', day: 3, start: '09:00', end: '09:45', player: 'Mia Chen',      type: 'Private',    court: 'Court 1', status: 'confirmed' },
  { id: 'b2', day: 3, start: '10:30', end: '11:30', player: 'Tom Okafor',    type: 'Private',    court: 'Court 2', status: 'confirmed' },
  { id: 'b3', day: 3, start: '12:00', end: '13:00', player: 'Junior Squad',  type: 'Group',      court: 'Court 1', status: 'confirmed' },
  { id: 'b4', day: 3, start: '16:00', end: '16:45', player: 'Ava Romero',    type: 'Private',    court: 'Court 3', status: 'confirmed' },
  { id: 'b5', day: 3, start: '18:00', end: '19:00', player: 'Daniel Cruz',   type: 'Match play', court: 'Court 3', status: 'confirmed' },
  { id: 'b6', day: 0, start: '15:30', end: '16:30', player: 'Performance Sq', type: 'Group',     court: 'Court 2', status: 'confirmed' },
  { id: 'b7', day: 1, start: '17:00', end: '18:15', player: 'Leo Whitfield', type: 'Match play', court: 'Court 3', status: 'confirmed' },
  { id: 'b8', day: 4, start: '15:30', end: '16:30', player: 'Hannah Berg',   type: 'Private',    court: 'Court 4', status: 'pending'   },
  { id: 'b9', day: 4, start: '16:30', end: '17:15', player: 'James Whitlock',type: 'Private',    court: 'Court 1', status: 'confirmed' },
  { id: 'b10', day: 5, start: '09:00', end: '10:30', player: 'Cardio Tennis', type: 'Cardio',    court: 'Court 1', status: 'confirmed' },
  { id: 'b11', day: 5, start: '11:00', end: '12:00', player: 'Priya Patel',  type: 'Private',    court: 'Court 2', status: 'confirmed' },
  { id: 'b12', day: 2, start: '12:00', end: '14:00', player: 'Admin / Planning', type: 'Block',  court: '—',       status: 'confirmed' },
  { id: 'b13', day: 0, start: '17:00', end: '18:00', player: 'Adult Group',  type: 'Group',      court: 'Court 4', status: 'confirmed' },
  { id: 'b14', day: 6, start: '10:00', end: '11:00', player: 'Open coaching', type: 'Block',     court: 'Court 1', status: 'pending'   },
]

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
  { id: 'r4',  title: '8-week Green-belt block',           category: 'Training plan',level: 'Intermediate', format: 'Plan',      duration: '8 weeks',belt: 'green',  tags: ['serve','periodisation'],     desc: 'Periodised plan to earn the Green belt serve criteria.' },
  { id: 'r5',  title: 'Cross-court rally targets',         category: 'Drill',        level: 'All levels',   format: 'PDF',       duration: '—',      belt: 'yellow', tags: ['consistency','rally'],       desc: 'Printable court targets for rally depth & direction.' },
  { id: 'r6',  title: 'Net play & volley progression',     category: 'Drill',        level: 'Intermediate', format: 'Video',     duration: '6 min',  belt: 'orange', tags: ['volley','net'],              desc: 'Feed sequence from block volley to closing the net.' },
  { id: 'r7',  title: 'Footwork agility ladder set',       category: 'Fitness',      level: 'All levels',   format: 'PDF',       duration: '15 min', tags: ['movement','warm-up'],        desc: 'Off-court ladder routine for split-step speed.' },
  { id: 'r8',  title: 'Compete: reset routine card',       category: 'Mental',       level: 'Advanced',     format: 'Worksheet', duration: '—',      belt: 'black',  tags: ['mental','routines'],         desc: 'Between-points reset & breathing routine worksheet.' },
  { id: 'r9',  title: 'Serve+1 forehand patterns',         category: 'Drill',        level: 'Advanced',     format: 'Video',     duration: '8 min',  belt: 'red',    tags: ['patterns','tactics'],        desc: 'Three go-to serve+1 patterns and how to drill them.' },
  { id: 'r10', title: 'Parent guide: ball stages',         category: 'Training plan',level: 'Beginner',     format: 'PDF',       duration: '—',      tags: ['parents','red-orange-green'], desc: 'Explains the red/orange/green/yellow ball pathway for parents.' },
  { id: 'r11', title: 'Drop shot & touch session',         category: 'Technique',    level: 'Intermediate', format: 'Video',     duration: '5 min',  belt: 'purple', tags: ['touch','specialty'],         desc: 'Disguised drop shot mechanics and feel drills.' },
  { id: 'r12', title: 'Match-play tactics worksheet',      category: 'Mental',       level: 'Advanced',     format: 'Worksheet', duration: '—',      belt: 'red',    tags: ['tactics','scouting'],        desc: 'Pre-match plan and opponent-read worksheet.' },
]

// ─── Coach AI brief ─────────────────────────────────────────────────────────
export type CoachBriefItem = { tag: string; pri: 'high' | 'med' | 'low'; txt: string }

export const COACH_AI_BRIEF: CoachBriefItem[] = [
  { tag: 'belts',     pri: 'high', txt: 'Mia Chen is one good serving session from her Green belt — book a belt assessment this week.' },
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
  { from: 'Lily Chen',    role: 'Parent · Mia',     last: 'So excited about the belt assessment!',                    time: 'Yesterday', unread: 0, urgent: false },
  { from: 'Adult Group',  role: 'Group · 6 players', last: 'Anyone for an extra Sunday hit?',                         time: 'Tue',       unread: 0, urgent: false },
]

// ─── Payments / packages ────────────────────────────────────────────────────
export type Package = { player: string; plan: string; used: number; total: number; status: 'active' | 'expiring' | 'overdue'; renews: string }

export const PACKAGES: Package[] = [
  { player: 'Tom Okafor',     plan: '10-lesson private pack', used: 7,  total: 10, status: 'active',   renews: '12 Jul' },
  { player: 'Mia Chen',       plan: '10-lesson private pack', used: 9,  total: 10, status: 'expiring', renews: '20 Jun' },
  { player: 'Leo Whitfield',  plan: 'Performance monthly',    used: 6,  total: 12, status: 'active',   renews: '01 Jul' },
  { player: 'Hannah Berg',    plan: '5-lesson private pack',  used: 5,  total: 5,  status: 'overdue',  renews: '—'      },
  { player: 'Priya Patel',    plan: 'Adult 8-lesson block',   used: 3,  total: 8,  status: 'active',   renews: '15 Aug' },
  { player: 'Daniel Cruz',    plan: 'Performance monthly',    used: 9,  total: 12, status: 'active',   renews: '01 Jul' },
]

export const PAY_SUMMARY = { mtd: 4280, outstanding: 340, packagesActive: 28, expiringSoon: 3 }

// ─── Today's sessions (dashboard timeline) ──────────────────────────────────
export type CoachScheduleItem = { t: string; what: string; where: string; type: string; highlight?: boolean }

export const COACH_TODAY: CoachScheduleItem[] = [
  { t: '08:00', what: 'Court setup & planning',        where: 'Courts 1–3', type: 'Admin' },
  { t: '09:00', what: 'Mia Chen — first serve',        where: 'Court 1',    type: 'Private', highlight: true },
  { t: '10:30', what: 'Tom Okafor — serve+1 patterns', where: 'Court 2',    type: 'Private' },
  { t: '12:00', what: 'Junior Squad (6)',              where: 'Court 1',    type: 'Group' },
  { t: '16:00', what: 'Ava Romero — rally control',    where: 'Court 3',    type: 'Private' },
  { t: '17:00', what: 'Belt assessment prep',          where: 'Office',     type: 'Admin' },
  { t: '18:00', what: 'Daniel Cruz — match play',      where: 'Court 3',    type: 'Match' },
]

// ─── Sidebar nav ────────────────────────────────────────────────────────────
export type CoachNavItem = { id: string; label: string; icon: string; group: string; badge?: string }

export const COACH_SIDEBAR: CoachNavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',          icon: 'home',         group: 'COACHING' },
  { id: 'lessons',     label: 'Lesson Summaries',   icon: 'note',         group: 'COACHING' },
  { id: 'planner',     label: 'Session Planner',    icon: 'flag',         group: 'COACHING' },
  { id: 'development', label: 'Player Development',  icon: 'arrow-up-right', group: 'COACHING' },
  { id: 'belts',       label: 'Belt Progression',   icon: 'trophy',       group: 'COACHING', badge: 'NEW' },
  { id: 'calendar',    label: 'Booking Calendar',   icon: 'calendar',     group: 'SCHEDULE' },
  { id: 'venues',      label: 'Court Planner',      icon: 'pin',          group: 'SCHEDULE', badge: 'NEW' },
  { id: 'camps',       label: 'Training Camps',     icon: 'plane',        group: 'SCHEDULE', badge: 'NEW' },
  { id: 'roster',      label: 'Player Roster',      icon: 'people',       group: 'PLAYERS' },
  { id: 'messages',    label: 'Messages',           icon: 'megaphone',    group: 'PLAYERS' },
  { id: 'resources',   label: 'Resource Centre',    icon: 'grid',         group: 'RESOURCES', badge: 'NEW' },
  { id: 'payments',    label: 'Payments & Packs',   icon: 'pound',        group: 'BUSINESS' },
  { id: 'settings',    label: 'Settings',           icon: 'settings',     group: 'SETTINGS' },
]

export const COACH_GROUPS = ['COACHING', 'SCHEDULE', 'PLAYERS', 'RESOURCES', 'BUSINESS', 'SETTINGS']

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
    summary: 'Junior development camp for red→green ball players. Skills, games and a belt-assessment week, with parents accommodated nearby.',
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
      'Belt re-assessment for any player who meets the criteria',
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
      'Belt assessment day on day 12',
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
        { slot: 'AM', time: '09:00', title: 'Ladder finals & belt assessments',     type: 'Match play', where: 'Centre court' },
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
    if (d.day === 14) return { day: d.day, date: d.date, theme: d.theme, am: 'Ladder finals and end-of-camp belt assessment.', pm: '1:1 review with coach and personal off-season plan agreed.', nextAction: 'Keep the off-season plan going — 4-week checkpoint set.', effort: 5 }
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
      ? `Earned the ${BELTS[a.beltIndex + 1].name} belt on assessment day — a standout fortnight.`
      : `Biggest leap of the camp: ${improvements[0].toLowerCase()} now holding up under match pressure.`,
  }
}
