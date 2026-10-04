// The demo's answers to /api/coach/* and /api/portal/*.
//
// fetch.ts intercepts every call the live components make to the coach API and
// hands it here. Each handler returns exactly the shape the real route returns —
// same field names, same status codes for the failures a component knows how to
// show — so a live component cannot tell the difference and behaves on the demo
// as it does for a real academy.
//
// Three rules hold throughout:
//
//   1. Nothing leaves the browser. "Lumio Coach" here is a library of written
//      coaching content, chosen and filled in from what the request and the demo
//      store say (the player's name, age and stage; the camp's dates and brief).
//      It costs nothing, which is the point: a visitor pressing every AI button
//      in the product must not spend a penny.
//   2. Nothing is sent. Every email, text, invite and payment answers with the
//      route's success shape and, where the live UI would then show a new row,
//      writes that row into the store so the screen updates.
//   3. Read the store defensively. The seed is live-shaped but nobody promises a
//      particular row exists, and a visitor can delete anything.
//
// Returning undefined lets fetch.ts answer { ok: true, demo: true } — the right
// reply for fire-and-forget calls nobody reads.

import { demoTable, demoId, DEMO_COACH_ID, DEMO_EMAIL, type Row } from './store'
import { demoClient } from './client'
import { scoreManualSession, MANUAL_MIN_DURATION_MIN } from '@/lib/coach/effort-score'
import { recipientFor, renderCampEmail, chaseReasons, type Draft } from '@/lib/coach/camp-email-build'
import { STAGE_BY_ID, type StageId } from '@/lib/coach/camp-lifecycle'
import { formEmailBlock, formEnabled } from '@/lib/coach/camp-form'
import { campAudience, isAdult } from '@/lib/coach/camp-audience'
import { cleanTrip, type Trip } from '@/lib/coach/trip'
import { buildNextSession } from '@/lib/student/next-session'
import { bookById } from '@/lib/coach/books'
import { isLumioResource } from '@/lib/coach/lumio-resources-data'
import { resourceHref } from '@/lib/coach/resource-files'

// ═══════════════════════════════════════════════════════════════════════════
// Small helpers
// ═══════════════════════════════════════════════════════════════════════════

type Req = { path: string; method: string; body: unknown; url: URL }
type Handler = (req: Req) => Promise<Response | undefined> | Response | undefined

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
const fail = (error: string, status = 400) => json({ error }, status)

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
/** A plain data route: long enough to see a spinner, short enough not to notice. */
const beat = () => sleep(150 + Math.floor(Math.random() * 150))

/** A stable number from a string — the same request picks the same wording. */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
/** "Thinking" time for an AI route. Tied to the input so it varies between
    requests but a visitor repeating one sees the same pause. */
const think = (seed: string) => sleep(700 + (hash(seed) % 900))
// `>>> 0` because callers shift the seed to get a second, independent choice,
// and a signed shift of a large hash is negative.
const pick = <T,>(list: T[], seed: number): T => list[(seed >>> 0) % list.length]
/** Keep the first item where it is (it is the highest-leverage one) and rotate the rest. */
function rotate<T>(list: T[], seed: number, take: number): T[] {
  if (list.length <= 1) return list.slice(0, take)
  const rest = list.slice(1)
  const k = (seed >>> 0) % rest.length
  return [list[0], ...rest.slice(k), ...rest.slice(0, k)].slice(0, take)
}

const obj = (b: unknown): Row =>
  b && typeof b === 'object' && !(typeof FormData !== 'undefined' && b instanceof FormData) ? (b as Row) : {}
const isForm = (b: unknown): b is FormData => typeof FormData !== 'undefined' && b instanceof FormData
const str = (v: unknown, max = 4000) => String(v ?? '').trim().slice(0, max)
const lc = (v: unknown) => str(v).toLowerCase()
const firstName = (name: unknown, fallback = 'there') => str(name).split(/\s+/)[0] || fallback
const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s)
const upperFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const sentence = (s: string) => { const t = upperFirst(s.trim()); return !t || /[.!?…]$/.test(t) ? t : `${t}.` }
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
/** Split prose into sentences. Written without a lookbehind, which the build target predates. */
const sentences = (s: string): string[] => (s.match(/[^.!?]+[.!?]*\s*/g) || []).map(x => x.trim()).filter(Boolean)
const listOf = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(x => str(x)).filter(Boolean)
    : typeof v === 'string' ? v.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []

