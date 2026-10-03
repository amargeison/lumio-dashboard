// The demo academy's data — "Lumio Tennis Club", head coach Vincent Jones.
//
// buildDemoSeed(now) returns every coach_* table (and the one sports_profiles
// row) in the LIVE column names and shapes, because the demo runs the live
// components against it. Three rules hold the file together:
//
//   1. Nothing is a calendar date. Every date is worked out from `now`, so the
//      demo is a busy academy on whatever day it is opened: sessions today, a
//      full week either side, summaries for the last four weeks, a camp coming
//      up and one just finished.
//   2. One timetable drives the diary. Bookings, attendance, lesson summaries,
//      session plans, effort sessions and "sessions used" on a pack are all
//      derived from the same weekly slots, so the numbers agree with each other.
//   3. It is pure. Same `now`, same rows — ids included — with no network, no
//      Math.random and nothing read from the browser.
//
// Everyone in here is fictional.

import type { Row } from './store'
import { LUMIO_RESOURCES } from '@/lib/coach/lumio-resources-data'
import { buildCampKit, type KitCategory } from '@/lib/coach/camp-kit-template'
import { STAGES as EMAIL_STAGES } from '@/lib/coach/camp-lifecycle'
import { askedForm } from '@/lib/coach/camp-form'
import { BOOKS } from '@/lib/coach/books'

/**
 * The mini camp runs Monday to Friday of the CURRENT week, so on a weekday the
 * dashboard, planner and calendar all show a camp in progress. The live booking
 * form refuses new bookings on a camp day (see LiveBookingCalendar), which also
 * applies here. Set this to false to run that camp LAST week instead — it then
 * reads as just finished and this week takes bookings as normal.
 */
const CAMP_RUNNING_THIS_WEEK = false

/** MUST equal DEMO_COACH_ID in ./store. Declared here rather than imported so
    this file has no runtime dependency on the store that imports it. */
const COACH = 'd3300000-0000-4000-8000-000000000001'

// ─── Dates ───────────────────────────────────────────────────────────────────
// All local time: the live components compare against the browser's own clock.
const DAY_MS = 86_400_000
const p2 = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
const plus = (d: Date, days: number) => { const x = new Date(d); x.setDate(x.getDate() + days); return x }
const midnight = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const mondayOf = (d: Date) => plus(midnight(d), -((d.getDay() + 6) % 7))
const at = (d: Date, hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); const x = new Date(d); x.setHours(h, m, 0, 0); return x }
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const shortDate = (d: Date) => `${d.getDate()} ${MONTH[d.getMonth()]}`
const dayLabel = (d: Date) => `${WEEKDAY[d.getDay()]} ${shortDate(d)}`
const addMins = (hhmm: string, mins: number) => { const [h, m] = hhmm.split(':').map(Number); const t = h * 60 + m + mins; return `${p2(Math.floor(t / 60) % 24)}:${p2(t % 60)}` }

// ─── Deterministic "randomness" ──────────────────────────────────────────────
// Keyed, not sequential: the value for a key never depends on what was
// generated before it, so adding a row elsewhere cannot reshuffle the academy.
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const unit = (key: string) => prng(hash(key))()
const between = (key: string, lo: number, hi: number) => lo + Math.floor(unit(key) * (hi - lo + 1))
const pick = <T,>(key: string, list: T[]): T => list[Math.floor(unit(key) * list.length) % list.length]
/** 64 hex characters, the shape of the database's own opaque tokens. */
function hex64(key: string): string {
  const r = prng(hash(key))
  let out = ''
  while (out.length < 64) out += Math.floor(r() * 0x10000).toString(16).padStart(4, '0')
  return out.slice(0, 64)
}

const firstName = (name: string) => name.trim().split(/\s+/)[0]
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const emailOf = (name: string) => `${name.toLowerCase().replace(/[^a-z\s-]/g, '').trim().replace(/\s+/g, '.')}@example.com`

// ─── Racket ladder ───────────────────────────────────────────────────────────
// Stage ids mirror RACKET_STAGES and the skill names mirror RACKET_SKILLS in
// ../coach-db.ts. They are the keys coach_player_skills is graded against, so
// they must match exactly — but that file is a client module that imports the
// demo store, so the names are restated here rather than imported.
const STAGE_IDS = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black'] as const
const STAGE_NAMES = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Red', 'Black']

type Theme = {
  /** The RACKET_SKILLS name this lesson works on (absent for squad themes). */
  skill?: string
  focus: string
  covered: string[]
  /** What went well — a phrase that reads after "…today:". */
  win: string
  /** What is still to fix — reads after "Still to fix:". */
  gap: string
  drills: string[]
  homework: string
  next: string
}
const th = (skill: string, focus: string, covered: string[], win: string, gap: string, drills: string[], homework: string, next: string): Theme =>
  ({ skill, focus, covered, win, gap, drills, homework, next })

// One lesson per skill on the ladder, written the way they are taught here.
const THEMES: Record<string, Theme[]> = {
  white: [
    th('Ready position & split-step', 'Ready position and split-step timing',
      ['Athletic base — feet wide, knees soft, racket up in both hands', 'Split-step timed to the feed, landing as the ball leaves my racket', 'First step out to the ball, then recover to the middle cone'],
      'landing the split-step on time for most fed balls by the end', 'stands tall and flat-footed once a rally gets going',
      ['Traffic-light split-step game', 'Shadow split, move and set', 'Catch-and-recover to the cone'],
      'Ten split-steps in front of a mirror each day — soft knees, racket up.', 'Keep the split-step alive inside a five-ball rally.'),
    th('Forehand groundstroke', 'Forehand shape — low to high, contact out in front',
      ['Side-on turn with the racket back early', 'Swinging low to high and finishing over the shoulder', 'Meeting the ball level with the front hip'],
      'clean contact out in front on eight of ten drop-feeds', 'lets the ball get too close to the body when it comes faster',
      ['Drop-feed and freeze the finish', 'Hit over the rope to the big target', 'Forehand rally with the foam ball'],
      'Twenty shadow forehands a day, freezing the finish over the shoulder.', 'Take the same swing into a moving-ball rally from the service line.'),
    th('Grips — eastern & continental', 'Finding the grips without looking',
      ['Shaking hands with the racket for the forehand grip', 'Hammer grip for volleys and the serve', 'Changing between the two on a call'],
      'finding both grips by feel with eyes closed', 'slides back to a frying-pan grip when asked to serve',
      ['Grip-change race', 'Bounce-ups on the edge with the hammer grip', 'Volley catch with the hammer grip'],
      'Edge bounce-ups — beat today’s best score with the hammer grip.', 'Use the hammer grip for the first underarm serves.'),
    th('Cooperative rally', 'Keeping a rally going with a partner',
      ['Sending the ball high and soft over the net', 'Getting back behind the bounce after each shot', 'Counting the rally out loud together'],
      'a best rally of seven with me, up from three', 'rushes the next shot instead of letting the ball drop',
      ['Rally to the rainbow (high over the net)', 'Bounce–hit rhythm call', 'Beat-your-record rally'],
      'Wall rally or balloon taps at home — beat ten in a row.', 'Rally cross-court to a target zone.'),
  ],
  yellow: [
    th('Two-handed backhand', 'Two-handed backhand — turn and drive',
      ['Shoulder turn with both hands on the grip', 'Top hand doing the pushing through contact', 'Finishing with the elbows high'],
      'turning early and driving through on the easier feeds', 'lets go with the top hand when stretched wide',
      ['Top-hand-only forehands', 'Backhand to the tramline target', 'Two-ball backhand then recover'],
      'Thirty top-hand-only swings a day against a soft ball or as a shadow.', 'Hold the two-hander together on a wider, moving ball.'),
    th('Footwork & recovery', 'Small steps in, quick recovery out',
      ['Adjusting steps to set the hitting distance', 'Crossover step to recover to the centre mark', 'Split-step before every shot'],
      'recovering past the centre mark after most balls', 'plants the feet too early and reaches for the ball',
      ['Cone-square adjust and hit', 'Hit and touch the centre mark', 'Figure-of-eight footwork rally'],
      'Two minutes of side-shuffles and crossovers before school each day.', 'Keep the recovery going when the rally speeds up.'),
    th('Sustained rally (10+)', 'Rallying ten and beyond, cross-court',
      ['Aiming a racket-length over the net for margin', 'Same rhythm ball after ball rather than hitting harder', 'Recovering to the right place for a cross-court rally'],
      'a best cross-court rally of fourteen', 'speeds up around ball six and the rally breaks down',
      ['Cross-court rally ladder (5, 8, 10, 12)', 'Rope-height margin rally', 'Rally to ten, then play the point'],
      'Count your best rally at the weekend and tell me the number.', 'Hold the same rally with a change of direction on my call.'),
    th('Ball tracking & timing', 'Reading the bounce and timing the hit',
      ['Calling “bounce” and “hit” to lock the timing', 'Moving back early for the deeper ball', 'Letting the ball drop to waist height'],
      'judging the deep ball far earlier and making room for it', 'gets caught on the half-volley when the ball lands short',
      ['Bounce–hit calling rally', 'Short ball / deep ball reaction feeds', 'Catch at waist height, then hit'],
      'Throw and catch against a wall, catching at waist height — fifty a day.', 'Track a faster, flatter feed without backing up late.'),
  ],
  orange: [
    th('Forehand volley', 'Forehand volley — short punch, firm wrist',
      ['Hammer grip and racket head above the wrist', 'Stepping in with the opposite foot', 'Punching through with no swing behind the shoulder'],
      'a compact punch on the first volley with no backswing', 'swings at the higher ball instead of blocking it',
      ['Catch-volley with the racket hand', 'Volley to the deep target', 'Two volleys and close in'],
      'Volley taps against a wall — twenty without dropping the racket head.', 'Join the forehand and backhand volley on random feeds.'),
    th('Backhand volley', 'Backhand volley — block forward through contact',
      ['Continental grip, shoulder turn, no change of grip', 'Leading with the edge and keeping the face stable', 'Stepping across to meet the ball early'],
      'a stable racket face and solid contact on the block volley', 'drops the racket head on the lower ball',
      ['Wall-of-hands block volley', 'Low-volley knee-bend feeds', 'Volley-to-volley with me'],
      'Ten low backhand volleys shadowed with a deep knee bend, every day.', 'Take the backhand volley on the move when approaching.'),
    th('Backhand slice', 'Backhand slice — high to low, staying side-on',
      ['Continental grip and a high preparation', 'Carving high to low with the face slightly open', 'Staying side-on through the finish'],
      'a slice that stays low and skids on the easier feeds', 'opens the chest too early and floats the ball',
      ['Slice over the low rope', 'Slice to slice down the line', 'Slice, recover and defend'],
      'Shadow twenty slices a day, finishing with the arms spread like wings.', 'Use the slice as a neutral ball in a live rally.'),
    th('Net positioning', 'Closing the net and covering the angle',
      ['Following the ball in to the right position', 'Split-step as the opponent hits', 'Closing after the first volley rather than standing still'],
      'closing forward after the first volley without being told', 'drifts to the middle and leaves the line open',
      ['Approach, split and volley', 'Cover-the-line passing game', 'Two-on-one net reaction'],
      'Watch one doubles match this week and notice where the net player stands.', 'Bring net position into approach-and-pass points.'),
  ],
  green: [
    th('Flat first serve', 'Flat first serve — trophy, reach and pronate',
      ['Trophy position with the weight loading back', 'Reaching up to full stretch at contact', 'Landing inside the baseline on the front foot'],
      'seven first serves in ten into the box from the baseline', 'muscles the serve and loses the reach when going for pace',
      ['Throwing a ball up and over the net', 'Serve from the knees, then the baseline', 'Ten-ball first-serve count'],
      'Thirty overarm throws a day, as high and far as possible.', 'Add a wide and a T target to the first serve.'),
    th('Toss & rhythm', 'Service toss and a smooth rhythm',
      ['Lifting the toss from the shoulder with a flat hand', 'Letting the toss land on the racket placed at one o’clock', '“Down together, up together” rhythm'],
      'the toss landing on the spot eight times in ten', 'rushes the toss arm down, so the chest drops early',
      ['Toss-and-catch to the target racket', 'Serve with a three-second count', 'Toss, freeze, then hit'],
      'Twenty tosses a day against a wall mark — let it drop, no hitting.', 'Keep the rhythm when serving a full game.'),
    th('Return of serve', 'Return of serve — split, short take-back, deep',
      ['Split-step as the server makes contact', 'Half the backswing of a normal groundstroke', 'Blocking deep through the middle first'],
      'getting the first-serve return back deep and central', 'takes a full swing at the faster serve and is late',
      ['Return from inside the baseline', 'Block-return to the deep square', 'Serve and return points to seven'],
      'Shadow ten split-and-turn returns each side before every hit.', 'Return with direction — cross-court off the wide serve.'),
    th('Serve placement', 'Serve placement — wide, body and T',
      ['Aiming with the edge and moving the toss by a few inches', 'Calling the target before every serve', 'Being ready for the second ball after each target'],
      'hitting the called target on roughly half the first serves', 'the T serve drifts into the middle of the box',
      ['Three-cone target serving', 'Call it and hit it — ten balls', 'Serve plus first ball to the open court'],
      'Serve a basket to one target only and write down the score out of twenty.', 'Choose the target from where the returner is standing.'),
  ],
  blue: [
    th('Topspin forehand', 'Topspin forehand — brush and shape',
      ['Dropping the racket head below the ball', 'Brushing up the back with a relaxed wrist', 'Finishing across the body for heavier spin'],
      'real net clearance and dip on the rally ball', 'flattens the swing out as soon as the point is live',
      ['Brush-up drop feeds over the high rope', 'Spin-only mini tennis', 'Heavy cross-court rally to the deep zone'],
      'Fifteen minutes on the wall brushing up above a taped line.', 'Hold the shape when the ball comes faster and lower.'),
    th('Topspin backhand', 'Topspin backhand — drive through with shape',
      ['Dropping both hands below the ball', 'Top hand accelerating up and through', 'Balance — staying down through the hit'],
      'a backhand that clears the net by a metre and lands deep', 'lifts the head early and pulls the ball short',
      ['Low-to-high backhand over the rope', 'Backhand cross-court depth rally', 'Backhand change of direction on the call'],
      'Thirty top-hand brush swings a day.', 'Use the heavier backhand to push me back in a live rally.'),
    th('Second serve (kick)', 'Second serve — spin first, pace later',
      ['Toss slightly further over the head', 'Brushing up and across from seven to one o’clock', 'Full racket speed with spin, not a push'],
      'a second serve clearing the net by a metre with real kick', 'the toss drifts forward when rushed and the serve flattens out',
      ['Spin-only serve ladder — ten in a row', 'Kick to the backhand cone', 'Second-serve-only points to eleven'],
      'Thirty shadow serves a day on the up-and-over brush; film one set.', 'Take the kick serve into second-serve points under scoreboard pressure.'),
    th('Depth & heavy ball', 'Depth — living in the back third',
      ['Aiming higher over the net rather than hitting harder', 'Using the legs to lift through the ball', 'Recognising when the ball has landed short'],
      'landing two in three rally balls past the service line', 'drops short whenever pushed onto the back foot',
      ['Deep-zone rally scoring', 'Height-over-the-rope challenge', 'Short ball means attack'],
      'Rally with a partner counting only balls that land past the service line.', 'Mix depth with a change of direction.'),
  ],
  purple: [
    th('Overhead smash', 'Overhead — turn, point and finish',
      ['Turning side-on the moment the lob goes up', 'Tracking with the non-hitting hand', 'Moving back with crossover steps, not backpedalling'],
      'getting side-on early and putting away the easier lob', 'backpedals on the deep lob and loses balance',
      ['Catch the lob with the left hand', 'Smash to the open half', 'Lob and smash rally with a partner'],
      'Throw a ball high and catch it above your head with the other hand, twenty times.', 'Deal with the deeper lob — scissor-kick or let it bounce.'),
    th('Drop shot', 'Drop shot — disguise and soft hands',
      ['Same preparation as the drive', 'Opening the face late and taking pace off', 'Following the drop shot in to cover the reply'],
      'good disguise from the forehand side', 'gives it away early on the backhand with a high take-back',
      ['Drop-shot landing zone game', 'Drive, drive, drop pattern', 'Drop shot and cover the reply'],
      'Feather twenty drop shots over a line in the garden or against a wall.', 'Pick the right ball — only drop from inside the baseline.'),
    th('Offensive & defensive lob', 'Lobs — attacking and getting out of trouble',
      ['High defensive lob to buy recovery time', 'Topspin lob over the net player’s backhand side', 'Reading when the volleyer is too close'],
      'a defensive lob that reliably lands past the service line', 'the topspin lob comes up short when hit on the run',
      ['Lob over the stretched racket', 'Lob and recover to the middle', 'Pass or lob decision game'],
      'Watch for three lobs in a match on television and note why each was played.', 'Choose between pass and lob under pressure at the net.'),
    th('Half-volley', 'Half-volley — staying low through transition',
      ['Getting down with the legs, not the back', 'Short backswing and a firm wrist', 'Continuing forward after the pick-up'],
      'a tidy pick-up off the shoelaces when moving forward', 'straightens up through the shot and pops the ball long',
      ['Service-line pick-up feeds', 'Approach, half-volley, volley sequence', 'Mini-tennis half-volley rally'],
      'Ten low lunges on each leg daily — it is all in the knees.', 'Use the half-volley as the first ball in serve-and-volley.'),
  ],
  brown: [
    th('Kick serve', 'Kick serve as a weapon',
      ['Toss over the head and a deeper knee bend', 'Racket-head speed up and across', 'Kicking it high to the backhand'],
      'kick serves jumping above shoulder height on the returner’s backhand', 'loses racket speed on big points and the ball sits up',
      ['Kick over the high rope', 'Ad-court kick to the cone', 'Kick serve plus one'],
      'One basket of kick serves three times this week; count how many clear the rope.', 'Use the kick as a first serve to start patterns.'),
    th('Slice serve', 'Slice serve — opening the court',
      ['Toss slightly to the right and carving around the ball', 'Aiming for the sideline cone on the deuce side', 'Recovering quickly for the first ball'],
      'a slice serve dragging the returner off the court', 'telegraphs it with a toss that is too far right',
      ['Slice serve to the wide cone', 'Same toss, two serves (flat and slice)', 'Wide serve plus forehand to the open court'],
      'Twenty slice serves from the same toss as your flat serve — film it.', 'Disguise — same toss for slice and flat.'),
    th('Inside-out forehand', 'Inside-out forehand and the short-ball cue',
      ['Running around the backhand with small, fast steps', 'Hitting inside-out to the backhand corner', 'Recognising the short reply and moving in'],
      'the inside-out forehand becoming a genuine weapon', 'runs around makeable backhands and leaves the court open',
      ['Three-ball inside-out feed', 'Inside-out then inside-in', 'Inside-out, approach and volley'],
      'Watch the clip and note three moments to approach earlier.', 'Pattern: serve plus one inside-out forehand to the open court.'),
    th('Approach & transition', 'Approach shot and closing the net',
      ['Choosing the short ball to come in on', 'Approaching down the line and following the ball', 'First volley deep, second volley away'],
      'approaching down the line and closing in behind it', 'hesitates in no-man’s-land after the approach',
      ['Short-ball approach and volley', 'Approach and pass points', 'Two volleys to finish'],
      'Play a set where you must come in on every short ball.', 'Approach off the return of a weak second serve.'),
  ],
  red: [
    th('Point construction', 'Building the point — open the court, then finish',
      ['Using height and depth to create the short ball', 'Changing direction only from a balanced position', 'Finishing into the open court'],
      'building patiently and finishing on the right ball', 'pulls the trigger a shot too early when ahead in the rally',
      ['Three-shot build, then attack', 'Cross-court until the short ball', 'Open-court finishing game'],
      'Chart ten points of your next match — how many shots before the winner or the error?', 'Build the same way under scoreboard pressure.'),
    th('Pattern play', 'Serve plus one and return plus one patterns',
      ['Two go-to serve patterns on each side', 'Return deep middle, then take the next ball early', 'Calling the pattern before the point'],
      'running the wide-serve, open-court pattern cleanly', 'abandons the pattern after one miss',
      ['Called-pattern serving games', 'Return plus one live points', 'First four shots scoring'],
      'Write down your two best patterns on each side and bring them next time.', 'Add a counter-pattern for when the first one is read.'),
    th('Disguise & variation', 'Variation — changing spin, pace and height',
      ['Slice to change the rhythm of a rally', 'High heavy ball to push the opponent back', 'Same preparation for the drive and the drop shot'],
      'good use of the slice to break my rhythm', 'the variation is predictable — always after three drives',
      ['Three balls, three different shapes', 'Change-of-pace rally scoring', 'Slice then attack pattern'],
      'Play a practice set where no two consecutive shots can be the same.', 'Pick the variation to suit the opponent rather than by habit.'),
    th('Reading opponents', 'Reading the opponent and adjusting',
      ['Scouting in the warm-up — grips, movement, weaker wing', 'Spotting patterns in the first three games', 'Having a plan B ready'],
      'spotting the weaker wing early and going after it', 'needs a prompt to change a plan that is not working',
      ['Scouting warm-up checklist', 'Coach plays three styles — find the answer', 'Changeover plan review'],
      'Scout one opponent this week and write three lines on how you would play them.', 'Adapt mid-set without a prompt from me.'),
  ],
  black: [
    th('Match management', 'Managing the score and the momentum',
      ['Playing the percentages at 30-all and deuce', 'Slowing down after losing two points in a row', 'Starting each set with a clear first-game plan'],
      'smart, high-percentage tennis on the big points', 'lets a run of points against become a run of games',
      ['Pressure-point serving', 'Momentum games (win three in a row)', 'Sets starting at 4–4'],
      'Keep a between-games note in your next match: score, feeling, plan.', 'Close out a set from a break up.'),
    th('Pressure & mental game', 'Routines and resets under pressure',
      ['Between-point routine: turn away, strings, breathe, plan', 'A reset word after an error', 'Body language at the changeover'],
      'holding the routine for a full set', 'the routine disappears when behind in the score',
      ['Routine-only points (I score the routine)', 'Tie-break ladder', 'Bad-call recovery game'],
      'Use the four-step routine on every point of your next practice set.', 'Keep the routine going when a break down.'),
    th('In-match adaptation', 'Changing a losing plan',
      ['Recognising when plan A is not working', 'Three levers: height, direction, position', 'Committing to the change for a full game'],
      'changing position on the return and turning the set around', 'waits too long before making the change',
      ['Scenario sets (down 1–4)', 'Coach changes style mid-set', 'Lever-of-the-game drill'],
      'After your next match, write down what you changed and when.', 'Make the adjustment within two games, unprompted.'),
    th('Closing out matches', 'Serving out sets and converting leads',
      ['First-serve percentage over pace when serving it out', 'Playing to the bigger target at match point', 'Treating 5–3 like 3–3'],
      'serving out both practice sets at the first attempt', 'tightens up and stops moving the feet at set point',
      ['Serve it out from 5–4', 'Match-point simulation', 'Front-runner sets (start 4–1 up)'],
      'Play two practice sets this week starting from 5–4 up on serve.', 'Close out against a player who raises their level.'),
  ],
}

const gt = (focus: string, covered: string[], win: string, gap: string, drills: string[], homework: string, next: string): Theme =>
  ({ focus, covered, win, gap, drills, homework, next })

