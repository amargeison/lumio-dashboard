// The nine colours, what each one is for, and where it sits on the LTA pathway.
//
// Shared because two screens describe the same ladder: Racket Progression, where
// a colour is a racket you award, and Player Development, where it is simply the
// stage a player is on. A coach who does not run the reward system still needs to
// know what Green means, and the two screens must not drift into two answers.
//
// -- One rung, two names, never three -------------------------------------
// This used to print THREE colours for a single rung. The White colour showed a
// white swatch, a "Red ball" chip and an "LTA Blue" label, and a coach reading it
// could not tell which of the three they were meant to act on. The cause was
// treating the ball as a fact separate from the LTA stage -- when they are the
// same fact: the LTA Youth stages ARE ball stages. Blue stage is the foam ball.
// Red stage is the red ball. There is nothing to reconcile.
//
// So the ball now comes OFF the LTA stage rather than being stored beside it,
// and the two render as one chip in one colour. Our colour is ours; the LTA
// stage is theirs; there is no third thing.

export type StageMeta = { theme: string; age: string }

export const STAGE_META: Record<string, StageMeta> = {
  white:  { theme: 'Foundations',     age: 'Ages 4–6 · first colour' },
  yellow: { theme: 'Rallying',        age: 'Ages 6–8' },
  orange: { theme: 'Net & Touch',     age: 'Ages 8–9' },
  green:  { theme: 'The Serve',       age: 'Ages 9–10' },
  blue:   { theme: 'Spin & Shape',    age: 'Ages 10–16' },
  purple: { theme: 'Specialty Shots', age: 'Ages 11–14 · competing' },
  brown:  { theme: 'Weapons',         age: 'Ages 13+ · county' },
  red:    { theme: 'Tactics',         age: 'Tournament player' },
  black:  { theme: 'Mastery',         age: 'Performance / elite' },
}

/** `ball` is the LTA stage's own ball — not a separate scale. */
export type LtaStage = { stage: string; short: string; ball: string; colour: string; ages: string; focus: string }

// Lumio is independent and not affiliated with, endorsed by or approved by the
// LTA. "LTA Youth" is their trademark, used here only to name the equivalent
// national stage so a coach can place a player against a framework they know.
//
// The five LTA Youth ball stages are Blue -> Red -> Orange -> Green -> Yellow.
// Blue is played with a foam ball; the four above it are named after theirs. Our
// top four colours sit past the ball stages entirely, on Compete and
// Performance, where everyone is on a yellow ball.
export const LTA_MAP: Record<string, LtaStage> = {
  white:  { stage: 'LTA Youth · Blue',                short: 'Blue',               ball: 'Foam',   colour: '#3A8EE0', ages: '4–6',    focus: 'Balance, coordination, agility, racket & ball skills' },
  yellow: { stage: 'LTA Youth · Red',                 short: 'Red',                ball: 'Red',    colour: '#C75A5A', ages: '6–8',    focus: 'Serve, rally and score on red courts' },
  orange: { stage: 'LTA Youth · Orange',              short: 'Orange',             ball: 'Orange', colour: '#E08A3C', ages: '8–9',    focus: 'A rounded game — develop the different shots' },
  green:  { stage: 'LTA Youth · Green',               short: 'Green',              ball: 'Green',  colour: '#4FAE72', ages: '9–10',   focus: 'Full court — refine and test technique' },
  blue:   { stage: 'LTA Youth · Yellow',              short: 'Yellow',             ball: 'Yellow', colour: '#E5C76B', ages: '10–16',  focus: 'Real balls, full court — game styles & spin' },
  purple: { stage: 'LTA Youth Compete',               short: 'Compete',            ball: 'Yellow', colour: '#7c5cbf', ages: '11–14',  focus: 'Start & build competing — Youth Grades' },
  brown:  { stage: 'LTA Youth Compete · County',      short: 'Compete · County',   ball: 'Yellow', colour: '#9A6B4F', ages: '13+',    focus: 'County-level competition & match weapons' },
  red:    { stage: 'Performance · County–Regional',   short: 'Performance',        ball: 'Yellow', colour: '#C75A5A', ages: 'Junior', focus: 'Tactical match-play on the performance pathway' },
  black:  { stage: 'Performance · Regional–National', short: 'Performance · Nat.', ball: 'Yellow', colour: '#2A3142', ages: 'Elite',  focus: 'National-level performance & mastery' },
}

/** The ball a colour is played with, taken from its LTA stage so the two can
    never disagree. */
export const ballOf = (id: string) => LTA_MAP[id]?.ball ?? 'Yellow'

/** The one colour a rung is drawn in when referring to the LTA pathway. */
export const ltaColour = (id: string) => LTA_MAP[id]?.colour ?? '#8A93A6'

/** Short LTA label for a chip — "Blue", "Compete · County", "Performance". */
export const ltaShort = (id: string) => LTA_MAP[id]?.short ?? ''

/** "Blue · foam ball" — the whole mapping in one line, in one colour. */
export const ltaChip = (id: string) => {
  const l = LTA_MAP[id]
  return l ? `${l.short} · ${l.ball.toLowerCase()} ball` : ''
}

// Kept for callers that still want a ball-coloured swatch. Foam is the pale one
// — a beginner's ball is not red, and colouring it red is what started this.
export const BALL_COLOUR: Record<string, string> = {
  Foam: '#8FB7DE', Red: '#C75A5A', Orange: '#E08A3C', Green: '#4FAE72', Yellow: '#E5C76B',
}

// ── A goal per colour ───────────────────────────────────────────────────────
// "No goal set yet" was the most common thing on a player's page, because
// setting one meant opening the roster, editing the player and writing a
// sentence. But the colour a coach has already chosen says most of it: a player
// on Orange and a player on Compete are not aiming at the same thing. These are
// the three or four a coach would actually write for that rung — one tap, or
// their own words if none of them is the player in front of them.
export const GOAL_PRESETS: Record<string, string[]> = {
  white:  ['Rally five balls over the net with a coach', 'Serve underarm into the right box five times', 'Play a whole game and keep the score'],
  yellow: ['Rally ten in a row on a red court', 'Start a point on their own serve', 'Play a red-ball match at a club event'],
  orange: ['Control forehand and backhand from the baseline', 'Land two first serves out of three', 'Finish a point at the net in a match'],
  green:  ['Serve overarm with a full action', 'Rally fifteen on a full court', 'Enter and finish a green-ball competition'],
  blue:   ['Put topspin on both wings under pressure', 'Hold serve against a rallying opponent', 'Win a match at LTA Youth Grade 5'],
  purple: ['Play an LTA Youth Grade 4 event', 'Build a reliable serve-plus-one pattern', 'Win three competitive matches this season'],
  brown:  ['Be selected for the county squad', 'Turn the inside-out forehand into a weapon', 'Win a round at county level'],
  red:    ['Compete at regional level', 'Take a set off a higher-rated player', 'Hold one game plan for a whole match'],
  black:  ['Compete at national level', 'Perform across a three-match day', 'Build and commit to a full-year schedule'],
}

/** The goals worth offering for a colour — never an empty list. */
export const goalPresets = (id: string): string[] => GOAL_PRESETS[id] || GOAL_PRESETS.orange