const aOrAn = (word: string) => (/^[aeiou]/i.test(word.trim()) ? 'an' : 'a')
/** "09:30" → "9.30am", the way a parent would write it. */
const clockTime = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h)) return t
  return `${((h + 11) % 12) + 1}${m ? `.${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`
}
const pad2 = (n: number) => String(n).padStart(2, '0')
const isoDay = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const today = () => isoDay(new Date())
const dayKey = (v: unknown) => String(v ?? '').slice(0, 10)
const nowISO = () => new Date().toISOString()
const longDate = (d?: string | null) => {
  if (!d) return ''
  const t = new Date(`${dayKey(d)}T00:00:00`)
  return isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
const pounds = (n: number) => '£' + Number(n).toFixed(Number(n) % 1 ? 2 : 0)

// ── The store, read defensively ─────────────────────────────────────────────
const same = (a: unknown, b: unknown) => lc(a) !== '' && lc(a) === lc(b)
const byId = (table: string, id: unknown): Row | undefined =>
  id ? demoTable(table).find(r => String(r?.id) === String(id)) : undefined
const playerNamed = (name: unknown): Row | undefined =>
  str(name) ? demoTable('coach_players').find(p => same(p?.name, name)) : undefined

function profile() {
  const p = byId('sports_profiles', DEMO_COACH_ID) || demoTable('sports_profiles')[0] || {}
  return {
    row: p as Row,
    brand: str(p.brand_name) || 'Lumio Tennis Club',
    coach: str(p.display_name) || 'Vincent Jones',
    slug: str(p.portal_slug) || 'demo',
    email: str(p.contact_email) || DEMO_EMAIL,
    phone: str(p.contact_phone || p.phone),
    logo: (p.brand_logo_url as string | null) ?? null,
    avatar: (p.avatar_url as string | null) ?? null,
  }
}

/** Rows about one player: by id, plus rows written before ids existed (name only). */
function rowsFor(table: string, player: Row): Row[] {
  return demoTable(table).filter(r =>
    (r?.player_id != null && String(r.player_id) === String(player.id)) ||
    (r?.player_id == null && same(r?.player_name, player.name)))
}
const newestFirst = (col: string) => (a: Row, b: Row) => String(b?.[col] ?? '').localeCompare(String(a?.[col] ?? ''))

// ── Who the content is for ──────────────────────────────────────────────────
// Stage ids in ladder order (RACKET_STAGES in coach-db.ts). Kept as a local list
// rather than imported: coach-db owns the database client, and this file is what
// that client's fetches are answered by — a cycle is not worth nine strings.
const STAGE_ORDER = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black']

type Level = 0 | 1 | 2
type Ctx = { name: string; first: string; lvl: Level; age: number | null; junior: boolean; stage: string; player: Row | null }

function levelOf(stage: unknown, standard: unknown): Level {
  const i = STAGE_ORDER.indexOf(lc(stage).replace(/\s*racket$/, ''))
  if (i >= 0) return i <= 2 ? 0 : i <= 5 ? 1 : 2
  const s = lc(standard)
  if (/begin|start|new|mini|red|tots/.test(s)) return 0
  if (/county|perform|advanc|elite|tournament|national|regional/.test(s)) return 2
  return 1
}

function ctxFor(playerName?: unknown, racket?: unknown, standard?: unknown): Ctx {
  const p = playerNamed(playerName) || null
  const age = p && Number(p.age) > 0 ? Number(p.age) : null
  const stage = lc(racket || p?.racket_stage).replace(/\s*racket$/, '')
  const adultCategory = lc(p?.category) === 'adult'
  return {
    name: str(playerName) || str(p?.name),
    first: firstName(playerName || p?.name, 'the player'),
    lvl: levelOf(stage, standard || p?.level || p?.category),
    age,
    junior: age != null ? age < 16 : !adultCategory && !!(p?.parent_name || p?.parent_email),
    stage,
    player: p,
  }
}

/** The ball and court a warm-up should start on. Age decides for the youngest;
    everyone else is on a full court with a yellow ball. */
function ballFor(c: Ctx): string {
  if (c.age != null && c.age <= 8) return 'red balls on a mini court'
  if (c.age != null && c.age <= 9) return 'orange balls on a three-quarter court'
  if (c.age != null && c.age <= 10 && c.lvl === 0) return 'green balls on a full court'
  return 'the service boxes, then back to the baseline'
}
const stageLabel = (c: Ctx) => (c.stage ? `${upperFirst(c.stage)} racket` : '')
const n3 = (c: Ctx, a: number, b: number, d: number) => [a, b, d][c.lvl]

// ═══════════════════════════════════════════════════════════════════════════
// The coaching library
//
// One entry per subject a tennis lesson is usually about. Every AI route for an
// individual player — the session plan, the lesson summary, the write-up, the
// targets — draws on the same entry, so a plan for "second serve" and the
// summary of that lesson talk about the same faults, cues and drills. That
// consistency is most of what makes the real Lumio Coach read like one coach.
// ═══════════════════════════════════════════════════════════════════════════

type Drill = { name: string; setup: string; target: (c: Ctx) => string; cue: string }
type Theme = {
  key: string
  /** How it reads mid-sentence: "the serve", "movement and recovery". */
  label: string
  match: RegExp
  /** What the block is for, as "…is about <aim>". */
  aim: string
  /** The usual thing in the way, as a noun phrase. */
  fault: string
  /** What that fault costs in a match. */
  cost: string
  warm: string
  points: string[]
  drills: Drill[]
  /** The live game the session finishes on. */
  live: string
  pressureCue: string
  kit: string[]
  homework: string
  measure: (c: Ctx) => string
  next: string
  takeaways: string[]
}

const THEMES: Theme[] = [
  {
    key: 'serve', label: 'the serve', match: /serv|toss|ace|double fault/i,
    aim: 'a serve that starts with a toss in the same place every time',
    fault: 'the toss drifting back over the head, so the racket chases the ball and the legs never join in',
    cost: 'free points on second serve',
    warm: 'Shoulder circles and throwing: ten overarm throws from the service line over the net, then ten from the baseline — the throw is the serve without the racket.',
    points: [
      'Toss first: straight arm, release at eye level, ball landing a racket-length inside the baseline at one o’clock',
      'Continental grip, checked before every serve — the edge of the racket leads up to the ball',
      'Trophy position with a still head: tossing arm up, hitting elbow back, weight loaded on the front hip',
      'Legs start the swing — bend, then drive up into contact rather than falling off to the side',
      'A second serve is a shape, not a slow first serve: brush up from seven to one o’clock and clear the net by a racket-length',
      'One routine every time: bounce, pick the target, breathe out, go',
    ],
    drills: [
      { name: 'Toss and catch', setup: 'Tossing arm only, with a racket laid on the ground at one o’clock as the landing target', target: c => `${n3(c, 6, 8, 9)} of 10 tosses landing on the strings`, cue: 'Lift it, don’t flick it' },
      { name: 'Kneeling serves', setup: 'Front knee down on the service line, continental grip, serving with the arm and forearm turn only', target: c => `${n3(c, 5, 7, 8)} of 10 in on each side`, cue: 'Edge up, then turn it over' },
      { name: 'Three-target ladder', setup: 'Cones wide, body and T in each box; the target is called out loud before the toss', target: c => `the called target hit ${n3(c, 2, 3, 4)} times before changing box`, cue: 'Pick it, see it, serve it' },
      { name: 'Second-serve ten', setup: 'Second serves only, over a rope tied a racket-length above the net tape', target: c => `${n3(c, 5, 7, 8)} of 10 over the rope and in`, cue: 'Up the back of the ball' },
      { name: 'Serve plus one', setup: 'Serve, the return is fed back through the middle, and the next ball goes to the open court', target: c => `${n3(c, 4, 6, 7)} of 10 patterns finished`, cue: 'Land, recover, hit your spot' },
    ],
    live: 'Second-serve tiebreak to seven: one serve only on every point, and a double fault costs two.',
    pressureCue: 'Same routine at 5–5 as at 0–0',
    kit: ['Basket of about 60 balls', '6 flat cones for targets', 'Rope or spare net for height over the tape', 'Throw-down lines to mark the toss landing spot'],
    homework: 'Twenty tosses a day against a wall or fence line — straight arm, catch without moving the feet. No racket needed.',
    measure: c => `${n3(c, 5, 7, 8)} of 10 second serves in play with a full swing`,
    next: 'Second-serve shape under scoreboard pressure, then serve plus one',
    takeaways: ['The toss decides the serve — if it is wrong, catch it and start again', 'A second serve is hit up and with spin, never slower and flatter', 'The same routine before every serve, in practice and in matches'],
  },
  {
    key: 'return', label: 'the return of serve', match: /return|receiv/i,
    aim: 'a return that starts the point on level terms instead of defending from the first ball',
    fault: 'a full groundstroke swing at a ball that has arrived too quickly for one',
    cost: 'the first two shots of every return game',
    warm: 'Split-step timing in pairs: one partner drops a ball from shoulder height, the other splits as it leaves the hand and catches it after one bounce.',
    points: [
      'Split-step as the server makes contact — land on the balls of the feet, ready to push either way',
      'Shorten the backswing: turn the shoulders, keep the racket in front of the body, and let the server’s pace do the work',
      'Stand where the serve tells you: a step inside the baseline for second serves, a step back for the big first',
      'Deep through the middle first — take away the server’s angle before trying to hit a winner',
      'Move forward through contact so the weight goes into the ball, not backwards off it',
    ],
    drills: [
      { name: 'Drop and split', setup: 'Coach serves from the service line at half pace; returner calls “split” out loud at contact', target: c => `${n3(c, 6, 8, 9)} of 10 returns played after a clean split`, cue: 'Up as they hit, down as you see it' },
      { name: 'Middle third', setup: 'A two-racket-wide channel down the centre past the service line is the only target', target: c => `${n3(c, 5, 6, 8)} of 10 returns landing in the channel`, cue: 'Short swing, long finish' },
      { name: 'Step-in seconds', setup: 'Second serves only, returner starts a full step inside the baseline', target: c => `${n3(c, 4, 6, 7)} of 10 taken on the rise and landing past the service line`, cue: 'Step, turn, punch' },
      { name: 'Return plus one', setup: 'Return crosscourt, coach feeds the next ball short, attack down the line', target: c => `${n3(c, 3, 5, 6)} of 10 patterns finished`, cue: 'Return to recover, then go' },
    ],
    live: 'Return games only, first to four: the returner starts every game at 15–30 up, and loses the lead if a return misses long.',
    pressureCue: 'Big target, short swing',
    kit: ['Basket of about 60 balls', 'Throw-down lines for the middle channel', '4 cones for returner positions', 'Spare rackets to mark the channel width'],
    homework: 'Shadow twenty split-steps a day in front of a mirror, turning the shoulders each way without taking the racket back past the hip.',
    measure: c => `${n3(c, 5, 7, 8)} of 10 second-serve returns landing past the service line`,
    next: 'Return position against different serves, then return plus one',
    takeaways: ['The split-step is the return — late feet mean a late racket', 'A shorter swing is a more reliable swing against pace', 'Deep and central beats wide and risky on the first ball'],
  },
  {
    key: 'forehand', label: 'the forehand', match: /forehand|topspin|fh\b/i,
    aim: 'a forehand with shape — height over the net and depth past the service line without forcing it',
    fault: 'contact drifting in beside the body, so the arm does the work the legs and hips should be doing',
    cost: 'depth on the rally ball, which hands the opponent the first attack',
    warm: 'Mini-tennis forehands only, service box to service box, counting the rally out loud and catching the ball on the strings every fifth shot.',
    points: [
      'Unit turn first: shoulders and hips turn together as soon as the ball is read, non-hitting hand on the throat of the racket',
      'Contact out in front and a comfortable arm’s length from the body — make space with the feet, not the elbow',
      'Low to high: the racket head drops below the ball and brushes up, finishing over the opposite shoulder',
      'Load the outside leg and push up through the shot so the legs supply the pace',
      'Recover with a crossover step the moment the ball is gone — the shot is not finished until the split-step',
      'Net clearance is the target: two racket-heights over the tape on the rally ball',
    ],
    drills: [
      { name: 'Drop-feed shape', setup: 'Self-fed from behind the baseline, over a rope a racket-height above the net', target: c => `${n3(c, 6, 8, 9)} of 10 over the rope and past the service line`, cue: 'Under it, up it, over it' },
      { name: 'Deep-zone crosscourt', setup: 'Crosscourt rally into a zone marked a racket-length inside the baseline', target: c => `a rally of ${n3(c, 6, 10, 16)} with every ball past the service line`, cue: 'Height gives you depth' },
      { name: 'Inside-out two', setup: 'Two balls fed to the middle: first crosscourt, second run round and hit inside-out', target: c => `${n3(c, 4, 6, 7)} of 10 pairs landed`, cue: 'Small steps to make the space' },
      { name: 'Figure of eight', setup: 'One player hits every ball crosscourt, the other every ball down the line', target: c => `${n3(c, 8, 12, 20)} shots without a mistake, then swap roles`, cue: 'Recover before you admire it' },
    ],
    live: 'Crosscourt forehand points to eleven: the rally starts with a fed ball, and a ball landing short of the service line can be attacked down the line.',
    pressureCue: 'Shape first, pace second',
    kit: ['Basket of about 60 balls', 'Rope or spare net for height', 'Throw-down lines for the deep zone', '4 cones for recovery marks'],
    homework: 'Thirty shadow forehands a day in front of a mirror, freezing on the finish to check the racket is over the opposite shoulder.',
    measure: c => `a crosscourt rally of ${n3(c, 8, 14, 20)} with every ball past the service line`,
    next: 'Changing direction off the forehand without losing height',
    takeaways: ['Turn first, then move — the swing starts with the shoulders', 'Height over the net is what makes depth', 'The feet make the space; the arm stays relaxed'],
  },
  {
    key: 'backhand', label: 'the backhand', match: /backhand|slice|bh\b|two[- ]hand|one[- ]hand/i,
    aim: 'a backhand that holds up in a long rally and does not need protecting',
    fault: 'the shoulders opening early, so the ball is hit with the arms alone and floats short',
    cost: 'every rally that gets pinned into that corner',
    warm: 'Mini-tennis backhands only from the service line, top hand doing the work — five in a row with the bottom hand off the racket if two-handed.',
    points: [
      'Turn the shoulders until the back is half-facing the net — chin over the front shoulder at the start of the swing',
      'On the two-hander the top hand drives: think of it as a forehand with the other hand',
      'Step into the ball with the front foot and keep the head still through contact',
      'Finish with the elbows high and the racket over the shoulder — a full finish, not a jab',
      'The slice stays on the same line: high to low, firm wrist, strings finishing towards the target',
      'Recover behind the baseline centre mark after every ball, even in a drill',
    ],
    drills: [
      { name: 'Top-hand only', setup: 'Close feeds from the service line, bottom hand off the grip, hitting crosscourt', target: c => `${n3(c, 5, 7, 8)} of 10 over the net with a full finish`, cue: 'Left hand hits it' },
      { name: 'Crosscourt lock', setup: 'Backhand crosscourt rally, both players recovering to a cone a step from the centre', target: c => `a rally of ${n3(c, 6, 10, 16)} past the service line`, cue: 'Turn, step, finish' },
      { name: 'Slice to drive', setup: 'Alternate one slice and one drive on consecutive balls, same target zone', target: c => `${n3(c, 4, 6, 7)} of 10 pairs in the zone`, cue: 'Change the swing, not the feet' },
      { name: 'Down-the-line change', setup: 'Three crosscourt, then the fourth down the line and close to the net', target: c => `${n3(c, 3, 5, 6)} of 8 sequences finished`, cue: 'Earn the change with depth' },
    ],
    live: 'Backhand-corner points to eleven: every point starts with a feed to the backhand, and a backhand winner counts double.',
    pressureCue: 'Shoulder under the chin, then swing',
    kit: ['Basket of about 60 balls', 'Throw-down lines for target zones', '4 cones for recovery marks', 'Rope for net height'],
    homework: 'Fifty wall backhands twice a week from five big steps back, counting how many in a row before the ball gets away.',
    measure: c => `a backhand crosscourt rally of ${n3(c, 8, 12, 18)} without a short ball`,
    next: 'Backhand down the line as a change of direction, off a deep crosscourt ball',
    takeaways: ['Shoulders turn before the racket goes back', 'On the two-hander, the top hand is in charge', 'A deep crosscourt backhand is a weapon, not a holding shot'],
  },
  {
    key: 'net', label: 'the net game', match: /volley|net\b|net play|approach|overhead|smash|transition/i,
    aim: 'coming forward on the right ball and finishing with a volley that is punched, not swung',
    fault: 'a backswing on the volley, which turns a simple block into a timing problem',
    cost: 'points that were already won from the baseline',
    warm: 'Volley to volley from the service lines, co-operative, catching the ball on the strings after every third volley to keep the hands soft.',
    points: [
      'Continental grip for everything at the net — no changes between forehand and backhand volley',
      'Split-step as the opponent hits, then step across with the opposite foot',
      'No backswing: the racket stays in front, and the step supplies the punch',
      'First volley deep to the feet or the open corner; the second one finishes',
      'Approach on the short ball only, down the line, and follow the line of the ball in',
      'On the overhead, turn side-on and point at the ball with the free hand before anything else',
    ],
    drills: [
      { name: 'Catch volleys', setup: 'Close feeds, the volley is “caught” on the strings and placed into a hoop past the service line', target: c => `${n3(c, 5, 7, 8)} of 10 in the hoop on each side`, cue: 'Catch it out in front' },
      { name: 'Approach and close', setup: 'Short ball fed, approach down the line, split, then one volley crosscourt', target: c => `${n3(c, 4, 6, 7)} of 10 sequences finished`, cue: 'Hit, follow, split' },
      { name: 'Two-volley finish', setup: 'First volley fed low and deep to the middle, second fed higher to put away', target: c => `${n3(c, 4, 6, 8)} of 10 pairs with the first volley past the service line`, cue: 'Deep, then done' },
      { name: 'Overhead reset', setup: 'Touch the net with the racket, lob fed, overhead, then back to the net', target: c => `${n3(c, 4, 6, 7)} of 10 overheads in the court`, cue: 'Side-on, point, reach' },
    ],
    live: 'Approach points to eleven: the coach feeds a short ball to start, and a point won at the net is worth two.',
    pressureCue: 'Feet first, hands quiet',
    kit: ['Basket of about 60 balls', '2 hoops or target mats', '6 cones for approach lines', 'Throw-down lines for the split-step spot'],
    homework: 'Fifty volleys a session against a wall from three steps away — no bounce, continental grip, counting the longest run.',
    measure: c => `${n3(c, 5, 7, 8)} of 10 first volleys landing past the service line`,
    next: 'Choosing the ball to come in on, then the second volley under pressure',
    takeaways: ['A volley is a step and a block — there is no swing', 'Come in on the short ball, not the hopeful one', 'The first volley sets it up; the second one wins it'],
  },
  {
    key: 'movement', label: 'movement and recovery', match: /footwork|movement|moving|recover|split|agility|speed|balance|fitness|cardio/i,
    aim: 'arriving balanced and early, so the stroke that is already there gets a chance to work',
    fault: 'standing and watching after the shot instead of recovering, which makes every next ball a rushed one',
    cost: 'a metre of court on every exchange',
    warm: 'Ladder and line work: side-steps along the baseline, crossover steps back to the centre, and a split-step on every clap for three minutes.',
    points: [
      'Split-step every time the opponent hits — small, on the balls of the feet, never flat',
      'First step is the big one: push off the outside foot towards the ball',
      'Small adjusting steps in the last two metres so the contact point is chosen, not accepted',
      'Hit from a wide, balanced base — head still, weight moving into the court',
      'Crossover step to recover, then side-steps, and be still again before the next ball is struck',
    ],
    drills: [
      { name: 'Spider run', setup: 'Five balls on the lines, collected one at a time and returned to a racket on the centre mark', target: c => `under ${n3(c, 24, 20, 17)} seconds, with a split-step at the centre every time`, cue: 'Low to turn, tall to run' },
      { name: 'Two-ball recovery', setup: 'Wide forehand fed, recover round a cone on the centre mark, wide backhand fed', target: c => `${n3(c, 5, 7, 8)} of 10 pairs hit from a balanced base`, cue: 'Hit, cross, shuffle, split' },
      { name: 'Shadow ten', setup: 'Coach points to a corner; player moves, shadows the stroke and recovers before the next point', target: () => 'ten calls in a row without being caught moving at the “hit”', cue: 'Be still when they strike' },
      { name: 'Live ball, three recoveries', setup: 'Crosscourt rally where each player must touch the centre cone with a foot between shots', target: c => `a rally of ${n3(c, 5, 8, 12)} with every recovery made`, cue: 'The shot ends at the split' },
    ],
    live: 'Side-to-side points to eleven: the coach feeds the first ball wide, and a player caught flat-footed at contact loses the point whoever hits the winner.',
    pressureCue: 'Split, then decide',
    kit: ['Agility ladder', '8 cones', 'Basket of about 40 balls', 'Stopwatch'],
    homework: 'Three sets of twenty split-steps and ten crossover recoveries each way, every other day — two minutes in total.',
    measure: c => `the spider run under ${n3(c, 24, 20, 17)} seconds with a split-step at every return to centre`,
    next: 'Movement to the wide ball and the first step out of the corner',
    takeaways: ['The split-step is where every good shot starts', 'Recover first, then look at where the ball went', 'Small steps near the ball, big steps away from it'],
  },
  {
    key: 'consistency', label: 'rally consistency', match: /consisten|rally|depth|control|basics|foundation|groundstroke|accuracy|technique|technical|general/i,
    aim: 'a rally ball that can be repeated — the same height, the same depth, as many times as the point needs',
    fault: 'changing the swing to chase pace, so the rally ball lands short or long as soon as the tempo goes up',
    cost: 'the unforced errors that decide most matches at this level',
    warm: 'Mini-tennis to twenty, then back to the baseline at half pace with a target of ten each before anybody hits out.',
    points: [
      'One rally speed, held: about seven out of ten, with the same swing on the first ball and the fifteenth',
      'Net clearance of two racket-heights on anything from behind the baseline',
      'Crosscourt is the default — longer court, lower net, and time to recover',
      'Depth before direction: past the service line first, then aim for a side',
      'Read the incoming ball early and decide in the first step — attack, rally or defend',
      'Breathe out on contact; a held breath is a tight arm',
    ],
    drills: [
      { name: 'Service-line gate', setup: 'Co-operative crosscourt rally; only balls landing past the service line count', target: c => `${n3(c, 8, 14, 24)} counted balls in one rally`, cue: 'High over the middle of the net' },
      { name: 'Four-zone depth', setup: 'Court split into four zones by throw-down lines; coach calls the zone on each feed', target: c => `${n3(c, 5, 7, 8)} of 10 into the called zone`, cue: 'Aim for a window, not a line' },
      { name: 'Rally ladder', setup: 'Rally targets of 6, 10, 14 and 18 — a mistake drops the pair one rung', target: c => `the ${n3(c, 10, 14, 18)} rung reached inside the block`, cue: 'Same swing, every ball' },
      { name: 'Two crosscourt, one line', setup: 'Pattern rally: two crosscourt, then a change down the line and recover', target: c => `${n3(c, 3, 5, 7)} full patterns in a row`, cue: 'Earn the change' },
    ],
    live: 'Baseline points to eleven with a tax on errors: a ball in the net loses two points, a ball long loses one.',
    pressureCue: 'Height is your safety',
    kit: ['Basket of about 60 balls', 'Throw-down lines for depth zones', 'Rope for net height', '4 cones'],
    homework: 'A wall rally twice a week: beat the previous best number in a row, forehand and backhand counted separately.',
    measure: c => `a crosscourt rally of ${n3(c, 10, 16, 24)} with every ball past the service line`,
    next: 'Holding the same rally ball while changing direction',
    takeaways: ['Rally at a speed that can be repeated all day', 'Miss long before missing in the net', 'Crosscourt is the percentage shot — use it until there is a reason not to'],
  },
  {
    key: 'tactics', label: 'patterns of play', match: /tactic|pattern|match|point|strateg|decision|shot selection|compet|tournament|game plan/i,
    aim: 'playing the point on purpose — a first pattern on serve and on return, chosen before the ball is in play',
    fault: 'hitting the ball back to where it came from and waiting for the opponent to miss',
    cost: 'the close games, where the player with a plan wins the big points',
    warm: 'Half-court points from the service line, first to seven, where every player says their target out loud before they hit.',
    points: [
      'Serve plus one: decide where the serve goes and where the next ball goes before stepping up to the line',
      'Build with crosscourt depth, change down the line only off a ball that lands short',
      'Play to the weaker side until it breaks down, then go to the open court',
      'Know the three ball types — attack, rally, defend — and pick the right shot for each',
      'At 30–all and deuce, play the highest-percentage pattern, not the newest one',
    ],
    drills: [
      { name: 'Serve plus one, called', setup: 'Server announces the pattern (for example “wide, then open court”) and plays the point out', target: c => `${n3(c, 3, 5, 6)} of 10 points where the called pattern is played`, cue: 'Say it, then play it' },
      { name: 'Short-ball trigger', setup: 'Crosscourt rally; the coach calls “go” on any ball landing inside the service line', target: c => `${n3(c, 4, 6, 7)} of 10 triggers attacked down the line`, cue: 'Short ball, change the line' },
      { name: 'Weak-side siege', setup: 'Every ball to the opponent’s backhand until a short reply, then finish', target: c => `${n3(c, 3, 4, 6)} of 8 points won using the pattern`, cue: 'Patience, then pounce' },
      { name: 'Scoreboard starts', setup: 'Games started at 30–40, deuce and 40–30, alternating server', target: c => `${n3(c, 3, 4, 5)} of 8 games held from behind`, cue: 'Best pattern on the big point' },
    ],
    live: 'A tiebreak to ten where each player writes their serve pattern down first, and wins a bonus point every time they use it and win.',
    pressureCue: 'Plan first, ball second',
    kit: ['Basket of about 40 balls', 'Whiteboard or scorecards for patterns', '6 cones for target areas', 'Throw-down lines'],
    homework: 'Before the next match, write down one serve pattern and one return pattern, and tally how often each was actually played.',
    measure: c => `the chosen serve pattern played on ${n3(c, 4, 6, 7)} of 10 service points in a practice set`,
    next: 'A second pattern for when the first one is read',
    takeaways: ['Decide the first two shots before the point starts', 'Crosscourt to build, down the line to finish', 'On big points, play the pattern that has worked all day'],
  },
  {
    key: 'doubles', label: 'doubles', match: /doubles|partner|poach|formation|mixed/i,
    aim: 'two players moving as one — the net player active, the server’s partner knowing where the serve is going',
    fault: 'the net player standing still and watching the rally go past',
    cost: 'the middle of the court, where most doubles points are decided',
    warm: 'Two-up, two-back volley rallies down the middle, calling “mine” or “yours” on every ball.',
    points: [
      'Serve to the body or the T so the partner at the net can cross',
      'Net player starts a step inside the service box and moves with the ball, never the opponent',
      'Middle solves the riddle: when in doubt, play between the two opponents',
      'Return crosscourt and low; the lob is the answer to a net player who crosses early',
      'Talk between every point — one target for the serve, one plan for the first volley',
    ],
    drills: [
      { name: 'Signal and cross', setup: 'Net player signals stay or go behind the back; server serves to the agreed spot', target: c => `${n3(c, 3, 5, 6)} of 10 poaches finished`, cue: 'Go on the toss, commit' },
      { name: 'Crosscourt alley', setup: 'Returner must land the return crosscourt past the net player into the doubles half', target: c => `${n3(c, 5, 7, 8)} of 10 returns past the net player`, cue: 'Low over the low part of the net' },
      { name: 'Middle ball', setup: 'Coach feeds down the middle to two players at the net; they must call it', target: () => 'ten in a row with no silent ball', cue: 'Forehand in the middle takes it' },
      { name: 'Lob and switch', setup: 'Lob fed over the net player; partner covers, both switch sides and reset', target: c => `${n3(c, 4, 6, 7)} of 10 switches completed and the ball back in play`, cue: 'Call “switch”, then move' },
    ],
    live: 'Doubles tiebreaks to ten: a point won by a poach or a volley through the middle is worth two.',
    pressureCue: 'Move with the ball, talk every point',
    kit: ['Basket of about 40 balls', '6 cones for net-player start positions', 'Throw-down lines to mark the middle channel'],
    homework: 'Agree three hand signals with a regular partner and use them on every service point in the next club session.',
    measure: c => `the net player touching the ball in ${n3(c, 3, 4, 5)} of 10 service points`,
    next: 'Formations on serve and what to do when the returner lobs',
    takeaways: ['An active net player wins more points than a big serve', 'Play the middle when unsure', 'Talk before every point, even if it is one word'],
  },
  {
    key: 'mental', label: 'playing under pressure', match: /mental|confiden|pressure|nerves|focus|routine|attitude|resilien|composure|belief/i,
    aim: 'a routine between points that is the same at 5–5 as it is at 1–1',
    fault: 'the last mistake being carried into the next point, so one error becomes three',
    cost: 'runs of games rather than single points',
    warm: 'Ten-ball rallies at half pace where the only job is to breathe out on every contact and say “yes” on every recovery.',
    points: [
      'Sixteen seconds between points: turn away, strings, breathe, plan, bounce',
      'Judge the decision, not the result — a good shot that missed is still the right shot',
      'One cue word per match, chosen beforehand and said on every changeover',
      'Body language first: racket in the non-hitting hand, eyes up, walk to the line like the point was won',
      'On big points, slow down and play the pattern that has been working',
    ],
    drills: [
      { name: 'Routine rallies', setup: 'Play points to five; the full between-point routine must be done or the point is replayed', target: c => `${n3(c, 6, 8, 10)} points in a row with the routine complete`, cue: 'Turn, breathe, plan' },
      { name: 'Down a break', setup: 'Sets start at 2–4 and 15–30; the player behind serves', target: c => `${n3(c, 1, 2, 2)} of 3 sets levelled`, cue: 'One point, then the next one' },
      { name: 'Error reset', setup: 'After any unforced error the player must name the decision as right or wrong before the next ball', target: () => 'ten errors reviewed out loud without a negative comment', cue: 'Decision, not result' },
      { name: 'Pressure serve', setup: 'One second serve at 30–40 after a thirty-second sprint and recovery', target: c => `${n3(c, 4, 6, 7)} of 10 in play`, cue: 'Breathe out, then toss' },
    ],
    live: 'A deciding tiebreak to ten with the routine scored: one bonus point every time the routine is visibly completed, one lost for a racket drop or a shout.',
    pressureCue: 'Slow feet between points, quick feet during them',
    kit: ['Basket of about 30 balls', 'Scorecards', 'Stopwatch for the sixteen seconds'],
    homework: 'Write the routine on a card, keep it in the racket bag and read it at every changeover in the next match.',
    measure: c => `the routine completed on ${n3(c, 7, 8, 9)} of 10 points in a practice tiebreak`,
    next: 'Holding the routine after a bad call or a lost lead',
    takeaways: ['The routine is a skill and gets practised like one', 'A good decision is a win, whatever the ball did', 'Slow down when it matters most'],
  },
]

const DEFAULT_THEME = THEMES.find(t => t.key === 'consistency') as Theme
function themeFor(...text: unknown[]): Theme {
  const hay = text.map(t => str(t)).join(' · ')
  // Earliest mention wins: "serve, then backhand depth" is a serve session.
  let best: { t: Theme; at: number } | null = null
  for (const t of THEMES) {
    const m = hay.match(t.match)
    if (m && m.index != null && (!best || m.index < best.at)) best = { t, at: m.index }
  }
  return best?.t || DEFAULT_THEME
}
const drillLine = (d: Drill, c: Ctx) => `${d.name} — ${lowerFirst(d.setup)}. Target: ${d.target(c)}. Cue: “${d.cue}”.`

/** The last lesson on record for a player, as the session routes read it. */
function lastLesson(playerName: unknown) {
  const name = str(playerName)
  if (!name) return null
  const rows = demoTable('coach_sessions').filter(s => same(s?.player_name, name)).sort(newestFirst('session_date'))
  const r = rows[0]
  if (!r) return null
  const rj = (r.review_json || {}) as Row
  return {
    row: r,
    covered: listOf(rj.covered).join('; ') || str(r.focus) || str(r.summary, 300),
    homework: str(rj.homework),
    nextFocus: str(rj.nextFocus),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Lumio Coach — one player
// ═══════════════════════════════════════════════════════════════════════════

type Phase = { phase: string; mins: number; detail: string; cue: string }

/** Minutes per phase that add up to the lesson length exactly. The real route
    throws a run-sheet away if it does not fit the clock, and the UI prints the
    total, so this is not allowed to be a minute out. */
function splitClock(mins: number, shares: number[]): number[] {
  const out = shares.map(s => Math.max(1, Math.round(mins * s)))
  out[out.length - 1] = Math.max(1, out[out.length - 1] + (mins - out.reduce((a, b) => a + b, 0)))
  return out
}

// POST /api/coach/session-draft — the full plan: focus points, drills, a timed
// run-sheet and a kit list.
const sessionDraft: Handler = async ({ body }) => {
  const b = obj(body)
  const mins = Math.max(15, Math.min(240, Number(b.duration) || 60))
  const c = ctxFor(b.player, b.racket, b.standard)
  const theme = themeFor(b.focus, b.note)
  const seed = hash(`${b.player}|${b.focus}|${b.type}|${mins}|${b.note}`)
  await think(`draft|${seed}`)

  const last = lastLesson(b.player)
  const group = /group|squad|cardio|camp/i.test(str(b.type))
  const matchPlay = /match/i.test(str(b.type))
  const count = mins <= 30 ? 2 : mins <= 45 ? 3 : 4
  const drills = rotate(theme.drills, seed, count)
  const points = rotate(theme.points, seed >> 3, 4)
  const who = group ? 'the group' : c.first

  // 15 / 25 / 20 / 20 / 20, with the decision block dropped on a short lesson.
  const shares = drills.length >= 3 ? [0.15, 0.25, 0.2, 0.2, 0.2] : [0.2, 0.3, 0.25, 0.25]
  const clock = splitClock(mins, shares)
  const rotation = group ? ' Work in pairs and rotate every three minutes so nobody queues.' : ''
  const sheet: Phase[] = [{
    phase: 'Warm-up with a purpose',
    mins: clock[0],
    detail: `${last?.homework ? `Ask about the homework from last time (${lowerFirst(last.homework.replace(/\.$/, ''))}) while warming up. ` : ''}Start on ${ballFor(c)}. ${theme.warm}`,
    cue: 'Feet first, then the ball',
  }, {
    phase: `Isolate — ${drills[0].name}`,
    mins: clock[1],
    detail: `${drills[0].setup}. Target: ${drills[0].target(c)}.${rotation}`,
    cue: drills[0].cue,
  }, {
    phase: `Build — ${drills[1].name}`,
    mins: clock[2],
    detail: `${drills[1].setup}. Target: ${drills[1].target(c)}. Move on only when the target is hit twice.`,
    cue: drills[1].cue,
  }]
  if (drills[2]) sheet.push({
    phase: `Add a decision — ${drills[2].name}`,
    mins: clock[3],
    detail: `${drills[2].setup}. Target: ${drills[2].target(c)}. This is where ${who} has to choose, not just repeat.`,
    cue: drills[2].cue,
  })
  sheet.push({
    phase: matchPlay ? 'Match play under the same rule' : 'Under pressure',
    mins: clock[clock.length - 1],
    detail: `${theme.live} Keep the last two minutes for one question — what changed today? — and the homework.`,
    cue: theme.pressureCue,
  })

  const history = !!(last && (last.covered || last.homework || last.nextFocus))
  const note = pick([
    `Today is for one thing: ${theme.aim}. Watch for ${theme.fault} — when it appears, go back a step rather than pushing on.`,
    `The whole ${mins} minutes is about ${theme.aim}. The tell is ${theme.fault}; if you see it under pressure at the end, that is next week’s starting point, not a failure.`,
    `Keep ${who} on ${theme.label} even when something else looks worth fixing — the real job is ${theme.aim}, and the thing to watch is ${theme.fault}.`,
  ], seed >> 5)

  return json({
    focus_points: points,
    drills: drills.map(d => drillLine(d, c)),
    run_sheet: sheet,
    kit: theme.kit.slice(0, 6),
    coach_note: history && last?.nextFocus
      ? `${note} It follows on from last time, when the next focus was set as “${last.nextFocus.replace(/\.$/, '')}”.`
      : note,
    built_on_history: history,
  })
}

const ratingPhrase = (r: number, first: string) =>
  r >= 5 ? `${first} had an excellent session`
    : r === 4 ? `${first} had a strong session`
      : r === 3 ? `${first} had a solid, workmanlike session`
        : r > 0 ? `${first} found today hard going, and that is useful information`
          : `${first} put in a good session`

/** The first sentence of the coach's own note, tidied — the strongest evidence
    a summary has, so it is quoted rather than paraphrased into something he did
    not say. */
const noteLead = (note: string) => sentence((sentences(note)[0] || note).slice(0, 220))

type Summary = {
  focus: string; assessment: string; covered: string[]; technique?: string[]; takeaways: string[]
  drills: string[]; homework: string; nextFocus: string; recap: string; coachNote: string; rating: number
}

function writeSummary(o: { player: unknown; focus: string; note: string; rating: number; seed: number }): Summary {
  const c = ctxFor(o.player)
  const theme = themeFor(o.focus, o.note)
  const drills = rotate(theme.drills, o.seed, 3)
  const points = rotate(theme.points, o.seed >> 2, 3)
  const them = c.first
  const assessment = pick([
    `${ratingPhrase(o.rating, c.first)}. The biggest lever right now is ${theme.aim}. What gets in the way is ${theme.fault} — and that costs ${them} ${theme.cost}. The fix is small and repeatable — “${drills[0].cue.toLowerCase()}” — and it held for long stretches today.`,
    `${ratingPhrase(o.rating, c.first)}. What stands between ${them} and the next level on ${theme.label} is ${theme.fault}. It matters because it costs ${theme.cost}. When the cue was “${drills[0].cue.toLowerCase()}” the difference was visible straight away, so that is the one thing to keep.`,
    `${ratingPhrase(o.rating, c.first)}. The priority is ${theme.aim}. The pattern to break is ${theme.fault} — it is what costs ${theme.cost} — and today showed it can be broken when the pace comes down and the cue is kept simple.`,
  ], o.seed >> 4)
  const covered = [
    ...(o.note ? [`From the court: ${noteLead(o.note)}`] : []),
    ...points.map(sentence),
    `${drills[0].name}: ${lowerFirst(drills[0].setup)}, working towards ${drills[0].target(c)}.`,
  ].slice(0, 5)
  const homework = theme.homework
  return {
    focus: o.focus || upperFirst(theme.label.replace(/^the /, '')),
    assessment,
    covered,
    takeaways: theme.takeaways.slice(0, 3),
    drills: drills.map(d => `${d.name} — target: ${d.target(c)}`),
    homework,
    nextFocus: theme.next,
    recap: `We worked on ${theme.label} today. The main thing ${c.junior ? `${c.first} is` : 'we are'} building is ${theme.aim}. Before next time: ${lowerFirst(homework.split(' — ')[0].replace(/\.$/, ''))}. Next lesson we move on to ${lowerFirst(theme.next)}.`,
    coachNote: pick([
      `Well done today, ${c.first}. The work on ${theme.label} is starting to show — keep the cue “${drills[0].cue.toLowerCase()}” in your head and it will hold in matches too.`,
      `${c.first}, that was real progress. You do not need to hit harder — you need to do the simple thing more often. Remember: “${drills[0].cue.toLowerCase()}”.`,
      `Good work, ${c.first}. I liked how you stuck with it when it felt awkward. That awkward feeling is the new habit going in.`,
    ], o.seed >> 6),
    rating: o.rating || 4,
  }
}

// POST /api/coach/lesson-summary — the sections of a lesson summary from a focus and a note.
const lessonSummary: Handler = async ({ body }) => {
  const b = obj(body)
  const focus = str(b.focus, 300), note = str(b.note, 4000)
  if (!focus && !note) return fail('Add a focus or a note first.')
  const seed = hash(`${b.player}|${focus}|${note}|${b.rating}`)
  await think(`summary|${seed}`)
  const s = writeSummary({ player: b.player, focus, note, rating: Math.round(Number(b.rating) || 0), seed })
  return json({
    assessment: s.assessment, covered: s.covered, takeaways: s.takeaways, drills: s.drills,
    homework: s.homework, nextFocus: s.nextFocus, recap: s.recap,
  })
}

/** The plain-text version stored beside the structured review (formatWriteUp in
    lib/coach/lesson-writeup.ts — that module pulls in the AI client, so the six
    lines are repeated here rather than imported). */
function formatWriteUp(r: Partial<Summary>): string {
  const parts: string[] = []
  if (r.assessment) parts.push(r.assessment)
  if (r.covered?.length) parts.push(`What we covered:\n${r.covered.map(x => `• ${x}`).join('\n')}`)
  if (r.takeaways?.length) parts.push(`Key takeaways:\n${r.takeaways.map(x => `• ${x}`).join('\n')}`)
  if (r.drills?.length) parts.push(`Drills:\n${r.drills.map(x => `• ${x}`).join('\n')}`)
  if (r.homework) parts.push(`Homework: ${r.homework}`)
  if (r.nextFocus) parts.push(`Next session: ${r.nextFocus}`)
  return parts.join('\n\n')
}

// POST /api/coach/session-complete — "Finish the session": the plan becomes a
// lesson on the player's record, written up from what the coach ticked.
const sessionComplete: Handler = async ({ body }) => {
  const b = obj(body)
  if (!b.planId) return fail('planId is required')
  const plan = byId('coach_session_plans', b.planId)
  if (!plan) return fail('Plan not found', 404)

  const sessions = demoTable('coach_sessions')
  const already = sessions.find(s => s?.plan_id != null && String(s.plan_id) === String(plan.id))
  if (already) return json({ ok: true, sessionId: already.id, written: true, duplicate: true })

  const playerName = str(plan.group_name || plan.title)
  const when = dayKey(plan.session_date) || today()
  const player = playerNamed(playerName)
  const covered = listOf(b.covered).slice(0, 12)
  const didDrills = listOf(b.drills).slice(0, 12)
  const note = str(b.note, 2000)
  const rating = typeof b.rating === 'number' && b.rating >= 1 && b.rating <= 5 ? Math.round(b.rating) : null
  const seed = hash(`${plan.id}|${covered.join('|')}|${note}`)

  let review: Row | null = null
  let aiReview = ''
  if (b.writeUp !== false) {
    await think(`complete|${seed}`)
    const c = ctxFor(playerName)
    const theme = themeFor(plan.focus, covered.join(' '), note)
    // Only what was ticked counts as covered; anything planned and unticked is
    // carried forward, never described as though it happened.
    const planned = listOf(plan.focus_points)
    const missed = planned.filter(p => !covered.some(x => same(x, p)))
    const out: Summary = {
      focus: str(plan.focus) || str(plan.title) || 'Session',
      assessment: note
        ? `${noteLead(note)} The session was built around ${lowerFirst(str(plan.focus) || theme.label)}, and the next step for ${c.first} is ${theme.aim}.`
        : `${c.first} worked on ${lowerFirst(str(plan.focus) || theme.label)} for ${Number(plan.duration_min) || 60} minutes. The thing this block is building towards is ${theme.aim}.`,
      covered: (covered.length ? covered : [str(plan.focus) || upperFirst(theme.label)]).slice(0, 5).map(sentence),
      takeaways: theme.takeaways.slice(0, 3),
      drills: didDrills,
      homework: theme.homework,
      nextFocus: missed.length ? `Pick up what we did not reach: ${lowerFirst(missed[0].replace(/\.$/, ''))}` : theme.next,
      recap: `We worked on ${lowerFirst(str(plan.focus) || theme.label)}${covered.length ? ` and got through ${covered.length} of the things planned` : ''}. Next time: ${lowerFirst(missed[0]?.replace(/\.$/, '') || theme.next)}.`,
      coachNote: `Good work today, ${c.first}. Keep hold of one thing from this session: “${theme.drills[0].cue.toLowerCase()}”.`,
      rating: rating ?? 3,
    }
    review = { ...out, source: 'session-complete' }
    aiReview = formatWriteUp(out)
  } else {
    await beat()
  }

  const row: Row = {
    id: demoId(), coach_id: DEMO_COACH_ID, staff_id: plan.staff_id ?? null,
    player_id: player?.id ?? null,
    player_name: playerName || 'Session',
    session_date: when,
    focus: (review?.focus as string) || plan.focus || plan.title || 'Session',
    rating: rating ?? (typeof review?.rating === 'number' ? review.rating : null),
    summary: note || str(plan.notes),
    ai_review: aiReview,
    review_json: review,
    plan_id: plan.id,
    created_at: nowISO(), updated_at: nowISO(),
  }
  sessions.unshift(row)

  // They were there — attendance is the same fact as the session happening.
  if (player?.id) {
    const att = demoTable('coach_attendance')
    if (!att.some(a => String(a?.player_id) === String(player.id) && dayKey(a?.session_date) === when)) {
      att.unshift({ id: demoId(), coach_id: DEMO_COACH_ID, player_id: player.id, session_date: when, present: true, created_at: nowISO() })
    }
  }
  plan.completed_at = nowISO()
  return json({ ok: true, sessionId: row.id, written: !!review, aiError: null })
}

// POST /api/coach/ai-review — the older free-text lesson review (LiveModules).
const aiReview: Handler = async ({ body }) => {
  const b = obj(body)
  const seed = hash(`${b.player_name}|${b.focus}|${b.summary}`)
  await think(`review|${seed}`)
  const s = writeSummary({ player: b.player_name, focus: str(b.focus, 300), note: str(b.summary, 2000), rating: Math.round(Number(b.rating) || 0), seed })
  return json({
    review: [
      s.assessment,
      `What we worked on:\n${s.covered.map(x => `• ${x}`).join('\n')}`,
      `To practise before next time: ${s.homework}`,
      `Next session: ${s.nextFocus}.`,
      s.coachNote,
    ].join('\n\n'),
  })
}

// POST /api/coach/message-draft — the coach's rough note, tidied into something
// a parent can read. The coach's own words stay the body; what is added is the
// greeting, the order and the sign-off.
const messageDraft: Handler = async ({ body }) => {
  const b = obj(body)
  const intent = str(b.intent, 2000)
  if (!intent) return fail('Write what you want to say first.')
  const me = profile()
  const recipients = listOf(b.recipients)
  const channels = listOf(b.channels).map(x => x.toLowerCase())
  const seed = hash(`${intent}|${recipients.join(',')}`)
  await think(`message|${seed}`)

  const hello = recipients.length === 1 ? `Hi ${firstName(recipients[0])},` : recipients.length === 2 ? `Hi ${firstName(recipients[0])} and ${firstName(recipients[1])},` : 'Hi everyone,'
  const core = intent.split(/\n+/).map(p => sentences(p).map(sentence).join(' ')).filter(Boolean).join('\n\n')
  const topic =
    /well done|proud|brilliant|fantastic|great (work|session|effort)|progress|improv|moved up|congrat/i.test(intent) ? 'praise'
      : /cancel|rain|weather|postpon|called off|reschedul|moved to|moving to|change of (time|court|venue)/i.test(intent) ? 'change'
        : /pay|invoice|balance|owe|fee|overdue/i.test(intent) ? 'money'
          : /camp|trip|holiday/i.test(intent) ? 'camp'
            : /remind|bring|kit|don.?t forget|tomorrow|arrive/i.test(intent) ? 'reminder'
              : 'general'
  const open: Record<string, string[]> = {
    change: ['A quick update on the schedule.', 'One change to let you know about.'],
    money: ['A quick note on payments.', 'Just a short admin note from me.'],
    camp: ['Some camp news.', 'An update on the camp.'],
    praise: ['I wanted to pass on some good news.', 'A quick word after today’s session.'],
    reminder: ['A short reminder from me.', 'Just a quick reminder.'],
    general: ['A quick note from me.', 'Just a short message.'],
  }
  const close: Record<string, string[]> = {
    change: ['Sorry for the change of plan — reply here if the new arrangement does not work and we will find another time.', 'Thanks for bearing with us. If this causes a problem, let me know and we will sort it.'],
    money: ['If anything looks wrong, or you would rather spread it, just reply and we will sort it out.', 'Thank you — and if it has already been paid, ignore this and accept my apologies.'],
    camp: ['Any questions at all, reply to this and it comes straight to me.', 'If you need anything before then, just reply.'],
    praise: ['Thank you for the support at home — it shows on court.', 'Lovely to see. More of the same next week.'],
    reminder: ['See you on court.', 'Thanks — see you there.'],
    general: ['Any questions, just reply to this message.', 'Thanks — see you on court.'],
  }
  const smsOnly = channels.length > 0 && channels.every(ch => /text|sms/.test(ch))
  const text = smsOnly
    // A text is read on a lock screen: no opener, and the name is the sign-off.
    ? `${b.urgent ? 'URGENT — ' : ''}${hello} ${core.replace(/\n+/g, ' ')} ${firstName(me.coach)}, ${me.brand}`
    : [
      hello,
      `${b.urgent ? 'Please read this one today. ' : ''}${pick(open[topic], seed)}`,
      core,
      pick(close[topic], seed >> 3),
      `${firstName(me.coach)}\n${me.brand}`,
    ].join('\n\n')
  return json({ text })
}

// POST /api/coach/briefing — the dashboard's morning briefing.
//
// The dashboard sends the signals it has already worked out from the store
// (payments, rackets, camps, retention, schedule, progress). What Lumio Coach
// adds is the order — what costs most if ignored comes first — and a next
// action, which here is filled in from the same store the signals came from.
const briefing: Handler = async ({ body }) => {
  const b = obj(body)
  const signals: { tag: string; fact: string }[] = (Array.isArray(b.signals) ? b.signals : [])
    .slice(0, 12).map((s: Row) => ({ tag: lc(s?.tag).replace(/[^a-z ]/g, '').slice(0, 16) || 'today', fact: str(s?.fact, 400) }))
    .filter((s: { fact: string }) => s.fact)
  if (!signals.length) return fail('Nothing to brief on yet.')
  await think(`briefing|${signals.map(s => s.fact).join('|')}`)

  const head = b.role !== 'coach'
  const day = today()
  const todays = demoTable('coach_bookings')
    .filter(x => dayKey(x?.booking_date) === day && lc(x?.status) !== 'cancelled')
    .sort((x, y) => String(x?.start_time ?? '').localeCompare(String(y?.start_time ?? '')))
  const owing = demoTable('coach_payments').filter(p => p && !p.paid && Number(p.amount) > 0 && lc(p.status) !== 'paid')
  const quiet = (fact: string) => /^no |healthy|up to date|keep logging|keep sharing/i.test(fact)

  type Item = { tag: string; pri: 'high' | 'med' | 'low'; text: string; rank: number }
  const items: Item[] = []
  const seen = new Set<string>()
  for (const s of signals) {
    if (seen.has(s.tag)) continue
    const news = !quiet(s.fact)
    const fact = s.fact.replace(/\s+—\s+worth a check-in\.?$/i, '.').replace(/\s+Worth collecting.*$/i, '')
    let it: Item | null = null
    if (s.tag === 'retention' && news) {
      const who = firstName(fact, '')
      it = { tag: s.tag, pri: 'high', rank: 0, text: `${fact} ${who ? `Ring ${who}’s family today rather than waiting for the next lesson` : 'Pick up the phone today'} — a player who drifts for a month rarely comes back on their own.` }
    } else if (s.tag === 'camps' && news) {
      const soon = /today|tomorrow|in [1-7] days/.test(fact)
      it = { tag: s.tag, pri: soon ? 'high' : 'med', rank: soon ? 1 : 4, text: `${fact} ${soon ? 'Check the kit list and the attendee forms this morning, and make sure every family has the arrival details.' : 'Worth a look at who has not paid or filled in their form while there is still time to chase.'}` }
    } else if (s.tag === 'payments' && news) {
      const names = [...new Set(owing.map(p => firstName(p.player_name, '')).filter(Boolean))].slice(0, 3)
      it = { tag: s.tag, pri: head ? 'high' : 'med', rank: 2, text: `${fact} ${names.length ? `Start with ${names.join(', ')} — ` : ''}${head ? 'send the chasers from Payments before your first lesson so it is done.' : 'mention it at their next session; the head coach handles the chasers.'}` }
    } else if (s.tag === 'rackets' && news) {
      it = { tag: s.tag, pri: 'med', rank: 3, text: `${fact} Tell them at their next session — it is the best five minutes of the week for both of you.` }
    } else if (s.tag === 'schedule') {
      const first = todays[0]
      const who = first ? str(first.player_name || first.title) : ''
      it = news && first
        ? { tag: s.tag, pri: 'med', rank: 5, text: `${todays.length} on court today, starting ${str(first.start_time).slice(0, 5)}${who ? ` with ${who}` : ''}${first.court ? ` on ${first.court}` : ''}.${todays.length > 3 ? ' It is a full day — eat before the afternoon block.' : ''}` }
        : { tag: s.tag, pri: 'low', rank: 7, text: fact }
    } else if (s.tag === 'progress') {
      it = { tag: s.tag, pri: 'low', rank: news ? 6 : 8, text: news ? `${fact.replace(/ — keep sharing.*$/i, '.')} Share the best one with the family today; it is the cheapest retention you have.` : 'No lesson summaries yet this week — write one straight after your next session while it is fresh.' }
    } else if (news) {
      it = { tag: s.tag, pri: 'med', rank: 5, text: fact }
    }
    if (it) { items.push(it); seen.add(s.tag) }
  }
  items.sort((x, y) => x.rank - y.rank)
  const out = items.slice(0, 4).map(({ tag, pri, text }) => ({ tag, pri, text }))
  // A quiet week is allowed to be quiet — one line, and let them get on with it.
  if (!out.length) return json({ briefing: 'Nothing needs you this morning: no balances outstanding, attendance is healthy and the diary is clear. Go and coach.', at: nowISO() })
  return json({ items: out, at: nowISO() })
}

// POST /api/coach/player-targets — development targets for one player, saved on
// the player straight away (a target the coach has to remember to save does not
// exist by Thursday).
const playerTargets: Handler = async ({ body }) => {
  const { playerId } = obj(body)
  if (!playerId) return fail('playerId is required')
  const player = byId('coach_players', playerId)
  if (!player) return fail('Player not found', 404)
  await think(`targets|${playerId}|${player.targets_set_at ?? ''}`)

  const c = ctxFor(player.name)
  const seed = hash(`${player.id}|${player.targets_set_at ?? ''}`)
  const skills = demoTable('coach_player_skills')
    .filter(s => String(s?.player_id) === String(playerId) && s?.skill)
    .sort((x, y) => (Number(x.score) || 0) - (Number(y.score) || 0))
  const LEVELS = ['not yet started', 'learning', 'developing', 'consolidating', 'consistent']
  const sixWeeks = shortDate(new Date(Date.now() + 42 * 86_400_000))
  const twelveWeeks = shortDate(new Date(Date.now() + 84 * 86_400_000))

  const targets: { target: string; why: string; measure: string; by: string }[] = []
  // The matrix is the evidence: the two weakest skills each become a target.
  for (const [i, s] of skills.filter(x => (Number(x.score) || 0) < 4).slice(0, 2).entries()) {
    const t = themeFor(s.skill)
    const score = Math.max(0, Math.min(4, Number(s.score) || 0))
    targets.push({
      target: `Take “${str(s.skill)}” from ${LEVELS[score]} to ${LEVELS[Math.min(4, score + 1)]}`,
      why: `It is the ${i ? 'next lowest' : 'lowest'} score on ${c.first}’s matrix, and it is costing ${t.cost}.`,
      measure: upperFirst(t.measure(c)),
      by: sixWeeks,
    })
  }
  const goal = str(player.goal)
  const goalTheme = themeFor(goal, player.notes)
  if (targets.length < 2) {
    targets.push({
      target: upperFirst(goalTheme.aim),
      why: goal ? `It is the shortest route to what ${c.first} has said they want: ${lowerFirst(goal.replace(/\.$/, ''))}.` : `It is the thing most likely to move ${c.first} on from ${stageLabel(c) || 'the current stage'}.`,
      measure: upperFirst(goalTheme.measure(c)),
      by: sixWeeks,
    })
  }
  const match = THEMES.find(t => t.key === (c.lvl === 0 ? 'consistency' : 'tactics')) as Theme
  targets.push({
    target: c.lvl === 0 ? 'Rally with a partner without the coach feeding' : 'Use one chosen pattern on serve in every practice set',
    why: c.lvl === 0 ? 'A player who can rally can practise without a coach — that is when improvement speeds up.' : 'Technique only counts when it survives a scoreboard, and a plan is what makes it survive.',
    measure: upperFirst(match.measure(c)),
    by: twelveWeeks,
  })
  const stageIdx = STAGE_ORDER.indexOf(c.stage)
  if (stageIdx >= 0 && stageIdx < STAGE_ORDER.length - 1) {
    targets.push({
      target: `Be ready for the ${upperFirst(STAGE_ORDER[stageIdx + 1])} racket assessment`,
      why: `Every skill at ${upperFirst(c.stage)} needs to be at consolidating or above before moving up — it gives the block something to aim at.`,
      measure: `All four ${upperFirst(c.stage)} skills scored 3 or higher on the matrix`,
      by: twelveWeeks,
    })
  }
  const final = targets.slice(0, 4)
  const note = pick([
    `${c.first} does not need more things to work on — these are in order, and the first one is worth more than the rest put together.`,
    `Review these with ${c.first} at the start of the next lesson so they are ${c.junior ? 'the family’s' : 'their own'} targets, not just yours.`,
    `Short list on purpose. If the first target is hit early, set a new one rather than adding to the pile.`,
  ], seed)

  Object.assign(player, { targets: final, targets_note: note, targets_set_at: nowISO(), targets_by: 'lumio-coach' })
  return json({ targets: final, note })
}

// POST /api/coach/welcome-plan — the first four weeks, written for this player.
const welcomePlan: Handler = async ({ body }) => {
  const { playerId } = obj(body)
  if (!playerId) return fail('playerId is required')
  const player = byId('coach_players', playerId)
  if (!player) return fail('Player not found', 404)
  await think(`welcome|${playerId}`)

  const me = profile()
  const c = ctxFor(player.name)
  const goal = str(player.goal)
  const theme = themeFor(goal, player.notes)
  const you = c.junior ? c.first : 'you'
  const your = c.junior ? `${c.first}’s` : 'your'
  const weeks = [
    [
      `Getting to know ${you}: a relaxed first lesson with a look at grips, the ready position and how ${you === 'you' ? 'you move' : `${c.first} moves`} to the ball. Lots of rallying on ${ballFor(c)}.`,
      `Rally foundations — keeping the ball in play with good height over the net. First go at ${theme.drills[0].name.toLowerCase()}.`,
      `Starting the point: a simple, repeatable serve and a first look at the return.`,
      `Putting it together in games, a first skills check against the ${stageLabel(c) || 'starting'} stage, and the plan for the next block.`,
    ],
    [
      `A baseline assessment: rally, serve and return measured so there is something real to compare against in a month.`,
      `The first priority — ${theme.aim}. ${theme.drills[0].name} and ${theme.drills[1].name.toLowerCase()}.`,
      `Taking it into live play: ${lowerFirst(theme.live.split(':')[0])}, with the new habit as the only rule.`,
      `Re-test against week one, agree two development targets and book the next block.`,
    ],
    [
      `Match-play assessment: a set played and charted so the plan is built on what actually loses points, not on how the strokes look.`,
      `The highest-leverage fix from the chart — most likely ${theme.label} — rebuilt at rally pace before any speed is added.`,
      `The same shot under pressure: ${lowerFirst(theme.live.split(':')[0])} and scoreboard starts from behind.`,
      `A second charted set, the numbers compared with week one, and targets set for the next six weeks.`,
    ],
  ][c.lvl]

  return json({
    welcome: c.junior
      ? `Welcome to ${me.brand}, ${c.first}! I am really looking forward to getting on court with you. Tennis is a game you can play for the rest of your life, and the first few weeks are about finding out what you already do well and having fun while we build on it.${goal ? ` You have told us what you want — ${lowerFirst(goal.replace(/\.$/, ''))} — and that is what this plan is pointed at.` : ''}`
      : `Welcome to ${me.brand}, ${c.first}. I am looking forward to working with you. The first four weeks are about finding out where your game really is and picking the one or two things that will make the biggest difference.${goal ? ` You have told me what you want — ${lowerFirst(goal.replace(/\.$/, ''))} — and the plan below is built around it.` : ''}`,
    weeks: weeks.map((focus, i) => ({ week: `Week ${i + 1}`, focus })),
    first_session: `Arrive ten minutes early so there is time to say hello and find the court. Bring a racket if ${c.junior ? `${c.first} has` : 'you have'} one (we have spares), a full water bottle and trainers with non-marking soles. The first lesson is mostly rallying and games — nobody is being tested.`,
    parent_note: c.junior
      ? `The most useful thing you can do in the first month is ask ${c.first} what was fun, not what the score was. A summary lands in your portal after each lesson with one small thing to practise — five minutes twice a week is plenty. If ${c.first} is ever worried about anything, tell ${firstName(me.coach)} and we will sort it out quietly.`
      : `After each lesson a short summary lands in your portal with one thing to practise before the next. Ten minutes twice a week makes more difference than an extra lesson. If something about ${your} game is bothering you, say so at the start of a session and we will build it in.`,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Lumio Coach — camps
// ═══════════════════════════════════════════════════════════════════════════

type CampSession = { slot: 'AM' | 'PM' | 'EVE'; time: string; title: string; type: string; where: string; detail: string; cue: string }
type CampDay = { day: number; theme: string; rest: boolean; coachFocus: string; sessions: CampSession[] }
type DayTemplate = {
  theme: string; coachFocus: string
  am: [string, string, string, string]     // title, type, detail, cue
  mid: [string, string, string, string]
  pm: [string, string, string, string]
  eve: [string, string, string, string]
  /** The same day in a parent's words, and the thing a coach can count at the end of it. */
  plain?: string
  goal?: string
}

// Ordered on purpose: assessment before technical change, technical before
// tactical, tactical before competition. A camp that does "serve day, volley
// day" in any order is a timetable, not a plan.
const CAMP_DAYS: DayTemplate[] = [
  {
    theme: 'Groundstroke foundations — height and depth',
    plain: 'Keeping the ball in play with good height and depth',
    goal: 'Every player holds a crosscourt rally of ten with every ball past the service line',
    coachFocus: 'Everything this week is built on a rally ball that lands past the service line. Watch net clearance, not pace.',
    am: ['Rally ball: height and depth', 'Technical', 'Crosscourt rallies over a rope a racket-height above the net, counting only balls past the service line.', 'Height gives you depth'],
    mid: ['Depth zones', 'Technical', 'Four-zone target work off fed balls, then live — the zone is called before the ball is struck.', 'Aim for a window, not a line'],
    pm: ['Baseline points with an error tax', 'Match play', 'Points to eleven where a ball in the net costs two — it rewards the shape worked on this morning.', 'Miss long before you miss short'],
    eve: ['Video: one rally each', 'Video', 'Each player watches thirty seconds of their own rally and names one thing to keep.', 'What do you see?'],
  },
  {
    theme: 'Serve and return — starting the point',
    plain: 'A serve that starts the point the same way every time',
    goal: 'Every player lands 7 of 10 second serves with a full swing in the final-day test',
    coachFocus: 'The toss decides the serve and the split-step decides the return. Coach those two things and leave the rest alone today.',
    am: ['Serve: toss, grip and rhythm', 'Technical', 'Toss-and-catch, kneeling serves and a three-target ladder, in that order.', 'Lift it, don’t flick it'],
    mid: ['Return: split and short swing', 'Technical', 'Returns off half-pace serves into a channel down the middle, then second serves taken a step inside the baseline.', 'Up as they hit'],
    pm: ['Serve-plus-one and return-plus-one points', 'Tactical', 'Points start with a called pattern; a point won using it counts double.', 'Say it, then play it'],
    eve: ['Serving under the lights', 'Social', 'Target-serving competition in teams — fun, loud, and a lot of second serves without anybody noticing.', 'Same routine every time'],
  },
  {
    theme: 'Moving forward — approach and net',
    plain: 'Coming forward and finishing at the net',
    goal: 'Every player wins at least one point at the net in each tournament match',
    coachFocus: 'Players come in on the wrong ball. Coach the decision to approach before coaching the volley.',
    am: ['Volley: step and block', 'Technical', 'Catch volleys into hoops, then two-volley finishes — first deep, second away.', 'Catch it out in front'],
    mid: ['Approach on the short ball', 'Tactical', 'Crosscourt rally with a “go” call on anything short; approach down the line and close.', 'Hit, follow, split'],
    pm: ['Net points and overheads', 'Match play', 'Points start with a short feed; a point won at the net is worth two. Overhead reset drill between rounds.', 'Feet first, hands quiet'],
    eve: ['Quiz and team games', 'Social', 'Tennis quiz in mixed teams, then touch-tennis doubles in the service boxes.', 'Play for your partner'],
  },
  {
    theme: 'Patterns of play — building the point',
    plain: 'Having a simple plan for each point',
    goal: 'Every player can name, and is seen to use, one serve pattern and one return pattern in the camp tournament',
    coachFocus: 'Today the strokes stop being the subject. Listen for whether players can say what they were trying to do after a point.',
    am: ['Crosscourt to build, line to finish', 'Tactical', 'Two crosscourt, one down the line as a pattern rally, then live with the change only allowed off a short ball.', 'Earn the change'],
    mid: ['Playing to the weaker side', 'Tactical', 'Weak-side siege: every ball to one wing until the reply is short, then finish to the open court.', 'Patience, then pounce'],
    pm: ['Scoreboard starts', 'Match play', 'Games begun at 30–40, deuce and 40–30 so every point is a big one.', 'Best pattern on the big point'],
    eve: ['Match analysis', 'Video', 'One professional rally watched three times: where did the point turn, and why?', 'What was the plan?'],
  },
  {
    theme: 'Doubles and team play',
    plain: 'Playing doubles as a team',
    goal: 'Every net player touches the ball in at least 4 of 10 service points in the doubles event',
    coachFocus: 'An active net player is the whole lesson. Praise movement at the net even when it loses the point.',
    am: ['Net player: move with the ball', 'Tactical', 'Signal-and-cross on serve, with the net player starting a step inside the service box.', 'Go on the toss'],
    mid: ['Returning in doubles', 'Technical', 'Crosscourt returns low past the net player, then the lob as the answer to an early cross.', 'Low over the low part of the net'],
    pm: ['Team doubles event', 'Match play', 'Rotating partners, tiebreaks to ten — a poach or a volley through the middle is worth two.', 'Talk every point'],
    eve: ['Team evening', 'Social', 'Results from the doubles event, awards for best communication, free time afterwards.', 'Well played'],
  },
  {
    theme: 'Defending and turning defence into attack',
    plain: 'Getting out of trouble and back into the point',
    goal: 'Every player recovers to the centre before the next ball in 8 of 10 wide-ball exchanges',
    coachFocus: 'Recovery is the skill. A defensive ball that is high, deep and crosscourt is a good shot — say so.',
    am: ['Movement and recovery', 'Physical', 'Spider runs, two-ball recovery and split-step timing, in short timed blocks with full rest.', 'Split, then decide'],
    mid: ['The neutralising ball', 'Technical', 'Wide feeds answered high, deep and crosscourt, recovering to a cone before the next ball.', 'Buy yourself time'],
    pm: ['Defence-to-attack points', 'Match play', 'The coach starts every point by pulling one player wide; winning from there counts double.', 'Reset, then build'],
    eve: ['Stretch and recover', 'Recovery', 'Guided mobility and a short session on sleep, food and water for match days.', 'Look after tomorrow’s legs'],
  },
  {
    theme: 'Playing under pressure',
    plain: 'Staying calm when the score is close',
    goal: 'Every player completes the between-point routine on at least 8 of 10 points in the final tiebreak',
    coachFocus: 'Coach the sixteen seconds between points, not the points. A complete routine after a lost point is today’s win.',
    am: ['The between-point routine', 'Technical', 'Turn away, strings, breathe, plan, bounce — rehearsed until it is automatic, then scored in points.', 'Turn, breathe, plan'],
    mid: ['Pressure serving', 'Physical', 'One second serve at 30–40 after a thirty-second shuttle. Ten each, scores on the board.', 'Breathe out, then toss'],
    pm: ['Comeback sets', 'Match play', 'Short sets starting at 2–4 down, with a bonus point each time the routine is visibly completed.', 'One point, then the next'],
    eve: ['Goal review', 'Briefing', 'Each player looks at the targets they set on day one and marks them honestly.', 'What has moved?'],
  },
]

const DAY_ONE: DayTemplate = {
  theme: 'Arrive, assess and set targets',
  coachFocus: 'Do not coach today — watch. The groups and every player’s target for the week come out of what you see this morning.',
  am: ['Welcome, groups and court rules', 'Briefing', 'Names, the shape of the week, how the courts rotate and who to find if something is wrong.', 'Everybody knows where to be'],
  mid: ['Assessment rallies', 'Technical', 'Rally, serve and return measured against simple targets so every player has a starting number.', 'Show us your normal game'],
  pm: ['Round-robin and target setting', 'Match play', 'Short matches in level groups, then each player agrees one target for the week with a coach.', 'One thing each'],
  eve: ['Welcome evening', 'Social', 'Team games and a short talk on what the week is for. Early night.', 'Get to know your group'],
}
const LAST_DAY: DayTemplate = {
  theme: 'Tournament day and individual reviews',
  coachFocus: 'Today is theirs. Coach nothing technical — note what held up under match conditions for each player’s report.',
  am: ['Re-test', 'Technical', 'The same rally, serve and return measures as day one, so every player leaves with a before and after.', 'Beat your own number'],
  mid: ['Camp tournament — group stage', 'Match play', 'Level-based boxes, short sets, players umpiring their own matches.', 'Play your patterns'],
  pm: ['Finals and presentations', 'Match play', 'Finals on the show court, then certificates and each player’s report handed over in person.', 'Enjoy it'],
  eve: ['Farewell dinner', 'Social', 'Awards, photographs and what to keep working on at home.', 'Thank you'],
}
const REST_DAY: DayTemplate = {
  theme: 'Lighter day — recover and reset',
  coachFocus: 'A planned rest is part of the programme, not a gap in it. Tired players learn nothing and get hurt.',
  am: ['Touch and feel', 'Recovery', 'Mini-tennis, drop shots and soft hands at walking pace. No scoring, no sprinting.', 'Soft hands'],
  mid: ['Mobility and video', 'Video', 'Guided stretching, then each player watches two clips of themselves from earlier in the week.', 'What do you notice?'],
  pm: ['Off court', 'Social', 'Free afternoon: swim, walk or rest. Nothing organised with a racket.', 'Switch off'],
  eve: ['Film night', 'Social', 'A film, an early finish and lights out on time.', 'Rest properly'],
}

function designCamp(b: Row): Row {
  const days = Math.max(1, Math.min(28, Number(b.days) || 5))
  const board = str(b.board)
  const residential = /resid|full|half|board|b&b|hotel/i.test(board) && !/day/i.test(board)
  const adult = campAudience({ audience: b.audience }) === 'adult'
  const courts = Math.max(0, Number(b.courts) || 0)
  const size = Math.max(0, Number(b.groupSize) || 0)
  const level = str(b.level) || 'mixed'
  const intent = str(b.intent || b.theme)
  const seed = hash(`${b.name}|${days}|${level}|${intent}`)
  const where = courts > 1 ? `Courts 1–${courts}` : courts === 1 ? 'Court 1' : 'All courts'
  const perCourt = courts && size ? Math.ceil(size / courts) : 0
  const split = perCourt ? ` Groups of ${perCourt} per court, rotating every twenty minutes.` : ''
  const times = residential ? { am: '09:00', mid: '11:00', pm: '15:00', eve: '19:30' } : { am: '09:30', mid: '11:15', pm: '13:30', eve: '' }
  const place = (type: string) => type === 'Briefing' || type === 'Video' ? 'Clubhouse' : type === 'Social' ? (residential ? 'Hotel' : 'Clubhouse') : type === 'Physical' ? `${where} and the warm-up area` : type === 'Recovery' ? 'Court 1 and the clubhouse' : where

  // The middle of the camp starts at the theme closest to what the coach said
  // they want players to leave with, so two different briefs give two different weeks.
  const wanted = themeFor(intent).key
  const startAt = Math.max(0, ['consistency', 'serve', 'net', 'tactics', 'doubles', 'movement', 'mental'].indexOf(wanted === 'return' ? 'serve' : wanted === 'forehand' || wanted === 'backhand' ? 'consistency' : wanted))
  // Foundations always come first; the rest follow in order from the wanted theme.
  const others = CAMP_DAYS.length - 1
  const middle = (i: number) => CAMP_DAYS[i === 0 ? 0 : 1 + ((Math.max(1, startAt) - 1 + (i - 1)) % others)]

  const itinerary: CampDay[] = []
  const used: DayTemplate[] = []
  let m = 0
  for (let d = 1; d <= days; d++) {
    const first = d === 1 && days >= 2
    const last = d === days && days >= 3
    // A rest day on anything of six days or more, every fourth day, never the last.
    const rest = !first && !last && days >= 6 && d % 4 === 0
    const t = first ? DAY_ONE : last ? LAST_DAY : rest ? REST_DAY : middle(m++)
    if (t.plain && !used.includes(t)) used.push(t)
    const mk = (slot: CampSession['slot'], time: string, s: [string, string, string, string], withSplit = false): CampSession =>
      ({ slot, time, title: s[0], type: s[1], where: place(s[1]), detail: `${s[2]}${withSplit ? split : ''}`, cue: s[3] })
    const sessions = [mk('AM', times.am, t.am), mk('AM', times.mid, t.mid, !rest), mk('PM', times.pm, t.pm)]
    if (residential) sessions.push(mk('EVE', times.eve, t.eve))
    itinerary.push({
      day: d,
      theme: days === 1 ? `One-day intensive — ${lowerFirst(t.theme)}` : t.theme,
      rest,
      coachFocus: t.coachFocus,
      sessions,
    })
  }

  const who = adult ? 'you' : 'your child'
  const they = adult ? 'you' : 'they'
  const surface = lc(b.surface)
  return {
    daily_rhythm: residential
      ? `Technical work in the cool of the morning, a long break over lunch, live play mid-afternoon and something off court in the evening — the hardest thinking is done while everyone is fresh, and the day ends with the group together.`
      : `Two technical blocks in the morning while legs and attention are fresh, lunch, then points and matches in the afternoon so what was learned is tested the same day. Finished by ${times.pm === '13:30' ? '3.30pm' : 'mid-afternoon'}.`,
    objectives: [
      `Every player improves their own day-one rally number by at least ${pick([30, 40, 50], seed)}% on the final-morning re-test`,
      // One countable outcome per day actually on the timetable — an objective
      // for a day the camp does not contain is a promise nobody can keep.
      ...used.slice(0, 3).map(t => t.goal as string),
      'Every player leaves with a written report, one target for the next six weeks and a drill to practise it',
    ],
    equipment: [
      `${Math.max(2, courts || 2)} baskets of balls (about 60 each)`,
      '24 flat cones and 12 tall cones',
      'Throw-down lines for depth zones and channels',
      'Ropes or spare nets for height over the tape',
      '4 hoops or target mats',
      '2 agility ladders and a stopwatch',
      'Tablet or phone on a tripod for video',
      'Whiteboard, pens and scorecards',
      'First-aid kit, ice packs and sun cream',
      ...(surface.includes('clay') ? ['Drag mats and line brushes for the clay'] : []),
      ...(adult ? [] : ['Spare junior rackets in three lengths']),
      'Certificates and report folders for the final day',
    ].slice(0, 12),
    itinerary,
    parent_brief: {
      intro: adult
        ? `${str(b.name) || 'This camp'} is ${days} day${days === 1 ? '' : 's'} of proper coaching with people at your level${b.region ? ` in ${b.region}` : ''}. It suits ${aOrAn(level)} ${level.toLowerCase()} player who wants to understand their own game better, not just hit a lot of balls. ${intent ? `The aim is simple: ${lowerFirst(intent.replace(/\.$/, ''))}.` : 'You will leave knowing exactly what to work on.'}`
        : `${str(b.name) || 'This camp'} is ${days} day${days === 1 ? '' : 's'} of coaching, games and matches for ${b.ages ? `players aged ${b.ages}` : 'juniors'}${b.region ? ` in ${b.region}` : ''}. It suits ${aOrAn(level)} ${level.toLowerCase()} player who enjoys being on court and is ready to be stretched a little. ${intent ? `The aim is simple: ${lowerFirst(intent.replace(/\.$/, ''))}.` : 'Every child leaves with something they can do that they could not do on Monday.'}`,
      whatTheyWorkOn: [
        ...used.slice(0, 4).map(t => t.plain as string),
        'Playing points and matches every afternoon, and keeping score properly',
        'Setting one target on the first day and measuring it on the last',
      ].slice(0, 6),
      whatToBring: [
        'A racket (spares are available)',
        `${surface.includes('clay') ? 'Clay-court' : 'Non-marking'} tennis shoes`,
        'A large refillable water bottle',
        'Sun cream and a cap',
        'A warm layer and a waterproof',
        residential ? 'Swimwear and a towel' : 'A packed lunch and snacks',
        ...(adult ? ['Any strapping or supports you normally use'] : ['Any medication, named, handed to a coach on arrival']),
        'A spare T-shirt and socks',
      ],
      dailyShape: residential
        ? `Coaching in the morning, a long lunch, matches in the afternoon and time together in the evening.`
        : `Coaching from ${clockTime(times.am)} until lunch, then points and matches until about 3.30pm.`,
      whatTheyLeaveWith: [
        `A written report on ${who === 'you' ? 'your' : 'their'} game, with a before-and-after from the first and last day`,
        `One clear thing to practise, and the drill to practise it with`,
        `A serve ${they} can rely on in a match`,
        ...(adult ? ['A group of people at your level to play with afterwards'] : ['A certificate, and usually a few new friends']),
      ],
    },
  }
}

// POST /api/coach/camp-design — streamed as newline-delimited JSON, exactly as
// the real route does it: {"t":"start"}, a {"t":"tick"} as each day is written,
// then {"t":"done","plan":…}. CampDesigner reads it line by line and moves its
// progress bar on the ticks, so the days arrive over a few seconds here too.
const campDesign: Handler = ({ body }) => {
  const b = obj(body)
  const days = Math.max(1, Math.min(28, Number(b.days) || 5))
  const plan = designCamp(b)
  const encoder = new TextEncoder()
  const step = Math.max(110, Math.min(700, Math.round(3000 / days)))
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: unknown) => { try { controller.enqueue(encoder.encode(JSON.stringify(o) + '\n')) } catch { /* reader went away */ } }
      send({ t: 'start', days })
      await sleep(500)
      for (let d = 1; d <= days; d++) { await sleep(step); send({ t: 'tick', day: d, days }) }
      await sleep(300)
      send({ t: 'done', plan })
      try { controller.close() } catch { /* already closed */ }
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-store, no-transform' } })
}

const NO_FILES = 'Reading your own documents is switched off in the demo — in your own portal Lumio Coach reads a PDF, a spreadsheet or a photo of a plan and fills this in for you.'

// POST /api/coach/camp-import — a coach's own camp document. There is no honest
// way to "read" a visitor's file without a model, and pretending to would fill
// their camp with somebody else's plan, so this answers with the route's
// could-not-read shape and says why.
const campImport: Handler = async () => { await beat(); return fail(NO_FILES) }

const campDaysOf = (camp: Row) =>
  Array.isArray(camp.itinerary) && camp.itinerary.length ? camp.itinerary.length
    : camp.start_date && camp.end_date ? Math.max(1, Math.round((Date.parse(camp.end_date) - Date.parse(camp.start_date)) / 86_400_000) + 1) : 0
const campThemes = (camp: Row): string[] =>
  Array.isArray(camp.itinerary) ? camp.itinerary.map((d: Row) => str(d?.theme || d?.focus)).filter(Boolean) : []
const campResidential = (camp: Row) => /resid|full|half|board|b&b|hotel/i.test(str(camp.board)) && !/day/i.test(str(camp.board))
const attendeesOf = (campId: unknown) =>
  demoTable('coach_camp_attendees').filter(a => String(a?.camp_id) === String(campId) && lc(a?.status) !== 'cancelled')
const campWhen = (camp: Row) =>
  [longDate(camp.start_date), camp.end_date && camp.end_date !== camp.start_date ? longDate(camp.end_date) : ''].filter(Boolean).join(' to ')
const campWhere = (camp: Row) => [camp.location, camp.region].map(x => str(x)).filter(Boolean).join(', ')

// POST /api/coach/camp-targets — what the players are working towards, and what
// the coach hands over at the end. Suggested, not saved: the caller saves them.
const campTargets: Handler = async ({ body }) => {
  const { campId } = obj(body)
  if (!campId) return fail('campId is required')
  const camp = byId('coach_camps', campId)
  if (!camp) return fail('Camp not found', 404)
  await think(`camp-targets|${campId}|${listOf(camp.objectives).length}`)

  const adult = campAudience(camp) === 'adult'
  const days = campDaysOf(camp)
  const themes = campThemes(camp)
  const keys = new Set(themes.map(t => themeFor(t).key))
  const c: Ctx = { name: '', first: '', lvl: 1, age: null, junior: !adult, stage: '', player: null }
  const targets = [
    'Every player beats their own day-one rally number on the final-morning re-test',
    ...THEMES.filter(t => keys.has(t.key)).slice(0, 4).map(t => `${upperFirst(t.label.replace(/^the /, ''))}: ${t.measure(c)}`),
    'Every player can name the one serve pattern they use on a big point — and is seen to use it in the camp tournament',
    ...(days >= 4 ? ['The between-point routine completed on 8 of 10 points in the final tiebreak'] : []),
    ...(str(camp.intent) ? [`The coach’s own aim, measured: ${lowerFirst(str(camp.intent).replace(/\.$/, ''))} — checked for every player on the last afternoon`] : []),
  ].slice(0, 8)
  const outcomes = [
    `A written report for every player within 48 hours of the camp finishing${adult ? '' : ', sent to their parent'}`,
    'A before-and-after score for rally, serve and return from the first and last day',
    'One development target for the next six weeks, with the drill to practise it',
    adult ? 'A recommendation for what to book next — lessons, a group or the next camp' : 'A racket-stage re-assessment for any player who is close to moving up',
    ...(camp.trip || campResidential(camp) ? ['A shared album of photographs and clips from the week'] : []),
  ].slice(0, 6)
  return json({ ok: true, targets, outcomes })
}

// POST /api/coach/camp-player — per-player camp targets (saved on the camp), or
// one player's end-of-camp report (returned for printing, never saved).
const campPlayer: Handler = async ({ body }) => {
  const b = obj(body)
  const mode = b.mode === 'report' ? 'report' : 'targets'
  if (!b.campId) return fail('campId is required')
  const camp = byId('coach_camps', b.campId)
  if (!camp) return fail('Camp not found', 404)
  let roster = attendeesOf(b.campId)
  if (mode === 'report') roster = roster.filter(a => a.player_name === b.playerName)
  if (!roster.length) return fail(mode === 'report' ? 'Player not on this camp' : 'No attendees on this camp yet')
  await think(`camp-player|${b.campId}|${mode}|${b.playerName ?? roster.length}`)

  const adult = campAudience(camp) === 'adult'
  const campName = str(camp.name) || 'the camp'

  if (mode === 'targets') {
    const players = roster.map((a, i) => {
      const c = ctxFor(a.player_name)
      const last = lastLesson(a.player_name)
      // Two players at the same stage still get different targets: the theme
      // comes from their own goal and recent lessons before it falls back on
      // their position in the list.
      const own = themeFor(a.camp_goal, c.player?.goal, last?.nextFocus, last?.row?.focus)
      const theme = a.camp_goal || c.player?.goal || last ? own : THEMES[(hash(str(a.player_name)) + i) % THEMES.length]
      const second = THEMES[(THEMES.indexOf(theme) + 1 + (hash(str(a.player_name)) % (THEMES.length - 1))) % THEMES.length]
      return {
        player_name: a.player_name,
        stage: stageLabel(c) || (adult ? 'Adult' : 'Not graded yet'),
        goals: [
          `${upperFirst(theme.label.replace(/^the /, ''))}: ${theme.aim}`,
          `${upperFirst(second.label.replace(/^the /, ''))}: ${lowerFirst(second.points[0].split(/[—:,]/)[0])}`,
          ...(last?.nextFocus ? [`Carry on from the last lesson: ${lowerFirst(last.nextFocus.replace(/\.$/, ''))}`] : []),
        ].slice(0, 3),
        measure: upperFirst(theme.measure(c)),
      }
    })
    camp.player_targets = players
    return json({ players })
  }

  const a = roster[0]
  const c = ctxFor(a.player_name)
  const target = listOf(camp.player_targets ? (camp.player_targets as Row[]).find(t => same(t?.player_name, a.player_name))?.goals : [])
  const theme = themeFor(a.camp_goal, target[0], c.player?.goal, campThemes(camp)[1])
  const second = THEMES[(THEMES.indexOf(theme) + 3) % THEMES.length]
  const seed = hash(`${a.player_name}|${campName}`)
  const your = adult ? 'your' : `${c.first}’s`
  return json({
    headline: adult
      ? `You leave ${campName} with ${theme.aim} — and the numbers to prove it.`
      : `${c.first} leaves ${campName} with ${theme.aim}.`,
    assessment: pick([
      `${adult ? 'You' : c.first} got better as the week went on, which is the best sign there is. The work on ${theme.label} was the turning point: once ${theme.fault} stopped happening, everything downstream of it improved. ${adult ? 'You were' : `${c.first} was`} also one of the players other people wanted to be on court with.`,
      `A really good week. ${adult ? 'You' : c.first} arrived with ${theme.fault} as the main thing in the way, and by the final day it only appeared when ${adult ? 'you were' : `${c.first} was`} tired. That is a habit changing, and it is ${your} own work that changed it.`,
    ], seed),
    progress: [
      `${upperFirst(theme.label.replace(/^the /, ''))}: reached ${theme.measure(c)} on the final-morning re-test`,
      `${upperFirst(second.label.replace(/^the /, ''))}: ${lowerFirst(second.takeaways[0])} — seen in the tournament matches, not just the drills`,
      `Completed the between-point routine without being reminded by the last two days`,
      ...(a.camp_goal ? [`The goal set at the start — ${lowerFirst(str(a.camp_goal).replace(/\.$/, ''))} — was met`] : []),
    ].slice(0, 4),
    nextSteps: [
      upperFirst(theme.next),
      `${upperFirst(second.label.replace(/^the /, ''))}: ${lowerFirst(second.next)}`,
      `Play at least one match a fortnight so the week’s work is tested while it is fresh`,
    ],
    homework: theme.homework,
    coachNote: adult
      ? `It was a pleasure to have you with us, ${c.first}. Keep hold of “${theme.drills[0].cue.toLowerCase()}” and I will see you on court soon.`
      : `${c.first}, you worked hard and you were great company all week. Remember “${theme.drills[0].cue.toLowerCase()}” — and well done.`,
  })
}

// POST /api/coach/camp-kit — the equipment list for the camp as it is planned.
const campKit: Handler = async ({ body }) => {
  const { campId } = obj(body)
  if (!campId) return fail('campId is required')
  const camp = byId('coach_camps', campId)
  if (!camp) return fail('Camp not found', 404)
  await think(`camp-kit|${campId}`)
  const players = Number(camp.group_size) || attendeesOf(campId).length || Number(camp.capacity) || 12
  const courts = Number(camp.courts) || 2
  const adult = campAudience(camp) === 'adult'
  const keys = new Set(campThemes(camp).map(t => themeFor(t).key))
  const equipment = [
    `${Math.max(2, courts)} ball baskets — about ${Math.max(120, players * 12)} balls in total`,
    `${courts * 8} flat cones and ${courts * 4} tall cones`,
    `Throw-down lines, ${courts * 6} strips`,
    'Ropes or spare nets for height over the tape',
    ...(keys.has('net') ? [`${courts * 2} hoops or target mats for volley targets`] : []),
    ...(keys.has('movement') ? [`${Math.min(courts, 3)} agility ladders and a stopwatch`] : []),
    ...(keys.has('serve') ? ['Serving targets — 9 flat cones per court'] : []),
    ...(adult ? [] : [`${Math.ceil(players / 4)} spare rackets in junior lengths`]),
    'Tablet or phone on a tripod for video',
    'Whiteboard, pens and scorecards',
    'First-aid kit, ice packs and blister plasters',
    'Sun cream, spare caps and a shade tent',
    `Water containers — plan for 1.5 litres per player per session`,
    ...(lc(camp.surface).includes('clay') ? ['Drag mats and line brushes'] : []),
    ...(campResidential(camp) ? ['Room list, emergency contact sheet and the medical forms, printed'] : ['Register and collection list, printed for each day']),
    ...(camp.overseas ? ['Copies of passports and travel-insurance details for every player'] : []),
    `${players} certificates and report folders`,
  ].slice(0, 20)
  return json({ ok: true, equipment })
}

// POST /api/coach/camp-promo — the announcement, written four ways.
const campPromo: Handler = async ({ body, url }) => {
  const { campId } = obj(body)
  if (!campId) return fail('campId is required')
  const camp = byId('coach_camps', campId)
  if (!camp) return fail('Camp not found', 404)
  await think(`camp-promo|${campId}`)

  const me = profile()
  const adult = campAudience(camp) === 'adult'
  const name = str(camp.name) || 'Our next camp'
  const brief = (camp.parent_brief || {}) as Row
  const days = campDaysOf(camp)
  const when = campWhen(camp)
  const where = campWhere(camp)
  const signupUrl = camp.signup_slug && camp.signup_open ? `${url.origin}/camp/${camp.signup_slug}` : null
  const work = listOf(brief.whatTheyWorkOn)
  const leave = listOf(brief.whatTheyLeaveWith)
  const price = Number(camp.price) > 0 ? pounds(Number(camp.price)) : ''
  const deposit = camp.payment_mode === 'deposit' && Number(camp.deposit_amount) > 0 ? pounds(Number(camp.deposit_amount)) : ''
  const left = Number(camp.capacity) > 0 ? Math.max(0, Number(camp.capacity) - attendeesOf(campId).length) : 0
  const seed = hash(`${campId}|${name}`)
  const themeLine = work[0] ? lowerFirst(work[0].replace(/\.$/, '')) : 'the serve, the rally ball and a plan for each point'
  const leaveLine = leave[0] ? lowerFirst(leave[0].replace(/\.$/, '')) : (adult ? 'a clear picture of your own game and what to do next' : 'a report, a target and a serve they trust')
  const facts = [when, where, camp.ages && !adult ? `ages ${camp.ages}` : '', price ? `${price} per player` : ''].filter(Boolean).join(' · ')
  const action = signupUrl ? (adult ? 'Places are limited — you can book yours here.' : 'Places are limited — you can sign your child up here.') : 'Reply to this message and I will hold a place.'

  const lead = adult
    ? pick([
      `By the last afternoon of ${name} you will know exactly why you win the points you win — and what to do about the ones you do not.`,
      `${days ? `${upperFirst(numberWord(days))} days` : 'A few days'} is long enough to change one thing in your game properly. That is what ${name} is for.`,
    ], seed)
    : pick([
      `By the last afternoon of ${name}, your child will have a serve they trust and a plan for how to start a point.`,
      `${days ? `${upperFirst(numberWord(days))} days` : 'A few days'} on court is enough to change one thing in a young player’s game for good. That is what ${name} is for.`,
    ], seed)

  const promo = {
    email: {
      subject: `${name} — places now open`.slice(0, 60),
      preheader: adult ? `${days ? `${days} days` : 'A week'} of proper coaching with players at your level.` : `${days ? `${days} days` : 'A week'} of coaching, matches and a report at the end.`,
      paragraphs: [
        lead,
        `${adult ? 'You' : 'They'} will spend the mornings on ${themeLine}, and the afternoons putting it to work in points and matches. ${str(brief.dailyShape) || (adult ? 'Small groups, the same coaches all week, and time to ask questions.' : 'Small groups, the same coaches all week, and plenty of games.')}`,
        `Everybody leaves with ${leaveLine}.`,
        [facts ? `The details: ${facts}.` : '', deposit ? `A deposit of ${deposit} holds the place.` : '', left > 0 && left <= 8 ? `There are ${left} places left.` : ''].filter(Boolean).join(' '),
      ].filter(Boolean),
      cta: action,
    },
    whatsapp: [
      `${name} is open for booking 🎾`,
      [when, where].filter(Boolean).join(' · '),
      adult ? `Coaching in the mornings, matches in the afternoons, and you leave with ${leaveLine}.` : `Coaching in the mornings, matches in the afternoons, and every child leaves with ${leaveLine}.`,
      [price ? `${price} per player.` : '', signupUrl ? 'Book here:' : `Reply to ${firstName(me.coach)} to book.`].filter(Boolean).join(' '),
    ].filter(Boolean).join('\n'),
    social: {
      caption: [
        lead,
        `${name}${when ? ` runs ${when}` : ''}${where ? ` at ${where}` : ''}. Mornings are for ${themeLine}; afternoons are for points, matches and finding out whether it holds up.`,
        `${adult ? 'You leave' : 'Every player leaves'} with ${leaveLine}.`,
        signupUrl ? 'Places are limited — the link is in our profile.' : `Message ${me.brand} to book a place.`,
      ].join('\n\n'),
      hashtags: ['tennis', 'tenniscamp', adult ? 'adulttennis' : 'juniortennis', 'tenniscoaching', lc(me.brand).replace(/[^a-z0-9]/g, ''), ...(camp.overseas ? ['tennisholiday'] : ['lovetennis'])].filter(Boolean).slice(0, 7),
    },
    poster: {
      headline: adult ? pick(['One week. A better game.', 'Play the game you practise'], seed) : pick(['A week that changes their game', 'Find their best tennis'], seed),
      sub: [name, when, where].filter(Boolean).join(' · '),
    },
  }
  return json({ ok: true, promo, signupUrl, campName: camp.name })
}

function numberWord(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n)
}

// POST /api/coach/camp-blast — the announcement, "sent". The security boundary
// of the real route (only addresses on the coach's own roster) is kept, so the
// count the UI reports is the one a real send would give.
const campBlast: Handler = async ({ body }) => {
  const b = obj(body)
  const subject = str(b.subject, 160)
  const paragraphs = listOf(b.paragraphs)
  if (!b.campId || !subject || !paragraphs.length) return fail('Nothing to send — generate the copy first.')
  if (!byId('coach_camps', b.campId)) return fail('Camp not found', 404)
  await beat()
  if (b.testOnly) return json({ ok: true, test: true, to: profile().email })

  const allowed = new Set<string>()
  for (const p of demoTable('coach_players')) {
    const addr = lc(isAdult(null, p?.age) ? (p?.email || p?.parent_email) : p?.parent_email)
    if (addr.includes('@')) allowed.add(addr)
  }
  const asked = [...new Set(listOf(b.recipients).map(lc))]
  const targets = asked.filter(a => allowed.has(a))
  if (!targets.length) return fail('None of those addresses are on your roster.')
  return json({ ok: true, sent: targets.length, failed: 0, dropped: asked.length - targets.length })
}

// ── Camp countdown emails ───────────────────────────────────────────────────

/** The sign-up confirmation (parentHtml in lib/coach/camp-signup-email.ts). That
    module also sends mail, so it cannot be imported into the browser; this is
    the same receipt, built from the same fields. */
function signupReceiptHtml(i: {
  academy: string; logoUrl: string | null; coachName: string; campName: string; when: string; location: string
  playerName: string; parentName: string; amountPennies: number; paymentMode: string; paid: boolean; direct: boolean
  formUrl: string | null
}): string {
  const money = (p: number) => '£' + (p / 100).toFixed(p % 100 ? 2 : 0)
  const rows = ([['Camp', i.campName], ['When', i.when], ['Where', i.location]] as [string, string][]).filter(r => !!r[1]).map(([l, v]) =>
    `<tr><td style="padding:7px 0;font-size:13px;color:#6b7280;width:150px;vertical-align:top">${esc(l)}</td>
         <td style="padding:7px 0;font-size:14px;color:#1a1d29">${esc(v)}</td></tr>`).join('')
  const payLine = !i.amountPennies ? ''
    : i.paid
      ? `<div style="background:#f1faf4;border:1px solid #cdebd8;border-radius:10px;padding:11px 13px;margin:16px 0;font-size:14px;color:#31543f">
           <strong>${money(i.amountPennies)} received.</strong> ${i.paymentMode === 'deposit' ? 'That secures the place — the balance is due before the camp starts.' : 'Paid in full.'}
         </div>`
      : `<div style="background:#fff7ed;border:1px solid #fcd9a8;border-radius:10px;padding:11px 13px;margin:16px 0;font-size:14px;color:#7c4a03">
           <strong>${money(i.amountPennies)} still to pay.</strong> The place is held for now — ${esc(i.coachName || 'your coach')} will be in touch with a payment link.
         </div>`
  const first = esc(firstName(i.playerName, 'Your player'))
  const head = i.direct
    ? `<h1 style="margin:0 0 6px;font-size:21px;color:#1a1d29">You&rsquo;re in</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">Thanks, ${first} — your place on <strong>${esc(i.campName)}</strong> is booked. Here&rsquo;s everything in one place.</p>`
    : `<h1 style="margin:0 0 6px;font-size:21px;color:#1a1d29">${first} is signed up</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151">Thanks${i.parentName ? ', ' + esc(firstName(i.parentName)) : ''} — we&rsquo;ve got ${esc(i.playerName)} down for <strong>${esc(i.campName)}</strong>. Here&rsquo;s everything in one place.</p>`
  const mapLink = i.location
    ? `<div style="margin-top:4px"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(i.location)}" style="font-size:13px;color:#3A8EE0">Get directions</a></div>` : ''
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,25,40,.07)">
  <div style="background:linear-gradient(135deg,#3A8EE0,#3A8EE0bb);padding:24px 22px;text-align:center;color:#fff">
    ${i.logoUrl ? `<img src="${esc(i.logoUrl)}" alt="" style="height:44px;max-width:150px;background:#fff;border-radius:10px;padding:7px;margin-bottom:10px">` : ''}
    <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.9">${esc(i.academy)}</div>
  </div>
  <div style="padding:24px 22px">
    ${head}
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #eef0f5">${rows}</table>
    ${mapLink}
    ${payLine}
    ${i.formUrl ? formEmailBlock(i.formUrl, { toParent: !i.direct, playerName: i.playerName }) : ''}
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7280">
      Anything we should know before the first morning — ${i.direct ? 'a niggle, a late arrival, a dietary requirement' : 'a change of collection arrangements, a new injury'} — just reply to this email and it comes straight to ${esc(i.coachName || 'the coaching team')}.
    </p>
    <p style="margin:14px 0 0;font-size:14px;color:#374151">See you on court.</p>
  </div>