// Squads and groups alternate between two sessions, week about.
const GROUP_THEMES: Record<string, Theme[]> = {
  'Performance Squad': [
    gt('Serve plus one patterns under pressure',
      ['Wide serve, forehand to the open court', 'Body serve, then taking the next ball early', 'King-of-the-court serving games'],
      'first-serve percentage up across the squad once the targets went down', 'the tempo drops in the last twenty minutes — the fitness block needs to stay in',
      ['Called-pattern serving', 'First four shots scoring', 'King of the court'],
      'Two baskets of serves to targets before the next squad.', 'Return plus one, then full points.'),
    gt('Cross-court depth and changing direction',
      ['Heavy cross-court rally to the deep zone', 'Changing down the line only off a short or central ball', 'Two-on-one defending drill'],
      'much better shot tolerance — several rallies past twenty balls', 'changes of direction off the back foot are still costing cheap errors',
      ['Deep-zone rally scoring', 'Change on the short ball', 'Two-on-one grinder'],
      'Play a practice set where the first change of direction must be off a short ball.', 'Serve plus one patterns under scoreboard pressure.'),
  ],
  'Junior Squad': [
    gt('Rallying with a partner and keeping score',
      ['Cross-court rally to a target zone', 'Serving underarm or overarm to start the point', 'Scoring a tie-break to seven'],
      'every pair managed a ten-ball rally and scored their own tie-break', 'a few still stand and watch after hitting — recovery steps next week',
      ['Rally ladder in pairs', 'Champion of the court', 'Tie-break to seven'],
      'Play one tie-break with someone at home or at the club and bring the score.', 'Serve and return — starting the point properly.'),
    gt('Serve and return — starting the point',
      ['Toss and reach from the service line, then the baseline', 'Returning to the middle of the court first', 'Serve, return, rally to three'],
      'most of the group now getting a first serve into the box from the baseline', 'returners are standing too far back and letting the ball drop low',
      ['Serve ladder back to the baseline', 'Return to the deep square', 'Serve, return and rally games'],
      'Twenty tosses a day against a wall mark.', 'Rallying cross-court and keeping score.'),
  ],
  'Adult Group': [
    gt('Doubles positioning — from one up, one back to both up',
      ['Where the net player stands on serve and on return', 'Moving together as a pair, as if joined by a rope', 'When to join your partner at the net'],
      'pairs moving together far better by the end', 'the back player is slow to come in behind a good deep ball',
      ['Rope drill in pairs', 'Deep ball means both up', 'Doubles points with a net bonus'],
      'In your next social doubles, call “up” every time you follow a ball in.', 'Return of serve and the first volley.'),
    gt('Return of serve and the first volley',
      ['Short take-back on the return, aiming cross-court', 'Split-step and first volley at the feet', 'Returner’s partner reading the poach'],
      'returns going cross-court and low rather than floating down the middle', 'first volleys are being hit too hard instead of placed',
      ['Cross-court return to the tramline', 'Return and first-volley sequence', 'Serve and return doubles to seven'],
      'Ten minutes of volley-to-volley before your next game.', 'Doubles positioning — both up.'),
  ],
  'Mini Reds': [
    gt('Throwing, catching and sending the ball over the net',
      ['Underarm and overarm throws to a partner', 'Tracking the bounce and catching in a cone', 'Tap-ups and floor rallies with the racket'],
      'everyone sent five in a row over the mini net', 'eyes come off the ball as soon as there is a game on',
      ['Cone catch', 'Popcorn tap-ups', 'Over-the-river rally'],
      'Ten tap-ups a day on the strings — can you get to twenty?', 'Forehand rally with a partner.'),
    gt('Forehand rally with a partner',
      ['Side-on like a surfer', 'Bounce, hit and back to the ready position', 'Rallying over the mini net to a count of five'],
      'four pairs reached a rally of five on their own', 'lots of square-on hitting — side-on is the cue for next week',
      ['Surfer stance freeze', 'Bounce–hit shout', 'Rally race in pairs'],
      'Bounce-hit against a wall or garage door, five in a row.', 'Throwing and the overarm serve action.'),
  ],
  'Cardio Tennis': [
    gt('High-tempo forehand and backhand circuits',
      ['Continuous feeding circuit, two balls and recover', 'Agility ladder between rotations', 'Finishing with a team rally race'],
      'heart rates up and plenty of balls hit — a good honest sweat', 'footwork gets lazy on the recovery when people tire',
      ['Two-ball drive circuit', 'Ladder and split-step station', 'Team rally race'],
      'A brisk twenty-minute walk or jog once before next week.', 'Volley and overhead pyramid.'),
    gt('Volley and overhead pyramid',
      ['Approach, volley, volley, overhead sequence', 'Short sprints between feeds', 'Points starting from a lob'],
      'much sharper at the net and plenty of laughs on the overheads', 'people are backpedalling for the lob — turn and run is the cue',
      ['Pyramid feed', 'Net-rush relay', 'Lob-start points'],
      'Ten squat jumps a day.', 'High-tempo forehand and backhand circuits.'),
  ],
  'Junior Match Play': [
    gt('Tie-break shoot-outs and keeping score',
      ['Scoring a tie-break and changing ends', 'Calling the lines fairly', 'First serve in on the big points'],
      'every player scored and umpired a tie-break without help', 'second serves are being pushed in under pressure',
      ['Tie-break ladder', 'Serve under pressure (two in a row)', 'Round-robin shoot-out'],
      'Play one tie-break before next week and write down the score.', 'Playing the first four shots.'),
    gt('Playing the first four shots',
      ['Serve to the bigger target, then recover', 'Return deep through the middle', 'Winning the third and fourth ball'],
      'far fewer free points given away in the first four shots', 'returners rush and aim too close to the lines',
      ['First-four scoring game', 'Serve plus one to the open court', 'Short sets from 2–2'],
      'Count how many returns you make out of ten in your next match.', 'Tie-break shoot-outs.'),
  ],
  'Sunday Social Doubles': [
    gt('Mixed-in doubles with a serving focus',
      ['Warm-up serving to targets', 'Rotating partners every four games', 'Placing the first serve to the backhand'],
      'good spirit and noticeably more first serves going in', 'net players are static — more movement on the partner’s serve',
      ['Target serving warm-up', 'Rotating doubles', 'Sudden-death deuce games'],
      'Serve ten balls to the backhand before your next match.', 'Poaching and communication.'),
    gt('Poaching and communication',
      ['Hand signals behind the back', 'Moving on the returner’s contact', 'Calling “mine” and “yours” early'],
      'several clean poaches and far better talking between partners', 'pairs forget to cover the line after a fake',
      ['Signal and go', 'Poach or fake game', 'Rotating doubles'],
      'Agree one signal with a partner and use it all match.', 'Serving patterns in doubles.'),
  ],
}

// ─── The coaching team ───────────────────────────────────────────────────────
type StaffSeed = {
  key: string; name: string; role: string; accreditation: string; specialisms: string[]
  hours: number; phone: string
  /** Days until the DBS certificate lapses (null = none on file yet). */
  dbs: number | null
  availability: string; venues: string[]
}
const STAFF: StaffSeed[] = [
  { key: 'vincent', name: 'Vincent Jones', role: 'Head Coach', accreditation: 'Performance Coach', specialisms: ['Performance', 'Match play'], hours: 32, phone: '07700 900123', dbs: 612, availability: 'Mon–Sat · full days', venues: ['riverside', 'parkside'] },
  { key: 'rachel', name: 'Rachel Adeyemi', role: 'Senior', accreditation: 'Senior Performance Coach', specialisms: ['Performance', 'Doubles'], hours: 30, phone: '07700 900151', dbs: 488, availability: 'Mon–Fri · days', venues: ['riverside', 'parkside'] },
  { key: 'marcus', name: 'Marcus Bell', role: 'Senior', accreditation: 'Senior Performance Coach', specialisms: ['Cardio', 'Adult'], hours: 30, phone: '07700 900152', dbs: 301, availability: 'Tue–Sat · days', venues: ['riverside', 'marina'] },
  { key: 'sofia', name: 'Sofia Nilsson', role: 'Senior', accreditation: 'Qualified Coach', specialisms: ['Performance', 'Junior'], hours: 28, phone: '07700 900153', dbs: 733, availability: 'Mon–Fri · days', venues: ['riverside'] },
  { key: 'david', name: 'David Okonkwo', role: 'Coach', accreditation: 'Qualified Coach', specialisms: ['Junior', 'Mini/Red'], hours: 26, phone: '07700 900154', dbs: 540, availability: 'Mon–Fri · afternoons', venues: ['riverside', 'oakwood'] },
  { key: 'elena', name: 'Elena Petrova', role: 'Coach', accreditation: 'Qualified Coach', specialisms: ['Cardio', 'Adult'], hours: 26, phone: '07700 900155', dbs: 215, availability: 'Tue–Sun · days', venues: ['riverside', 'marina'] },
  { key: 'jamie', name: 'Jamie Sutton', role: 'Coach', accreditation: 'Qualified Coach', specialisms: ['Adult', 'Doubles'], hours: 24, phone: '07700 900156', dbs: 402, availability: 'Wed–Sun · days', venues: ['riverside'] },
  { key: 'aisha', name: 'Aisha Khan', role: 'Coach', accreditation: 'Qualified Coach', specialisms: ['Junior', 'Performance'], hours: 24, phone: '07700 900157', dbs: 655, availability: 'Mon–Fri · days', venues: ['riverside'] },
  { key: 'theo', name: 'Theo Hargreaves', role: 'Coach', accreditation: 'Qualified Coach', specialisms: ['Performance', 'Match play'], hours: 24, phone: '07700 900158', dbs: 127, availability: 'Mon–Sat · days', venues: ['riverside', 'parkside'] },
  { key: 'grace', name: 'Grace Lin', role: 'Coach', accreditation: 'Qualified Coach', specialisms: ['Junior', 'Mini/Red'], hours: 22, phone: '07700 900159', dbs: 371, availability: 'Thu–Mon · days', venues: ['riverside', 'oakwood'] },
  { key: 'ben', name: 'Ben Carter', role: 'Assistant', accreditation: 'Coaching Assistant', specialisms: ['Mini/Red', 'Cardio'], hours: 18, phone: '07700 900160', dbs: 41, availability: 'Sat–Sun and evenings', venues: ['riverside'] },
  { key: 'nadia', name: 'Nadia Rashid', role: 'Assistant', accreditation: 'Coaching Assistant', specialisms: ['Junior', 'Adult'], hours: 18, phone: '07700 900161', dbs: 580, availability: 'Mon–Fri · evenings', venues: ['riverside'] },
  { key: 'luca', name: 'Luca Romano', role: 'Assistant', accreditation: 'Coaching Assistant', specialisms: ['Mini/Red', 'Junior'], hours: 16, phone: '07700 900162', dbs: 266, availability: 'Wed–Sun · days', venues: ['riverside', 'oakwood'] },
  { key: 'chloe', name: 'Chloe Foster', role: 'Apprentice', accreditation: 'Coaching apprentice (in training)', specialisms: ['Mini/Red'], hours: 12, phone: '07700 900163', dbs: null, availability: 'Sat–Sun', venues: ['riverside', 'oakwood'] },
  { key: 'ollie', name: 'Ollie Grant', role: 'Apprentice', accreditation: 'Coaching apprentice (in training)', specialisms: ['Mini/Red', 'Junior'], hours: 12, phone: '07700 900164', dbs: 698, availability: 'Fri–Sun', venues: ['riverside', 'oakwood'] },
]

// ─── Venues ──────────────────────────────────────────────────────────────────
type CourtSeed = { name: string; surface: string; status?: string; notes?: string }
type VenueSeed = { key: string; name: string; home?: boolean; address: string; contact: string; phone: string; email: string; facilities: string; access: string; hours: string; courts: CourtSeed[] }
const VENUES: VenueSeed[] = [
  {
    key: 'riverside', name: 'Riverside Tennis Centre', home: true,
    address: 'Riverside Park, Mill Lane, Riverside RV1 4TC', contact: 'Karen Blythe', phone: '01632 770100', email: 'karen@riversidetennis.example.com',
    facilities: 'Café, Pro shop, Parking (40), Changing rooms, Ball machine, Floodlights',
    access: 'Coach fob entry · gate code 4471 after 6pm', hours: '07:00–22:00',
    courts: [
      { name: 'Court 1', surface: 'Hard · floodlit' }, { name: 'Court 2', surface: 'Hard · floodlit' },
      { name: 'Court 3', surface: 'Hard · floodlit' }, { name: 'Court 4', surface: 'Hard · floodlit' },
      { name: 'Court 5', surface: 'Hard · floodlit' }, { name: 'Court 6', surface: 'Hard · floodlit', status: 'Booked', notes: 'Members’ box league most evenings' },
      { name: 'Indoor 1', surface: 'Carpet · indoor' },
      { name: 'Indoor 2', surface: 'Carpet · indoor', status: 'Maintenance', notes: 'Net and lighting repair — back next week' },
    ],
  },
  {
    key: 'parkside', name: 'Parkside Lawn Tennis Club',
    address: 'Parkside Avenue, Westbrook WB2 6LN', contact: 'Geoff Hartley', phone: '01632 880255', email: 'office@parksideltc.example.com',
    facilities: 'Clubhouse bar, Parking (20), Changing rooms, Floodlights (2 courts)',
    access: 'Sign in at the clubhouse · coaching slots Tuesday and Thursday', hours: '08:00–21:00',
    courts: [
      { name: 'Clay 1', surface: 'Clay · floodlit' }, { name: 'Clay 2', surface: 'Clay · floodlit' },
      { name: 'Clay 3', surface: 'Clay', status: 'Booked', notes: 'Club doubles evenings' }, { name: 'Clay 4', surface: 'Clay' },
    ],
  },
  {
    key: 'oakwood', name: 'Oakwood Grammar School',
    address: 'Oakwood Grammar, School Road, Riverside RV3 8GS', contact: 'Mr D. Holloway (PE department)', phone: '01632 660300', email: 'pe@oakwoodgrammar.example.com',
    facilities: 'Parking (street), Toilets, No floodlights',
    access: 'Book through the PE office · no access during school hours in term time', hours: '16:00–19:00 in term · 09:00–17:00 in holidays',
    courts: [
      { name: 'Court A', surface: 'Hard' }, { name: 'Court B', surface: 'Hard' }, { name: 'Court C', surface: 'Hard', status: 'Booked', notes: 'School club' },
    ],
  },
  {
    key: 'marina', name: 'Marina Indoor Tennis Dome',
    address: 'Marina Quay, Dockside DK1 2QY', contact: 'Booking desk', phone: '01632 990400', email: 'bookings@marinatennis.example.com',
    facilities: 'Café, Parking (paid), Changing rooms, Climate controlled',
    access: 'Pre-pay courts online · arrive ten minutes early', hours: '06:30–23:00',
    courts: [
      { name: 'Dome 1', surface: 'Hard · indoor', status: 'Booked', notes: 'Pay-and-play' }, { name: 'Dome 2', surface: 'Hard · indoor' },
      { name: 'Dome 3', surface: 'Hard · indoor' }, { name: 'Dome 4', surface: 'Hard · indoor' },
    ],
  },
]

// ─── The roster ──────────────────────────────────────────────────────────────
type Cat = 'Junior' | 'Performance' | 'Adult'
type PlayerSeed = {
  key: string; name: string; age: number; cat: Cat
  /** Index into STAGE_IDS — the colour they are working on. */
  stage: number
  /** Attendance over the last eight weeks, as a target percentage. */
  att: number
  goal: string
  /** STAFF key. The head coach's own players carry no assignment in the
      database (a null staff_id is "the academy's"), exactly as on a live portal. */
  coach: string
  parent?: string
  /** Scores (0–4) on the four skills of the current colour. */
  cur?: number[]
  pays?: string
  medical?: string
  notes?: string
  /** Days since they joined. */
  joined: number
  noPhoto?: boolean
  watch?: boolean
  /** Fixed contact details for the long-standing demo players. */
  contact?: { email?: string; phone?: string; parentEmail?: string; parentPhone?: string; emergency?: string }
}
const PLAYERS: PlayerSeed[] = [
  // Vincent's own players — the eight the demo has always had.
  { key: 'mia', name: 'Mia Chen', age: 9, cat: 'Junior', stage: 2, att: 96, goal: 'First serve over the net consistently', coach: 'vincent', parent: 'Lily Chen', cur: [4, 4, 3, 4], pays: 'Standing order', medical: 'No known allergies', notes: 'WhatsApp preferred. Emergency contact: David Chen (father) 07700 900142.', joined: 410, watch: true, contact: { parentEmail: 'lily.chen@example.com', parentPhone: '07700 900141' } },
  { key: 'tom', name: 'Tom Okafor', age: 12, cat: 'Performance', stage: 4, att: 91, goal: 'Reliable kick second serve', coach: 'vincent', parent: 'Grace Okafor', cur: [4, 3, 3, 2], pays: 'Bank transfer', medical: 'Mild asthma — inhaler in bag', notes: 'Email preferred. Emergency contact: Grace Okafor (mother) 07700 900233.', joined: 620, watch: true, contact: { parentEmail: 'grace.okafor@example.com', parentPhone: '07700 900233' } },
  { key: 'ava', name: 'Ava Romero', age: 8, cat: 'Junior', stage: 1, att: 88, goal: 'Rally 10 balls cross-court', coach: 'vincent', parent: 'Sofia Romero', cur: [3, 2, 3, 2], pays: 'Card', medical: 'Nut allergy — carries an auto-injector', notes: 'WhatsApp preferred. Emergency contact: Carlos Romero (father) 07700 900319.', joined: 240, contact: { parentEmail: 'sofia.romero@example.com', parentPhone: '07700 900318' } },
  { key: 'leo', name: 'Leo Whitfield', age: 14, cat: 'Performance', stage: 6, att: 94, goal: 'Build serve+1 forehand pattern', coach: 'vincent', parent: 'Sarah Whitfield', cur: [3, 3, 4, 2], pays: 'Direct debit', medical: 'No known allergies', notes: 'Text Leo and copy in his mum. Emergency contact: Sarah Whitfield (mother) 07700 900405.', joined: 830, watch: true, contact: { email: 'leo.whitfield@example.com', phone: '07700 900404', parentEmail: 'sarah.whitfield@example.com', parentPhone: '07700 900405' } },
  { key: 'hannah', name: 'Hannah Berg', age: 11, cat: 'Junior', stage: 3, att: 79, goal: 'Add topspin shape to forehand', coach: 'vincent', parent: 'Mark Berg', cur: [3, 3, 2, 1], pays: 'Invoice', medical: 'No known allergies', notes: 'Phone call preferred. Emergency contact: Mark Berg (father) 07700 900512.', joined: 365, contact: { parentEmail: 'mark.berg@example.com', parentPhone: '07700 900512' } },
  { key: 'daniel', name: 'Daniel Cruz', age: 16, cat: 'Performance', stage: 7, att: 97, goal: 'Win first county-level match', coach: 'vincent', parent: 'Maria Cruz', cur: [4, 4, 3, 2], pays: 'Direct debit', medical: 'No known allergies', notes: 'Text Daniel directly. Emergency contact: Maria Cruz (mother) 07700 900607.', joined: 990, watch: true, contact: { email: 'daniel.cruz@example.com', phone: '07700 900606', parentEmail: 'maria.cruz@example.com', parentPhone: '07700 900607' } },
  { key: 'priya', name: 'Priya Patel', age: 38, cat: 'Adult', stage: 3, att: 85, goal: 'Consistent doubles serve & volley', coach: 'vincent', cur: [4, 3, 3, 2], pays: 'Card', medical: 'No known allergies', notes: 'Email or WhatsApp. Emergency contact: Raj Patel (husband) 07700 900708.', joined: 300, watch: true, contact: { email: 'priya.patel@example.com', phone: '07700 900707', emergency: 'Raj Patel (husband) 07700 900708' } },
  { key: 'james', name: 'James Whitlock', age: 10, cat: 'Junior', stage: 2, att: 90, goal: 'Backhand volley at the net', coach: 'vincent', parent: 'Anna Whitlock', cur: [4, 2, 3, 2], pays: 'Standing order', medical: 'No known allergies', notes: 'WhatsApp preferred. Emergency contact: Anna Whitlock (mother) 07700 900818.', joined: 205, contact: { parentEmail: 'anna.whitlock@example.com', parentPhone: '07700 900818' } },
  // The rest of the academy, by coach.
  { key: 'sophie', name: 'Sophie Marsh', age: 13, cat: 'Performance', stage: 5, att: 92, goal: 'Tidy up the second serve', coach: 'rachel', parent: 'Claire Marsh', pays: 'Direct debit', joined: 540, watch: true },
  { key: 'oliver', name: 'Oliver Tan', age: 12, cat: 'Performance', stage: 4, att: 88, goal: 'Forehand depth and shape', coach: 'rachel', parent: 'Wei Tan', pays: 'Invoice', joined: 420 },
  { key: 'lily', name: 'Lily Stone', age: 15, cat: 'Performance', stage: 6, att: 90, goal: 'Net play under pressure', coach: 'rachel', parent: 'Andrew Stone', pays: 'Direct debit', joined: 700 },
  { key: 'ella', name: 'Ella Brooks', age: 34, cat: 'Adult', stage: 3, att: 80, goal: 'Match-play consistency', coach: 'marcus', pays: 'Card', joined: 280 },
  { key: 'greg', name: 'Greg Powell', age: 45, cat: 'Adult', stage: 2, att: 76, goal: 'Cardio fitness and footwork', coach: 'marcus', pays: 'Invoice', notes: 'Travelling a lot with work this term — has not rebooked.', joined: 330 },
  { key: 'noah', name: 'Noah Pike', age: 10, cat: 'Junior', stage: 2, att: 94, goal: 'Rally length and control', coach: 'sofia', parent: 'Hannah Pike', pays: 'Standing order', joined: 260 },
  { key: 'maya', name: 'Maya Cole', age: 13, cat: 'Performance', stage: 5, att: 89, goal: 'Topspin backhand build', coach: 'sofia', parent: 'Denise Cole', pays: 'Direct debit', joined: 480, watch: true },
  { key: 'reuben', name: 'Reuben Cox', age: 9, cat: 'Junior', stage: 1, att: 85, goal: 'Serve over the net', coach: 'david', parent: 'Steve Cox', pays: 'Cash', joined: 150, noPhoto: true },
  { key: 'isla', name: 'Isla Fern', age: 8, cat: 'Junior', stage: 1, att: 91, goal: 'Ready position and split-step', coach: 'david', parent: 'Kate Fern', pays: 'Childcare vouchers', joined: 120, noPhoto: true },
  { key: 'greta', name: 'Greta Voss', age: 41, cat: 'Adult', stage: 3, att: 78, goal: 'Doubles positioning', coach: 'elena', pays: 'Bank transfer', joined: 390 },
  { key: 'sam', name: 'Sam Doyle', age: 29, cat: 'Adult', stage: 4, att: 83, goal: 'Serve power and placement', coach: 'elena', pays: 'Card', joined: 210, watch: true },
  { key: 'amara', name: 'Amara Singh', age: 36, cat: 'Adult', stage: 3, att: 81, goal: 'Return of serve', coach: 'jamie', pays: 'Card', joined: 175 },
  { key: 'kai', name: 'Kai Mercer', age: 14, cat: 'Performance', stage: 5, att: 87, goal: 'Inside-out forehand', coach: 'jamie', parent: 'Joanne Mercer', pays: 'Invoice', medical: 'Old left ankle sprain — taped for match play', joined: 450, watch: true },
  { key: 'zara', name: 'Zara Iqbal', age: 11, cat: 'Junior', stage: 3, att: 93, goal: 'Backhand drive consistency', coach: 'aisha', parent: 'Farah Iqbal', pays: 'Standing order', medical: 'Hay fever — antihistamine in her bag in summer', joined: 340 },
  { key: 'toby', name: 'Toby Hale', age: 12, cat: 'Performance', stage: 4, att: 86, goal: 'Court coverage and recovery', coach: 'aisha', parent: 'Simon Hale', pays: 'Direct debit', joined: 380, watch: true },
  { key: 'lucas', name: 'Lucas Reed', age: 15, cat: 'Performance', stage: 6, att: 95, goal: 'Serve+1 patterns', coach: 'theo', parent: 'Paula Reed', cur: [4, 4, 4, 4], pays: 'Direct debit', joined: 760, watch: true },
  { key: 'nina', name: 'Nina Park', age: 16, cat: 'Performance', stage: 7, att: 96, goal: 'Match temperament', coach: 'theo', parent: 'Min-jun Park', cur: [4, 4, 4, 2], pays: 'Direct debit', joined: 900, watch: true },
  { key: 'evie', name: 'Evie Hart', age: 7, cat: 'Junior', stage: 0, att: 90, goal: 'Racket skills and coordination', coach: 'grace', parent: 'Laura Hart', cur: [2, 2, 1, 1], pays: 'Childcare vouchers', joined: 95 },
  { key: 'max', name: 'Max Turner', age: 9, cat: 'Junior', stage: 2, att: 84, goal: 'Cross-court rally', coach: 'grace', parent: 'Chris Turner', pays: 'Cash', notes: 'Pack finished last week — dad to confirm whether Max carries on after football season.', joined: 230 },
  { key: 'harry', name: 'Harry Dean', age: 8, cat: 'Junior', stage: 1, att: 88, goal: 'Throwing and the serve motion', coach: 'ben', parent: 'Michelle Dean', pays: 'Card', medical: 'Type 1 diabetes — meter and snack in his kit bag; mum on call during sessions', joined: 140 },
  { key: 'amelia', name: 'Amelia Frost', age: 13, cat: 'Performance', stage: 4, att: 82, goal: 'Volley confidence', coach: 'nadia', parent: 'Rob Frost', pays: 'Bank transfer', joined: 310 },
  { key: 'owen', name: 'Owen Pryce', age: 27, cat: 'Adult', stage: 2, att: 74, goal: 'Consistent first serve', coach: 'nadia', pays: 'Card', notes: 'Shift pattern changed — evenings are difficult at the moment.', joined: 190, noPhoto: true },
  { key: 'dylan', name: 'Dylan Vance', age: 10, cat: 'Junior', stage: 2, att: 92, goal: 'Forehand contact point', coach: 'luca', parent: 'Tessa Vance', pays: 'Standing order', joined: 200 },
  { key: 'freya', name: 'Freya Hill', age: 8, cat: 'Junior', stage: 1, att: 89, goal: 'Mini-tennis match play', coach: 'luca', parent: 'Jon Hill', pays: 'Card', joined: 110 },
  { key: 'theoday', name: 'Theo Day', age: 7, cat: 'Junior', stage: 0, att: 87, goal: 'Hand-eye coordination and balance', coach: 'ollie', parent: 'Becky Day', cur: [3, 2, 1, 1], pays: 'Cash', joined: 80 },
  { key: 'ruby', name: 'Ruby Vale', age: 9, cat: 'Junior', stage: 1, att: 91, goal: 'Rally cooperation', coach: 'chloe', parent: 'Imogen Vale', pays: 'Card', joined: 100 },
  // Two who joined this week.
  { key: 'isaac', name: 'Isaac Bell', age: 7, cat: 'Junior', stage: 0, att: 100, goal: 'Learn to rally over the mini net', coach: 'grace', parent: 'Naomi Bell', cur: [2, 1, 1, 1], pays: 'Card', notes: 'Came through the Mini Aces holiday camp. First lesson and baseline assessment done; weekly slot offered.', joined: 6 },
  { key: 'charlotte', name: 'Charlotte Dunn', age: 31, cat: 'Adult', stage: 0, att: 100, goal: 'Get back into tennis after ten years away', coach: 'jamie', cur: [2, 2, 1, 1], pays: 'Card', notes: 'Played as a junior. First lesson and baseline assessment done. Wants to join the Sunday social once she has had a few lessons.', joined: 4 },
]

