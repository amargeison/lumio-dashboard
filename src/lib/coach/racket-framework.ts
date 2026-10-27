// The Lumio racket framework: the stages in order and the four skills at each.
// Plain data, so the server (the iPhone app's dashboard) and the portal share
// one copy; coach-db re-exports it for the portal's existing imports.

// Racket progression stages (ordered). Mirrors the demo BELTS palette.
export const RACKET_STAGES: { id: string; name: string; colour: string }[] = [
  { id: 'white',  name: 'White',  colour: '#E5E7EB' },
  { id: 'yellow', name: 'Yellow', colour: '#EAB308' },
  { id: 'orange', name: 'Orange', colour: '#F97316' },
  { id: 'green',  name: 'Green',  colour: '#22C55E' },
  { id: 'blue',   name: 'Blue',   colour: '#3B82F6' },
  { id: 'purple', name: 'Purple', colour: '#A855F7' },
  { id: 'brown',  name: 'Brown',  colour: '#92400E' },
  { id: 'red',    name: 'Red',    colour: '#EF4444' },
  { id: 'black',  name: 'Black',  colour: '#111827' },
]

// Skills worked at each racket stage (4 per stage), with a one-line coaching note.
// Coaches mark a player's mastery 1–4 against these in Player Development. This is
// the canonical Lumio racket-skill framework (mirrors the academy demo); it's
// fixed/Lumio-managed — coaches grade against it but don't edit the skills.
export const RACKET_SKILLS: Record<string, { name: string; note: string }[]> = {
  white: [
    { name: 'Ready position & split-step', note: 'Athletic base, balanced, on toes before each ball' },
    { name: 'Forehand groundstroke', note: 'Low-to-high swing, contact out front' },
    { name: 'Grips — eastern & continental', note: 'Find and change grip without looking' },
    { name: 'Cooperative rally', note: 'Keep 3–5 balls going with a partner' },
  ],
  yellow: [
    { name: 'Two-handed backhand', note: 'Shoulder turn, two clean hands, follow through' },
    { name: 'Footwork & recovery', note: 'Small adjusting steps, recover to centre' },
    { name: 'Sustained rally (10+)', note: 'Rally 10+ balls cross-court with control' },
    { name: 'Ball tracking & timing', note: 'Read bounce early, meet the ball cleanly' },
  ],
  orange: [
    { name: 'Forehand volley', note: 'Punch, firm wrist, short backswing at the net' },
    { name: 'Backhand volley', note: 'Continental grip, block forward through contact' },
    { name: 'Backhand slice', note: 'High-to-low, stable face, ball stays low' },
    { name: 'Net positioning', note: 'Close the net, cut angles, ready hands' },
  ],
  green: [
    { name: 'Flat first serve', note: 'Trophy pose, toss, pronate, land inside' },
    { name: 'Toss & rhythm', note: 'Consistent toss, smooth service motion' },
    { name: 'Return of serve', note: 'Split on contact, short take-back, block deep' },
    { name: 'Serve placement', note: 'Hit wide / body / T targets on demand' },
  ],
  blue: [
    { name: 'Topspin forehand', note: 'Brush up the back, heavy net clearance' },
    { name: 'Topspin backhand', note: 'Drive through with spin, depth and shape' },
    { name: 'Second serve (kick)', note: 'Spin-first, high margin, reliable under pressure' },
    { name: 'Depth & heavy ball', note: 'Land balls in the back third consistently' },
  ],
  purple: [
    { name: 'Overhead smash', note: 'Turn, point, finish high balls with authority' },
    { name: 'Drop shot', note: 'Disguised touch, soft hands, dies short' },
    { name: 'Offensive & defensive lob', note: 'Clear the net player, reset from defence' },
    { name: 'Half-volley', note: 'Short hop pick-up in transition, stable face' },
  ],
  brown: [
    { name: 'Kick serve', note: 'Heavy topspin serve that jumps off the court' },
    { name: 'Slice serve', note: 'Curve the ball wide to open the court' },
    { name: 'Inside-out forehand', note: 'Run around the backhand, attack with the FH' },
    { name: 'Approach & transition', note: 'Approach off short balls, close behind it' },
  ],
  red: [
    { name: 'Point construction', note: 'Build the point, open space, finish the right ball' },
    { name: 'Pattern play', note: 'Serve+1 and return+1 go-to patterns' },
    { name: 'Disguise & variation', note: 'Change spin, pace and height to disrupt' },
    { name: 'Reading opponents', note: 'Spot and exploit weaknesses live' },
  ],
  black: [
    { name: 'Match management', note: 'Manage score, momentum and game state' },
    { name: 'Pressure & mental game', note: 'Routines, resets, compete on big points' },
    { name: 'In-match adaptation', note: 'Change a losing plan, adjust on the fly' },
    { name: 'Closing out matches', note: 'Serve out sets, convert when ahead' },
  ],
}

// Names only — kept for callers that just need the skill list (grading keys).
export const SKILLS_BY_STAGE: Record<string, string[]> = Object.fromEntries(
  Object.entries(RACKET_SKILLS).map(([k, v]) => [k, v.map(s => s.name)]),
)

export const SKILL_LEVELS = ['—', 'Learning', 'Developing', 'Consolidating', 'Consistent']