</div>
<div style="max-width:560px;margin:14px auto 0;text-align:center;font-size:11px;color:#9aa1b1">Powered by Lumio</div>
</body></html>`
}

/** One countdown email, written from what the camp record actually holds. An
    absent field is an absent line — no email here invents a time or a hotel. */
function campEmailDraft(camp: Row, attendee: Row, stage: StageId, toParent: boolean, note: string): Draft {
  const me = profile()
  const name = str(camp.name) || 'the camp'
  const brief = (camp.parent_brief || {}) as Row
  const first = firstName(attendee.player_name, toParent ? 'your player' : 'you')
  const who = toParent ? first : 'you'
  const whose = toParent ? `${first}’s` : 'your'
  const are = toParent ? 'is' : 'are'
  const when = campWhen(camp)
  const where = campWhere(camp)
  const bring = listOf(brief.whatToBring)
  const work = listOf(brief.whatTheyWorkOn)
  const shape = str(brief.dailyShape || camp.daily_rhythm)
  const dayOne = Array.isArray(camp.itinerary) ? (camp.itinerary[0] as Row | undefined) : undefined
  const firstTime = str((dayOne?.sessions as Row[] | undefined)?.[0]?.time)
  const extra = note ? [sentence(note)] : []

  switch (stage) {
    case 'details': return {
      subject: `${name} — everything you need`,
      preheader: 'Kit, the shape of a day and where to be. Worth keeping.',
      paragraphs: [
        `This is the one to keep: everything you need for ${name} in a single email.`,
        [when ? `We run ${when}` : '', where ? `at ${where}` : ''].filter(Boolean).join(' ') + (when || where ? '.' : ''),
        shape ? `A typical day: ${lowerFirst(shape.replace(/\.$/, ''))}.` : '',
        work.length ? `Over the camp ${who} will work on ${work.slice(0, 3).map(x => lowerFirst(x.replace(/\.$/, ''))).join(', ')}.` : '',
        camp.overseas ? `As this one is abroad, please check ${whose} passport is in date for the whole trip and that travel insurance is in place.` : '',
        ...extra,
      ].filter(Boolean),
      bullets: bring.length ? bring : ['A racket (we have spares)', 'Non-marking tennis shoes', 'A large water bottle', 'Sun cream and a cap', 'A warm layer'],
      cta: 'If anything here does not work for you, reply to this email and it comes straight to me.',
    }
    case 'two_weeks': {
      const chase = chaseReasons(camp, attendee as { id: string } & Row)
      return {
        subject: chase.length ? `${name} — a couple of things before we start` : `${name} — two weeks to go`,
        preheader: chase.length ? 'A short list, and then you are all set.' : 'Nothing needed from you — just a hello.',
        paragraphs: [
          `${name} is two weeks away, and we are looking forward to it.`,
          chase.length
            ? `There ${chase.length === 1 ? 'is one thing' : `are ${chase.length} things`} still open for ${who}. None of them takes long, and once they are done there is nothing more to do until the first morning.`
            : `Everything is in place for ${who} — the balance, the consents and the contact details are all done. Thank you for being so organised.`,
          ...extra,
        ],
        bullets: chase,
        cta: chase.length ? 'If any of this looks wrong, reply and tell me — it is far more likely to be our records than you.' : 'Any questions before then, just reply.',
      }
    }
    case 'one_week': return {
      subject: `${name} — a week to go`,
      preheader: 'What day one looks like.',
      paragraphs: [
        `One week to go. The admin is behind us, so this one is just about the tennis.`,
        dayOne?.theme || dayOne?.focus
          ? `Day one is “${str(dayOne.theme || dayOne.focus)}”. ${toParent ? `We will watch ${first} play before we coach anything, so the week is built around what ${first} actually needs.` : 'We will watch you play before we coach anything, so the week is built around what you actually need.'}`
          : `The first morning is about getting to know everybody’s game, so the rest of the week is built around what each player needs.`,
        work.length ? `After that the days build on each other, starting with ${lowerFirst(work[0].replace(/\.$/, ''))}.` : '',
        toParent ? `The best preparation is simple: a couple of early nights, and a hit in the garden or at the park if ${first} fancies it.` : 'The best preparation is simple: a couple of gentle hits this week, and nothing new in the racket bag.',
        ...extra,
      ].filter(Boolean),
      bullets: [],
      cta: `See ${toParent ? 'you both' : 'you'} next week.`,
    }
    case 'tomorrow': return {
      subject: `${name} — see you tomorrow`,
      preheader: 'Time, place and three things to pack tonight.',
      paragraphs: [
        `Tomorrow is the day. ${[firstTime ? `We start at ${firstTime}` : '', where ? `at ${where}` : ''].filter(Boolean).join(' ') || 'The details are below'}${toParent ? ' — please arrive ten minutes early so there is time to sign in.' : ' — arriving ten minutes early makes the first morning easier.'}`,
        me.phone ? `If you are running late or cannot find us, ring ${firstName(me.coach)} on ${me.phone}.` : `If you are running late, reply to this email and it reaches ${firstName(me.coach)} straight away.`,
        ...extra,
      ],
      bullets: (bring.length ? bring : ['Racket', 'A full water bottle', 'Sun cream and a cap']).slice(0, 3),
      cta: `${toParent ? `${first} ${are} going to have a great week.` : 'It is going to be a great week.'}`,
    }
    default: return {
      subject: `${name} — how it went`,
      preheader: `${toParent ? `${first}’s report` : 'Your report'} and what to keep working on.`,
      paragraphs: [
        `Thank you for being part of ${name}. ${toParent ? `${first} was a pleasure to coach` : 'You were a pleasure to coach'}, and the group was one of the best we have had.`,
        `${toParent ? `${first}’s` : 'Your'} report and certificate are ready${toParent ? ' in the parent portal' : ' in your portal'}. The report says what moved during the camp and the one thing to keep working on now.`,
        work.length ? `The short version: keep practising ${lowerFirst(work[0].replace(/\.$/, ''))}, little and often, while it is fresh.` : '',
        ...extra,
      ].filter(Boolean),
      bullets: [],
      cta: 'If you would like to carry the work on in lessons, reply to this email and we will find a time.',
    }
  }
}

// POST /api/coach/camp-email-preview — one countdown email as a real attendee
// would receive it. With a `draft` it only renders (the editor calls it as the
// coach types); without one, Lumio Coach "writes" it. The HTML comes from
// renderCampEmail — the same function the real route and the real cron use.
const campEmailPreview: Handler = async ({ body, url }) => {
  const b = obj(body)
  if (!b.campId || !b.stage) return fail('campId and stage are required')
  const stage = STAGE_BY_ID[b.stage as StageId]
  if (!stage) return fail('Unknown email')
  const camp = byId('coach_camps', b.campId)
  if (!camp) return fail('Camp not found', 404)

  const on = demoTable('coach_camp_attendees').filter(a => String(a?.camp_id) === String(camp.id))
  const attendee = (b.attendeeId && on.find(a => String(a.id) === String(b.attendeeId)))
    || [...on].sort((x, y) => String(x?.created_at ?? '').localeCompare(String(y?.created_at ?? '')))[0]
  if (!attendee) return fail('Nobody is on this camp yet, so there is no email to preview. Add an attendee, or share the sign-up link.', 409)

  const player = attendee.player_id ? byId('coach_players', attendee.player_id) ?? null : null
  const me = profile()
  const prof = { brand_name: me.brand, brand_logo_url: me.logo, display_name: me.coach, contact_email: me.email }
  const rec = recipientFor(camp, attendee as { id: string } & Row, player)
  const recipient = { name: attendee.player_name || 'an attendee', to: rec.to, toParent: rec.toParent }

  if (stage.id === 'signup') {
    await beat()
    const html = signupReceiptHtml({
      academy: me.brand, logoUrl: me.logo, coachName: me.coach,
      campName: str(camp.name), when: campWhen(camp).replace(' to ', ' – '), location: campWhere(camp),
      playerName: str(attendee.player_name) || 'your player', parentName: str(attendee.parent_name),
      amountPennies: Number(attendee.amount_pennies) || 0, paymentMode: str(camp.payment_mode) || 'none',
      paid: !!attendee.paid, direct: rec.toParent === false, formUrl: null,
    })
    return json({
      ok: true, fixed: true, html,
      draft: { subject: rec.toParent === false ? `You're in — ${camp.name}` : `${attendee.player_name} is signed up — ${camp.name}` },
      recipient,
    })
  }

  let draft: Draft
  if (b.draft && Array.isArray(b.draft.paragraphs)) {
    // Rendering the coach's own text — instant, as it is on the live route.
    draft = b.draft as Draft
  } else {
    await think(`camp-email|${camp.id}|${stage.id}|${attendee.id}`)
    const overrides = (camp.email_overrides || {}) as Record<string, { note?: string }>
    draft = campEmailDraft(camp, attendee, stage.id, rec.toParent, str(overrides[stage.id]?.note, 600))
  }
  const { subject, html } = renderCampEmail({
    camp, attendee: attendee as { id: string } & Row, profile: prof,
    stageId: stage.id, draft, greeting: rec.greeting, origin: url.origin,
  })
  return json({ ok: true, draft: { ...draft, subject }, html, recipient })
}