/** Current-colour scores for players without a hand-set pattern. None of these
    is "ready" — only the players given `cur` above can be. */
const SKILL_PATTERNS = [[4, 3, 2, 1], [4, 4, 3, 2], [3, 2, 2, 1], [4, 4, 4, 2], [2, 2, 1, 1], [4, 3, 3, 2], [4, 4, 2, 2], [3, 3, 2, 0]]

// ─── The weekly timetable ────────────────────────────────────────────────────
// Seven sessions a weekday, four on Saturday, three on Sunday, academy-wide.
// `from` / `to` are week offsets (0 = this week) for slots that started or
// stopped: three players have drifted away and two have only just joined.
type Slot = {
  dow: number            // 0 = Monday
  time: string
  mins: number
  type: 'Private' | 'Group' | 'Cardio' | 'Match play' | 'Block'
  coach: string
  court: string
  venue?: string         // defaults to the home venue
  player?: string        // PLAYERS key — a private lesson
  title?: string         // a squad or group
  from?: number
  to?: number
  pending?: boolean
  /** A note for the booking itself. */
  note?: string
}
const SLOTS: Slot[] = [
  // Monday
  { dow: 0, time: '09:30', mins: 60, type: 'Private', coach: 'vincent', court: 'Court 2', player: 'priya' },
  { dow: 0, time: '16:00', mins: 60, type: 'Private', coach: 'aisha', court: 'Court 4', player: 'zara' },
  { dow: 0, time: '16:00', mins: 45, type: 'Private', coach: 'sofia', court: 'Court 5', player: 'noah' },
  { dow: 0, time: '16:30', mins: 90, type: 'Group', coach: 'vincent', court: 'Court 2', title: 'Performance Squad' },
  { dow: 0, time: '17:00', mins: 60, type: 'Private', coach: 'rachel', court: 'Court 1', player: 'sophie' },
  { dow: 0, time: '17:00', mins: 60, type: 'Private', coach: 'theo', court: 'Court 3', player: 'lucas' },
  { dow: 0, time: '18:00', mins: 60, type: 'Private', coach: 'nadia', court: 'Court 4', player: 'amelia' },
  { dow: 0, time: '19:00', mins: 60, type: 'Private', coach: 'nadia', court: 'Court 5', player: 'owen', to: -4 },
  // Tuesday
  { dow: 1, time: '10:00', mins: 60, type: 'Private', coach: 'marcus', court: 'Court 5', player: 'ella' },
  { dow: 1, time: '13:00', mins: 60, type: 'Cardio', coach: 'elena', court: 'Indoor 1', title: 'Cardio Tennis' },
  { dow: 1, time: '16:00', mins: 45, type: 'Private', coach: 'vincent', court: 'Court 1', player: 'mia' },
  { dow: 1, time: '16:00', mins: 45, type: 'Private', coach: 'david', court: 'Court 4', player: 'reuben' },
  { dow: 1, time: '17:00', mins: 60, type: 'Private', coach: 'vincent', court: 'Court 2', player: 'tom' },
  { dow: 1, time: '17:00', mins: 60, type: 'Private', coach: 'rachel', court: 'Court 5', player: 'oliver' },
  { dow: 1, time: '18:15', mins: 75, type: 'Match play', coach: 'vincent', court: 'Clay 1', venue: 'parkside', player: 'leo' },
  { dow: 1, time: '16:00', mins: 30, type: 'Private', coach: 'grace', court: 'Court 3', player: 'isaac', from: 1, pending: true },
  // Wednesday
  { dow: 2, time: '09:00', mins: 60, type: 'Private', coach: 'elena', court: 'Court 5', player: 'greta' },
  { dow: 2, time: '15:45', mins: 45, type: 'Private', coach: 'david', court: 'Court 4', player: 'isla' },
  { dow: 2, time: '16:00', mins: 60, type: 'Group', coach: 'vincent', court: 'Court 1', title: 'Junior Squad' },
  { dow: 2, time: '16:30', mins: 45, type: 'Private', coach: 'luca', court: 'Court 5', player: 'dylan' },
  { dow: 2, time: '17:00', mins: 45, type: 'Private', coach: 'vincent', court: 'Court 3', player: 'ava' },
  { dow: 2, time: '17:00', mins: 60, type: 'Private', coach: 'aisha', court: 'Court 2', player: 'toby' },
  { dow: 2, time: '18:00', mins: 60, type: 'Private', coach: 'jamie', court: 'Court 4', player: 'amara' },
  { dow: 2, time: '12:00', mins: 90, type: 'Block', coach: 'vincent', court: 'Clubhouse', title: 'Coaches’ meeting & planning', from: 1 },
  // Thursday
  { dow: 3, time: '09:00', mins: 60, type: 'Private', coach: 'elena', court: 'Court 5', player: 'sam' },
  { dow: 3, time: '12:00', mins: 60, type: 'Private', coach: 'marcus', court: 'Court 2', player: 'greg', to: -3 },
  { dow: 3, time: '16:00', mins: 30, type: 'Private', coach: 'grace', court: 'Court 4', player: 'evie' },
  { dow: 3, time: '16:00', mins: 60, type: 'Private', coach: 'sofia', court: 'Court 2', player: 'maya' },
  { dow: 3, time: '16:30', mins: 45, type: 'Private', coach: 'vincent', court: 'Court 1', player: 'james' },
  { dow: 3, time: '17:30', mins: 60, type: 'Match play', coach: 'vincent', court: 'Court 3', player: 'daniel' },
  { dow: 3, time: '17:30', mins: 60, type: 'Private', coach: 'jamie', court: 'Court 5', player: 'kai' },
  { dow: 3, time: '19:00', mins: 60, type: 'Group', coach: 'vincent', court: 'Court 4', title: 'Adult Group' },
  { dow: 3, time: '18:00', mins: 60, type: 'Private', coach: 'jamie', court: 'Court 2', player: 'charlotte', from: 1, pending: true },
  // Friday
  { dow: 4, time: '15:30', mins: 60, type: 'Private', coach: 'vincent', court: 'Court 4', player: 'hannah', pending: true },
  { dow: 4, time: '16:00', mins: 45, type: 'Group', coach: 'grace', court: 'Court 3', title: 'Mini Reds' },
  { dow: 4, time: '16:00', mins: 30, type: 'Private', coach: 'ollie', court: 'Court 5', player: 'theoday' },
  { dow: 4, time: '16:30', mins: 60, type: 'Private', coach: 'rachel', court: 'Court 2', player: 'lily' },
  { dow: 4, time: '16:45', mins: 45, type: 'Private', coach: 'grace', court: 'Court 3', player: 'max', to: -1 },
  { dow: 4, time: '17:00', mins: 60, type: 'Private', coach: 'vincent', court: 'Court 1', player: 'tom' },
  { dow: 4, time: '17:30', mins: 60, type: 'Private', coach: 'theo', court: 'Court 5', player: 'nina' },
  { dow: 4, time: '18:00', mins: 60, type: 'Private', coach: 'vincent', court: 'Court 2', player: 'leo' },
  // Saturday
  { dow: 5, time: '09:00', mins: 60, type: 'Cardio', coach: 'marcus', court: 'Court 1', title: 'Cardio Tennis' },
  { dow: 5, time: '10:00', mins: 60, type: 'Private', coach: 'vincent', court: 'Court 3', player: 'daniel' },
  { dow: 5, time: '10:00', mins: 45, type: 'Private', coach: 'ben', court: 'Court 5', player: 'harry' },
  { dow: 5, time: '11:00', mins: 90, type: 'Match play', coach: 'theo', court: 'Court 2', title: 'Junior Match Play' },
  // Sunday
  { dow: 6, time: '10:00', mins: 45, type: 'Private', coach: 'luca', court: 'Court 5', player: 'freya' },
  { dow: 6, time: '11:00', mins: 45, type: 'Private', coach: 'chloe', court: 'Court 4', player: 'ruby' },
  { dow: 6, time: '11:00', mins: 90, type: 'Group', coach: 'jamie', court: 'Court 1', title: 'Sunday Social Doubles' },
]

/** Who is in which squad — attendance is logged for squads as well as lessons. */
const GROUPS: Record<string, string[]> = {
  'Performance Squad': ['tom', 'leo', 'daniel', 'sophie', 'oliver', 'lily', 'maya', 'kai', 'toby', 'lucas', 'nina', 'amelia'],
  'Junior Squad': ['mia', 'hannah', 'james', 'noah', 'zara', 'dylan', 'max'],
  'Mini Reds': ['ava', 'reuben', 'isla', 'evie', 'harry', 'freya', 'theoday', 'ruby'],
  'Adult Group': ['priya', 'ella', 'greta', 'sam', 'amara', 'greg', 'owen'],
}
/** The last week (offset) a drifting player was still coming to their squad. */
const SQUAD_UNTIL: Record<string, number> = { greg: -3, owen: -4, max: -1 }

// ─── The four most recent write-ups for the best-known players ───────────────
// Hand-written, and used for each player's latest lesson instead of the themed one.
type Feature = Theme & { skills: string[]; note: string; rating: number }
const FEATURED: Record<string, Feature> = {
  tom: {
    focus: 'Second serve — kick and reliability', skills: ['Second serve (kick)', 'Toss & rhythm', 'Serve placement'],
    covered: ['Service toss height and consistency — slightly more over the head for kick', 'Brushing up the back of the ball from seven to one o’clock', 'Targeting the backhand side of the ad court', 'Live points starting from the second serve only'],
    win: 'kick serve clearing the net by a metre or more — a much safer margin', gap: 'when rushed the toss drifts forward, and the serve comes out flatter and riskier',
    drills: ['Spin-only serve ladder (10 in a row)', 'Target cones — ad-court backhand', 'Second-serve-only points to 11'],
    homework: 'Shadow-serve 30 reps a day focusing on the up-and-over brush; film one set.', next: 'Carry the kick serve into serve+1 forehand patterns.',
    note: 'Real progress today — confidence on the second ball is the difference-maker at his level. Hold him to the higher toss.', rating: 5,
  },
  mia: {
    focus: 'First serve fundamentals', skills: ['Flat first serve', 'Toss & rhythm', 'Grips — eastern & continental'],
    covered: ['Trophy position and a relaxed toss', 'Continental grip — held it the whole session', 'Serving from the service line, then back to the baseline'],
    win: 'getting the ball in the box six times in ten from the baseline, up from two', gap: 'loses the continental grip when she tries to hit hard',
    drills: ['Toss-and-catch (10 reps)', 'Down-the-ladder serve from the service line', 'Serve and rally to 5'],
    homework: 'Practise 20 tosses a day against a wall mark; keep the continental grip.', next: 'Add a target (wide or T) once the box rate is steady at seven in ten.',
    note: 'Lovely attitude. Her Orange racket skills are all there now — one more good week and we book the assessment.', rating: 4,
  },
  hannah: {
    focus: 'Topspin forehand shape', skills: ['Topspin forehand', 'Depth & heavy ball'],
    covered: ['Low-to-high swing path with a relaxed arm', 'Net clearance targets over the high rope', 'Rallying with margin rather than flat and flat'],
    win: 'generating real spin in the drills', gap: 'reverts to a flat swing under live pressure, and the missed sessions are costing her rhythm',
    drills: ['High-rope cross-court rally', 'Spin-only mini tennis', 'Drop-feed brush-up reps'],
    homework: 'Wall rally for 15 minutes focusing only on brushing up; aim above a taped line.', next: 'Bridge the gap between drill spin and match spin with live rally targets.',
    note: 'One for a word with mum and dad: consistency of attendance is the main blocker right now.', rating: 3,
  },
  // The two new joiners: their first lesson, which doubled as the baseline assessment.
  isaac: {
    focus: 'First lesson — baseline assessment and forehand basics', skills: ['Ready position & split-step', 'Forehand groundstroke', 'Grips — eastern & continental', 'Cooperative rally'],
    covered: ['Baseline check on all four White skills: ready position, forehand, grips and a rally with me', 'Shaking hands with the racket to find the forehand grip', 'Side-on like a surfer, bounce and hit over the mini net'],
    win: 'six forehands in a row over the mini net by the end, and a ready position he remembers on his own', gap: 'holds the racket in a frying-pan grip and stands square-on to the ball',
    drills: ['Cone catch and tap-ups', 'Surfer stance freeze', 'Bounce–hit over the river'],
    homework: 'Ten tap-ups on the strings each day — can you get to fifteen without a drop?', next: 'Forehand grip without looking, then a rally of three with me.',
    note: 'Lovely first lesson. Isaac listens well and the camp has given him good hand-eye. Baseline is logged against the White skills — the grip is the first job.', rating: 4,
  },
  charlotte: {
    focus: 'First lesson — baseline assessment and finding the timing again', skills: ['Ready position & split-step', 'Forehand groundstroke', 'Grips — eastern & continental', 'Cooperative rally'],
    covered: ['Baseline check on the White skills: movement, forehand, grips and a cooperative rally', 'Split-step and first step, which came back within ten minutes', 'Forehand rally from the service line, then back to the baseline'],
    win: 'a twelve-ball rally from the baseline by the end — the forehand shape is still there from junior days', gap: 'serves and volleys with a forehand grip, and is late on the backhand side',
    drills: ['Mini tennis to find the timing', 'Cross-court forehand rally ladder', 'Grip-change race'],
    homework: 'Edge bounce-ups with the hammer grip, two minutes a day, to get the serve grip back.', next: 'Two-handed backhand timing and the continental grip on serve.',
    note: 'Far better than she gave herself credit for. Ten years away shows in the timing and the serve grip, not in the strokes. Baseline logged; I expect her off White within a few weeks.', rating: 4,
  },
  leo: {
    focus: 'Inside-out forehand and approach', skills: ['Inside-out forehand', 'Approach & transition', 'Forehand volley'],
    covered: ['Running around the backhand to attack with the forehand', 'Recognising the short-ball cue to approach', 'Closing the net behind the approach'],
    win: 'the inside-out forehand is becoming a genuine weapon', gap: 'sometimes runs around makeable backhands — balance needed',
    drills: ['3-ball inside-out feed, approach, volley', 'Short-ball reaction approach', 'Approach and pass points'],
    homework: 'Watch the clip and note three moments to approach earlier.', next: 'Pattern: serve+1 inside-out forehand to the open court.',
    note: 'Brown racket tactics are coming together. Ready to compete more.', rating: 5,
  },
}

// ─── Session-plan run-sheets ─────────────────────────────────────────────────
type PlanType = 'Private' | 'Group' | 'Cardio' | 'Match play' | 'Mini / red ball'
const RUN_SHEETS: Record<PlanType, { phase: string; pct: number; detail: (f: string) => string; cue: string }[]> = {
  Private: [
    { phase: 'Warm-up & movement', pct: 0.15, detail: () => 'Dynamic prep, split-step reactions, mini tennis to find the timing.', cue: 'Light feet, racket up.' },
    { phase: 'Technical block', pct: 0.3, detail: f => `Re-groove ${f} with controlled feeds and one clear cue.`, cue: 'One thing at a time.' },
    { phase: 'Constraint drill', pct: 0.25, detail: () => 'Targeted drill with a success score to beat before progressing.', cue: 'Beat last week’s number.' },
    { phase: 'Live points', pct: 0.2, detail: f => `Carry ${f} into live points and patterns.`, cue: 'Same swing when it counts.' },
    { phase: 'Review & homework', pct: 0.1, detail: () => 'Score-based game, quick video review, set the homework.', cue: 'What did you feel change?' },
  ],
  Group: [
    { phase: 'Warm-up & dynamic games', pct: 0.15, detail: () => 'Movement games to raise the pulse and get them sharp.', cue: 'Everyone moving, nobody queuing.' },
    { phase: 'Skill stations', pct: 0.35, detail: f => `Rotate stations on ${f} — short reps, lots of balls.`, cue: 'Quality over speed.' },
    { phase: 'Match games', pct: 0.3, detail: () => 'Cooperative-to-competitive games applying the skill.', cue: 'Use today’s skill to score.' },
    { phase: 'Mini-tournament', pct: 0.15, detail: () => 'Round-robin points — keep it fun and competitive.', cue: 'Call your own lines.' },
    { phase: 'Cool-down & feedback', pct: 0.05, detail: () => 'Stretch, one win each, quick group feedback.', cue: 'One thing you did well.' },
  ],
  Cardio: [
    { phase: 'Warm-up & pulse-raiser', pct: 0.15, detail: () => 'Footwork ladder, dynamic stretch, easy rally.', cue: 'Build it gradually.' },
    { phase: 'High-tempo feeds', pct: 0.4, detail: () => 'Continuous feeding circuits — heart rate up, technique honest.', cue: 'Hit and move.' },
    { phase: 'Live rally games', pct: 0.35, detail: f => `Fast live games built around ${f}.`, cue: 'Keep the feet going.' },
    { phase: 'Cool-down & stretch', pct: 0.1, detail: () => 'Bring the heart rate down, mobility work.', cue: 'Breathe out, long stretch.' },
  ],
  'Match play': [
    { phase: 'Warm-up & serve routine', pct: 0.15, detail: () => 'Full warm-up including serves; settle the routine.', cue: 'Same routine as a match day.' },
    { phase: 'Pattern rehearsal', pct: 0.2, detail: f => `Rehearse ${f} before competing.`, cue: 'Call the pattern first.' },
    { phase: 'Competitive sets', pct: 0.55, detail: () => 'Play out sets; I observe with minimal interruption.', cue: 'Play the score, not the last point.' },
    { phase: 'Debrief & notes', pct: 0.1, detail: () => 'What worked, what to adjust, logged for the report.', cue: 'Two keeps, one change.' },
  ],
  'Mini / red ball': [
    { phase: 'Warm-up games', pct: 0.2, detail: () => 'Fun coordination and ball-skill games.', cue: 'Eyes on the ball.' },
    { phase: 'Skill of the day', pct: 0.3, detail: f => `Introduce and build ${f} through play.`, cue: 'Show me, then tell me.' },
    { phase: 'Challenge games', pct: 0.35, detail: () => 'Target and team games applying the skill.', cue: 'Can you beat your record?' },
    { phase: 'Rewards & skill check', pct: 0.15, detail: () => 'Stickers, a quick skill check, celebrate the wins.', cue: 'High fives all round.' },
  ],
}
const PLAN_KIT: Record<PlanType, string[]> = {
  Private: ['Ball basket', 'Target cones', 'Throw-down lines', 'Video tripod'],
  Group: ['2 ball baskets', 'Cones ×12', 'Throw-down lines', 'Bibs'],
  Cardio: ['Ball machine', 'Agility ladders', 'Cones', 'Speaker'],
  'Match play': ['Match balls', 'Scorecards', 'Net gauge'],
  'Mini / red ball': ['Red balls', 'Mini nets', 'Stickers', 'Throw-down lines'],
}
function runSheet(type: PlanType, focus: string, mins: number) {
  const tpl = RUN_SHEETS[type]
  const f = focus.charAt(0).toLowerCase() + focus.slice(1)
  let used = 0
  return tpl.map((ph, i) => {
    const m = i === tpl.length - 1 ? mins - used : Math.round(mins * ph.pct)
    used += m
    return { phase: ph.phase, mins: m, detail: ph.detail(f), cue: ph.cue }
  })
}

