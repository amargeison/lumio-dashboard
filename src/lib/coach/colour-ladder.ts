// The nine colours, what each one is for, and where it sits on the LTA pathway.
//
// Shared because two screens now describe the same ladder: Racket Progression,
// where a colour is a racket you award, and Player Development, where it is
// simply the stage a player is on. A coach who does not run the reward system
// still needs to know what Green means — and both screens must not drift into
// two different answers.

export type StageMeta = { theme: string; age: string; ball: string }

export const STAGE_META: Record<string, StageMeta> = {
  white:  { theme: 'Foundations',     age: 'Ages 5–7 · first colour',  ball: 'Red' },
  yellow: { theme: 'Rallying',        age: 'Ages 6–8 · red ball',      ball: 'Red' },
  orange: { theme: 'Net & Touch',     age: 'Ages 8–9 · orange ball',   ball: 'Orange' },
  green:  { theme: 'The Serve',       age: 'Ages 9–10 · green ball',   ball: 'Green' },
  blue:   { theme: 'Spin & Shape',    age: 'Ages 10–12 · yellow ball', ball: 'Yellow' },
  purple: { theme: 'Specialty Shots', age: 'Ages 11–14 · developing',  ball: 'Yellow' },
  brown:  { theme: 'Weapons',         age: 'Ages 13+ · competitive',   ball: 'Yellow' },
  red:    { theme: 'Tactics',         age: 'Tournament player',        ball: 'Yellow' },
  black:  { theme: 'Mastery',         age: 'Performance / elite',      ball: 'Yellow' },
}

export type LtaStage = { stage: string; colour: string; ages: string; focus: string }

// Lumio is independent and not affiliated with, endorsed by or approved by the
// LTA. "LTA Youth" is their trademark, used here only to name the equivalent
// national stage so a coach can place a player against a framework they know.
export const LTA_MAP: Record<string, LtaStage> = {
  white:  { stage: 'LTA Youth · Blue',                colour: '#3A8EE0', ages: '4–6',    focus: 'Balance, coordination, agility, racket & ball skills' },
  yellow: { stage: 'LTA Youth · Red',                 colour: '#C75A5A', ages: '6–8',    focus: 'Serve, rally and score on red courts' },
  orange: { stage: 'LTA Youth · Orange',              colour: '#E08A3C', ages: '8–9',    focus: 'A rounded game — develop the different shots' },
  green:  { stage: 'LTA Youth · Green',               colour: '#4FAE72', ages: '9–10',   focus: 'Full court — refine and test technique' },
  blue:   { stage: 'LTA Youth · Yellow',              colour: '#E5C76B', ages: '10–16',  focus: 'Real balls, full court — game styles & spin' },
  purple: { stage: 'LTA Youth Compete',               colour: '#7c5cbf', ages: '11–14',  focus: 'Start & build competing — Youth Grades' },
  brown:  { stage: 'LTA Youth Compete · County',      colour: '#9A6B4F', ages: '13+',    focus: 'County-level competition & match weapons' },
  red:    { stage: 'Performance · County–Regional',   colour: '#C75A5A', ages: 'Junior', focus: 'Tactical match-play on the performance pathway' },
  black:  { stage: 'Performance · Regional–National', colour: '#2A3142', ages: 'Elite',  focus: 'National-level performance & mastery' },
}

export const BALL_COLOUR: Record<string, string> = {
  Red: '#C75A5A', Orange: '#E08A3C', Green: '#4FAE72', Yellow: '#E5C76B',
}

/** Short LTA label for a chip — "Blue", "Compete · County", "Performance · …". */
export const ltaShort = (id: string) =>
  (LTA_MAP[id]?.stage || '').replace(/LTA Youth ?· ?/, '').replace('LTA Youth ', '')