// POST /api/coach/trip-draft — the trip hub, started from the camp record. The
// rule on the real route is the rule here: never invent a hotel, a transfer, a
// time or a phone number. So the draft is deliberately thin, and the UI tells
// the coach that the blanks are theirs to fill.
const tripDraft: Handler = async ({ body }) => {
  const campId = isForm(body) ? str(body.get('campId')) : str(obj(body).campId)
  if (!campId) return fail('campId is required')
  const camp = byId('coach_camps', campId)
  if (!camp) return fail('Camp not found', 404)
  if (isForm(body) && body.get('file')) { await beat(); return fail(NO_FILES) }
  await think(`trip|${campId}`)

  const me = profile()
  const adult = campAudience(camp) === 'adult'
  const when = campWhen(camp)
  const where = campWhere(camp)
  const surface = lc(camp.surface)
  const raw: Trip = {
    intro: [
      `Welcome to ${str(camp.name) || 'the camp'}${when ? ` — ${when}` : ''}${where ? `, at ${where}` : ''}.`,
      adult ? 'This page has everything for the trip in one place, and it is updated as details are confirmed.' : 'This page has everything families need for the trip in one place, and it is updated as details are confirmed.',
      str(camp.daily_rhythm) ? `The shape of a day: ${lowerFirst(str(camp.daily_rhythm).replace(/\.$/, ''))}.` : '',
    ].filter(Boolean).join(' '),
    venue: {
      name: str(camp.location) || undefined,
      address: where || undefined,
      courts: [camp.courts ? `${camp.courts} court${Number(camp.courts) === 1 ? '' : 's'}` : '', str(camp.surface)].filter(Boolean).join(' · ') || undefined,
    },
    stay: campResidential(camp) && str(camp.board) ? { meals: str(camp.board) } : undefined,
    contacts: [{ name: me.coach, role: 'Lead coach', ...(me.phone ? { phone: me.phone } : {}), note: 'First call for anything on the trip.' }],
    bring: [
      'Racket — and a spare if you have one',
      `${surface.includes('clay') ? 'Clay-court' : surface.includes('grass') ? 'Grass-court' : 'Non-marking'} tennis shoes`,
      'A large refillable water bottle',
      'Sun cream, a cap and sunglasses',
      'A warm layer for the evenings',
      ...(camp.overseas ? ['Passport, in date for the whole trip', 'Travel insurance details that cover racket sports'] : []),
      ...(adult ? ['Any strapping or supports you normally use'] : ['Any medication, named, to hand to a coach on arrival']),
    ],
    practical: camp.overseas ? { notes: 'Check your passport is valid for the whole trip and keep a copy of your insurance policy on your phone.' } : undefined,
  }
  return json({ ok: true, trip: cleanTrip(raw), from: 'camp', adult })
}