// ─── Camp attendees who are not on the roster ────────────────────────────────
type Guest = { name: string; age: number; parent?: string; medical?: string }

// ═════════════════════════════════════════════════════════════════════════════
export function buildDemoSeed(now: Date): Record<string, Row[]> {
  const today = midnight(now)
  const week0 = mondayOf(now)
  const nowIso = now.toISOString()
  /** An ISO timestamp that is never in the future. */
  const stamp = (d: Date) => new Date(Math.min(d.getTime(), now.getTime() - 60_000)).toISOString()
  const ago = (days: number, hhmm = '10:00') => stamp(at(plus(today, -days), hhmm))

  // Ids are a table prefix plus a counter, in UUID layout, so the same row has
  // the same id on every load and links between tables hold.
  const counters: Record<string, number> = {}
  const id = (table: string) => {
    counters[table] = (counters[table] || 0) + 1
    return `d33000${table}-0000-4000-8000-${String(counters[table]).padStart(12, '0')}`
  }
  const T = {
    staff: '01', venue: '02', court: '03', player: '04', skill: '05', attendance: '06', booking: '07', plan: '08',
    session: '09', camp: '0a', attendee: '0b', email: '0c', payment: '0d', pkg: '0e', message: '0f', equipment: '10',
    kit: '11', resource: '12', playerResource: '13', media: '14', watch: '15', gps: '16', consent: '17',
    development: '18', staffVenue: '19',
  }
  /** A row with the columns every table shares. `created` doubles as updated_at
      unless a later one is given; `false` is for tables with no updated_at. */
  const row = (table: string, body: Row, created: string, updated: string | false = created): Row =>
    ({ id: id(table), coach_id: COACH, ...body, created_at: created, ...(updated === false ? {} : { updated_at: updated }) })

  // UK drama-range mobile numbers, handed out in order so each is used once.
  let phoneN = 0
  const PHONE_BLOCKS = [[830, 999], [200, 299], [420, 499], [520, 599]]
  const nextPhone = () => {
    let n = phoneN++
    for (const [lo, hi] of PHONE_BLOCKS) { const size = hi - lo + 1; if (n < size) return `07700 900${lo + n}`; n -= size }
    return `07700 900${String(n % 100).padStart(3, '0')}`
  }

  const out: Record<string, Row[]> = {}

  // ── Venues and courts ──────────────────────────────────────────────────────
  const venueId: Record<string, string> = {}
  out.coach_venues = VENUES.map((v, i) => {
    const r = row(T.venue, {
      name: v.name, address: v.address, contact_name: v.contact, contact_phone: v.phone, contact_email: v.email,
      facilities: v.facilities, access_note: v.access, is_home: !!v.home, external_booking_url: null, inclusive_sessions: false,
    }, ago(600 + i * 40))
    venueId[v.key] = r.id
    return r
  })
  out.coach_courts = VENUES.flatMap((v, vi) => v.courts.map((c, ci) => row(T.court, {
    venue_id: venueId[v.key], name: c.name, surface: c.surface, location: v.name, hours: v.hours,
    status: c.status || 'Free', notes: c.notes || null,
  }, ago(600 + vi * 40, `09:${p2(59 - ci)}`))))
  const HOME = VENUES[0]

  // ── Staff ──────────────────────────────────────────────────────────────────
  const staffId: Record<string, string> = {}
  const staffName: Record<string, string> = {}
  out.coach_staff = STAFF.map((s, i) => {
    const head = s.key === 'vincent'
    const expiry = s.dbs == null ? null : plus(today, s.dbs)
    const r = row(T.staff, {
      name: s.name, role: s.role,
      email: head ? 'vincent@lumiotennisclub.example' : `${s.name.toLowerCase().replace(/\s+/g, '.')}@lumiotennisclub.example`,
      phone: s.phone,
      // Accreditation first, then specialisms — the Coaches page shows each as a chip.
      qualifications: [s.accreditation, ...s.specialisms].join(', '),
      notes: s.dbs == null ? `${s.availability}. DBS application submitted — supervised sessions only until it is back.` : s.availability,
      dbs_number: expiry ? `0017 ${between(`dbs1:${s.key}`, 1000, 9999)} ${between(`dbs2:${s.key}`, 1000, 9999)}` : null,
      dbs_issued: expiry ? ymd(plus(expiry, -1095)) : null,
      dbs_expiry: expiry ? ymd(expiry) : null,
      safeguarding_trained: true,
      safeguarding_date: ymd(plus(today, -between(`sg:${s.key}`, 60, 520))),
      home_venue: VENUES.find(v => v.key === s.venues[0])?.name || null,
      contracted_hours: s.hours,
      // No photo: initials render everywhere, and nothing is fetched from outside.
      avatar_url: null,
      is_head: head, equipment_own: false, profile_complete: true,
    }, ago(head ? 1100 : 200 + i * 45))
    staffId[s.key] = r.id
    staffName[s.key] = s.name
    return r
  })
  out.coach_staff_venues = STAFF.flatMap((s, si) => s.venues.map((vk, vi) => row(T.staffVenue, {
    staff_id: staffId[s.key], venue_id: venueId[vk], is_primary: vi === 0,
  }, ago(si === 0 ? 1100 : 200 + si * 45, '11:00'), false)))
  /** staff_id / assigned_coach for a row: the head coach's own work is the academy's. */
  const assign = (coachKey: string) => coachKey === 'vincent'
    ? { staff_id: null, assigned_coach: null }
    : { staff_id: staffId[coachKey], assigned_coach: staffName[coachKey] }
  const staffOnly = (coachKey: string) => ({ staff_id: coachKey === 'vincent' ? null : staffId[coachKey] })

  // ── Camp dates (needed early: the diary keeps clear of them) ───────────────
  // A  an overseas adult week, about three weeks out (Sunday to Saturday)
  // B  a junior holiday camp at the home venue, the week after next (Mon–Fri)
  // C  a mini camp, Monday to Friday of last week — or of THIS week when
  //    CAMP_RUNNING_THIS_WEEK is on, which makes it "in progress" on a weekday
  // D  a performance camp abroad that finished about five weeks ago
  const bStart = plus(week0, 14), bEnd = plus(bStart, 4)
  let aStart = plus(week0, 20)                                  // Sunday of the week after next
  if ((aStart.getTime() - today.getTime()) / DAY_MS < 18.5) aStart = plus(aStart, 7)
  const aEnd = plus(aStart, 6)
  const cStart = CAMP_RUNNING_THIS_WEEK ? week0 : plus(week0, -7), cEnd = plus(cStart, 4)
  const dStart = plus(week0, -36), dEnd = plus(week0, -30)       // Sunday to Saturday
  const CAMP_D_PLAYERS = GROUPS['Performance Squad']
  const CAMP_D_COACHES = ['vincent', 'theo', 'rachel']
  const duringCampD = (d: Date) => d >= dStart && d <= dEnd

  // ── The diary: every occurrence of every slot, eight weeks back to next week ─
  type Occ = { slot: Slot; date: Date; dateStr: string; week: number; past: boolean; isToday: boolean; key: string }
  const occs: Occ[] = []
  for (let w = -8; w <= 1; w++) {
    for (const [si, slot] of SLOTS.entries()) {
      if (slot.from !== undefined && w < slot.from) continue
      if (slot.to !== undefined && w > slot.to) continue
      const date = plus(week0, w * 7 + slot.dow)
      // The performance group and three coaches were in Spain that week.
      if (duringCampD(date) && (CAMP_D_COACHES.includes(slot.coach) || (slot.player && CAMP_D_PLAYERS.includes(slot.player)))) continue
      occs.push({ slot, date, dateStr: ymd(date), week: w, past: date < today, isToday: date.getTime() === today.getTime(), key: `${si}:${w}` })
    }
  }
  // The two who joined this week have each had a first lesson — a one-off, a
  // few days ago, before their weekly slot starts next week.
  const FIRST_LESSONS: { player: string; daysAgo: number; slot: Slot }[] = [
    { player: 'isaac', daysAgo: 3, slot: { dow: 0, time: '16:00', mins: 30, type: 'Private', coach: 'grace', court: 'Court 3', player: 'isaac', note: 'First lesson — baseline assessment.' } },
    { player: 'charlotte', daysAgo: 2, slot: { dow: 0, time: '18:00', mins: 60, type: 'Private', coach: 'jamie', court: 'Court 2', player: 'charlotte', note: 'First lesson — baseline assessment.' } },
  ]
  const firstLessonAt: Record<string, Date> = {}
  for (const f of FIRST_LESSONS) {
    const date = plus(today, -f.daysAgo)
    firstLessonAt[f.player] = at(date, addMins(f.slot.time, f.slot.mins))
    occs.push({ slot: f.slot, date, dateStr: ymd(date), week: Math.floor((date.getTime() - week0.getTime()) / (7 * DAY_MS)), past: true, isToday: false, key: `first:${f.player}` })
  }
  occs.sort((a, b) => a.date.getTime() - b.date.getTime() || a.slot.time.localeCompare(b.slot.time))

  // ── Who missed what ────────────────────────────────────────────────────────
  // Each player's sessions are their own lessons plus their squad. The number
  // missed comes from their attendance figure; which ones is keyed, so it is
  // stable. Nothing in the last five days is missed — those are the bookings
  // the dashboard is asking for summaries on.
  const quietFrom = plus(today, -5)
  const missed = new Set<string>()          // `${playerKey}|${dateStr}|p` (lesson) or `|g` (squad)
  const squadOf = (pk: string) => Object.keys(GROUPS).find(g => GROUPS[g].includes(pk))
  const inSquadThatWeek = (pk: string, w: number) => SQUAD_UNTIL[pk] === undefined || w <= SQUAD_UNTIL[pk]
  for (const p of PLAYERS) {
    const mine: { tag: string; date: Date; forced: boolean }[] = []
    const squad = squadOf(p.key)
    for (const o of occs) {
      if (!o.past) continue
      if (o.slot.player === p.key) mine.push({ tag: `${p.key}|${o.dateStr}|p`, date: o.date, forced: p.key === 'hannah' && (o.week === -2 || o.week === -4) })
      else if (squad && o.slot.title === squad && inSquadThatWeek(p.key, o.week) && !(duringCampD(o.date) && CAMP_D_PLAYERS.includes(p.key))) mine.push({ tag: `${p.key}|${o.dateStr}|g`, date: o.date, forced: false })
    }
    if (!mine.length) continue
    const share = (100 - p.att) / 100 * mine.length
    const want = p.att < 80 ? Math.ceil(share) : Math.round(share)
    const eligible = mine.filter(m => m.date < quietFrom)
      .sort((a, b) => Number(b.forced) - Number(a.forced) || hash(a.tag) - hash(b.tag))
    for (const m of eligible.slice(0, want)) missed.add(m.tag)
  }

  // ── Players ────────────────────────────────────────────────────────────────
  const playerId: Record<string, string> = {}
  const seedOf: Record<string, PlayerSeed> = {}
  const parentContact: Record<string, { name: string | null; email: string; phone: string; emergency: string }> = {}
  const levelOf = (p: PlayerSeed) => {
    if (p.cat === 'Performance') return 'Performance / county'
    if (p.cat === 'Adult') return p.stage <= 0 ? 'Adult beginner' : p.stage <= 2 ? 'Adult improver' : p.stage === 3 ? 'Adult intermediate' : 'Adult advanced'
    return p.age <= 8 ? 'Red ball (5–8)' : p.age === 9 ? 'Orange ball (8–9)' : p.age === 10 ? 'Green ball (9–10)' : 'Yellow ball — junior'
  }
  const TARGETS: Record<string, { target: string; why: string; measure: string }[]> = {
    mia: [
      { target: 'Seven first serves in ten from the baseline', why: 'It is the last piece before she starts scoring her own matches.', measure: 'Ten-ball serve count at the start of each lesson' },
      { target: 'Hold the continental grip on every serve and volley', why: 'The frying-pan grip comes back when she tries to hit hard.', measure: 'No grip reminders needed across a full lesson' },
    ],
    tom: [
      { target: 'Kick second serve landing in eight of ten under pressure', why: 'Double faults are costing him a game a set.', measure: 'Second-serve-only points, win six of eleven' },
      { target: 'Serve plus one forehand to the open court', why: 'Turns a safe second serve into the start of a pattern.', measure: 'Pattern completed in half of all service points in practice sets' },
    ],
    ava: [
      { target: 'A ten-ball cross-court rally with a partner', why: 'Rally length is what unlocks orange-ball match play.', measure: 'Best rally recorded each week' },
    ],
    leo: [
      { target: 'Approach on the first short ball', why: 'He creates the chance with the inside-out forehand, then stays back.', measure: 'Net approaches per set — target six' },
      { target: 'Slice serve from the same toss as the flat serve', why: 'Good returners are reading the toss.', measure: 'Video check — tosses indistinguishable' },
    ],
    hannah: [
      { target: 'Topspin shape held in live rallies', why: 'She has the swing in drills and loses it when the point is live.', measure: 'Two in three rally balls clearing the high rope' },
      { target: 'Four sessions in a row attended', why: 'Rhythm is the real blocker at the moment.', measure: 'Register' },
    ],
    daniel: [
      { target: 'Win a county-level main-draw match', why: 'The level is there — it is the closing out that has been missing.', measure: 'Tournament result' },
      { target: 'First-serve percentage above 60 when serving for a set', why: 'He goes for too much at 5–4.', measure: 'Match charting' },
    ],
    priya: [
      { target: 'Serve and first volley in doubles without rushing', why: 'The first volley is being hit on the run.', measure: 'First volley made in six of ten serve-and-volley points' },
    ],
    isaac: [
      { target: 'A rally of five over the mini net with a coach', why: 'It is the first thing that makes tennis feel like a game to a seven-year-old.', measure: 'Best rally recorded each lesson' },
      { target: 'Find the forehand grip without looking', why: 'He arrived with a frying-pan grip from the camp.', measure: 'Grip-change race — five out of five' },
    ],
    charlotte: [
      { target: 'Continental grip on the serve and at the net', why: 'Ten years away and the forehand grip has crept in everywhere.', measure: 'Ten serves in a row without a grip reminder' },
      { target: 'Ready for Sunday Social Doubles', why: 'It is why she came back — and playing weekly is what will keep her.', measure: 'A twenty-ball cross-court rally and a second serve she trusts' },
    ],
    james: [
      { target: 'Backhand volley with a stable racket face', why: 'It is the one orange skill still collapsing under pace.', measure: 'Eight of ten block volleys to the deep target' },
    ],
  }
  out.coach_players = PLAYERS.map((p, pi) => {
    seedOf[p.key] = p
    const adult = p.cat === 'Adult'
    const ownContact = adult || p.age >= 14
    const parentEmail = p.parent ? (p.contact?.parentEmail || emailOf(p.parent)) : null
    const parentPhone = p.parent ? (p.contact?.parentPhone || nextPhone()) : null
    const email = ownContact ? (p.contact?.email || emailOf(p.name)) : null
    const phone = ownContact ? (p.contact?.phone || nextPhone()) : parentPhone
    const emergency = p.contact?.emergency || (p.parent ? `${p.parent} (parent) ${parentPhone}` : `${pick(`ec:${p.key}`, ['Alex', 'Chris', 'Jo', 'Sam', 'Pat'])} ${p.name.split(' ').slice(-1)[0]} (partner) ${nextPhone()}`)
    parentContact[p.key] = { name: p.parent || null, email: parentEmail || email || emailOf(p.name), phone: parentPhone || phone || nextPhone(), emergency }
    const targets = TARGETS[p.key]
    // Added to Lumio in roster order (the list reads newest first), apart from
    // the two who really did join this week.
    const added = ago(p.joined < 8 ? p.joined : 70 + pi * 4, '09:30')
    const r = row(T.player, {
      name: p.name, nickname: null, age: p.age, category: p.cat, level: levelOf(p),
      racket_stage: STAGE_IDS[p.stage], goal: p.goal,
      parent_name: p.parent || null, parent_email: parentEmail, email, contact_email: null, phone,
      notes: p.notes || (p.parent ? `Parent prefers ${pick(`comms:${p.key}`, ['WhatsApp', 'email', 'a text'])}.` : null),
      avatar_url: null,
      consent_data: true, consent_photo: !p.noPhoto, consent_medical: true, consent_wearable: !!p.watch,
      consent_by: p.parent || p.name, consent_date: ymd(plus(today, -p.joined)),
      medical_notes: p.medical && !/^no known/i.test(p.medical) ? p.medical : null,
      payment_method: p.pays || null,
      xp_total: 0,                                   // filled in below from their effort sessions
      watch_token: hex64(`watch:${p.key}`),
      targets: targets ? targets.map(t => ({ ...t, by: 'End of term' })) : null,
      targets_note: targets ? (firstLessonAt[p.key] ? `Set from ${firstName(p.name)}’s baseline assessment in the first lesson — revisit after four weeks.` : `Set after ${firstName(p.name)}’s last review — revisit at the end of term.`) : null,
      targets_set_at: targets ? (firstLessonAt[p.key] ? stamp(plus(firstLessonAt[p.key], 0)) : ago(between(`tg:${p.key}`, 9, 24), '19:30')) : null,
      targets_by: targets ? 'lumio-coach' : null,
      discord_user_id: null,
      ...assign(p.coach),
    }, added, ago(Math.min(p.joined, between(`pu:${p.key}`, 1, 12)), '18:00'))
    playerId[p.key] = r.id
    return r
  })
  const playerRow = (key: string) => out.coach_players.find(r => r.id === playerId[key]) as Row

  // ── Skills ─────────────────────────────────────────────────────────────────
  // Everything below the current colour is mastered, the current colour follows
  // the player's pattern, and now and then there is an early look at the next.
  out.coach_player_skills = PLAYERS.flatMap((p, pi) => {
    const rows: Row[] = []
    const cur = p.cur || SKILL_PATTERNS[(pi + hash(p.key)) % SKILL_PATTERNS.length]
    const inCampD = CAMP_D_PLAYERS.includes(p.key)
    for (let st = 0; st <= Math.min(p.stage + 1, STAGE_IDS.length - 1); st++) {
      THEMES[STAGE_IDS[st]].forEach((theme, i) => {
        const tag = `${p.key}:${st}:${i}`
        let score: number
        if (st < p.stage) score = unit(`sk:${tag}`) < 0.12 ? 3 : 4
        else if (st === p.stage) score = cur[i]
        else score = !firstLessonAt[p.key] && (hash(tag) % 3 === 0) ? 1 : 0
        if (!score) return
        // A lower colour was graded longer ago. One current skill was signed
        // off during the performance camp for the players who went.
        let when = ago(st < p.stage ? Math.min(p.joined, 60 + (p.stage - st) * 70 + between(`skd:${tag}`, 0, 40)) : between(`skd:${tag}`, 2, 26), '17:45')
        if (firstLessonAt[p.key]) when = stamp(firstLessonAt[p.key])        // graded at the baseline assessment
        if (inCampD && st === p.stage && i === cur.indexOf(Math.max(...cur))) when = stamp(at(plus(dStart, 4), '17:00'))
        rows.push(row(T.skill, { player_id: playerId[p.key], skill: theme.skill, score }, when))
      })
    }
    return rows
  })

  // ── Bookings ───────────────────────────────────────────────────────────────
  const CANCEL_JUNIOR = ['Cancelled by parent — unwell', 'Cancelled — school trip', 'Cancelled — family away', 'Cancelled by parent — clash with a school fixture']
  const CANCEL_ADULT = ['Cancelled — work commitment', 'Cancelled — away', 'Cancelled — unwell']
  const bookingOf = new Map<string, Row>()
  out.coach_bookings = occs.map(o => {
    const s = o.slot
    const p = s.player ? seedOf[s.player] : null
    const absent = !!p && missed.has(`${p.key}|${o.dateStr}|p`)
    const status = absent ? 'cancelled' : (!o.past && !o.isToday && s.pending) ? 'pending' : 'confirmed'
    const name = p ? p.name : (s.title as string)
    const r = row(T.booking, {
      title: name, player_name: p ? p.name : null, player_id: p ? playerId[p.key] : null,
      court: s.court, booking_date: o.dateStr, start_time: s.time, duration_min: s.mins,
      type: s.type, status,
      notes: absent ? pick(`cx:${o.key}`, p && p.cat === 'Adult' ? CANCEL_ADULT : CANCEL_JUNIOR)
        : s.venue ? `At ${VENUES.find(v => v.key === s.venue)?.name}.`
        : s.note ? s.note
        : s.pending && !o.past ? (p && p.joined < 10 ? 'Weekly slot offered after the first lesson — waiting for confirmation.' : 'Waiting for the family to confirm.') : null,
      ...assign(s.coach),
    }, stamp(at(plus(o.date, -between(`bk:${o.key}`, 6, 16)), '12:00')))
    bookingOf.set(o.key, r)
    return r
  })

  // ── Which recent lessons are still waiting for a write-up ──────────────────
  // The head coach's last few sessions: the list a coach clears at the weekend.
  const unwritten = new Set<string>()
  const recentHead = occs.filter(o => o.past && o.slot.type !== 'Block' && !o.key.startsWith('first:') && bookingOf.get(o.key)?.status !== 'cancelled' && (today.getTime() - o.date.getTime()) / DAY_MS <= 4.5)
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.slot.time.localeCompare(a.slot.time))
  for (const o of recentHead.filter(o => o.slot.coach === 'vincent').slice(0, 3)) unwritten.add(o.key)
  for (const o of recentHead) { if (unwritten.size >= 2) break; unwritten.add(o.key) }

  // ── Attendance ─────────────────────────────────────────────────────────────
  out.coach_attendance = []
  for (const o of occs) {
    if (!o.past || o.slot.type === 'Block' || unwritten.has(o.key)) continue
    const venue_id = venueId[o.slot.venue || HOME.key]
    const members = o.slot.player ? [o.slot.player]
      : (GROUPS[o.slot.title || ''] || []).filter(pk => inSquadThatWeek(pk, o.week) && !(duringCampD(o.date) && CAMP_D_PLAYERS.includes(pk)))
    for (const pk of members) {
      const tag = `${pk}|${o.dateStr}|${o.slot.player ? 'p' : 'g'}`
      out.coach_attendance.push(row(T.attendance, {
        player_id: playerId[pk], session_date: o.dateStr, present: !missed.has(tag), source: 'coach', venue_id,
        ...staffOnly(seedOf[pk].coach),
      }, stamp(at(o.date, addMins(o.slot.time, o.slot.mins + 10))), false))
    }
  }

  // ── Lesson write-ups, session plans ────────────────────────────────────────
  const planType = (s: Slot): PlanType => s.title === 'Mini Reds' ? 'Mini / red ball' : s.type === 'Cardio' ? 'Cardio' : s.type === 'Match play' ? 'Match play' : s.type === 'Group' ? 'Group' : 'Private'
  const standardFor = (p: PlayerSeed | null) => !p || p.cat === 'Adult' ? null
    : `LTA Youth · ${p.stage <= 1 ? 'Red' : p.stage === 2 ? 'Orange' : p.stage === 3 ? 'Green' : 'Yellow'}`
  // The nth lesson a player (or squad) has had decides which theme it was.
  const lessonNo = new Map<string, number>()
  const themeFor = (o: Occ): Theme => {
    const s = o.slot
    const who = s.player || (s.title as string)
    const n = lessonNo.get(who) || 0
    lessonNo.set(who, n + 1)
    if (s.player) { const list = THEMES[STAGE_IDS[seedOf[s.player].stage]]; return list[(hash(s.player) + n) % list.length] }
    const list = GROUP_THEMES[s.title as string] || GROUP_THEMES['Junior Squad']
    return list[n % list.length]
  }
  const NOTES = [
    (n: string, t: Theme) => `Good session with ${n} — ${t.win}. Still to fix: ${t.gap}.`,
    (n: string, t: Theme) => `${n} worked hard today. The headline: ${t.win}. Work-on for next time: ${t.gap}.`,
    (n: string, t: Theme) => `Pleased with ${n} this week — ${t.win}. Not there yet: ${t.gap}.`,
  ]
  const GROUP_NOTES = [
    (_: string, t: Theme) => `Good energy from the group — ${t.win}. To carry into next week: ${t.gap}.`,
    (_: string, t: Theme) => `A productive session: ${t.win}. The thing to tidy up — ${t.gap}.`,
  ]

  out.coach_sessions = []
  out.coach_session_plans = []
  const windowStart = plus(today, -28)
  const lastLessonOf = new Map<string, Occ>()
  for (const o of occs) if (o.past && o.slot.player && bookingOf.get(o.key)?.status !== 'cancelled' && !unwritten.has(o.key)) lastLessonOf.set(o.slot.player, o)
  const sessionCount: Record<string, number> = {}
  const sessionOf = new Map<string, Row>()

  for (const o of occs) {
    const s = o.slot
    if (s.type === 'Block') continue
    const booking = bookingOf.get(o.key) as Row
    if (booking.status === 'cancelled') continue
    const p = s.player ? seedOf[s.player] : null
    const who = p ? p.name : (s.title as string)
    const type = planType(s)
    const endOfSession = at(o.date, addMins(s.time, s.mins))

    if (o.past) {
      if (o.date < windowStart) { themeFor(o); continue }       // keeps the rotation honest
      const base = themeFor(o)
      if (unwritten.has(o.key)) continue
      const feature = p && lastLessonOf.get(p.key) === o ? FEATURED[p.key] : undefined
      const theme: Theme = feature || base
      const rating = feature ? feature.rating : p && p.att < 80 ? between(`rt:${o.key}`, 3, 4) : between(`rt:${o.key}`, 3, 5) === 3 ? 4 : between(`rt2:${o.key}`, 4, 5)
      const note = feature ? feature.note : (p ? pick(`nt:${o.key}`, NOTES) : pick(`nt:${o.key}`, GROUP_NOTES))(firstName(who), theme)
      // A plan the coach ran from: the head coach's sessions in the last week.
      let planId: string | null = null
      if (s.coach === 'vincent' && (today.getTime() - o.date.getTime()) / DAY_MS <= 7.5) {
        const plan = row(T.plan, {
          title: `${who} — ${theme.focus}`.slice(0, 120), booking_id: booking.id,
          session_date: o.dateStr, start_time: s.time, session_type: type, court: s.court, group_name: who,
          focus: theme.focus, duration_min: s.mins, racket_stage: p ? STAGE_IDS[p.stage] : null, standard: standardFor(p),
          focus_points: theme.covered.join('\n'), drills: theme.drills.join('\n'), notes: null,
          run_sheet: runSheet(type, theme.focus, s.mins), kit: PLAN_KIT[type],
          coach_note: p ? `Last time: ${p.goal.charAt(0).toLowerCase() + p.goal.slice(1)} is still the term goal — tie today back to it.` : 'Keep the queues short: four stations, three minutes each.',
          built_by: 'lumio-coach', designed_at: stamp(at(plus(o.date, -2), '20:15')), source: 'planner',
          completed_at: stamp(endOfSession), ...staffOnly(s.coach),
        }, stamp(at(plus(o.date, -2), '20:15')), stamp(endOfSession))
        out.coach_session_plans.push(plan)
        planId = plan.id
      }
      const review = {
        focus: theme.focus, covered: theme.covered,
        takeaways: [cap(theme.win), `Still to fix: ${theme.gap}`],
        drills: theme.drills, skillsWorked: feature ? feature.skills : theme.skill ? [theme.skill] : [],
        homework: theme.homework, nextFocus: theme.next, coachNote: note, rating,
        time: s.time, court: s.court, type: s.type, duration: s.mins,
      }
      const written = stamp(at(o.date, '20:30'))
      const sess = row(T.session, {
        player_name: who, player_id: p ? playerId[p.key] : null, session_date: o.dateStr,
        focus: theme.focus, summary: note, rating, ai_review: null, review_json: review, plan_id: planId,
        ...staffOnly(s.coach),
      }, written)
      out.coach_sessions.push(sess)
      sessionOf.set(o.key, sess)
      sessionCount[who] = (sessionCount[who] || 0) + 1
      continue
    }

    // Today and ahead: the plan for it, where one has been built. Everything
    // today is planned; further out the head coach is further ahead than most.
    const theme = themeFor(o)
    const planned = o.isToday || unit(`pl:${o.key}`) < (s.coach === 'vincent' ? 0.7 : 0.4)
    if (!planned) continue
    const byCoach = unit(`pb:${o.key}`) < 0.25
    const designed = stamp(at(plus(o.date, -between(`pd:${o.key}`, 2, 5)), '20:40'))
    out.coach_session_plans.push(row(T.plan, {
      title: `${who} — ${theme.focus}`.slice(0, 120), booking_id: booking.id,
      session_date: o.dateStr, start_time: s.time, session_type: type, court: s.court, group_name: who,
      focus: theme.focus, duration_min: s.mins, racket_stage: p ? STAGE_IDS[p.stage] : null, standard: standardFor(p),
      focus_points: theme.covered.join('\n'), drills: theme.drills.join('\n'),
      notes: p?.medical && !/^no known/i.test(p.medical) ? `Medical: ${p.medical}.` : null,
      run_sheet: byCoach ? null : runSheet(type, theme.focus, s.mins), kit: byCoach ? null : PLAN_KIT[type],
      coach_note: byCoach ? null : p ? `Picks up from last time. Watch for: ${theme.gap}.` : `Group of ${GROUPS[s.title || '']?.length || 8}. Demonstrate once, then get them hitting.`,
      built_by: byCoach ? 'coach' : 'lumio-coach', designed_at: designed, source: 'planner', completed_at: null,
      ...staffOnly(s.coach),
    }, designed))
  }
  // One plan with nowhere to go yet: written from Max's last lesson, waiting on a booking.
  out.coach_session_plans.push(row(T.plan, {
    title: 'Next session — Max Turner', booking_id: null, session_date: null, start_time: null,
    session_type: 'Private', court: null, group_name: 'Max Turner',
    focus: THEMES.orange[2].focus, duration_min: 45, racket_stage: 'orange', standard: 'LTA Youth · Orange',
    focus_points: THEMES.orange[2].covered.join('\n'), drills: THEMES.orange[2].drills.join('\n'),
    notes: 'Saved from his last lesson summary — book him in and assign this.',
    run_sheet: runSheet('Private', THEMES.orange[2].focus, 45), kit: PLAN_KIT.Private, coach_note: null,
    built_by: 'lumio-coach', designed_at: ago(6, '20:50'), source: 'lesson', completed_at: null, ...staffOnly('grace'),
  }, ago(6, '20:50')))

  // ── Effort & Rewards, GPS ──────────────────────────────────────────────────
  out.coach_watch_sessions = []
  out.coach_gps_sessions = []
  const GPS_PLAYERS = ['tom', 'leo', 'daniel', 'lucas', 'nina', 'sophie']
  const xp: Record<string, number> = {}
  for (const o of occs) {
    const pk = o.slot.player
    if (!pk || !o.past || bookingOf.get(o.key)?.status === 'cancelled') continue
    const p = seedOf[pk]
    const daysAgo = (today.getTime() - o.date.getTime()) / DAY_MS
    if (p.watch && daysAgo <= 43) {
      const manual = unit(`wm:${o.key}`) < 0.2
      const effort = between(`we:${o.key}`, p.cat === 'Performance' ? 62 : 48, p.cat === 'Performance' ? 94 : 82)
      const movement = between(`wv:${o.key}`, 45, 90)
      const consistency = Math.min(100, Math.round(o.slot.mins / 60 * 100))
      const awarded = Math.min(120, Math.round(0.5 * effort + 0.3 * movement + 0.2 * consistency))
      const maxHr = 220 - p.age
      const avgHr = Math.round(maxHr * (0.5 + effort / 100 * 0.4))
      xp[pk] = (xp[pk] || 0) + awarded
      out.coach_watch_sessions.push(row(T.watch, {
        player_id: playerId[pk], source: manual ? 'manual' : 'apple_watch',
        started_at: at(o.date, o.slot.time).toISOString(), duration_min: o.slot.mins,
        avg_hr: manual ? null : avgHr, max_hr: manual ? null : Math.min(maxHr - 2, avgHr + between(`wh:${o.key}`, 16, 30)),
        active_kcal: Math.round(o.slot.mins * (p.cat === 'Adult' ? 7.5 : 6) * (0.7 + effort / 200)),
        distance_m: Math.round(o.slot.mins * (22 + movement * 0.45)),
        effort_score: effort, movement_score: movement, consistency_score: consistency,
        xp_awarded: awarded, estimated: manual, voided: false, raw: null,
      }, stamp(at(o.date, addMins(o.slot.time, o.slot.mins + 5)))))
    }
    if (GPS_PLAYERS.includes(pk) && daysAgo <= 29) {
      out.coach_gps_sessions.push(row(T.gps, {
        player_name: p.name, session_date: o.dateStr,
        distance_m: between(`gd:${o.key}`, 2600, 4400), top_speed_kmh: between(`gs:${o.key}`, 196, 248) / 10,
        avg_hr: between(`gh:${o.key}`, 138, 166), video_url: null,
        notes: pick(`gn:${o.key}`, ['Heavy baseline load — lots of wide balls.', 'Short, sharp session: serve and first-ball work.', 'Match play — most distance covered in the second set.', 'Good intensity throughout; recovery walk between sets.']),
      }, stamp(at(o.date, '21:00'))))
    }
  }
  for (const p of PLAYERS) {
    if (!p.watch) continue
    // What they earned before the six weeks on screen.
    const total = (xp[p.key] || 0) + between(`xb:${p.key}`, 180, 1900)
    Object.assign(playerRow(p.key), { xp_total: total })
  }

  // ── Player development notes ───────────────────────────────────────────────
  const DEV: [string, string, number, string, string][] = [
    ['mia', 'technical', 4, 'Seven first serves in ten from the baseline', 'Toss is the thing — when it lands on the spot the rest follows.'],
    ['mia', 'psychological', 4, 'Stay positive after a double fault', 'Much better. Uses her reset word without being asked.'],
    ['tom', 'technical', 4, 'Kick second serve under pressure', 'Racket speed is there; the toss drifts when rushed.'],
    ['tom', 'tactical', 3, 'Serve plus one to the open court', 'Hits the serve, then admires it. First step after the serve needs to be automatic.'],
    ['leo', 'tactical', 4, 'Approach on the first short ball', 'Reads it late. Cue: any ball landing inside the service line.'],
    ['leo', 'physical', 3, 'Repeat-sprint fitness for three-set matches', 'Fades in the third. Two conditioning sessions a week agreed with mum.'],
    ['hannah', 'social', 2, 'Four sessions in a row attended', 'Enjoys it when she is here; the gaps are what hold her back.'],
    ['hannah', 'technical', 3, 'Topspin shape in live rallies', 'Has it in drills. Needs rally targets rather than more feeding.'],
    ['daniel', 'psychological', 4, 'Close out sets from a break up', 'Routine holds until 5–4. Simulated set points every match-play session.'],
    ['daniel', 'tactical', 5, 'Two go-to patterns on each side', 'Clear and well-rehearsed. Ready for a counter-pattern.'],
    ['ava', 'physical', 3, 'Recovery steps after every shot', 'Stands and watches the ball she has just hit — very normal at eight.'],
    ['priya', 'tactical', 3, 'Join partner at the net behind a deep return', 'Stays back out of habit. Rope drill in the adult group is helping.'],
    ['james', 'technical', 3, 'Stable racket face on the backhand volley', 'Collapses on the faster ball. Wall volleys set for homework.'],
    ['isaac', 'technical', 2, 'A rally of five over the mini net', 'Baseline from his first lesson: good hand-eye from the camp, frying-pan grip, stands square-on. Grip first.'],
    ['charlotte', 'technical', 2, 'Continental grip back on the serve and volleys', 'Baseline from her first lesson: strokes intact from junior days, timing and serve grip have gone. Fitness is fine.'],
  ]
  out.coach_development = DEV.map(([pk, area, rating, target, notes], i) => row(T.development, {
    player_name: seedOf[pk].name, player_id: playerId[pk], area, rating, target,
    review_date: ymd(plus(today, between(`dv:${i}`, 12, 45))), notes, ...staffOnly(seedOf[pk].coach),
  }, firstLessonAt[pk] ? stamp(plus(firstLessonAt[pk], 0)) : ago(between(`dvc:${i}`, 3, 30), '19:00')))

  // ── Packages (the price list) ──────────────────────────────────────────────
  const PACKAGES: [string, string, number, number, string, string, string[], string[]][] = [
    ['10-lesson private pack', 'Private', 360, 10, 'per pack', 'Ten 1-hour private lessons — best value for committed players.', ['10 × 60-min private lessons', 'Racket progress tracking', 'Lesson summary after each session', 'Saves £20 vs pay-as-you-go'], ['Ball basket (60+)', 'Cones ×8', 'Target hoops']],
    ['5-lesson private pack', 'Private', 185, 5, 'per pack', 'A five-lesson block to get started or work on a specific goal.', ['5 × 60-min private lessons', 'Starting racket assessment', 'Lesson summaries', 'Flexible scheduling'], ['Ball basket (60+)', 'Cones ×8']],
    ['Performance monthly', 'Performance', 240, 12, 'per month', 'Intensive monthly programme for competitive junior players.', ['12 sessions per month', 'Match-play and tactical work', 'Fitness and movement block', 'Tournament planning'], ['Ball basket (60+)', 'Cones ×12', 'Agility ladders']],
    ['Adult 8-lesson block', 'Adult', 280, 8, 'per pack', 'Eight lessons for adult improvers — technique and match craft.', ['8 × 60-min lessons', 'Cardio and rally fitness option', 'Doubles tactics', 'Evening slots available'], ['Ball basket (60+)', 'Cones ×8']],
    ['Junior group — term', 'Group', 150, 10, 'per term', 'Weekly small-group coaching across a 10-week term.', ['10 weekly group sessions', 'Max 6 players per court', 'Racket pathway curriculum', 'End-of-term report'], ['2 ball baskets', 'Cones ×12', 'Throw-down lines', 'Bibs']],
    ['Cardio tennis — 6 pack', 'Cardio', 60, 6, 'per pack', 'High-energy, music-led tennis fitness — all levels welcome.', ['6 × 45-min cardio sessions', 'All abilities', 'No booking needed — just turn up', 'Great for fitness'], ['Ball machine or 2 baskets', 'Cones ×16', 'Music speaker']],
  ]
  out.coach_packages = PACKAGES.map(([name, kind, price, sessions, period, description, features, equipment], i) => row(T.pkg, {
    name, kind, price, sessions, period, description, features: features.join('\n'), equipment: equipment.join('\n'), sort_order: i,
  }, ago(700, `09:${p2(30 - i)}`)))

  // ── Camps ──────────────────────────────────────────────────────────────────
  const season = (d: Date) => ['New Year', 'February Half-Term', 'Spring', 'Easter', 'May Half-Term', 'Summer Term', 'Summer', 'Summer', 'Autumn', 'October Half-Term', 'Autumn', 'Christmas'][d.getMonth()]
  const campBName = `${season(bStart)} Junior Tennis Camp`
  const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  type DayPlan = { theme: string; coachFocus: string; rest?: boolean; did: string; sessions: { slot: string; time: string; title: string; type: string; where: string; detail?: string; cue?: string }[] }
  const itinerary = (start: Date, days: DayPlan[]) => days.map((d, i) => ({
    day: i + 1, date: dayLabel(plus(start, i)), theme: d.theme, focus: d.theme, coachFocus: d.coachFocus, did: d.did,
    ...(d.rest ? { rest: true } : {}), sessions: d.sessions,
  }))
  const kitFor = (shape: Parameters<typeof buildCampKit>[0], state: 'packing' | 'ready'): KitCategory[] =>
    buildCampKit(shape).map(c => ({ ...c, items: c.items.map(it => ({ ...it, status: state === 'ready' ? 'ready' as const : it.status })) }))

  const A_DAYS: DayPlan[] = [
    { theme: 'Arrival and a loosener', coachFocus: 'Nobody is assessed today. Get them hitting, see who is rusty, and sort the groups over dinner.', did: 'Transfers, check-in, an optional hit and the welcome dinner.', sessions: [
      { slot: 'PM', time: '14:00', title: 'Airport transfers and check-in', type: 'Logistics', where: 'Faro airport → resort', detail: 'Two group transfers meet the main flights. Rooms are ready from 15:00.' },
      { slot: 'PM', time: '17:00', title: 'Optional loosener hit', type: 'Social', where: 'Courts 1–4', detail: 'An easy hour of rallying to shake off the flight and find the clay.', cue: 'Just get a feel for the bounce.' },
      { slot: 'EVE', time: '19:30', title: 'Welcome dinner and week briefing', type: 'Briefing', where: 'Resort terrace', detail: 'The shape of the week, groups for tomorrow and the one thing each player wants from it.' },
    ] },
    { theme: 'Serve and return', coachFocus: 'The serve is where adult improvers leak the most free points. One cue each — do not rebuild anyone’s action in a week.', did: 'Serve clinic by group, return work, then doubles to put it into play.', sessions: [
      { slot: 'AM', time: '09:30', title: 'Serve clinic — toss, rhythm and a reliable second serve', type: 'Technical', where: 'Courts 1–6', detail: 'Three groups by level. Everyone films ten serves for the evening review.', cue: 'Slow toss, full reach.' },
      { slot: 'AM', time: '11:15', title: 'Return of serve — short take-back, deep target', type: 'Technical', where: 'Courts 1–6', cue: 'Half a swing, twice the depth.' },
      { slot: 'PM', time: '16:30', title: 'Doubles — serve and return games', type: 'Match play', where: 'Courts 1–6', detail: 'Rotating partners, first to four games. Bonus point for a first serve in on game point.' },
      { slot: 'EVE', time: '18:15', title: 'Serve video review (optional)', type: 'Video', where: 'Clubhouse', detail: 'Ten minutes each with a coach and the footage from this morning.' },
    ] },
    { theme: 'Building the point from the baseline', coachFocus: 'Height and depth before pace. On clay, the patient player wins — make them feel that.', did: 'Depth and direction work, clay movement, then singles and doubles ladders.', sessions: [
      { slot: 'AM', time: '09:30', title: 'Depth and direction — cross-court until the short ball', type: 'Tactical', where: 'Courts 1–6', cue: 'Higher over the net, not harder.' },
      { slot: 'AM', time: '11:15', title: 'Moving on clay — slide, balance, recover', type: 'Physical', where: 'Courts 1–3', detail: 'Short and fun. Optional for anyone managing a knee.' },
      { slot: 'PM', time: '16:30', title: 'Match-play ladder — round one', type: 'Match play', where: 'Courts 1–6', detail: 'Short sets to four. Singles or doubles by preference.' },
    ] },
    { theme: 'The net and a free afternoon', rest: true, coachFocus: 'Volleys in the morning while legs are fresh, then let them be on holiday. Tired adults stop learning.', did: 'Volley and overhead clinic, then a free afternoon and the group boat trip.', sessions: [
      { slot: 'AM', time: '09:30', title: 'Volleys and overheads — closing the net', type: 'Technical', where: 'Courts 1–6', cue: 'Punch, don’t swing.' },
      { slot: 'PM', time: '14:00', title: 'Free afternoon — pool, beach or the coast boat trip', type: 'Recovery', where: 'Resort / marina', detail: 'The boat trip leaves the marina at 14:30 for those who booked it.' },
      { slot: 'EVE', time: '20:00', title: 'Dinner in the old town', type: 'Social', where: 'Meet in reception at 19:30' },
    ] },
    { theme: 'Doubles patterns and positioning', coachFocus: 'Both up, moving together. Most of this group plays club doubles — this is the day they take home.', did: 'Doubles positioning, poaching, then the second round of the ladder.', sessions: [
      { slot: 'AM', time: '09:30', title: 'Doubles positioning — from one up, one back to both up', type: 'Tactical', where: 'Courts 1–6', cue: 'Move as if you are joined by a rope.' },
      { slot: 'AM', time: '11:15', title: 'Poaching and the first volley', type: 'Tactical', where: 'Courts 1–6' },
      { slot: 'PM', time: '16:30', title: 'Match-play ladder — round two', type: 'Match play', where: 'Courts 1–6' },
      { slot: 'EVE', time: '18:15', title: 'One-to-one feedback slots', type: 'Video', where: 'Clubhouse', detail: 'Fifteen minutes each: what has changed, what to take home.' },
    ] },
    { theme: 'Tournament day', coachFocus: 'Let them play. Notes for the take-home plans, not coaching between points.', did: 'Round-robin doubles tournament, finals and the prizegiving dinner.', sessions: [
      { slot: 'AM', time: '09:30', title: 'Warm-up and tournament briefing', type: 'Briefing', where: 'Courts 1–6' },
      { slot: 'AM', time: '10:00', title: 'Round-robin doubles tournament', type: 'Match play', where: 'Courts 1–6', detail: 'Balanced pairs, timed rounds, everybody plays everybody.' },
      { slot: 'PM', time: '16:30', title: 'Finals and consolation final', type: 'Match play', where: 'Courts 1–2' },
      { slot: 'EVE', time: '19:30', title: 'Prizegiving dinner', type: 'Social', where: 'Resort terrace' },
    ] },
    { theme: 'Last hit and home', coachFocus: 'Hand over the take-home plans in person. Check every transfer against the flight list.', did: 'An optional early hit, check-out and transfers to the airport.', sessions: [
      { slot: 'AM', time: '08:30', title: 'Optional early hit', type: 'Social', where: 'Courts 1–3' },
      { slot: 'AM', time: '10:30', title: 'Check-out and take-home plans', type: 'Briefing', where: 'Reception', detail: 'A one-page plan each: two things to keep, one to work on.' },
      { slot: 'PM', time: '12:00', title: 'Airport transfers', type: 'Logistics', where: 'Resort → Faro airport', detail: 'Two transfers timed to the main return flights.' },
    ] },
  ]
  const juniorDays = (themes: [string, string, string, string][], mini: boolean, where: string): DayPlan[] => themes.map(([theme, coachFocus, am, pm], i) => ({
    theme, coachFocus, did: `${am}; ${pm.charAt(0).toLowerCase() + pm.slice(1)}.`,
    sessions: mini ? [
      { slot: 'AM', time: '09:30', title: 'Arrival, register and warm-up games', type: 'Social', where },
      { slot: 'AM', time: '10:00', title: am, type: 'Technical', where, cue: 'Show me, then tell me.' },
      { slot: 'AM', time: '11:00', title: 'Snack and water break', type: 'Recovery', where: 'Shade tent' },
      { slot: 'AM', time: '11:20', title: pm, type: i === themes.length - 1 ? 'Match play' : 'Social', where },
      { slot: 'PM', time: '12:15', title: 'Stickers, star of the day and pick-up', type: 'Briefing', where: 'Court A gate' },
    ] : [
      { slot: 'AM', time: '09:00', title: 'Register, warm-up and movement games', type: 'Physical', where },
      { slot: 'AM', time: '09:45', title: am, type: 'Technical', where, detail: 'Red, orange and green-ball groups on separate courts.', cue: 'One cue per group.' },
      { slot: 'AM', time: '11:15', title: 'Skills challenge — beat your own score', type: 'Tactical', where },
      { slot: 'PM', time: '12:00', title: 'Lunch (packed lunch from home)', type: 'Recovery', where: 'Clubhouse' },
      { slot: 'PM', time: '13:00', title: pm, type: i === themes.length - 1 ? 'Match play' : 'Tactical', where },
      { slot: 'PM', time: '14:30', title: 'Team games, awards and pick-up at 15:00', type: 'Social', where: 'Court 1' },
    ],
  }))
  const B_DAYS = juniorDays([
    ['Rallying and control', 'Find out who can rally and who cannot yet — the groups are set from today.', 'Rally skills by ball colour', 'Champion of the court'],
    ['Serving and starting the point', 'Throwing action first. Nobody serves from the baseline until the toss behaves.', 'Serve stations — toss, reach, land', 'Serve and return games'],
    ['At the net', 'Volleys are the quickest win of the week. Lots of success, short feeds.', 'Volley and overhead stations', 'Doubles games — both up'],
    ['Playing points', 'Scoring, calling lines, changing ends. The thing parents notice most.', 'Building a point — height, depth, open court', 'Tie-break shoot-outs'],
    ['Tournament day', 'Everybody plays, everybody gets a note home. Spot the three for the squad pathway.', 'Tournament warm-up and team draw', 'Camp tournament and presentation'],
  ], false, 'Courts 1–6')
  const C_DAYS = juniorDays([
    ['Meet the ball', 'Names, rules and lots of touches. Nobody stands in a queue.', 'Throwing, catching and tap-ups', 'Over-the-river team game'],
    ['Forehand heroes', 'Side-on like a surfer. Celebrate every ball over the net.', 'Forehand — bounce, hit and finish', 'Target knock-down challenge'],
    ['Backhand day', 'Two hands, big hug finish. Keep the groups to four.', 'Two-handed backhand with the foam ball', 'Rally race in pairs'],
    ['Serve it up', 'Throwing games first — the serve is a throw.', 'Throwing games and the first overarm serves', 'Serve and catch relay'],
    ['Mini Aces tournament', 'Short games, lots of prizes, parents in for the last half hour.', 'Tournament warm-up', 'Mini tournament and medals'],
  ], true, 'Courts A–C')
  const D_DAYS: DayPlan[] = [
    ['Travel and settle', 'Light hit only. Phones in at ten.', true, 'Flights, transfer, an easy hit and the camp briefing.', 'Travel and check-in', 'Easy hit — find the clay', 'Camp briefing and goal-setting'],
    ['Serve under pressure', 'Second serves decide matches at this level. Every basket ends with a pressure set.', false, 'Serve technique blocks, a fitness base session and the first ladder matches.', 'Serve block — kick and slice to targets', 'Ladder matches — round one', 'Serve video review'],
    ['Heavy ball on clay', 'Height and spin over pace. Slide into the ball, not after it.', false, 'Depth and spin work on clay, movement and round two of the ladder.', 'Depth and heavy spin — living in the back third', 'Ladder matches — round two', 'Recovery, stretch and match notes'],
    ['Transition and the net', 'They all defend well. Make them finish.', false, 'Approach and volley patterns, then points starting from the short ball.', 'Approach, first volley, finish', 'Short-ball points and doubles', 'Team dinner in town'],
    ['Recovery and tactics', 'Half day. Tired legs learn nothing — classroom work on patterns instead.', true, 'A lighter morning, a pattern workshop and an afternoon off.', 'Mobility, serve rhythm and returns', 'Free afternoon — beach with staff', 'Pattern workshop: two plays each side'],
    ['Match day', 'Full sets, no coaching during play. Chart everything.', false, 'Best-of-three matches against the host club’s squad, then the debrief.', 'Match warm-up and scouting', 'Matches against the host club squad', 'Match debrief and awards'],
    ['Reports and home', 'Every player leaves with their report in hand.', true, 'One-to-one reports, a last hit, transfer and flights home.', 'One-to-one reports and a last hit', 'Transfer and flights home', ''],
  ].map(([theme, coachFocus, rest, did, am, pm, eve]) => ({
    theme: theme as string, coachFocus: coachFocus as string, did: did as string, ...(rest ? { rest: true } : {}),
    sessions: [
      { slot: 'AM', time: '09:00', title: am as string, type: /Travel|Transfer/.test(am as string) ? 'Logistics' : 'Technical', where: 'Clay courts 1–4' },
      { slot: 'PM', time: '15:30', title: pm as string, type: /Free|Transfer|flights/i.test(pm as string) ? (/Free/.test(pm as string) ? 'Recovery' : 'Logistics') : 'Match play', where: 'Clay courts 1–6' },
      ...(eve ? [{ slot: 'EVE', time: '19:30', title: eve as string, type: /video|notes|workshop|debrief|briefing/i.test(eve as string) ? 'Video' : 'Social', where: 'Hotel meeting room' }] : []),
    ],
  }))

  const coachIds = (...keys: string[]) => keys.map(k => staffId[k])
  const campA = row(T.camp, {
    name: 'Algarve Adult Tennis Week', start_date: ymd(aStart), end_date: ymd(aEnd), capacity: 16, price: 1295,
    location: 'Quinta do Mar Tennis Resort', region: 'Algarve, Portugal', surface: 'Clay and hard', courts: 6,
    board: 'Half board at the resort — breakfast and dinner',
    daily_rhythm: 'Two coached sessions in the cool of the morning, the afternoon to rest, then match play from 16:30 when the heat drops.',
    description: 'A week of coached tennis in the sun for adult club players. Small groups by level, a doubles tournament on the last day, and enough afternoons off that it still feels like a holiday.',
    notes: 'Rachel and Marcus are coaching with me. Resort needs the final rooming list ten days before we fly.',
    confirmed: true, collected: 0, itinerary: itinerary(aStart, A_DAYS), equipment: null,
    objectives: [
      'Every player leaves with one reliable serve they trust on a big point',
      'Each player filmed twice — serve and a rally pattern — with a one-to-one review',
      'A minimum of twelve competitive sets each across the week',
      'Doubles positioning: both players comfortable at the net together',
    ],
    outcomes: [
      'A one-page take-home plan for every player, handed over on the last morning',
      'Their serve clips, before and after, shared within a week of getting home',
      'First refusal on next year’s week for everyone who came',
    ],
    parent_brief: {
      intro: 'Seven days at a tennis resort on the Algarve coast, coached by Vincent, Rachel and Marcus. It is a proper coaching week — but it is also your holiday, and the timetable respects that.',
      whatTheyWorkOn: ['A serve and second serve you can rely on', 'Building points from the baseline on clay', 'Volleys, overheads and closing the net', 'Doubles positioning and patterns'],
      whatToBring: ['Two rackets if you have them', 'Clay-court or all-court shoes', 'Hat, sun cream and a refillable water bottle', 'Passport, travel insurance details and your GHIC card'],
      dailyShape: 'Coaching from 09:30 to 12:30, a long lunch and rest, match play from 16:30 and dinner together most evenings.',
      whatTheyLeaveWith: ['A personal take-home plan', 'Before-and-after video of your serve', 'A week of matches against players of your own level'],
    },
    player_targets: [
      { player_name: 'Priya Patel', stage: 'Green', goals: ['Serve and first volley without rushing', 'Poach at least once a game in doubles'], measure: 'First volley made in six of ten serve-and-volley points' },
      { player_name: 'Ella Brooks', stage: 'Green', goals: ['Hold her nerve in tie-breaks', 'First serve in on game point'], measure: 'Win two of three tie-breaks in the ladder' },
      { player_name: 'Sam Doyle', stage: 'Blue', goals: ['More first serves in at full pace', 'Kick second serve to the backhand'], measure: 'First-serve percentage above 55 on tournament day' },
      { player_name: 'Amara Singh', stage: 'Green', goals: ['Return deep rather than chipping short'], measure: 'Seven of ten returns past the service line' },
      { player_name: 'Richard Hale', goals: ['Move forward behind a good deep ball', 'A volley he trusts'], measure: 'Four net approaches per set' },
    ],
    ages: 'Adults 18+', group_size: 16, intent: 'Adult improvers and club doubles players. Coaching in the mornings, match play in the late afternoon, a tournament to finish.',
    designed_at: ago(52, '21:10'),
    signup_slug: 'algarve-adult-tennis-week', signup_open: true, payment_mode: 'deposit', deposit_amount: 300,
    signup_note: 'Flights are not included — book to arrive at Faro by mid-afternoon on the first day. Tell me your flight and I will add you to a transfer.',
    emails_paused: false, overseas: true, balance_link: null, email_overrides: null, audience: 'adult', info_form: null,
    trip: {
      intro: 'Everything for the week in one place. If your plans change — a different flight, a late arrival — message me and I will sort the transfer.',
      stay: {
        name: 'Quinta do Mar Tennis Resort', address: 'Estrada da Praia, 8135 Almancil, Algarve, Portugal',
        checkIn: 'From 15:00 on arrival day; check-out by 10:30 on the last morning', rooms: 'Twin and single rooms in the garden wing, all a two-minute walk from the courts',
        meals: 'Breakfast 07:30–10:00 and dinner at 19:30 are included. Lunch is your own — the pool bar does a good one.',
        wifi: 'Free throughout — the code is on your key card', notes: 'Pool towels at reception. The gym opens at 07:00.',
      },
      venue: {
        name: 'Quinta do Mar tennis centre', address: 'Estrada da Praia, 8135 Almancil, Algarve, Portugal',
        courts: 'Four clay and two hard courts, all ours every morning and from 16:30', facilities: 'Shaded seating, a pro shop that restrings overnight, cold water on every court',
        notes: 'Clay shoes are kinder to the courts and to your knees. The pro shop sells them if you forget.',
      },
      travel: {
        airport: 'Faro (FAO) — about 25 minutes from the resort', flights: 'Not included. Most of the group is on the mid-morning flight from Gatwick.',
        transfers: 'Two group transfers on arrival day and two on the last day, timed to the main flights. Tell me your flight number and you are on one.',
        arrival: 'Aim to land by 15:00 so you can make the loosener hit at 17:00.', departure: 'Transfers leave the resort from 12:00 on the last day.',
        notes: 'Travelling separately or staying on? Let me know and I will give you the taxi firm’s number.',
      },
      transport: [
        { name: 'Almancil Taxis', kind: 'Taxi firm', phone: '+351 289 555 0142', note: 'Reliable and they know the resort. About €12 into the village, €35 to the airport.' },
        { name: 'Resort shuttle', kind: 'Shuttle', note: 'Runs to the beach on the hour from reception — free with your key card.' },
      ],
      eating: [
        { name: 'A Tasca do Pescador', kind: 'Seafood', address: 'Rua do Porto, Quarteira', note: 'Where we go on the free evening. Order the cataplana for two and share it between three.' },
        { name: 'Casa da Avó', kind: 'Portuguese', address: 'Largo da Igreja, Almancil', note: 'Ten minutes’ walk from the resort. Cash only, closed on Mondays.' },
        { name: 'The pool bar', kind: 'Lunch', note: 'Toasties and salads — the quickest lunch between sessions.' },
      ],
      contacts: [
        { name: 'Vincent Jones', role: 'Head coach', phone: '07700 900123', note: 'Anything at all, any time.' },
        { name: 'Rachel Adeyemi', role: 'Coach', phone: '07700 900151', note: 'Transfers and rooming.' },
        { name: 'Marcus Bell', role: 'Coach', phone: '07700 900152' },
        { name: 'Resort reception', role: '24 hours', phone: '+351 289 555 0100' },
      ],
      bring: ['Passport — valid for at least three months after we return', 'Travel insurance that covers playing sport', 'Two rackets if you have them, and overgrips', 'Clay or all-court shoes', 'Hat, SPF50, refillable water bottle', 'A light jumper — the evenings cool down'],
      practical: {
        currency: 'Euro. Cards work everywhere except Casa da Avó.', weather: 'Warm and dry: low-to-mid twenties by day, cooler in the evening.',
        timeDifference: 'The same time as the UK', plugs: 'Two-pin European — bring an adaptor', health: 'Bring your GHIC card. The nearest pharmacy is in Almancil, five minutes by taxi.',
      },
      sections: [
        { title: 'The free afternoon', body: 'Day four finishes at 12:30. There is a boat trip along the coast for anyone who wants it — €40, pay on the day — and the beach is a ten-minute shuttle ride.' },
      ],
    },
    trip_slug: 'algarve-adult-tennis-week-k4x9m2pq', trip_open: true,
    kit: kitFor({ players: 15, days: 7, courts: 6, overseas: true, board: 'Half board at the resort', audience: 'adult' }, 'packing'),
    costs: [
      { label: 'Resort — rooms and half board (15 guests, 3 coaches)', amount: 9450 },
      { label: 'Court hire — six courts for six days', amount: 1680 },
      { label: 'Coach fees (Rachel and Marcus)', amount: 1800 },
      { label: 'Coach flights and transfers', amount: 870 },
      { label: 'Group airport transfers', amount: 640 },
      { label: 'Welcome and prizegiving dinners', amount: 520 },
      { label: 'Balls, camp shirts and prizes', amount: 410 },
    ],
    payment_plan: { deposit: 300, installments: [{ label: 'Second payment', amount: 500, due: ymd(plus(aStart, -56)) }, { label: 'Final balance', amount: 495, due: ymd(plus(aStart, -14)) }] },
    coach_ids: coachIds('vincent', 'rachel', 'marcus'), staff_id: null,
    discord_guild_id: null, discord_channel_id: null, discord_channel_name: null, discord_last_message_id: null, discord_synced_at: null, discord_mirror: true,
  }, ago(58, '20:30'), ago(1, '21:05'))

  const campB = row(T.camp, {
    name: campBName, start_date: ymd(bStart), end_date: ymd(bEnd), capacity: 24, price: 220,
    location: 'Riverside Tennis Centre', region: 'Riverside, England', surface: 'Indoor and outdoor hard', courts: 6,
    board: 'Day camp — bring a packed lunch',
    daily_rhythm: 'Technique in the morning while they are fresh, lunch at twelve, then games and match play — every day finishes with something to win.',
    description: 'Five days at Riverside for ages 6 to 14. Red, orange and green-ball groups, 9am to 3pm, with a tournament and presentation on the last afternoon.',
    notes: 'Indoor 1 is held as the wet-weather court all week.',
    confirmed: true, collected: 0, itinerary: itinerary(bStart, B_DAYS), equipment: null,
    objectives: [
      'Every junior leaves with one clear technical focus to take into term',
      'All red and orange-ball players score their own tie-break by the last day',
      'Daily skills awards — every child wins something during the week',
      'Spot and invite three or four players for the squad pathway',
    ],
    outcomes: ['A short progress note for each parent at pick-up on the last day', 'Follow-up term places offered to every family'],
    parent_brief: {
      intro: 'A week of tennis at Riverside for players aged 6 to 14, whatever their level. Groups are set by ball colour and experience on the first morning.',
      whatTheyWorkOn: ['Rallying and control', 'Serving and starting a point', 'Volleys and doubles', 'Scoring and playing matches'],
      whatToBring: ['A racket if they have one — we have spares', 'Trainers with non-marking soles', 'Packed lunch, a snack and a named water bottle', 'Sun cream and a hat, or a waterproof — we play in most weather'],
      dailyShape: 'Drop-off from 08:45 for a 9am start. Lunch at twelve. Pick-up at 15:00 from Court 1.',
      whatTheyLeaveWith: ['A progress note from their coach', 'A certificate and their skills awards', 'One thing to practise at home'],
    },
    player_targets: [
      { player_name: 'Mia Chen', stage: 'Orange', goals: ['Serve from the baseline in every match', 'Score a full tie-break without help'], measure: 'Seven first serves in ten on the last day' },
      { player_name: 'Ava Romero', stage: 'Yellow', goals: ['A ten-ball rally with a partner'], measure: 'Best rally recorded each day' },
      { player_name: 'Hannah Berg', stage: 'Green', goals: ['Topspin shape in live points', 'All five days attended'], measure: 'Two in three rally balls over the high rope' },
      { player_name: 'James Whitlock', stage: 'Orange', goals: ['Come to the net and finish with a volley'], measure: 'Three net points won per match' },
    ],
    ages: '6–14', group_size: 24, intent: 'A holiday camp that feeds the term programme: fun first, with a real technical focus for each child.',
    designed_at: ago(40, '20:45'),
    signup_slug: slug(campBName), signup_open: true, payment_mode: 'none', deposit_amount: null,
    signup_note: 'Drop-off from 08:45 at the clubhouse. Please tell us about any allergies on the form.',
    emails_paused: false, overseas: false, balance_link: null, email_overrides: null, audience: 'junior', info_form: null,
    trip: null, trip_slug: null, trip_open: false,
    kit: kitFor({ players: 16, days: 5, courts: 6, overseas: false, board: 'Day camp', audience: 'junior' }, 'packing'),
    costs: [
      { label: 'Court hire — six courts for five days', amount: 900 },
      { label: 'Assistant coaches (three, five days)', amount: 1350 },
      { label: 'Balls, prizes and camp shirts', amount: 320 },
      { label: 'First-aid cover and insurance', amount: 140 },
    ],
    payment_plan: null, coach_ids: coachIds('vincent', 'sofia', 'aisha', 'luca'), staff_id: null,
    discord_guild_id: null, discord_channel_id: null, discord_channel_name: null, discord_last_message_id: null, discord_synced_at: null, discord_mirror: true,
  }, ago(66, '19:40'), ago(3, '18:20'))

  const campC = row(T.camp, {
    name: 'Mini Aces Holiday Camp', start_date: ymd(cStart), end_date: ymd(cEnd), capacity: 16, price: 140,
    location: 'Oakwood Grammar School', region: 'Riverside, England', surface: 'Hard', courts: 3,
    board: 'Mornings only — bring a snack and a drink',
    daily_rhythm: 'Short blocks and lots of games: twenty minutes is a long time when you are six.',
    description: 'Five mornings of red-ball tennis for ages 5 to 8 on the school courts at Oakwood, run by David, Grace and Chloe. Parents are invited in for the tournament on the last day.',
    notes: 'Run by David’s team at Oakwood — the Riverside diary carries on as normal.',
    confirmed: true, collected: 0, itinerary: itinerary(cStart, C_DAYS), equipment: null,
    objectives: ['Every child rallies five balls with a coach by the last day', 'Everyone learns to keep score in a mini game', 'A sticker or award for every child every day'],
    outcomes: ['A certificate and a note home for each child', 'An invitation to the Friday Mini Reds group'],
    parent_brief: {
      intro: 'A gentle, busy first taste of tennis for ages 5 to 8. Soft balls, small courts, and no standing in queues.',
      whatTheyWorkOn: ['Throwing, catching and balance', 'Forehand and backhand with a soft ball', 'A first overarm serve', 'Playing a mini match'],
      whatToBring: ['Trainers', 'A named water bottle and a snack', 'Sun hat or waterproof', 'A racket if they have one — we bring plenty'],
      dailyShape: 'Drop-off from 09:15 for a 9:30 start. Snack break at eleven. Pick-up at 12:30 from the Court A gate.',
      whatTheyLeaveWith: ['A certificate and medal', 'A star-of-the-day sticker chart', 'A note on what to try next'],
    },
    player_targets: [
      { player_name: 'Evie Hart', stage: 'White', goals: ['Rally five with a coach'], measure: 'Best rally each morning' },
      { player_name: 'Isaac Bell', stage: 'White', goals: ['Hit ten forehands over the net in a row'], measure: 'Count on day five' },
    ],
    ages: '5–8', group_size: 16, intent: 'Red-ball fun for the youngest players, feeding the Friday Mini Reds group.',
    designed_at: ago(45, '20:00'),
    signup_slug: 'mini-aces-holiday-camp', signup_open: false, payment_mode: 'none', deposit_amount: null,
    signup_note: 'Parking is on School Road. Please use the side gate by Court A.',
    emails_paused: false, overseas: false, balance_link: null, email_overrides: null, audience: 'junior', info_form: null,
    trip: null, trip_slug: null, trip_open: false,
    kit: kitFor({ players: 12, days: 5, courts: 3, overseas: false, board: 'Mornings only', audience: 'junior' }, 'ready'),
    costs: [
      { label: 'School court hire — five mornings', amount: 300 },
      { label: 'Coaches (three, five mornings)', amount: 750 },
      { label: 'Red balls, stickers and medals', amount: 130 },
    ],
    payment_plan: null, coach_ids: coachIds('david', 'grace', 'chloe'), staff_id: null,
    discord_guild_id: null, discord_channel_id: null, discord_channel_name: null, discord_last_message_id: null, discord_synced_at: null, discord_mirror: true,
  }, ago(78, '19:10'), ago(1, '13:00'))

  const campD = row(T.camp, {
    name: 'Costa del Sol Performance Camp', start_date: ymd(dStart), end_date: ymd(dEnd), capacity: 12, price: 1450,
    location: 'Club de Tenis Las Palmeras', region: 'Costa del Sol, Spain', surface: 'Clay', courts: 6,
    board: 'Full board at the team hotel',
    daily_rhythm: 'Technical block at nine, competitive tennis from half past three, and something short in the evening — video, a workshop or a debrief.',
    description: 'A sold-out week on Spanish clay for the performance squad: serve work, a heavy clay-court ball, a match-play ladder and a fixture against the host club to finish.',
    notes: 'Completed. Reports went home on the last day; fitness benchmarks are in each player’s development notes.',
    confirmed: true, collected: 17400, itinerary: itinerary(dStart, D_DAYS), equipment: null,
    objectives: [
      'Every player adds one serve variation — kick or slice — to their match play',
      'Two filmed reviews per player: serve and a rally pattern',
      'A minimum of fifteen competitive sets each',
      'A heavier clay-court ball: two in three rally balls past the service line',
    ],
    outcomes: [
      'Delivered — a written report for every player, handed over on the last morning',
      'Delivered — racket re-assessment for the three players who met their criteria',
      'Delivered — a four-week plan for each player for the block after camp',
      'The squad won the fixture against the host club 7–5',
    ],
    parent_brief: {
      intro: 'Seven days of clay-court training and competition for the performance squad, with three coaches travelling.',
      whatTheyWorkOn: ['Serve variation under pressure', 'Depth and heavy spin on clay', 'Transition and finishing at the net', 'Match play against unfamiliar opponents'],
      whatToBring: ['Passport and signed consent form', 'Three rackets, strung', 'Clay-court shoes', 'Refillable bottle, hat and sun cream'],
      dailyShape: 'Training at nine, lunch and rest, matches from 15:30, a short evening session and lights out at ten.',
      whatTheyLeaveWith: ['A written report and four-week plan', 'Serve and rally video', 'Match results from the ladder and the fixture'],
    },
    player_targets: CAMP_D_PLAYERS.slice(0, 6).map(pk => ({
      player_name: seedOf[pk].name, stage: STAGE_NAMES[seedOf[pk].stage],
      goals: [cap(seedOf[pk].goal), 'Fifteen competitive sets across the week'], measure: 'Ladder results and the serve chart on match day',
    })),
    ages: '12–16', group_size: 12, intent: 'Performance squad only. A training block on clay with a fixture to finish.',
    designed_at: ago(120, '20:00'),
    signup_slug: 'costa-del-sol-performance-camp', signup_open: false, payment_mode: 'deposit', deposit_amount: 350, signup_note: null,
    emails_paused: false, overseas: true, balance_link: null, email_overrides: null, audience: 'junior', info_form: null,
    trip: {
      intro: 'The week in one place for players and parents.',
      stay: { name: 'Hotel Las Palmeras', address: 'Avenida del Mar 14, 29600 Marbella, Spain', rooms: 'Twin rooms, coaches on the same corridor', meals: 'Full board at the hotel' },
      venue: { name: 'Club de Tenis Las Palmeras', address: 'Camino del Olivar, 29600 Marbella, Spain', courts: 'Six clay courts, ten minutes’ walk from the hotel' },
      travel: { airport: 'Málaga (AGP)', transfers: 'Coach transfer both ways with the group', flights: 'Group booking — travelling together from Gatwick' },
      contacts: [{ name: 'Vincent Jones', role: 'Head coach', phone: '07700 900123' }, { name: 'Rachel Adeyemi', role: 'Coach and welfare lead', phone: '07700 900151' }],
      bring: ['Passport', 'Three rackets', 'Clay-court shoes', 'Signed medical and consent form'],
    },
    trip_slug: 'costa-del-sol-performance-camp-h7t2w9ce', trip_open: false,
    kit: kitFor({ players: 12, days: 7, courts: 6, overseas: true, board: 'Full board at the team hotel', audience: 'junior' }, 'ready'),
    costs: [
      { label: 'Hotel — rooms and full board', amount: 8900 },
      { label: 'Court hire and host-club coach', amount: 2100 },
      { label: 'Coach fees (Theo and Rachel)', amount: 2400 },
      { label: 'Flights and transfers for three coaches', amount: 1150 },
      { label: 'Physio cover, excursion and kit', amount: 760 },
    ],
    payment_plan: { deposit: 350, installments: [{ label: 'Second payment', amount: 550, due: ymd(plus(dStart, -70)) }, { label: 'Final balance', amount: 550, due: ymd(plus(dStart, -28)) }] },
    coach_ids: coachIds('vincent', 'theo', 'rachel'), staff_id: null,
    discord_guild_id: null, discord_channel_id: null, discord_channel_name: null, discord_last_message_id: null, discord_synced_at: null, discord_mirror: true,
  }, ago(150, '19:00'), stamp(at(plus(dEnd, 2), '10:00')))
  out.coach_camps = [campA, campB, campC, campD]

  // ── Camp attendees ─────────────────────────────────────────────────────────
  type Pay = 'full' | 'deposit' | 'none'
  type Place = { player?: string; guest?: Guest; pay: Pay; form: boolean; goal?: string; room?: string; single?: boolean; pending?: boolean; signed: number; source?: 'signup' | 'coach' }
  const GUEST_GOALS_ADULT = ['A second serve I can trust', 'Stop being afraid of the net in doubles', 'More consistency from the back of the court', 'Play a full week of matches and enjoy it', 'A backhand that is not a liability']
  const GUEST_GOALS_JUNIOR = ['Rally with a friend', 'Learn to serve overarm', 'Play a real match', 'Hit the ball harder and still get it in', 'Win a game against my brother']
  const OUT_FLIGHTS = [{ airline: 'Crown Air', flight: 'CRN412', time: '11:05' }, { airline: 'Meridian Airways', flight: 'MRD2217', time: '13:40' }]
  const RET_FLIGHTS = [{ flight: 'CRN413', time: '14:55' }, { flight: 'MRD2218', time: '16:20' }]

  const attendeesFor = (camp: Row, start: Date, end: Date, places: Place[], opts: { adult: boolean; airport?: string; deposit?: number }): Row[] => {
    const asked = new Set(askedForm(camp).sections.flatMap(s => s.questions.map(q => q.id)))
    return places.map((pl, i) => {
      const p = pl.player ? seedOf[pl.player] : null
      const name = p ? p.name : (pl.guest as Guest).name
      const age = p ? p.age : (pl.guest as Guest).age
      const key = `${camp.id}:${name}`
      const contact = p ? parentContact[p.key] : (() => {
        const parent = (pl.guest as Guest).parent
        const who = parent || name
        const ecPhone = nextPhone()
        return { name: parent || null, email: emailOf(who), phone: nextPhone(), emergency: `${pick(`gec:${key}`, ['Alex', 'Robin', 'Jo', 'Lesley', 'Kim'])} ${name.split(' ').slice(-1)[0]} (${opts.adult ? 'partner' : 'grandparent'}) ${ecPhone}` }
      })()
      const medical = p ? (p.medical && !/^no known/i.test(p.medical) ? p.medical : null) : ((pl.guest as Guest).medical || null)
      const goal = pl.goal || (p ? cap(p.goal) : pick(`gg:${key}`, opts.adult ? GUEST_GOALS_ADULT : GUEST_GOALS_JUNIOR))
      const price = Number(camp.price) || 0
      const pennies = pl.pay === 'full' ? price * 100 : pl.pay === 'deposit' ? (opts.deposit || 0) * 100 : 0
      const out1 = OUT_FLIGHTS[hash(`of:${key}`) % OUT_FLIGHTS.length], ret1 = RET_FLIGHTS[hash(`of:${key}`) % RET_FLIGHTS.length]
      const overseas = !!camp.overseas
      const signedAt = ago(pl.signed, `${p2(8 + (hash(key) % 12))}:${p2(hash(`m:${key}`) % 60)}`)
      const submitted = pl.form ? ago(Math.max(0, pl.signed - between(`fs:${key}`, 1, 6)), '20:15') : null
      const ecMatch = contact.emergency.match(/^(.*?)\s*\((.*?)\)\s*(.*)$/)
      const dob = new Date(now.getFullYear() - age - 1, hash(`dob:${key}`) % 12, 1 + (hash(`dobd:${key}`) % 27))
      const all: Record<string, string> = {
        full_name: name, preferred_name: firstName(name), phone: contact.phone, dob: ymd(dob),
        address: `${between(`ad:${key}`, 2, 88)} ${pick(`st:${key}`, ['Maple Avenue', 'Oakwood Close', 'Birch Lane', 'Cedar Court', 'Elm Road', 'Willow Way', 'Hawthorn Drive', 'Rowan Gardens'])}, Riverside`,
        ec_name: ecMatch ? ecMatch[1] : contact.emergency, ec_relation: ecMatch ? cap(ecMatch[2]) : 'Family', ec_phone: ecMatch ? ecMatch[3] : contact.phone,
        pickup: contact.name ? `${contact.name} both ways. Not to leave on their own.` : '',
        out_airline: out1.airline, out_flight: out1.flight, out_airport: opts.airport || '', out_date: ymd(start), out_time: out1.time,
        ret_flight: ret1.flight, ret_date: ymd(end), ret_time: ret1.time, transfer: 'Both ways',
        room: pl.single ? 'Single room (supplement applies)' : 'Standard room, included', room_share: pl.single ? '' : (pl.room || ''),
        level: opts.adult ? pick(`lv:${key}`, ['Club team player — doubles mostly, twice a week', 'Improver. Lessons for two years and social doubles at weekends', 'Played as a junior, back at it for three years. Box league singles', 'Regular club player, strong baseline game, weak at the net'])
          : pick(`lv:${key}`, ['Lessons once a week for about a year', 'New to tennis — a few sessions at school', 'Plays in the Saturday group and with family', 'Two terms of group coaching at the club']),
        frequency: pick(`fq:${key}`, ['Once a week', 'Two or three times a week', 'Two or three times a week', 'Less than once a week']),
        format: pick(`fm:${key}`, ['Doubles', 'Both', 'Singles', 'Both']), handed: unit(`hd:${key}`) < 0.12 ? 'Left' : 'Right',
        injury: medical && /knee|ankle|shoulder|back/i.test(medical) ? medical : 'None', goal,
        shirt: opts.adult ? pick(`sh:${key}`, ['S', 'M', 'M', 'L', 'L', 'XL']) : age <= 6 ? 'Age 5–6' : age <= 8 ? 'Age 7–8' : age <= 10 ? 'Age 9–10' : age <= 12 ? 'Age 11–12' : age <= 14 ? 'Age 13–14' : 'Adult S',
        video: unit(`vd:${key}`) < 0.3 ? 'Sent' : '',
        dietary: pick(`dt:${key}`, ['None', 'None', 'None', 'Vegetarian', 'None', 'No shellfish']), medical: medical && !/knee|ankle|shoulder|back/i.test(medical) ? medical : 'None',
        insurance: unit(`in:${key}`) < 0.75 ? 'Yes' : 'Not yet, but I will before we travel', photo: p?.noPhoto ? 'No' : 'Yes',
        anything: unit(`an:${key}`) < 0.35 ? pick(`an2:${key}`, opts.adult ? ['Happy to share a taxi from the airport if the transfer is full.', 'Would love some singles as well as the doubles.', 'First tennis holiday — slightly nervous!'] : ['Can be shy on the first day — fine once she knows someone.', 'Best friend is also coming; same group if possible please.', 'Needs reminding to drink.']) : '',
      }
      const answers = pl.form ? Object.fromEntries(Object.entries(all).filter(([k, v]) => asked.has(k) && v !== '')) : null
      return row(T.attendee, {
        camp_id: camp.id, player_id: p ? playerId[p.key] : null, player_name: name,
        paid: pl.pay === 'full', amount_pennies: pennies, paid_pennies: pennies,
        // On an adult camp the contact details are the player's own.
        parent_name: opts.adult ? null : contact.name, parent_email: contact.email, parent_phone: contact.phone,
        player_age: opts.adult ? null : age, medical_notes: medical, emergency_contact: contact.emergency,
        consent_photo: !p?.noPhoto, consent_medical: true,
        status: pl.pending ? 'pending' : 'confirmed', stripe_session_id: null,
        source: pl.source || (p ? 'coach' : 'signup'), signed_up_at: signedAt,
        room: overseas ? (pl.single ? 'Single (supplement)' : pl.room ? `Twin · with ${pl.room}` : 'Twin · to be confirmed') : null,
        arrival: overseas && pl.form ? `${out1.flight} · ${shortDate(start)} · ${out1.time}` : null,
        camp_goal: goal,
        form_token: hex64(`form:${key}:${i}`), form_answers: answers, form_submitted_at: submitted,
        form_sent_at: ago(Math.max(0, pl.signed - 1), '09:05'),
      }, signedAt, submitted || signedAt)
    })
  }
  const g = (name: string, age: number, parent?: string, medical?: string): Guest => ({ name, age, parent, medical })

  const attA = attendeesFor(campA, aStart, aEnd, [
    { player: 'priya', pay: 'full', form: true, room: 'Ella Brooks', goal: 'Serve and first volley in doubles without rushing', signed: 54, source: 'coach' },
    { player: 'ella', pay: 'full', form: true, room: 'Priya Patel', goal: 'Hold my nerve in tie-breaks', signed: 53, source: 'coach' },
    { guest: g('Helen Marsden', 52), pay: 'full', form: true, room: 'Amara Singh', signed: 50 },
    { guest: g('Richard Hale', 58, undefined, 'Type 2 diabetes — well managed, carries glucose tablets'), pay: 'full', form: true, single: true, goal: 'Move forward behind a good deep ball', signed: 49 },
    { player: 'sam', pay: 'full', form: true, room: 'Dev Kapoor', goal: 'More pace and placement on the first serve', signed: 47, source: 'coach' },
    { guest: g('Joanna Whitcombe', 44), pay: 'full', form: true, room: 'Sue Lockwood', signed: 44 },
    { guest: g('Sue Lockwood', 47), pay: 'full', form: false, room: 'Joanna Whitcombe', signed: 44 },
    { guest: g('Paul Ferris', 61, undefined, 'Right knee replaced two years ago — fine on clay, no sprinting'), pay: 'full', form: true, single: true, signed: 41 },
    { player: 'amara', pay: 'deposit', form: true, room: 'Helen Marsden', goal: 'Return of serve — stop chipping everything short', signed: 38, source: 'coach' },
    { guest: g('Graham Tolley', 55), pay: 'full', form: true, room: 'Martin Ashby', signed: 35 },
    { guest: g('Martin Ashby', 57), pay: 'full', form: false, room: 'Graham Tolley', signed: 35 },
    { player: 'greta', pay: 'deposit', form: false, single: true, goal: 'Doubles positioning — know where to stand', signed: 30, source: 'coach' },
    { guest: g('Caroline Penn', 41), pay: 'deposit', form: true, room: 'Anita Rao', signed: 24 },
    { guest: g('Anita Rao', 39), pay: 'deposit', form: false, room: 'Caroline Penn', signed: 24 },
    { guest: g('Dev Kapoor', 33), pay: 'none', form: false, room: 'Sam Doyle', pending: true, signed: 3 },
  ], { adult: true, airport: 'Faro (FAO)', deposit: 300 })

  const attB = attendeesFor(campB, bStart, bEnd, [
    { player: 'mia', pay: 'full', form: true, signed: 58, goal: 'Serve from the baseline in every match' },
    { player: 'james', pay: 'full', form: true, signed: 57 },
    { player: 'noah', pay: 'full', form: true, signed: 55 },
    { guest: g('Oscar Bennett', 8, 'Rebecca Bennett'), pay: 'full', form: true, signed: 51 },
    { player: 'zara', pay: 'full', form: true, signed: 48 },
    { guest: g('Poppy Lang', 9, 'Fiona Lang', 'Asthma — blue inhaler in her bag'), pay: 'full', form: true, signed: 46 },
    { player: 'dylan', pay: 'full', form: false, signed: 43 },
    { player: 'ava', pay: 'none', form: true, signed: 40, goal: 'A ten-ball rally with a partner' },
    { guest: g('Arjun Mehta', 10, 'Priti Mehta'), pay: 'full', form: true, signed: 36 },
    { player: 'reuben', pay: 'full', form: false, signed: 33 },
    { player: 'isla', pay: 'full', form: true, signed: 31 },
    { guest: g('Elsie Crane', 7, 'Hannah Crane'), pay: 'none', form: false, signed: 22 },
    { player: 'hannah', pay: 'none', form: false, signed: 19, goal: 'Topspin shape in live points' },
    { guest: g('Finlay Ross', 11, 'Duncan Ross'), pay: 'full', form: true, signed: 14 },
    { player: 'max', pay: 'none', form: false, signed: 12 },
    { guest: g('Maisie Okoro', 9, 'Chidi Okoro'), pay: 'none', form: false, signed: 4 },
  ], { adult: false })

  const attC = attendeesFor(campC, cStart, cEnd, [
    { player: 'evie', pay: 'full', form: true, signed: 70 },
    { player: 'harry', pay: 'full', form: true, signed: 68 },
    { guest: g('Lola Finch', 6, 'Gemma Finch'), pay: 'full', form: true, signed: 61 },
    { player: 'freya', pay: 'full', form: true, signed: 60 },
    { guest: g('Henry Okoye', 7, 'Ngozi Okoye'), pay: 'full', form: true, signed: 52 },
    { player: 'theoday', pay: 'full', form: false, signed: 47 },
    { guest: g('Bea Sutherland', 6, 'Isobel Sutherland', 'Egg allergy — no shared snacks'), pay: 'full', form: true, signed: 40 },
    { player: 'ruby', pay: 'full', form: true, signed: 38 },
    { guest: g('Rafi Aziz', 8, 'Samira Aziz'), pay: 'full', form: false, signed: 30 },
    { guest: g('Orla Kenny', 7, 'Siobhan Kenny'), pay: 'none', form: true, signed: 21 },
    { player: 'isaac', pay: 'full', form: true, signed: 16, source: 'signup', goal: 'Hit ten forehands over the net in a row' },
    { guest: g('Jude Parrish', 5, 'Tom Parrish'), pay: 'none', form: false, signed: 13 },
  ], { adult: false })

  const dDaysAgo = Math.round((today.getTime() - dStart.getTime()) / DAY_MS)
  const attD = attendeesFor(campD, dStart, dEnd, CAMP_D_PLAYERS.map((pk, i) => ({
    player: pk, pay: 'full' as Pay, form: true, signed: dDaysAgo + 95 - i * 4,
    room: seedOf[CAMP_D_PLAYERS[i % 2 === 0 ? Math.min(i + 1, CAMP_D_PLAYERS.length - 1) : i - 1]].name,
  })), { adult: false, airport: 'Málaga (AGP)', deposit: 350 })
  out.coach_camp_attendees = [...attA, ...attB, ...attC, ...attD]
  const collectedFor = (camp: Row, list: Row[]) => list.reduce((n, a) => n + (a.paid ? Number(camp.price) : Number(a.amount_pennies) / 100), 0)
  campA.collected = collectedFor(campA, attA); campB.collected = collectedFor(campB, attB)
  campC.collected = collectedFor(campC, attC); campD.collected = collectedFor(campD, attD)

  // ── Camp emails: what the countdown has already sent ───────────────────────
  // Follows the rules in camp-lifecycle.ts — a stage is logged once its date
  // has come round, skipped for somebody who booked after it, and the chase
  // email only goes to people with something outstanding.
  const SUBJECTS: Record<string, (camp: string) => string> = {
    signup: c => `You’re in — ${c}`,
    details: c => `Everything you need for ${c}`,
    two_weeks: c => `Two weeks to go — a couple of things for ${c}`,
    one_week: c => `A week to go — ${c}`,
    tomorrow: c => `See you tomorrow — ${c}`,
    after: c => `How it went — ${c}`,
  }
  out.coach_camp_emails = []
  const logEmails = (camp: Row, start: Date, list: Row[]) => {
    const startUtc = Date.parse(`${ymd(start)}T00:00:00Z`)
    for (const a of list) {
      const signed = Date.parse(a.signed_up_at)
      for (const st of EMAIL_STAGES) {
        const subject = SUBJECTS[st.id]?.(camp.name) || camp.name
        const push = (status: string, when: number, error: string | null) => {
          const iso = new Date(Math.min(when, now.getTime() - 120_000)).toISOString()
          out.coach_camp_emails.push(row(T.email, { camp_id: camp.id, attendee_id: a.id, stage: st.id, status, error, subject, sent_at: iso }, iso, false))
        }
        if (st.offsetDays == null) { push('sent', signed + 90_000, null); continue }
        const due = startUtc + st.offsetDays * DAY_MS
        if (due > now.getTime()) continue
        if (a.status === 'pending' && ['one_week', 'tomorrow', 'after'].includes(st.id)) continue
        if (st.lateStill && signed >= startUtc) continue
        if (due < signed && !st.lateStill) {
          push('skipped', signed + 90_000, st.catchUp ? 'signed up late — folded into their confirmation' : 'signed up after this was due')
          continue
        }
        if (st.conditional && a.paid && a.form_submitted_at) { push('skipped', due + 8 * 3_600_000, 'nothing outstanding'); continue }
        push('sent', due + 8 * 3_600_000, null)
      }
    }
  }
  logEmails(campA, aStart, attA); logEmails(campB, bStart, attB); logEmails(campC, cStart, attC); logEmails(campD, dStart, attD)
  out.coach_camp_channels = []

  // ── Payments ───────────────────────────────────────────────────────────────
  // Packs and one-off invoices, per player. `used` is counted from their
  // lesson summaries — the same count the Payments page works out for itself.
  type Inv = { item: string; amount: number; total?: number; paid?: number; due?: number; renews?: number; status?: 'active' | 'expiring' | 'overdue'; notes?: string }
  const PRICE: Record<string, [number, number]> = {
    '10-lesson private pack': [360, 10], '5-lesson private pack': [185, 5], 'Performance monthly': [240, 12],
    'Adult 8-lesson block': [280, 8], 'Junior group — term': [150, 10], 'Cardio tennis — 6 pack': [60, 6],
  }
  const pack = (name: string, rest: Partial<Inv>): Inv => ({ item: name, amount: PRICE[name][0], total: PRICE[name][1], ...rest })
  const INVOICES: Record<string, Inv[]> = {
    mia: [pack('5-lesson private pack', { paid: 24, renews: 6, status: 'expiring' }), pack('Junior group — term', { paid: 41, renews: 29 })],
    tom: [pack('10-lesson private pack', { paid: 30, renews: 9, status: 'expiring' })],
    ava: [pack('Junior group — term', { paid: 38, renews: 32 }), pack('5-lesson private pack', { paid: 26, renews: 9, status: 'expiring' }), { item: `Camp place — ${campBName}`, amount: 220, due: 5, notes: 'Mum has asked to pay at the end of the month.' }],
    leo: [pack('Performance monthly', { paid: 12, renews: 18 }), { item: 'Restring ×2 — 17-gauge poly', amount: 44, paid: 20 }, { item: 'County closed tournament entry', amount: 35, due: 4 }],
    hannah: [pack('5-lesson private pack', { due: -12, status: 'overdue', notes: 'Invoice sent twice. Mark has said he will settle at the next lesson.' }), pack('Junior group — term', { due: 3, renews: 34 }), { item: 'Racket restring', amount: 22, due: -5, status: 'overdue' }],
    daniel: [pack('Performance monthly', { paid: 9, renews: 21 }), { item: 'Restring — match racket', amount: 24, due: 2 }],
    priya: [pack('Adult 8-lesson block', { paid: 29, renews: 27 })],
    james: [pack('5-lesson private pack', { paid: 18, renews: 17 }), pack('Junior group — term', { paid: 40, renews: 30 })],
    sophie: [pack('Performance monthly', { paid: 14, renews: 16 })],
    oliver: [pack('10-lesson private pack', { due: 6, renews: 40, notes: 'New pack — invoice sent last week.' })],
    lily: [pack('Performance monthly', { paid: 6, renews: 24 })],
    greg: [pack('Adult 8-lesson block', { due: -20, status: 'overdue', notes: 'Stopped coming three weeks ago with two lessons unpaid — Marcus to call.' })],
    noah: [pack('5-lesson private pack', { paid: 21, renews: 12, status: 'expiring' }), pack('Junior group — term', { paid: 39, renews: 31 })],
    maya: [pack('Performance monthly', { paid: 17, renews: 13, status: 'expiring' })],
    reuben: [pack('5-lesson private pack', { paid: 15, renews: 20 })],
    isla: [pack('5-lesson private pack', { paid: 27, renews: 8, status: 'expiring' })],
    greta: [pack('Adult 8-lesson block', { paid: 33, renews: 23 })],
    kai: [pack('Performance monthly', { due: -3, status: 'overdue', notes: 'Direct debit bounced — Joanne is sorting a new mandate.' })],
    zara: [pack('5-lesson private pack', { paid: 19, renews: 16 }), pack('Junior group — term', { paid: 42, renews: 28 })],
    toby: [pack('Performance monthly', { paid: 11, renews: 19 })],
    lucas: [pack('Performance monthly', { paid: 8, renews: 22 })],
    nina: [pack('10-lesson private pack', { paid: 31, renews: 39 })],
    max: [pack('5-lesson private pack', { paid: 44, status: 'expiring', notes: 'All five used. Waiting to hear whether he is carrying on.' })],
    harry: [pack('5-lesson private pack', { paid: 23, renews: 13, status: 'expiring' })],
    amelia: [pack('10-lesson private pack', { paid: 36, renews: 34 })],
    owen: [pack('Cardio tennis — 6 pack', { due: -27, status: 'overdue', notes: 'Has not been in for a month.' })],
    dylan: [pack('Junior group — term', { paid: 37, renews: 33 }), pack('5-lesson private pack', { paid: 16, renews: 19 })],
    freya: [pack('5-lesson private pack', { paid: 10, renews: 25 })],
    ruby: [pack('5-lesson private pack', { paid: 20, renews: 15 })],
  }
  out.coach_payments = Object.entries(INVOICES).flatMap(([pk, list]) => list.map((inv, i) => {
    const p = seedOf[pk]
    const isPaid = inv.paid !== undefined
    const issued = isPaid ? ago((inv.paid as number) + 3, '09:15') : ago(Math.max(1, 14 - (inv.due ?? 0)), '09:15')
    return row(T.payment, {
      player_id: playerId[pk], player_name: p.name, item: inv.item, amount: inv.amount,
      paid: isPaid, paid_at: isPaid ? ago(inv.paid as number, `${p2(9 + i * 3)}:20`) : null,
      status: inv.status || 'active',
      sessions_used: inv.total ? Math.min(inv.total, sessionCount[p.name] || 0) : 0, sessions_total: inv.total ?? null,
      renews_date: inv.renews !== undefined ? ymd(plus(today, inv.renews)) : null,
      due_date: inv.due !== undefined ? ymd(plus(today, inv.due)) : null,
      notes: inv.notes || null,
    }, issued, isPaid ? ago(inv.paid as number, `${p2(9 + i * 3)}:20`) : issued)
  }))

  // ── Messages ───────────────────────────────────────────────────────────────
  // A conversation is every row sharing a `recipients` name; inbound rows carry
  // direction 'in'. Times are "that many days ago at that time of day", and a
  // whole thread slides back a day if its last message would be in the future.
  type Msg = { d: number; t: string; dir: 'in' | 'out'; body: string; subject?: string; unread?: boolean; from?: string; reaction?: string; channels?: string }
  out.coach_messages = []
  const thread = (who: string, msgs: Msg[], extra: Row = {}) => {
    const latest = Math.max(...msgs.map(m => at(plus(today, -m.d), m.t).getTime()))
    const shift = latest > now.getTime() - 120_000 ? 1 : 0
    msgs.forEach((m, i) => {
      const when = at(plus(today, -m.d - shift), m.t).toISOString()
      out.coach_messages.push(row(T.message, {
        recipients: who, thread_key: extra.thread_key || who, to_name: m.dir === 'out' ? who : null,
        direction: m.dir, from_name: m.dir === 'in' ? (m.from || who) : null,
        channels: m.channels || (m.dir === 'in' ? 'email' : 'inapp, email'), subject: m.subject || null, body: m.body,
        status: m.dir === 'in' ? 'received' : 'sent', results: null,
        read: m.dir === 'out' ? true : !m.unread, dismissed: false, reaction: m.reaction || null,
        external_id: m.dir === 'in' ? `demo-${hash(`${who}:${i}`).toString(16)}` : null,
        reply_to: null, camp_id: extra.camp_id || null, discord_channel_id: null, discord_channel_name: null,
      }, when))
    })
  }
  thread('Grace Okafor', [
    { d: 0, t: '07:46', dir: 'in', unread: true, body: 'Morning Vincent — Tom came home buzzing after the serve session, hasn’t stopped talking about the toss drill.' },
    { d: 0, t: '07:48', dir: 'in', unread: true, body: 'He’s asking if we can add a regular Saturday slot on top of his two in the week. Mornings work best for us — what have you got free?' },
  ])
  thread('Mark Berg', [
    { d: 1, t: '18:12', dir: 'in', body: 'Hi Vincent, really sorry we missed again — Hannah’s been under the weather and we’ve had a few clashes with school. I know it’s the second one this month.' },
    { d: 1, t: '19:05', dir: 'out', body: 'No problem at all Mark — hope Hannah feels better soon. She’s not far behind; a couple of sessions will sort it. I’ve pencilled her in for this week’s lesson — just confirm when you can.' },
    { d: 0, t: '07:18', dir: 'in', unread: true, body: 'Thanks Vincent. She’s keen to keep going and we’ll definitely be there this week.' },
    { d: 0, t: '07:20', dir: 'in', unread: true, body: 'Is there anything she should be practising at home to catch back up? And I’ll settle the invoice when I see you — apologies for the delay.' },
  ])
  thread('Riverside Tennis Centre', [
    { d: 1, t: '16:31', dir: 'in', unread: true, from: 'Karen Blythe', subject: 'Court 3 — two bookings in one slot', body: 'Hi Vincent — flagging a clash: Court 3 is showing both your Thursday match-play session and a members’ booking in the same early-evening slot. Our system let both through by mistake.' },
    { d: 1, t: '16:32', dir: 'in', unread: true, from: 'Karen Blythe', body: 'Can you confirm whether you want to keep Court 3 or move to Court 6, which I can free up from 17:15? Whoever confirms first keeps the court.' },
  ])
  thread('Daniel Cruz', [
    { d: 1, t: '15:02', dir: 'in', body: 'All confirmed for match play this week 👍' },
    { d: 1, t: '15:03', dir: 'in', body: 'Are we doing full sets or the serve+1 pattern games again? Want to know whether to bring the heavier racket.' },
    { d: 1, t: '15:40', dir: 'out', reaction: '👍', body: 'Full sets — best of three, and I’ll chart your first-serve percentage when you’re serving for a set. Bring both rackets.' },
  ])
  thread('Lily Chen', [
    { d: 2, t: '18:40', dir: 'in', body: 'Hi Vincent — Mia is SO excited about the racket assessment, she’s been practising her serve in the garden all week.' },
    { d: 2, t: '18:41', dir: 'in', body: 'Is there anything specific you’ll be looking for so she knows what to expect? And do parents get to watch?' },
    { d: 2, t: '20:10', dir: 'out', reaction: '❤️', body: 'She’s earned it. I’ll be looking at the four Orange skills — both volleys, the slice and where she stands at the net — all things she’s been doing well for weeks. Parents very welcome. We’ll do it in the last fifteen minutes of her next lesson.' },
  ])
  thread('Leo Whitfield', [
    { d: 2, t: '12:30', dir: 'in', body: 'Hi Vincent, gutted but I’ve got a clash — county trials got moved to the same evening as my match-play session next week.' },
    { d: 2, t: '12:31', dir: 'in', body: 'Really don’t want to lose the session before the tournament. Any chance we can move it? Happy to take whatever’s going.' },
    { d: 2, t: '13:15', dir: 'out', body: 'Good luck at trials — that takes priority. Keep your Friday as normal and I’ll find you an extra hour at the weekend. I’ll send a booking link tonight.' },
  ])
  thread('Sofia Romero', [
    { d: 3, t: '09:15', dir: 'in', subject: 'Term invoice', body: 'Hi Vincent — quick one on the term invoice for Ava’s group sessions. I think we’ve been charged for ten weeks but the term’s only nine with the bank holiday closure.' },
    { d: 3, t: '09:16', dir: 'in', body: 'Could you take a look when you get a chance? No rush. And is it all right to pay for the holiday camp at the end of the month?' },
    { d: 3, t: '12:40', dir: 'out', body: 'You’re quite right, Sofia — nine weeks. I’ve carried the tenth session over as a credit against next term. End of the month is absolutely fine for the camp; Ava’s place is held.' },
    { d: 3, t: '12:52', dir: 'in', reaction: '✅', body: 'Perfect, thank you!' },
  ])
  thread('Rachel Adeyemi', [
    { d: 4, t: '08:50', dir: 'in', channels: 'inapp', body: 'Morning — rooming list for the Algarve is nearly there. Two things: Greta has asked for a single, and Dev Kapoor has signed up but not paid a deposit yet. Do you want me to chase or will you?' },
    { d: 4, t: '09:30', dir: 'out', channels: 'inapp', body: 'Thanks Rachel. Give Greta the single and add the supplement to her balance. I’ll message Dev today — he’s a friend of Sam’s, so I’d like him on the trip if he’s serious.' },
    { d: 4, t: '09:34', dir: 'in', channels: 'inapp', reaction: '👍', body: 'Will do. Transfers are booked for both flights.' },
  ])
  thread('Priya Patel', [
    { d: 5, t: '19:10', dir: 'in', body: 'Anyone from the adult group fancy an extra social hit this Sunday? Vincent — would you be up for running a quick doubles hour if enough of us are in?' },
    { d: 5, t: '20:02', dir: 'out', body: 'Jamie runs Sunday Social Doubles at eleven — come along to that, there’s room for four more. I’ll tell him to expect you.' },
  ])
  // The holiday-camp announcement: one row per family, as the send route writes it.
  for (const who of ['Lily Chen', 'Sofia Romero', 'Anna Whitlock', 'Mark Berg', 'Hannah Pike', 'Farah Iqbal']) {
    thread(who, [{ d: 16, t: '17:30', dir: 'out', subject: `${campBName} — places open`, body: `Places are now open for the ${campBName} at Riverside: five days, 9am to 3pm, ages 6 to 14, £220. Red, orange and green-ball groups, with a tournament on the last afternoon. Reply here or use the sign-up link and I’ll hold a place.` }])
  }
  // The trip's own conversation.
  const campThread = { thread_key: `camp:${campA.id}`, camp_id: campA.id }
  thread(`Camp · ${campA.name}`, [
    { d: 9, t: '18:00', dir: 'out', subject: 'Flights and transfers', body: 'Hello everyone — not long now. If you haven’t yet, please fill in the player information form: I need flight numbers to book you onto a transfer. Most of the group is on the mid-morning flight into Faro.' },
    { d: 9, t: '18:42', dir: 'in', from: 'Helen Marsden', channels: 'inapp', body: 'Done! Amara and I are on the same flight — can we be on the same transfer?' },
    { d: 8, t: '08:15', dir: 'in', from: 'Paul Ferris', channels: 'inapp', body: 'Form filled in. A note on my knee is in there — fine on clay, I just won’t be chasing drop shots.' },
    { d: 8, t: '09:00', dir: 'out', reaction: '👍', body: 'Helen — yes, you’re both on the first transfer. Paul — noted, and we’ll keep you off the sprint drills. The clay will be kind to it.' },
    { d: 2, t: '17:20', dir: 'in', from: 'Sam Doyle', channels: 'inapp', unread: true, body: 'Is there a restringer at the resort or should I bring a spare set of strings?' },
  ], campThread)

  // ── Equipment and kit lists ────────────────────────────────────────────────
  const INVENTORY: [string, [string, number, string, string][]][] = [
    ['Balls & baskets', [
      ['Yellow balls (dozens)', 24, 'in_stock', 'Main coaching bag'], ['Green transition balls (dozens)', 2, 'low', 'Main coaching bag · down to the last two tubes'],
      ['Orange balls (dozens)', 5, 'in_stock', 'Junior bag'], ['Red and foam balls (dozens)', 4, 'in_stock', 'Junior bag'],
      ['Ball baskets', 6, 'in_stock', 'Club store'], ['Ball pick-up tubes', 2, 'repair', 'Car boot · one spring gone'],
    ]],
    ['Coaching aids', [
      ['Target cones', 40, 'in_stock', 'Main coaching bag'], ['Throw-down lines (sets)', 4, 'in_stock', 'Main coaching bag'],
      ['Agility ladders', 3, 'in_stock', 'Club store'], ['Spin and brush trainers', 2, 'in_stock', 'Main coaching bag'],
      ['Hand targets and hoops', 6, 'low', 'Junior bag · two split'], ['Rebound net', 1, 'in_stock', 'Club store'],
    ]],
    ['Court equipment', [
      ['Portable mini nets', 4, 'order', 'Club store · two damaged, replacements on order'], ['Singles sticks (pairs)', 2, 'in_stock', 'Court shed'],
      ['Net measure', 1, 'in_stock', 'Main coaching bag'], ['Portable scoreboards', 2, 'in_stock', 'Club store'], ['Line tape (rolls)', 1, 'low', 'Club store'],
    ]],
    ['Ball machine & tech', [
      ['Ball machine', 1, 'in_stock', 'Club store'], ['Machine remote', 1, 'in_stock', 'Club store'],
      ['Spare batteries', 2, 'low', 'Main coaching bag · recharge before the weekend'], ['Camera and tripod', 2, 'in_stock', 'Office'], ['Coaching tablets', 3, 'in_stock', 'Office'],
    ]],
    ['Medical & welfare', [
      ['First aid kits', 2, 'in_stock', 'Main coaching bag · check plasters'], ['Ice packs', 6, 'in_stock', 'Cool box'],
      ['Sun cream SPF50', 1, 'order', 'Main coaching bag'], ['Electrolyte sachets', 20, 'low', 'Main coaching bag'], ['Spare water bottles', 6, 'in_stock', 'Club store'],
    ]],
    ['Player merchandise & spares', [
      ['Overgrips', 30, 'in_stock', 'Main coaching bag'], ['Vibration dampeners', 20, 'in_stock', 'Main coaching bag'],
      ['Reward stickers (packs)', 2, 'low', 'Junior bag'], ['Club wristbands', 15, 'in_stock', 'Junior bag'], ['Loan rackets — junior', 12, 'in_stock', 'Club store'],
    ]],
    ['Admin', [
      ['Coaching whiteboards', 2, 'in_stock', 'Main coaching bag · pens drying out'], ['Registers and clipboards', 4, 'in_stock', 'Office'],
      ['Score sheets', 100, 'in_stock', 'Office'], ['Bibs', 20, 'in_stock', 'Club store'],
    ]],
    ['Stringing', [
      ['String reels', 1, 'low', 'Office · down to one full reel'], ['Grommet kits', 2, 'in_stock', 'Office'], ['Stencil and marker', 1, 'in_stock', 'Office'],
    ]],
  ]
  let eq = 0
  out.coach_equipment = INVENTORY.flatMap(([category, items]) => items.map(([item, quantity, status, notes]) => row(T.equipment, {
    item, category, quantity, status, notes, staff_id: null,
  }, ago(400, `08:${p2(59 - (eq++ % 60))}`), ago(between(`eq:${item}`, 1, 40), '18:30'))))
  const SESSION_KITS: [string, string[]][] = [
    ['Private lesson', ['Ball basket (60+)', 'Cones ×8', 'Throw-down lines', 'Target hoops', 'Whiteboard and pen', 'Water']],
    ['Group / squad', ['2 ball baskets', 'Cones ×20', 'Throw-down lines ×4', 'Bibs ×12', 'First aid kit', 'Spare balls (2 dozen)']],
    ['Cardio Tennis', ['Ball machine or 2 baskets', 'Cones ×16', 'Agility ladders', 'Music speaker', 'Water station']],
    ['Match play', ['New pressurised balls', 'Scoreboard', 'Net measure', 'Singles sticks', 'Scorecards']],
    ['Mini / red ball', ['Red and orange balls', 'Mini nets ×4', 'Targets and hoops', 'Reward stickers', 'Foam balls']],
  ]
  let kn = 0
  out.coach_kit_items = SESSION_KITS.flatMap(([session_type, labels]) => labels.map((label, i) => row(T.kit, {
    session_type, label, sort_order: i, staff_id: null,
  }, ago(400, `07:${p2(59 - (kn++ % 60))}`))))

  // ── Resources ──────────────────────────────────────────────────────────────
  // The coach's own first, then the Lumio starter library exactly as a live
  // academy gets it when it preloads.
  const OWN_RESOURCES: Row[] = [
    { title: 'Riverside squad warm-up — ten minutes', category: 'Drill', format: 'PDF', level: 'All levels', duration: '10 min', racket: null, tags: 'warm-up, squads', notes: 'The warm-up every squad session starts with. Printed and pinned in the court shed.', file: 'squad-warm-up.pdf' },
    { title: 'Match-day checklist for juniors', category: 'Guides', format: 'PDF', level: 'Intermediate', duration: null, racket: 'green', tags: 'tournaments, parents', notes: 'What to pack, when to arrive and how to warm up. Written for first-time tournament families.', file: 'match-day-checklist.pdf' },
    { title: 'Term dates and squad timetable', category: 'Guides', format: 'PDF', level: 'All levels', duration: null, racket: null, tags: 'parents, admin', notes: 'This term’s dates, squad times and the closure days.', file: 'term-dates-and-timetable.pdf' },
    { title: 'Serve progression — from throw to kick', category: 'Technique', format: 'Plan', level: 'Intermediate', duration: '6 weeks', racket: 'green', tags: 'serve, progression', notes: 'My own six-step serve pathway. Players stall when the toss is taught last — this teaches it first.', file: 'serve-progression.pdf' },
  ]
  out.coach_resources = [
    ...OWN_RESOURCES.map(({ file, ...r }, i) => row(T.resource, {
      ...r, type: null, url: `file:${COACH}/resources/${hash(String(file)).toString(16).padStart(8, '0')}-${file}`,
    }, ago(20 + i * 30, '21:00'))),
    ...LUMIO_RESOURCES.map((r, i) => row(T.resource, { type: null, ...r }, new Date(at(plus(today, -420), '09:00').getTime() - i * 1000).toISOString())),
  ]
  // Reading handed to players from the bookshelf.
  const SHELF: [string, string, string | null][] = [
    ['b1', 'daniel', 'For the between-points routine we have been working on — chapter three especially.'],
    ['b2', 'leo', 'Read the chapters on scouting before the county closed.'],
    ['b4', 'hannah', 'One for Mum and Dad as much as for Hannah.'],
    ['b7', 'tom', null],
    ['b1', 'priya', 'You asked what to read on the plane to Portugal — this.'],
    ['b6', 'nina', 'The routines chapter is the one.'],
  ]
  out.coach_player_resources = SHELF.map(([bookId, pk, note], i) => {
    const book = BOOKS.find(b => b.id === bookId) || BOOKS[0]
    return row(T.playerResource, { player_id: playerId[pk], kind: 'book', ref_id: book.id, title: book.title, author: book.author, note: note || book.why }, ago(4 + i * 6, '19:45'), false)
  })

  // ── Video & audio ──────────────────────────────────────────────────────────
  // Recordings hang off real lessons. A reviewed recording carries the same
  // structured review as the lesson summary it produced.
  out.coach_media = []
  const lessonsOf = (pk: string) => occs.filter(o => o.slot.player === pk && sessionOf.has(o.key)).reverse()
  const record = (pk: string, nth: number, kind: 'video' | 'audio', title: string, secs: number, reviewed: boolean, clips: [string, number, number, boolean][] = []) => {
    const o = lessonsOf(pk)[nth]
    if (!o) return
    const sess = sessionOf.get(o.key) as Row
    const p = seedOf[pk]
    const when = stamp(at(o.date, addMins(o.slot.time, o.slot.mins)))
    const ext = kind === 'video' ? 'mp4' : 'm4a'
    const parent = row(T.media, {
      lesson_id: reviewed ? sess.id : null, player_id: playerId[pk], player_name: p.name, kind, title,
      storage_path: `${COACH}/demo/${slug(`${p.name}-${o.dateStr}-${title}`)}.${ext}`, mime_type: kind === 'video' ? 'video/mp4' : 'audio/mp4',
      duration_seconds: secs, size_bytes: Math.round(secs * (kind === 'video' ? 610_000 : 16_000)),
      status: 'done', error: null,
      transcript: reviewed ? `Right ${firstName(p.name)}, today is all about ${String(sess.focus).charAt(0).toLowerCase() + String(sess.focus).slice(1)}. … Good — that’s it. ${cap(String(sess.review_json.takeaways[0]))}. … Before next time: ${sess.review_json.homework}` : null,
      review: reviewed ? sess.review_json : null,
      clip_of: null, shot_type: null, clip_start: null, clip_end: null, shot_confirmed: false,
    }, when)
    out.coach_media.push(parent)
    if (reviewed) Object.assign(sess, { ai_review: [`Focus: ${sess.focus}`, '', 'What we covered:', ...sess.review_json.covered.map((c: string) => `• ${c}`), '', 'Key takeaways:', ...sess.review_json.takeaways.map((c: string) => `• ${c}`), '', `Homework: ${sess.review_json.homework}`].join('\n') })
    clips.forEach(([shot, from, to, confirmed], i) => out.coach_media.push(row(T.media, {
      lesson_id: null, player_id: playerId[pk], player_name: p.name, kind: 'video', title: `${cap(shot)} · highlight`,
      storage_path: `${COACH}/demo/${slug(`${p.name}-${o.dateStr}-${shot}-${i + 1}`)}.mp4`, mime_type: 'video/mp4',
      duration_seconds: to - from, size_bytes: Math.round((to - from) * 610_000), status: 'done', error: null, transcript: null, review: null,
      clip_of: parent.id, shot_type: shot, clip_start: from, clip_end: to, shot_confirmed: confirmed,
    }, new Date(Date.parse(when) + (i + 1) * 1000).toISOString())))
  }
  record('tom', 0, 'video', 'Second serve block — Court 2', 1260, true, [['serve', 184, 196, true], ['serve', 512, 523, true], ['forehand', 870, 879, false]])
  record('mia', 0, 'video', 'First serves from the baseline', 840, true, [['serve', 96, 105, true], ['volley', 610, 618, false]])
  record('daniel', 0, 'video', 'Match play — first set', 1980, false)
  record('leo', 0, 'video', 'Inside-out forehand and approach', 1140, true, [['forehand', 232, 241, true], ['volley', 655, 662, true], ['smash', 930, 936, false]])
  record('ava', 0, 'video', 'Cross-court rally — best of the day', 95, false)
  record('tom', 1, 'audio', 'On-court session audio', 3480, true)
  record('mia', 1, 'audio', 'On-court session audio', 2640, true)
  record('daniel', 1, 'audio', 'Match-play audio — between points', 3540, true)
  record('priya', 0, 'audio', 'Voice note after the lesson', 150, true)
  record('hannah', 0, 'audio', 'On-court session audio', 3300, true)

  // ── Consent forms waiting to be applied ────────────────────────────────────
  out.coach_consent_submissions = [
    row(T.consent, { child_name: 'Elsie Crane', child_age: 7, parent_name: 'Hannah Crane', parent_email: 'hannah.crane@example.com', consent_data: true, consent_photo: true, consent_medical: true, medical_notes: null, status: 'pending', submitted_at: ago(2, '20:40') }, ago(2, '20:40')),
    row(T.consent, { child_name: 'Arjun Mehta', child_age: 10, parent_name: 'Priti Mehta', parent_email: 'priti.mehta@example.com', consent_data: true, consent_photo: false, consent_medical: true, medical_notes: 'Hay fever in summer — takes an antihistamine before sessions.', status: 'pending', submitted_at: ago(1, '08:10') }, ago(1, '08:10')),
  ]

  // ── The academy itself ─────────────────────────────────────────────────────
  out.sports_profiles = [{
    id: COACH, coach_id: COACH, sport: 'coach',
    display_name: 'Vincent Jones', nickname: 'Vincent', brand_name: 'Lumio Tennis Club', club_name: 'Lumio Tennis Club',
    brand_logo_url: '/tennis_coach_logo.png', avatar_url: '/James_Wright.jpg',
    portal_slug: 'demo', slug_confirmed: true, location: 'Riverside',
    contact_email: 'vincent@lumiotennisclub.example', contact_phone: '07700 900123',
    calendar_provider: 'google', dpa_accepted_at: ago(1100, '10:30'),
    head_coach_dbs_number: out.coach_staff[0].dbs_number, head_coach_dbs_expiry: out.coach_staff[0].dbs_expiry,
    head_coach_safeguarding_date: out.coach_staff[0].safeguarding_date,
    onboarding_complete: true, setup_complete: true, setup_type: 'academy', enabled_features: [], invites: [],
    plan: 'founding', status: 'active', admin_notes: null,
    created_at: ago(1100, '10:00'), updated_at: nowIso,
  }]

  // Nothing to show in these on the demo: no Stripe account, no card charges,
  // no portal memberships, and settings live in the browser (settings-store).
  out.coach_stripe = []
  out.coach_charges = []
  out.coach_members = []
  out.coach_settings = []

  return out
}