// ═══════════════════════════════════════════════════════════════════════════
// Identity and the portal shell
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/coach/whoami — the demo visitor is the head coach of the demo academy.
const whoami: Handler = () => {
  const me = profile()
  return json({
    academyId: DEMO_COACH_ID,
    staffId: null,
    isHead: true,
    role: 'head',
    equipmentOwn: true,
    brandName: me.brand,
    slug: me.slug,
    displayName: me.coach,
    // Same rule as the live route: a photo stored inline is never sent on the
    // hot path, only a path or a URL.
    avatarUrl: me.avatar && !me.avatar.startsWith('data:') ? me.avatar : null,
    brandLogoUrl: me.logo,
    staffRole: 'Head coach',
    accreditation: (me.row.qualifications as string | null) ?? null,
  })
}

// The staff row "my profile" edits. The live route resolves it from the signed-in
// coach's membership; the demo visitor is the head coach, so it is the head's own
// staff row where the seed has one.
const myStaffRow = (): Row | undefined => {
  const staff = demoTable('coach_staff')
  return staff.find(s => s?.is_head) || staff.find(s => same(s?.name, profile().coach)) || staff[0]
}
const PROFILE_READABLE = ['id', 'name', 'role', 'email', 'phone', 'qualifications', 'avatar_url', 'home_venue', 'contracted_hours', 'dbs_number', 'dbs_issued', 'dbs_expiry', 'safeguarding_trained', 'safeguarding_date', 'profile_complete']
const PROFILE_EDITABLE = ['avatar_url', 'phone', 'email', 'qualifications', 'dbs_number', 'dbs_issued', 'dbs_expiry', 'safeguarding_trained', 'safeguarding_date', 'profile_complete']

const myProfileGet: Handler = async () => {
  await beat()
  const row = myStaffRow()
  if (!row) return fail('No coach access', 403)
  const staff = Object.fromEntries(PROFILE_READABLE.map(k => [k, row[k] ?? null]))
  const venues = demoTable('coach_staff_venues').filter(v => String(v?.staff_id) === String(row.id)).map(v => ({
    id: v.venue_id, name: byId('coach_venues', v.venue_id)?.name ?? null, isPrimary: !!v.is_primary,
  }))
  return json({ staff, venues })
}
const myProfilePost: Handler = async ({ body }) => {
  await beat()
  const row = myStaffRow()
  if (!row) return fail('No coach access', 403)
  const b = obj(body)
  const patch: Row = {}
  for (const k of PROFILE_EDITABLE) if (k in b) patch[k] = b[k] === '' ? null : b[k]
  if (!Object.keys(patch).length) return fail('Nothing to update')
  Object.assign(row, patch, { updated_at: nowISO() })
  return json({ ok: true })
}

// ── Connected accounts ──────────────────────────────────────────────────────
// The demo opens with one mailbox-and-calendar connection, so every screen that
// asks "can I send as you?" or "is a calendar linked?" shows its connected
// state. Disconnecting works and stays disconnected for the visit — and the
// provider is then reported as not configured, because the alternative is a
// live "Connect" button that walks a demo visitor into a real OAuth consent
// screen (that button is a page navigation, which nothing here can intercept).
let mailboxConnected = true
const connections = () => mailboxConnected
  ? [{ provider: 'google', email_address: profile().email, capabilities: ['calendar', 'send_email'], status: 'connected', last_synced: nowISO(), updated_at: nowISO() }]
  : []

const integrationsGet: Handler = async () => {
  await beat()
  return json({ connections: connections(), configured: { google: mailboxConnected, microsoft: false, icloud: true } })
}
const integrationsDelete: Handler = ({ url }) => {
  const provider = url.searchParams.get('provider')
  if (!provider) return fail('Missing provider')
  if (provider === 'google') mailboxConnected = false
  return json({ ok: true })
}
const integrationsTest: Handler = async ({ body }) => {
  const { provider } = obj(body)
  if (!provider) return fail('Missing provider')
  const conn = connections().find(c => c.provider === provider)
  if (!conn) return fail('That account is not connected.')
  await sleep(600)
  return json({ ok: true, provider, from: conn.email_address })
}
const integrationsIcloud: Handler = async ({ body }) => {
  const b = obj(body)
  if (!str(b.appleId) || !str(b.appPassword)) return fail('Apple ID and an app-specific password are required')
  await beat()
  return fail('Connecting an account is switched off in the demo — please do not enter a real password here. In your own portal this links your calendar and your sending address in about a minute.')
}

// ── Card payments ───────────────────────────────────────────────────────────
// Status says "connected", so the Payments page shows its Take-a-payment
// controls rather than the not-switched-on notice. Starting a payment answers
// with the route's error shape, which the modal prints under the button — a
// checkout URL would open a real payment page.
const PAY_OFF = 'Card payments are switched off in the demo. In your own portal this opens a secure payment page and a QR code your player can scan at the side of the court.'
const payStatus: Handler = async () => { await beat(); return json({ connected: true, chargesEnabled: true, detailsSubmitted: true }) }
const payCheckout: Handler = async ({ body }) => {
  const pennies = Math.round(Number(obj(body).amount) * 100)
  if (!pennies || pennies < 50) return fail('Enter an amount of at least £0.50')
  await sleep(500)
  return fail(PAY_OFF)
}
const payConnect: Handler = async () => { await beat(); return fail('Connecting a bank account is switched off in the demo.') }

// ── Calendar ────────────────────────────────────────────────────────────────

// GET /api/coach/calendar/availability — "busy" blocks from the connected
// calendar: the coach's own life, which the booking calendar greys out. A few
// fixed weekly commitments, dropped on any day where one would sit on top of a
// lesson (a real diary would not have the clash either).
const WEEKLY_BUSY: Record<number, [number, number][]> = {
  1: [[12 * 60 + 30, 13 * 60 + 30]],                         // Monday lunch
  2: [[7 * 60 + 30, 8 * 60 + 30]],                           // Tuesday early
  3: [[13 * 60, 14 * 60]],                                   // Wednesday — club committee
  4: [[12 * 60, 13 * 60], [19 * 60, 20 * 60 + 30]],          // Thursday lunch, evening league
  5: [[15 * 60, 15 * 60 + 45]],                              // Friday school run
  6: [[13 * 60, 14 * 60 + 30]],                              // Saturday family
}
const availability: Handler = async ({ url }) => {
  const from = url.searchParams.get('from'), to = url.searchParams.get('to')
  if (!from || !to) return fail('from and to are required (ISO)')
  await beat()
  if (!mailboxConnected) return json({ busy: [] })
  const start = new Date(from), end = new Date(to)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return json({ busy: [] })
  const bookings = demoTable('coach_bookings').filter(b => lc(b?.status) !== 'cancelled')
  const busy: { start: string; end: string }[] = []
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  for (let i = 0; i < 45 && day < end; i++, day.setDate(day.getDate() + 1)) {
    const key = isoDay(day)
    const lessons = bookings.filter(b => dayKey(b.booking_date) === key).map(b => {
      const [h, m] = str(b.start_time).split(':').map(Number)
      const s = (h || 0) * 60 + (m || 0)
      return [s, s + (Number(b.duration_min) || 60)] as [number, number]
    })
    for (const [s, e] of WEEKLY_BUSY[day.getDay()] || []) {
      if (lessons.some(([ls, le]) => s < le && ls < e)) continue
      const at = (mins: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(mins / 60), mins % 60)
      if (at(e) <= start || at(s) >= end) continue
      busy.push({ start: at(s).toISOString(), end: at(e).toISOString() })
    }
  }
  return json({ busy })
}

// POST /api/coach/calendar/event — "pushed" to the connected calendar. `ok`
// with a provider list is what flips the calendar's sync pill to Synced.
const calendarEventPost: Handler = ({ body }) => {
  const b = obj(body)
  if (!b.bookingId || !b.title || !b.start || !b.end) return fail('bookingId, title, start and end are required')
  const synced = connections().map(c => c.provider)
  return json({ ok: true, synced, failed: [], connected: synced.length })
}
const calendarEventDelete: Handler = ({ url }) =>
  url.searchParams.get('bookingId') ? json({ ok: true }) : fail('Missing bookingId')

const campsSyncPost: Handler = ({ body }) => {
  const b = obj(body)
  // "missing" asks for camps never written to a calendar; on the demo they all have been.
  if (b.missing || !b.campId || !byId('coach_camps', b.campId)) return json({ ok: true, synced: 0, camps: 0 })
  return json({ ok: true, camps: 1, synced: mailboxConnected ? 1 : 0, failed: [], connected: mailboxConnected ? 1 : 0 })
}
const campsSyncDelete: Handler = ({ url }) =>
  url.searchParams.get('campId') ? json({ ok: true }) : fail('campId is required')

// POST /api/coach/bookings/confirm — the booking confirmation that would have
// gone to the player and the coach.
const bookingsConfirm: Handler = ({ body }) => {
  const { bookingId } = obj(body)
  if (!bookingId) return fail('bookingId is required')
  const booking = byId('coach_bookings', bookingId)
  if (!booking) return fail('Booking not found', 404)
  if (lc(booking.status) === 'cancelled') return json({ sent: false, reason: 'booking is cancelled' })
  const p = booking.player_id ? byId('coach_players', booking.player_id) : playerNamed(booking.player_name)
  const adult = isAdult(null, p?.age)
  const to = str(adult ? (p?.email || p?.parent_email) : (p?.parent_email || p?.email)) || null
  return json({ ok: true, to, toParent: !adult, reason: to ? null : 'no email address on file', inApp: !!p, playerSent: !!to, via: mailboxConnected ? 'google' : 'lumio-fallback', coachSent: true })
}
const campsConfirm: Handler = ({ body }) => {
  const { attendeeId } = obj(body)
  if (!attendeeId) return fail('attendeeId is required')
  const a = byId('coach_camp_attendees', attendeeId)
  if (!a) return fail('Attendee not found', 404)
  if (lc(a.status) === 'cancelled') return json({ sent: false, reason: 'cancelled' })
  const camp = byId('coach_camps', a.camp_id)
  if (!camp) return fail('Camp not found', 404)
  const rec = recipientFor(camp, a as { id: string } & Row, a.player_id ? byId('coach_players', a.player_id) : null)
  return json({ ok: true, inApp: !!a.player_id, emailedTo: rec.to })
}

// ── Booking links ───────────────────────────────────────────────────────────
// Kept in the store like any other table, so a link the visitor creates appears
// in "Links you've sent" and can be turned off. The address looks real and
// copies, but /book/<token> is a server page and no demo link exists there.
const newToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789-_'
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
const bookingLinkGet: Handler = async ({ url }) => {
  await beat()
  const links = [...demoTable('coach_booking_links')].sort(newestFirst('created_at')).slice(0, 12).map(l => ({
    id: l.id, token: l.token, name: l.name ?? null, email: l.email ?? null,
    duration_min: Number(l.duration_min) || 60, session_type: l.session_type ?? null,
    reusable: !!l.reusable, uses: Number(l.uses) || 0, used_at: l.used_at ?? null,
    revoked_at: l.revoked_at ?? null, expires_at: l.expires_at ?? null, created_at: l.created_at ?? null,
    url: `${url.origin}/book/${l.token}`,
  }))
  return json({ links })
}
const bookingLinkPost: Handler = async ({ body, url }) => {
  const b = obj(body)
  const email = lc(b.email).slice(0, 120)
  const reusable = !!b.reusable
  const send = b.send !== false && !reusable
  if (send && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fail('Give an email address to send the link to, or copy a general link instead.')
  }
  if (b.venueId && !byId('coach_venues', b.venueId)) return fail('That venue is not on your account.')
  await sleep(450)
  const player = b.playerId ? byId('coach_players', b.playerId) : undefined
  const toEmail = email || str(player?.parent_email || player?.email || player?.contact_email)
  const toName = str(b.name, 80) || str(player?.name)
  const durationMin = Math.max(15, Math.min(180, Number(b.durationMin) || 60))
  const sessionType = str(b.sessionType, 40) || 'Private'
  const note = str(b.note, 400) || null
  const link: Row = {
    id: demoId(), coach_id: DEMO_COACH_ID, staff_id: b.staffId && byId('coach_staff', b.staffId) ? b.staffId : null,
    player_id: player?.id ?? null, token: newToken(), name: toName || null, email: toEmail || null,
    duration_min: durationMin, session_type: sessionType, venue_id: b.venueId || null, court: str(b.court, 80) || null,
    note, reusable, uses: 0, used_at: null, revoked_at: null, expires_at: null, created_at: nowISO(),
  }
  demoTable('coach_booking_links').unshift(link)
  const linkUrl = `${url.origin}/book/${link.token}`
  if (!send) return json({ ok: true, id: link.id, url: linkUrl, sent: false })

  // In the portal too, as the live route does — a link that only exists in an
  // inbox is a link that gets archived.
  if (player?.name) {
    demoTable('coach_messages').unshift({
      id: demoId(), coach_id: DEMO_COACH_ID, recipients: player.name, thread_key: player.name, direction: 'out',
      channels: 'inapp, email', subject: 'Book your next session',
      body: `Pick a time that suits you and it goes straight into my diary.\n\n[Book a session](${linkUrl})\n\n${sessionType} · ${durationMin} minutes${note ? `\n\n${note}` : ''}`,
      status: 'sent', read: true, created_at: nowISO(),
    })
  }
  return json({ ok: true, id: link.id, url: linkUrl, sent: true, to: toEmail })
}
const bookingLinkDelete: Handler = ({ url }) => {
  const id = url.searchParams.get('id')
  if (!id) return fail('id is required')
  const link = byId('coach_booking_links', id)
  if (link) link.revoked_at = nowISO()
  return json({ ok: true })
}

// ── Discord ─────────────────────────────────────────────────────────────────
// Whatever the seed says. With no channels linked anywhere it is the plain
// "bot not in your server yet" state, without an invite link (that link leaves
// the site). If the seed has linked a camp's channels, the demo academy has a
// server and the panel is fully workable: link, unlink and tick, all in the store.
const DEMO_GUILD = 'demo-guild'
const DEMO_CHANNELS = ['general', 'important-info', 'travel-info', 'faqs', 'photos']
const channelRows = () => demoTable('coach_camp_channels')
const discordGet: Handler = async ({ url }) => {
  await beat()
  const campId = url.searchParams.get('campId')
  const guildId = url.searchParams.get('guildId')
  const rows = channelRows()
  const linked = rows.filter(r => campId && String(r?.camp_id) === String(campId)).map(r => ({
    id: r.id, guildId: r.guild_id ?? DEMO_GUILD, channelId: r.channel_id, channelName: r.channel_name ?? null,
    syncedAt: r.synced_at ?? null, mirror: !!r.mirror,
  }))
  if (!rows.length) return json({ configured: true, invite: null, guilds: [], channels: [], linked })
  const guilds = [...new Set(rows.map(r => str(r.guild_id) || DEMO_GUILD))].map(id => ({ id, name: `${profile().brand} — players and parents` }))
  const names = [...new Set([...rows.map(r => str(r.channel_name)).filter(Boolean), ...DEMO_CHANNELS])]
  const channels = guildId ? names.map(name => ({
    id: str(rows.find(r => r.channel_name === name)?.channel_id) || `demo-${name}`, name, parentName: 'Camps',
  })) : []
  return json({ configured: true, invite: null, guilds, channels, linked })
}
const discordPost: Handler = async ({ body }) => {
  const b = obj(body)
  if (!b.campId) return fail('campId is required')
  if (!byId('coach_camps', b.campId)) return fail('Camp not found', 404)
  await beat()
  const rows = channelRows()
  const mine = rows.filter(r => String(r?.camp_id) === String(b.campId))
  const toLink: { id: string; name: string }[] = Array.isArray(b.channels) && b.channels.length
    ? b.channels
    : (b.channelId && b.mirror === undefined ? [{ id: b.channelId, name: b.channelName ?? '' }] : [])
  if (toLink.length) {
    const fresh = toLink.filter(c => !mine.some(r => String(r.channel_id) === String(c.id)))
    if (!fresh.length && !Array.isArray(b.channels)) return fail('That channel is already linked to this camp.')
    fresh.forEach((c, i) => rows.push({
      id: demoId(), coach_id: DEMO_COACH_ID, camp_id: b.campId, guild_id: b.guildId ?? DEMO_GUILD,
      channel_id: c.id, channel_name: c.name || null, last_message_id: null, synced_at: null,
      // A camp's first channel is where camp-wide messages go by default.
      mirror: mine.length === 0 && i === 0, created_at: nowISO(),
    }))
  }
  if (b.channelId && typeof b.mirror === 'boolean') {
    const row = mine.find(r => String(r.channel_id) === String(b.channelId))
    if (row) row.mirror = b.mirror
  }
  for (const r of rows) if (String(r?.camp_id) === String(b.campId)) r.synced_at = nowISO()
  return json({ ok: true, added: 0 })
}
const discordDelete: Handler = ({ url }) => {
  const campId = url.searchParams.get('campId'), channelId = url.searchParams.get('channelId')
  if (!campId) return fail('campId is required')
  const rows = channelRows()
  for (let i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i]?.camp_id) === campId && (!channelId || String(rows[i]?.channel_id) === channelId)) rows.splice(i, 1)
  }
  return json({ ok: true })
}

// ═══════════════════════════════════════════════════════════════════════════
// Sends — nothing goes anywhere; the record of it is written to the store
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/coach/message/send — one outbound row per recipient (the shape
// LiveMessages groups into conversations), plus the camp thread for a camp-wide
// message.
const messageSend: Handler = async ({ body }) => {
  const b = obj(body)
  const recipients: Row[] = Array.isArray(b.recipients) ? b.recipients : []
  const channels = listOf(b.channels)
  const text = String(b.body ?? '')
  if (!text.trim()) return fail('Message body is required')
  if (!recipients.length) return fail('Add at least one recipient')
  if (!channels.length) return fail('Choose at least one channel')
  await sleep(500)

  const from = profile().email
  const label = (r: Row) => str(r?.name || r?.email || r?.phone) || '—'
  const results: { name: string; channel: string; ok: boolean; detail: string }[] = []
  for (const ch of channels) {
    for (const r of recipients) {
      if (ch === 'inapp') results.push({ name: label(r), channel: ch, ok: true, detail: 'Sent in-app' })
      else if (ch === 'email') results.push(r?.email ? { name: label(r), channel: ch, ok: true, detail: `Sent from ${from}` } : { name: label(r), channel: ch, ok: false, detail: 'No email on file' })
      else if (ch === 'sms') results.push(r?.phone ? { name: label(r), channel: ch, ok: true, detail: 'Sent' } : { name: label(r), channel: ch, ok: false, detail: 'No phone on file' })
    }
  }
  const okCount = results.filter(r => r.ok).length
  const status = okCount === 0 ? 'failed' : okCount === results.length ? 'sent' : 'partial'

  const messages = demoTable('coach_messages')
  const base = { coach_id: DEMO_COACH_ID, direction: 'out', channels: channels.join(', '), subject: b.subject || null, body: text, read: true }
  for (const r of recipients) {
    const who = str(r?.name || r?.email || r?.phone)
    if (!who) continue
    const mine = results.filter(x => x.name === who)
    const okMine = mine.filter(x => x.ok).length
    messages.unshift({
      ...base, id: demoId(), recipients: who, thread_key: who,
      status: mine.length === 0 ? status : okMine === 0 ? 'failed' : okMine === mine.length ? 'sent' : 'partial',
      results: mine.length ? mine : results, created_at: nowISO(),
    })
  }
  const camp = b.campId ? byId('coach_camps', b.campId) : undefined
  if (camp) {
    const chans = channelRows().filter(c => String(c?.camp_id) === String(camp.id))
    const picked = b.channel ? chans.find(c => c.channel_name === b.channel) : null
    const targets = picked ? [picked] : chans.filter(c => c.mirror)
    messages.unshift({
      ...base, id: demoId(), recipients: `Camp · ${camp.name}`, thread_key: `camp:${camp.id}`, camp_id: camp.id, status,
      ...(targets.length === 1 ? { discord_channel_name: targets[0].channel_name } : {}), created_at: nowISO(),
    })
  }
  return json({ status, results })
}

// POST /api/coach/camps/form-send — the player-information form, "emailed".
const campFormSend: Handler = async ({ body }) => {
  const b = obj(body)
  if (!b.campId) return fail('campId is required')
  const camp = byId('coach_camps', b.campId)
  if (!camp) return fail('Camp not found', 404)
  if (!formEnabled(camp)) return fail('The form is switched off for this camp.')
  await sleep(500)
  let sent = 0
  const noAddress: string[] = []
  for (const a of attendeesOf(camp.id)) {
    if (a.form_submitted_at || (b.attendeeId && String(a.id) !== String(b.attendeeId))) continue
    const rec = recipientFor(camp, a as { id: string } & Row, a.player_id ? byId('coach_players', a.player_id) : null)
    if (!rec.to) { noAddress.push(str(a.player_name)); continue }
    // Every attendee has their own link on a live camp; make sure a seeded one does too.
    if (!a.form_token) a.form_token = newToken()
    a.form_sent_at = nowISO()
    sent++
  }
  return json({ ok: true, sent, failed: 0, noAddress })
}

// POST /api/portal/invite — a portal login for a parent, a player or a coach.
const portalInvite: Handler = async ({ body }) => {
  const b = obj(body)
  const email = lc(b.email)
  if (!email || !/.+@.+\..+/.test(email)) return fail('A valid email is required')
  if (!['coach', 'parent', 'student'].includes(str(b.role))) return fail('Invalid role')
  if ((b.role === 'parent' || b.role === 'student') && !b.scopePlayerId) return fail('A player must be chosen for a parent/student invite')
  await sleep(500)
  const members = demoTable('coach_members')
  const row: Row = {
    academy_id: DEMO_COACH_ID, email, role: b.role, scope_player_id: b.scopePlayerId ?? null,
    scope_coach_name: b.scopeCoachName ?? null, staff_id: b.staffId && b.staffId !== '__head__' ? b.staffId : null,
    status: 'invited', updated_at: nowISO(),
  }
  const hit = members.find(m => lc(m?.email) === email)
  if (hit) Object.assign(hit, row)
  else members.unshift({ id: demoId(), created_at: nowISO(), ...row })
  return json({ ok: true })
}

// ═══════════════════════════════════════════════════════════════════════════
// Roster, kit, effort
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/coach/players/merge — really merges, in the store.
const MERGE_TABLES = [
  'coach_bookings', 'coach_sessions', 'coach_attendance', 'coach_player_skills', 'coach_media',
  'coach_watch_sessions', 'coach_camp_attendees', 'coach_development', 'coach_player_resources',
  'coach_booking_links', 'coach_payments',
]
const MERGE_FILLABLE = ['nickname', 'age', 'level', 'category', 'racket_stage', 'goal', 'avatar_url', 'email', 'contact_email', 'parent_email', 'parent_name', 'phone', 'notes', 'medical_notes', 'staff_id', 'payment_method', 'year_group']
const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === ''

const playersMerge: Handler = async ({ body }) => {
  const b = obj(body)
  const keepId = str(b.keepId)
  const losers = (Array.isArray(b.mergeIds) ? b.mergeIds : []).map(String).filter((id: string) => id && id !== keepId)
  if (!keepId || !losers.length) return fail('Pick which profile to keep and at least one to merge into it.')
  if (losers.length > 20) return fail('That is too many at once.')
  await beat()
  const players = demoTable('coach_players')
  const keep = players.find(p => String(p?.id) === keepId)
  const gone = players.filter(p => losers.includes(String(p?.id)))
  if (!keep || gone.length !== losers.length) return fail('Those players are not all on your roster.', 404)

  // 1. Move every row across — by id, and by name for rows older than ids.
  const keepName = str(keep.name)
  const goneNames = gone.map(g => lc(g.name)).filter(n => n && n !== lc(keepName))
  const moved: Record<string, number> = {}
  for (const table of MERGE_TABLES) {
    let n = 0
    for (const r of demoTable(table)) {
      if (!r) continue
      const byIdHit = r.player_id != null && losers.includes(String(r.player_id))
      const byNameHit = r.player_id == null && goneNames.includes(lc(r.player_name))
      if (!byIdHit && !byNameHit) continue
      if (byIdHit) { r.player_id = keepId; n++ }
      if ('player_name' in r) r.player_name = keepName
    }
    if (n) moved[table] = n
  }
  // A skill scored on both profiles would now be there twice; the higher score stands.
  const skills = demoTable('coach_player_skills')
  const bestSkill = new Map<string, Row>()
  for (let i = skills.length - 1; i >= 0; i--) {
    const s = skills[i]
    if (String(s?.player_id) !== keepId) continue
    const had = bestSkill.get(lc(s.skill))
    if (!had) { bestSkill.set(lc(s.skill), s); continue }
    if ((Number(s.score) || 0) > (Number(had.score) || 0)) { skills.splice(skills.indexOf(had), 1); bestSkill.set(lc(s.skill), s) }
    else skills.splice(i, 1)
  }

  // 2. Rescue what the duplicates knew.
  const patch: Row = {}
  for (const f of MERGE_FILLABLE) {
    if (!blank(keep[f])) continue
    const found = gone.map(g => g[f]).find(v => !blank(v))
    if (found !== undefined) patch[f] = found
  }
  const xp = [keep, ...gone].reduce((n, p) => n + (Number(p.xp_total) || 0), 0)
  if (xp !== (Number(keep.xp_total) || 0)) patch.xp_total = xp
  for (const c of ['consent_data', 'consent_photo', 'consent_medical', 'consent_wearable']) {
    if (!keep[c] && gone.some(g => g[c])) patch[c] = true
  }
  Object.assign(keep, patch)

  // 3. Only now, the empty shells.
  for (let i = players.length - 1; i >= 0; i--) if (losers.includes(String(players[i]?.id))) players.splice(i, 1)
  return json({ ok: true, kept: keepId, merged: losers.length, moved, filled: Object.keys(patch) })
}

// POST /api/coach/equipment-setup — an assistant coach choosing their own kit
// list. The demo visitor is the head coach and already owns the academy's.
const equipmentSetup: Handler = ({ body }) => {
  const { mode } = obj(body)
  if (mode !== 'copy' && mode !== 'blank') return fail('mode must be copy or blank')
  return json({ ok: true, mode, copied: 0 })
}

// POST /api/coach/watch/log — a manually logged session, scored exactly as the
// live route scores it and added to the player's effort record.
const watchLog: Handler = async ({ body }) => {
  const b = obj(body)
  const playerId = str(b.player_id)
  if (!playerId) return fail('Pick a player', 422)
  const num = (v: unknown) => { const n = Number(v); return v === null || v === undefined || v === '' || Number.isNaN(n) ? null : n }
  const duration = num(b.duration_min) ?? 0
  if (duration < MANUAL_MIN_DURATION_MIN) return fail(`Session too short (min ${MANUAL_MIN_DURATION_MIN} min)`, 422)
  const rpe = num(b.perceived_effort)
  if (rpe == null || rpe < 1 || rpe > 10) return fail('Set how hard it felt (1–10)', 422)
  const player = byId('coach_players', playerId)
  if (!player) return fail('Player not found', 404)
  await beat()
  const distance = num(b.distance_m)
  const s = scoreManualSession({ duration, rpe, distance })
  demoTable('coach_watch_sessions').unshift({
    id: demoId(), coach_id: DEMO_COACH_ID, player_id: playerId, source: 'manual',
    started_at: b.started_at || nowISO(), duration_min: duration, avg_hr: null, max_hr: null, distance_m: distance,
    effort_score: s.effort, movement_score: s.movement, consistency_score: s.consistency, xp_awarded: s.xp,
    estimated: true, voided: false,
    raw: { manual: true, logged_by: 'coach', perceived_effort: rpe, note: str(b.note, 280) || null },
    created_at: nowISO(),
  })
  const total = (Number(player.xp_total) || 0) + s.xp
  player.xp_total = total
  return json({ ok: true, scores: { effort: s.effort, movement: s.movement, consistency: s.consistency }, xp_awarded: s.xp, xp_total: total })
}

// ═══════════════════════════════════════════════════════════════════════════
// Media and uploads
// ═══════════════════════════════════════════════════════════════════════════

// A recording is uploaded by an XHR PUT straight to storage, which a fetch
// stand-in never sees. So the demo stops one step earlier: `sign` — the fetch
// that would mint the upload URL — answers with the route's error shape, the
// uploader throws that message, and no bytes are ever sent anywhere.
const UPLOADS_OFF = 'Uploads are switched off in the demo, so nothing you record or pick here leaves your device. In your own portal a recording is transcribed and written up as a lesson summary within a couple of minutes.'
const mediaSign: Handler = async () => { await beat(); return fail(UPLOADS_OFF, 403) }

const mediaReady: Handler = ({ body }) => {
  const b = obj(body)
  const ids = (Array.isArray(b.ids) && b.ids.length ? b.ids : b.id ? [b.id] : []).filter(Boolean)
  if (!ids.length) return fail('Missing media id(s)')
  const pending = ids.filter((id: unknown) => !byId('coach_media', id))
  return json({ ready: pending.length === 0, pending })
}

// "Generate AI review" on a clip already in the library. The live pipeline
// writes its progress onto the row and the UI polls for it; here the stages
// are a clock started by /process and read by GET /media/<id>, so the card
// walks through Transcribing… and Writing summary… before the review lands.
const reviewing = new Map<string, number>()
const mediaProcess: Handler = ({ body }) => {
  const b = obj(body)
  const ids: string[] = (Array.isArray(b.ids) && b.ids.length ? b.ids : b.id ? [b.id] : []).filter(Boolean).map(String)
  if (!ids.length) return fail('Missing media id(s)')
  const rows = ids.map(id => byId('coach_media', id)).filter(Boolean) as Row[]
  if (!rows.length) return fail('Media not found', 404)
  for (const r of rows) { reviewing.set(String(r.id), Date.now()); r.status = 'processing'; r.error = null }
  return json({ status: 'processing', firstId: ids[0] })
}

function finishReview(m: Row) {
  reviewing.delete(String(m.id))
  const title = str(m.title)
  const seed = hash(`${m.id}|${title}`)
  const s = writeSummary({ player: m.player_name, focus: m.shot_type ? `${m.shot_type} technique` : title, note: '', rating: 4, seed })
  m.status = 'done'
  m.review = { ...s, source: 'recording' }
  // The summary is the point of the recording — it lands in Lesson Summaries.
  const player = playerNamed(m.player_name)
  demoTable('coach_sessions').unshift({
    id: demoId(), coach_id: DEMO_COACH_ID, player_id: player?.id ?? null, player_name: str(m.player_name) || null,
    session_date: dayKey(m.created_at) || today(), focus: s.focus, rating: s.rating, summary: s.recap,
    ai_review: formatWriteUp(s), review_json: m.review, media_id: m.id, created_at: nowISO(), updated_at: nowISO(),
  })
}

// GET /api/coach/media/<id> — no playable URL: the demo's clips are records
// without a file behind them, and the player simply does not open without one.
const mediaGet = (id: string): Response => {
  const m = byId('coach_media', id)
  if (!m) return fail('Not found', 404)
  const started = reviewing.get(String(m.id))
  if (started != null) {
    const elapsed = Date.now() - started
    if (elapsed >= 6500) finishReview(m)
    else m.status = elapsed >= 3200 ? 'summarising' : 'transcribing'
  }
  return json({
    id: m.id, kind: m.kind ?? null, title: m.title ?? null, status: m.status ?? 'done',
    transcript: m.transcript ?? null, review: m.review ?? null, playerName: m.player_name ?? null,
    error: m.error ?? null, createdAt: m.created_at ?? null, url: null,
  })
}
const mediaDelete = (id: string): Response => {
  const rows = demoTable('coach_media')
  // A recording's highlight clips go with it.
  for (let i = rows.length - 1; i >= 0; i--) if (String(rows[i]?.id) === id || String(rows[i]?.clip_of) === id) rows.splice(i, 1)
  reviewing.delete(id)
  return json({ ok: true })
}

// POST /api/coach/avatar and /staff-avatar — the picture the visitor chose is
// handed straight back as the "stored" URL (it is already a small data URL,
// which avatarSrc renders as it is) and written onto the row, so the face
// appears everywhere for the rest of the visit.
const avatar: Handler = ({ body }) => {
  const b = obj(body)
  if (!b.playerId || !b.dataUrl) return fail('Missing image')
  const player = byId('coach_players', b.playerId)
  if (!player) return fail('Player not found', 404)
  player.avatar_url = b.dataUrl
  return json({ url: b.dataUrl })
}
const staffAvatar: Handler = ({ body }) => {
  const b = obj(body)
  if (!b.dataUrl) return fail('Missing image')
  if (b.head) return json({ url: b.dataUrl })     // the client saves the head coach's own photo
  if (!b.staffId) return fail('Missing coach')
  const staff = byId('coach_staff', b.staffId)
  if (!staff) return fail('Coach not found', 404)
  Object.assign(staff, { avatar_url: b.dataUrl, updated_at: nowISO() })
  return json({ url: b.dataUrl })
}

// POST /api/coach/resources/file — a "file:" address only means something to
// the storage bucket behind the live route, so there is nothing useful to hand
// back. The caller prints this message beside the upload button.
const resourceFile: Handler = async () => {
  await beat()
  return fail('Attaching files is switched off in the demo — paste a web link instead. In your own portal you can attach PDFs, slides, spreadsheets and images to any resource.')
}

// POST /api/coach/import (+ /map, /save, /attendees)
const IMPORT_OFF = 'Importing is switched off in the demo — it is one of the first things you will do in your own portal.'
const importOff: Handler = async () => { await beat(); return fail(IMPORT_OFF) }

// GET /api/coach/slug-check — only reached from onboarding, which the demo skips.
const slugCheck: Handler = ({ url }) => json({ slug: lc(url.searchParams.get('slug')), available: true })

// ═══════════════════════════════════════════════════════════════════════════
// The student's page, as the coach previews it
// ═══════════════════════════════════════════════════════════════════════════

const only = (r: Row, cols: string[]) => Object.fromEntries(cols.map(c => [c, r[c] ?? null]))
const MSG_COLS = ['id', 'direction', 'from_name', 'subject', 'body', 'created_at', 'reaction', 'to_name', 'reply_to', 'camp_id', 'channels']

// GET /api/coach/student-preview?playerId= — the same bundle the family's own
// portal is given, assembled from the same tables by the same rules.
const studentPreview: Handler = async ({ url }) => {
  const playerId = url.searchParams.get('playerId')
  if (!playerId) return fail('Missing player')
  const player = byId('coach_players', playerId)
  if (!player) return fail('Player not found', 404)
  await beat()
  const name = str(player.name)

  const skills = demoTable('coach_player_skills').filter(s => String(s?.player_id) === playerId && s?.skill)
    .map(s => ({ skill: s.skill, score: Number(s.score) || 0 }))
  const lessons = rowsFor('coach_sessions', player).sort(newestFirst('session_date')).slice(0, 50)
    .map(r => only(r, ['id', 'session_date', 'focus', 'summary', 'ai_review', 'review_json', 'rating']))
  const watch = demoTable('coach_watch_sessions').filter(w => String(w?.player_id) === playerId && !w?.voided)
    .sort(newestFirst('started_at')).slice(0, 50)
    .map(w => only(w, ['started_at', 'duration_min', 'avg_hr', 'max_hr', 'distance_m', 'effort_score', 'movement_score', 'consistency_score', 'xp_awarded']))

  // Resources for their stage, plus anything marked for all levels.
  const stage = str(player.racket_stage)
  const settings = (demoTable('coach_settings')[0]?.data || {}) as Row
  const lumioOff = settings.resourcesPreloaded === false
  const resources = demoTable('coach_resources')
    .filter(r => r && !(lumioOff && isLumioResource(r as { title?: string | null })))
    .filter(r => (stage && r.racket === stage) || (!r.racket && lc(r.level).startsWith('all')))
    .slice(0, 9)
    .map(r => {
      const u = str(r.url)
      return {
        ...only(r, ['id', 'title', 'category', 'format', 'racket', 'level', 'duration', 'notes']),
        // An attached file opens through the live storage route, which has no
        // demo files behind it — so it is listed without a link rather than
        // with one that fails.
        url: u.startsWith('lumio:') ? u : u.startsWith('file:') ? null : resourceHref(u),
      }
    })

  // Camps they are booked on, with their own attendee details and targets only.
  const mine = demoTable('coach_camp_attendees').filter(a => String(a?.player_id) === playerId && lc(a?.status || 'confirmed') !== 'cancelled')
  const camps = mine.map(a => {
    const c = byId('coach_camps', a.camp_id)
    if (!c) return null
    const targets = Array.isArray(c.player_targets) ? (c.player_targets as Row[]).filter(t => same(t?.player_name, name)) : []
    return {
      ...only(c, ['id', 'name', 'start_date', 'end_date', 'location', 'region', 'audience', 'board', 'daily_rhythm', 'description', 'intent', 'objectives', 'outcomes', 'itinerary', 'equipment', 'parent_brief', 'balance_link', 'overseas', 'trip']),
      player_targets: targets,
      paid: a.paid ?? null, status: a.status ?? 'confirmed',
      room: a.room ?? null, arrival: a.arrival ?? null, camp_goal: a.camp_goal ?? null,
    }
  }).filter(Boolean) as Row[]

  const all = demoTable('coach_messages')
  const messages = all
    .filter(m => m && (same(m.thread_key, name) || (m.thread_key == null && same(m.recipients, name))))
    .sort(newestFirst('created_at')).slice(0, 40).map(m => only(m, MSG_COLS))

  const books = demoTable('coach_player_resources')
    .filter(r => String(r?.player_id) === playerId && r?.kind === 'book').sort(newestFirst('created_at')).slice(0, 12)
    .map(r => { const shelf = bookById(String(r.ref_id)); return { id: r.id, title: r.title, author: r.author ?? null, note: r.note ?? null, topic: shelf?.topic ?? null, spine: shelf?.spine ?? null } })

  const coaches = demoTable('coach_staff').filter(s => str(s?.name)).slice(0, 40)
    .map(s => ({ id: String(s.id), name: str(s.name), role: s.role || (s.is_head ? 'Head coach' : 'Coach'), avatar_url: null }))

  const campThreads = camps.map(c => ({
    campId: String(c.id), name: str(c.name) || 'Camp', people: attendeesOf(c.id).length,
    messages: all.filter(m => m && (String(m.camp_id) === String(c.id) || m.thread_key === `camp:${c.id}`))
      .sort(newestFirst('created_at')).slice(0, 120)
      .map(m => ({ ...only(m, MSG_COLS), channel: m.discord_channel_name ?? null })),
    channels: channelRows().filter(ch => String(ch?.camp_id) === String(c.id)).map(ch => str(ch.channel_name)).filter(Boolean),
  }))

  // The one rule for "which booking is next" lives in lib/student/next-session;
  // it only needs something that answers .from(), which the demo client does.
  const nextSession = await buildNextSession(demoClient(), DEMO_COACH_ID, playerId, name).catch(() => null)

  return json({
    books, messages, nextSession, coaches, campThreads,
    player: only(player, ['id', 'name', 'nickname', 'age', 'category', 'level', 'racket_stage', 'goal', 'avatar_url', 'parent_name', 'parent_email', 'xp_total']),
    // Clips and voice notes are files; the demo has none to play, and a tile
    // that opens an empty player is worse than no tile.
    skills, lessons, clips: [], voiceNotes: [], watch, resources, camps,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// The table
// ═══════════════════════════════════════════════════════════════════════════

const C = '/api/coach'
const ROUTES: Record<string, Handler> = {
  // Identity and shell
  [`GET ${C}/whoami`]: whoami,
  [`GET ${C}/my-profile`]: myProfileGet,
  [`POST ${C}/my-profile`]: myProfilePost,
  [`GET ${C}/integrations`]: integrationsGet,
  [`DELETE ${C}/integrations`]: integrationsDelete,
  [`POST ${C}/integrations/test`]: integrationsTest,
  [`POST ${C}/integrations/icloud`]: integrationsIcloud,
  [`GET ${C}/pay/status`]: payStatus,
  [`POST ${C}/pay/checkout`]: payCheckout,
  [`POST ${C}/pay/connect`]: payConnect,
  [`GET ${C}/calendar/availability`]: availability,
  [`POST ${C}/calendar/event`]: calendarEventPost,
  [`DELETE ${C}/calendar/event`]: calendarEventDelete,
  [`POST ${C}/camps/sync`]: campsSyncPost,
  [`DELETE ${C}/camps/sync`]: campsSyncDelete,
  [`POST ${C}/bookings/confirm`]: bookingsConfirm,
  [`POST ${C}/camps/confirm`]: campsConfirm,
  [`GET ${C}/booking-link`]: bookingLinkGet,
  [`POST ${C}/booking-link`]: bookingLinkPost,
  [`DELETE ${C}/booking-link`]: bookingLinkDelete,
  [`GET ${C}/discord`]: discordGet,
  [`POST ${C}/discord`]: discordPost,
  [`DELETE ${C}/discord`]: discordDelete,
  [`GET ${C}/slug-check`]: slugCheck,
  // Lumio Coach
  [`POST ${C}/briefing`]: briefing,
  [`POST ${C}/session-draft`]: sessionDraft,
  [`POST ${C}/lesson-summary`]: lessonSummary,
  [`POST ${C}/session-complete`]: sessionComplete,
  [`POST ${C}/ai-review`]: aiReview,
  [`POST ${C}/message-draft`]: messageDraft,
  [`POST ${C}/player-targets`]: playerTargets,
  [`POST ${C}/welcome-plan`]: welcomePlan,
  [`POST ${C}/camp-design`]: campDesign,
  [`POST ${C}/camp-import`]: campImport,
  [`POST ${C}/camp-targets`]: campTargets,
  [`POST ${C}/camp-player`]: campPlayer,
  [`POST ${C}/camp-promo`]: campPromo,
  [`POST ${C}/camp-email-preview`]: campEmailPreview,
  [`POST ${C}/trip-draft`]: tripDraft,
  [`POST ${C}/camp-kit`]: campKit,
  // Sends
  [`POST ${C}/message/send`]: messageSend,
  [`POST ${C}/camp-blast`]: campBlast,
  [`POST ${C}/camps/form-send`]: campFormSend,
  ['POST /api/portal/invite']: portalInvite,
  // Roster, kit, effort
  [`POST ${C}/players/merge`]: playersMerge,
  [`POST ${C}/equipment-setup`]: equipmentSetup,
  [`POST ${C}/watch/log`]: watchLog,
  // Media and uploads
  [`POST ${C}/media/sign`]: mediaSign,
  [`POST ${C}/media/upload`]: mediaSign,
  [`POST ${C}/media/ready`]: mediaReady,
  [`POST ${C}/media/process`]: mediaProcess,
  [`POST ${C}/avatar`]: avatar,
  [`POST ${C}/staff-avatar`]: staffAvatar,
  [`POST ${C}/resources/file`]: resourceFile,
  [`POST ${C}/import`]: importOff,
  [`POST ${C}/import/map`]: importOff,
  [`POST ${C}/import/save`]: importOff,
  [`POST ${C}/import/attendees`]: importOff,
  // Student page
  [`GET ${C}/student-preview`]: studentPreview,
}

const MEDIA_ID = /^\/api\/coach\/media\/([^/]+)$/

/**
 * The demo's answer to one coach-API request, or undefined to let fetch.ts
 * reply with its harmless { ok: true, demo: true }.
 */
export async function demoApi(path: string, method: string, body: unknown, url: URL): Promise<Response | undefined> {
  const clean = path.replace(/\/+$/, '')
  const verb = method.toUpperCase()
  const handler = ROUTES[`${verb} ${clean}`]
  if (handler) return handler({ path: clean, method: verb, body, url })

  const media = clean.match(MEDIA_ID)
  if (media) {
    const id = decodeURIComponent(media[1])
    if (verb === 'GET') return mediaGet(id)
    if (verb === 'DELETE') return mediaDelete(id)
  }
  // An OAuth start is a page navigation and never arrives here; if something
  // does fetch one, it must not be told it worked.
  if (clean.startsWith(`${C}/oauth/`)) return fail('Connecting an account is switched off in the demo.')
  return undefined
}
