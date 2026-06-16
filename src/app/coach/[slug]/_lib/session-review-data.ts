// Demo-only canned "AI Session Review" content. There is NO real transcription
// or AI here — every review below is hand-authored to match the plan content of
// the corresponding session in TODAY_SESSIONS (coach-data.ts). Keyed by the exact
// session ids (ts1…ts6). Feeds the SessionReviewPanel report and the
// "Create next plan" draft that lands in the session-plan store.

import type { PlanPhase } from './session-plan'

export type FocusStatus = 'covered' | 'partial' | 'missed'
export type Airtime = 'full' | 'light' | 'none'

export type DemoReview = {
  // Short coach-speech snippets the "transcription" surfaced, with mm:ss stamps.
  transcriptExcerpts: { at: string; text: string }[]
  // One row per session focus point, numbered to match the planner's list.
  focusPointResults: { point: string; status: FocusStatus; evidence: string | null; note: string }[]
  drillResults: { drill: string; ran: boolean; note: string }[]
  runSheetCoverage: { phase: string; plannedMins: number; airtime: Airtime }[]
  coachingNotes: { cuesUsed: string[]; positiveToCorrectiveRatio: string; homeworkSet: boolean; summary: string }
  // Pre-drafted "next session" the coach can save straight to Saved Plans.
  nextPlanDraft: { focus: string; workOn: string[]; drills: string[]; plan: PlanPhase[] }
}

// Fake processing pipeline — the panel steps through these with timed delays.
export const REVIEW_STAGES: { label: string; ms: number }[] = [
  { label: 'Transcribing session audio…', ms: 1800 },
  { label: 'Comparing against session plan…', ms: 2200 },
  { label: 'Drafting next session…', ms: 1200 },
]

export const DEMO_REVIEWS: Record<string, DemoReview> = {
  // ── ts1 · Mia Chen · Private 45m · First serve fundamentals ──────────────────
  // Strong session: everything covered, one drill skipped for time, homework set.
  ts1: {
    transcriptExcerpts: [
      { at: '01:12', text: 'Lovely — up to the trophy, nice and relaxed, let the toss drop onto the spot.' },
      { at: '06:48', text: 'Keep that continental grip, even when you want to hit it hard. Hammer grip, remember?' },
      { at: '14:20', text: 'That is six out of ten in the box now — last week you were on two. Brilliant.' },
      { at: '21:05', text: 'Reach up to the ball, don’t pull down on it. Stretch tall.' },
      { at: '33:40', text: 'We’ll skip the serve-and-rally game today, we’re tight for time — let’s lock the toss in instead.' },
      { at: '41:30', text: 'Homework: twenty tosses a day against the wall mark, continental grip the whole time.' },
    ],
    focusPointResults: [
      { point: 'Trophy position and a relaxed toss', status: 'covered',
        evidence: '01:12 · "Up to the trophy, nice and relaxed, let the toss drop onto the spot."',
        note: 'Held the trophy shape consistently from the service line and the baseline.' },
      { point: 'Hold the continental grip through the serve', status: 'covered',
        evidence: '06:48 · "Keep that continental grip, even when you want to hit it hard."',
        note: 'Only slipped once when she tried to add pace — corrected immediately.' },
      { point: 'First serves into the box from the baseline', status: 'covered',
        evidence: '14:20 · "That is six out of ten in the box now."',
        note: 'Up from 2/10 last week — close to the Green-racket serve criteria.' },
    ],
    drillResults: [
      { drill: 'Toss-and-catch (10 reps)', ran: true, note: 'Consistent landing spot by the second set of reps.' },
      { drill: 'Down-the-ladder serve from service line', ran: true, note: 'Progressed back to the baseline cleanly.' },
      { drill: 'Serve & rally to 5', ran: false, note: 'Skipped for time to protect the toss work.' },
    ],
    runSheetCoverage: [
      { phase: 'Warm-up & movement', plannedMins: 7, airtime: 'full' },
      { phase: 'Technical block', plannedMins: 14, airtime: 'full' },
      { phase: 'Constraint drill', plannedMins: 11, airtime: 'light' },
      { phase: 'Live points', plannedMins: 9, airtime: 'full' },
      { phase: 'Review & homework', plannedMins: 4, airtime: 'full' },
    ],
    coachingNotes: {
      cuesUsed: ['Up to the trophy', 'Let the toss drop onto the spot', 'Reach up, don’t pull down', 'Hammer grip'],
      positiveToCorrectiveRatio: '8 : 2 positive to corrective',
      homeworkSet: true,
      summary: 'A really clean session. Every focus point landed, the box rate jumped, and the only thing dropped was the serve-and-rally game — a sensible trade to bank the toss consistency. Homework set and clear.',
    },
    nextPlanDraft: {
      focus: 'First serve placement — wide vs T',
      workOn: [
        'Keep the box rate steady at 7/10 from the baseline',
        'Add a wide and a T target with the same toss',
        'Run the serve-and-rally game we skipped last time',
      ],
      drills: ['Same-toss target serves (wide / T)', 'Serve & rally to 5', 'Toss-and-catch warm-up (10 reps)'],
      plan: [
        { phase: 'Warm-up & movement', detail: 'Dynamic prep, mini-tennis, ten toss-and-catch reps to groove the spot.', mins: 7 },
        { phase: 'Technical block', detail: 'Same toss, two targets — wide then T. One cue: aim small after a relaxed toss.', mins: 14 },
        { phase: 'Constraint drill', detail: 'Call the target before each serve; 5/10 into the named zone before progressing.', mins: 11 },
        { phase: 'Live points', detail: 'Serve & rally to 5 — the game we ran out of time for last week.', mins: 9 },
        { phase: 'Review & homework', detail: 'Two-minute review, celebrate the box-rate jump, set the toss homework.', mins: 4 },
      ],
    },
  },

  // ── ts2 · Tom Okafor · Private 60m · Second serve into serve+1 patterns ──────
  // FLAGSHIP MIXED RESULT: point 1 covered, point 2 partial (constraint drill
  // never run), point 3 missed.
  ts2: {
    transcriptExcerpts: [
      { at: '02:30', text: 'Spin first, not pace — high over the net and let it kick down into the box.' },
      { at: '08:15', text: 'That is the one. Clearing the net by a metre, landing in. Much safer second ball.' },
      { at: '19:40', text: 'When you rush, the toss drifts forward and it flattens out. Keep it over your head.' },
      { at: '24:55', text: 'Okay we are running behind — let’s stay on the serve itself rather than the serve-plus-one drill.' },
      { at: '38:10', text: 'Good kick there, but you stood and admired it — there is no first forehand after it yet.' },
      { at: '52:20', text: 'We didn’t get to the plus-one pattern today, we’ll make that the headline next time.' },
    ],
    focusPointResults: [
      { point: 'Reliable kick second serve under no pressure', status: 'covered',
        evidence: '08:15 · "Clearing the net by a metre, landing in. Much safer second ball."',
        note: 'The spin serve itself is in good shape — high margin, lands 7/10 from a settled stance.' },
      { point: 'Link the second serve into a serve+1 forehand', status: 'partial',
        evidence: '38:10 · "Good kick there, but you stood and admired it — there is no first forehand after it yet."',
        note: 'Touched on in live points only. The serve+1 constraint drill that builds this pattern was never run (cut for time).' },
      { point: 'Hold the higher toss when the score gets tight', status: 'missed',
        evidence: null,
        note: 'Never tested under pressure — we stayed on technique and ran out of time before competitive points. The toss-drift-when-rushed issue is unaddressed.' },
    ],
    drillResults: [
      { drill: 'Spin-only serve ladder (10 in a row)', ran: true, note: 'Strong — exaggerated the kick, hit the streak twice.' },
      { drill: 'Serve+1 forehand to the open court', ran: false, note: 'Constraint drill never run — the session over-ran on the serve itself.' },
      { drill: 'Second-serve-only points to 11', ran: true, note: 'Only one short game; not enough pressure reps to test the toss.' },
      { drill: 'Target cones — ad-court backhand', ran: true, note: 'Placement good when unhurried.' },
    ],
    runSheetCoverage: [
      { phase: 'Warm-up & movement', plannedMins: 9, airtime: 'full' },
      { phase: 'Technical block', plannedMins: 18, airtime: 'full' },
      { phase: 'Constraint drill', plannedMins: 15, airtime: 'none' },
      { phase: 'Live points', plannedMins: 12, airtime: 'light' },
      { phase: 'Review & homework', plannedMins: 6, airtime: 'light' },
    ],
    coachingNotes: {
      cuesUsed: ['Spin first, not pace', 'Toss over your head', 'Brush up the back, 7 to 1', 'First forehand after the serve'],
      positiveToCorrectiveRatio: '5 : 5 positive to corrective',
      homeworkSet: true,
      summary: 'The serve itself is genuinely good now — that is the win. But the session is the textbook over-run: too long on technique meant the serve+1 constraint drill never happened and the toss was never pressure-tested. The plus-one pattern is the clear headline for next time.',
    },
    nextPlanDraft: {
      focus: 'Serve+1 forehand off the kick second serve',
      workOn: [
        'Run the serve+1 constraint drill we skipped — kick wide, attack the reply',
        'Hold the higher toss when the score gets tight',
        'First-strike forehand to the open court off a weak return',
      ],
      drills: ['Serve+1 forehand to the open court', 'Kick-wide → forehand plus-one', 'Second-serve-only points to 11'],
      plan: [
        { phase: 'Warm-up & movement', detail: 'Dynamic prep, split-step reactions, easy spin serves to find the toss.', mins: 9 },
        { phase: 'Technical block', detail: 'Short refresh only — five minutes to confirm the kick, then move on. Do not over-dwell.', mins: 12 },
        { phase: 'Constraint drill', detail: 'The drill we missed: kick second serve, then must hit the next forehand to the open court. Success target before progressing.', mins: 18 },
        { phase: 'Live points', detail: 'Second-serve-only points to 11 — toss must stay over the head on big points.', mins: 15 },
        { phase: 'Review & homework', detail: 'Film one game, review the plus-one, set the shadow-serve homework.', mins: 6 },
      ],
    },
  },

  // ── ts3 · Junior Squad (6) · Group 60m · Rally tolerance & match games ───────
  // Group flavour: uneven rep counts, two players flagged, one focus point partial.
  ts3: {
    transcriptExcerpts: [
      { at: '03:20', text: 'Everyone moving — split-step before every ball, no flat feet!' },
      { at: '11:45', text: 'Station two, you have had way more goes than station four — rotate, rotate.' },
      { at: '22:10', text: 'Aim a metre over the net into the middle. Height buys you time, keep it going.' },
      { at: '34:30', text: 'Freddie, Aanya — eyes up, you two keep drifting off when it’s not your turn.' },
      { at: '45:15', text: 'Co-op challenge — beat your best streak, one shared score for the pair.' },
      { at: '56:40', text: 'Quick mini-tournament — winners stay on, keep it competitive but tidy.' },
    ],
    focusPointResults: [
      { point: 'Longer rallies — keep the ball in play', status: 'covered',
        evidence: '22:10 · "Aim a metre over the net into the middle. Height buys you time."',
        note: 'Most pairs got cross-court rallies into double figures by the back half.' },
      { point: 'Apply rally skills in the match games', status: 'partial',
        evidence: '11:45 · "You have had way more goes than station four — rotate, rotate."',
        note: 'Uneven across the group — the stronger pair dominated reps while two players got far fewer quality balls.' },
      { point: 'Footwork & recovery between shots', status: 'covered',
        evidence: '03:20 · "Split-step before every ball, no flat feet!"',
        note: 'Good energy in the warm-up games; carried into the stations.' },
    ],
    drillResults: [
      { drill: 'Cross-court rally count (co-op)', ran: true, note: 'Rep counts uneven — strong pair ran away with it, quieter pair under-served.' },
      { drill: 'Skill stations rotation', ran: true, note: 'Rotations needed chasing; station two hogged the time.' },
      { drill: 'Round-robin match games', ran: true, note: 'Competitive and fun; tolerance held up under a bit of pressure.' },
      { drill: 'King of the court', ran: false, note: 'Ran out of time after the round-robin over-ran.' },
    ],
    runSheetCoverage: [
      { phase: 'Warm-up & dynamic games', plannedMins: 9, airtime: 'full' },
      { phase: 'Skill stations', plannedMins: 21, airtime: 'full' },
      { phase: 'Match games', plannedMins: 18, airtime: 'full' },
      { phase: 'Mini-tournament', plannedMins: 9, airtime: 'light' },
      { phase: 'Cool-down & feedback', plannedMins: 3, airtime: 'full' },
    ],
    coachingNotes: {
      cuesUsed: ['Split-step before every ball', 'Height buys you time', 'A metre over the net', 'One shared score'],
      positiveToCorrectiveRatio: '7 : 3 positive to corrective',
      homeworkSet: false,
      summary: 'Good group energy and the rally tolerance is clearly improving. The thing to fix is rep equity — the stations let the stronger pair take over. Two players (Freddie and Aanya) drifted whenever it wasn’t their turn and need a closer eye next week. Pair them deliberately and cap reps per station.',
    },
    nextPlanDraft: {
      focus: 'Rally tolerance with even reps & accountable pairs',
      workOn: [
        'Cap reps per station so every player gets equal quality balls',
        'Pair Freddie and Aanya with a steady partner and a job each',
        'Carry rally height into the competitive match games',
      ],
      drills: ['Capped cross-court rally count (co-op)', 'Paired stations with rotation timer', 'King of the court (the game we missed)'],
      plan: [
        { phase: 'Warm-up & dynamic games', detail: 'Movement games, split-step reactions to raise the pulse and get them sharp.', mins: 9 },
        { phase: 'Skill stations', detail: 'Timed rotations with a rep cap — every pair moves on the whistle, no station hogging.', mins: 21 },
        { phase: 'Match games', detail: 'Cooperative-to-competitive rally games; Freddie and Aanya given a specific target each.', mins: 18 },
        { phase: 'Mini-tournament', detail: 'King of the court — the game we ran out of time for last week.', mins: 9 },
        { phase: 'Cool-down & feedback', detail: 'Stretch, one win each, quick group feedback.', mins: 3 },
      ],
    },
  },

  // ── ts4 · Ava Romero · Private 45m · Rally control — 10-ball target ──────────
  // Mostly covered, but the technical block ran long and live points got squeezed.
  ts4: {
    transcriptExcerpts: [
      { at: '04:10', text: 'Same shape every ball — low to high, finish over the shoulder.' },
      { at: '12:30', text: 'Hit and get back — quick adjusting steps and a split before the next one.' },
      { at: '20:05', text: 'Lovely, that is the cleanest cross-court rally you’ve had. Keep that height.' },
      { at: '31:50', text: 'We’ve spent a long time on the technique here — I want to get you into a game.' },
      { at: '39:15', text: 'Right, quick — let’s see if we can hit the ten-ball target in a live point.' },
      { at: '43:00', text: 'Out of time for the proper game today, but you were close. We’ll start there next week.' },
    ],
    focusPointResults: [
      { point: 'Consistent cross-court rally shape', status: 'covered',
        evidence: '20:05 · "That is the cleanest cross-court rally you’ve had. Keep that height."',
        note: 'Really good in the controlled drills — repeatable low-to-high shape with margin.' },
      { point: 'Recover to the centre between shots', status: 'covered',
        evidence: '12:30 · "Hit and get back — quick adjusting steps and a split before the next one."',
        note: 'Recovery improved through the footwork block; touched the centre cone consistently.' },
      { point: 'Reach the 10-ball rally target in a live game', status: 'partial',
        evidence: '43:00 · "Out of time for the proper game today, but you were close."',
        note: 'Barely tested — the technical block over-ran and squeezed the live points to a couple of rushed rallies.' },
    ],
    drillResults: [
      { drill: 'High-rope cross-court rally', ran: true, note: 'Excellent — the rope target really helped the height.' },
      { drill: 'Feed-touch-recover to centre', ran: true, note: 'Good reps; recovery is becoming automatic.' },
      { drill: '10-ball co-op rally challenge (live)', ran: false, note: 'Only a couple of rushed attempts — squeezed out by the technical over-run.' },
    ],
    runSheetCoverage: [
      { phase: 'Warm-up & movement', plannedMins: 7, airtime: 'full' },
      { phase: 'Technical block', plannedMins: 14, airtime: 'full' },
      { phase: 'Constraint drill', plannedMins: 11, airtime: 'full' },
      { phase: 'Live points', plannedMins: 9, airtime: 'light' },
      { phase: 'Review & homework', plannedMins: 4, airtime: 'light' },
    ],
    coachingNotes: {
      cuesUsed: ['Same shape every ball', 'Low to high, finish over the shoulder', 'Height buys you time', 'Hit and get back'],
      positiveToCorrectiveRatio: '7 : 3 positive to corrective',
      homeworkSet: false,
      summary: 'The rally shape and recovery are genuinely good now. The lesson is pacing: the technical block ran long, so the actual 10-ball game — the whole point of the session — only got a couple of rushed goes. Next time, ring-fence the live time and start with the game.',
    },
    nextPlanDraft: {
      focus: 'Rally control — hit the 10-ball target in a live game',
      workOn: [
        'Open with the 10-ball game while she is fresh — protect the live time',
        'Keep the cross-court height under live pressure, not just in drills',
        'Recover to centre between every ball in a real rally',
      ],
      drills: ['10-ball co-op rally challenge (live)', 'High-rope cross-court rally', 'Feed-touch-recover to centre'],
      plan: [
        { phase: 'Warm-up & movement', detail: 'Dynamic prep and mini-tennis straight into rally shape — short and sharp.', mins: 7 },
        { phase: 'Live points', detail: 'Open with the 10-ball game while she is fresh. Ring-fence this time first.', mins: 12 },
        { phase: 'Technical block', detail: 'Brief shape refresh only if needed — one cue, do not over-dwell.', mins: 10 },
        { phase: 'Constraint drill', detail: 'High-rope rally with a 10-ball success target before progressing.', mins: 11 },
        { phase: 'Review & homework', detail: 'Quick review, celebrate the streaks, set a wall-rally homework.', mins: 5 },
      ],
    },
  },

  // ── ts5 · Cardio Tennis (8) · Cardio 60m · High-tempo fitness & live games ───
  // Intensity / engagement framing: pacing held, water breaks taken, one game
  // variation missed.
  ts5: {
    transcriptExcerpts: [
      { at: '02:00', text: 'Feet moving, ladder first — get the heart rate up before we touch a ball.' },
      { at: '14:25', text: 'Continuous feeds now, no standing around — next ball is already coming!' },
      { at: '20:00', text: 'Water break, sixty seconds — well done, that was a hard block.' },
      { at: '33:40', text: 'Great intensity, nobody dropping off. King of the court, winners stay on.' },
      { at: '40:10', text: 'Second water break — grab a drink, we’ve got one big game left.' },
      { at: '54:30', text: 'We won’t get to the doubles scramble today — cool-down and stretch instead.' },
    ],
    focusPointResults: [
      { point: 'Hold a high work-rate across the hour', status: 'covered',
        evidence: '33:40 · "Great intensity, nobody dropping off."',
        note: 'Energy held the whole way — strong engagement from all eight.' },
      { point: 'Heart rate up through continuous feeds', status: 'covered',
        evidence: '14:25 · "Continuous feeds now, no standing around — next ball is already coming!"',
        note: 'The feeding circuit kept everyone moving; minimal queueing.' },
      { point: 'Finish with a live game variation', status: 'partial',
        evidence: '54:30 · "We won’t get to the doubles scramble today."',
        note: 'King of the court ran, but the planned doubles-scramble variation was dropped to protect the cool-down.' },
    ],
    drillResults: [
      { drill: 'Footwork ladder pulse-raiser', ran: true, note: 'Good buy-in, set the tempo early.' },
      { drill: 'Continuous feeding circuit', ran: true, note: 'High heart rate, honest technique under fatigue.' },
      { drill: 'King of the court (live)', ran: true, note: 'Competitive and fun, intensity stayed up.' },
      { drill: 'Doubles scramble variation', ran: false, note: 'Planned but missed — ran out of time before cool-down.' },
    ],
    runSheetCoverage: [
      { phase: 'Warm-up & pulse-raiser', plannedMins: 9, airtime: 'full' },
      { phase: 'High-tempo feeds', plannedMins: 24, airtime: 'full' },
      { phase: 'Live rally games', plannedMins: 21, airtime: 'light' },
      { phase: 'Cool-down & stretch', plannedMins: 6, airtime: 'full' },
    ],
    coachingNotes: {
      cuesUsed: ['Feet moving', 'No standing around', 'Next ball is already coming', 'Winners stay on'],
      positiveToCorrectiveRatio: '9 : 1 positive to corrective',
      homeworkSet: false,
      summary: 'Exactly what a Cardio session should be — pacing held, intensity high, and both water breaks taken on schedule at 20 and 40 minutes. The only thing dropped was the doubles-scramble variation, which is a fine trade to keep a proper cool-down. Add it earlier next week.',
    },
    nextPlanDraft: {
      focus: 'High-tempo cardio with the doubles-scramble variation',
      workOn: [
        'Keep the work-rate high with minimal queueing',
        'Slot the doubles-scramble variation in before the cool-down',
        'Hold the two water breaks at 20 and 40 minutes',
      ],
      drills: ['Footwork ladder pulse-raiser', 'Continuous feeding circuit', 'Doubles scramble (the variation we missed)'],
      plan: [
        { phase: 'Warm-up & pulse-raiser', detail: 'Footwork ladder, dynamic stretch, easy rally to raise the pulse.', mins: 9 },
        { phase: 'High-tempo feeds', detail: 'Continuous feeding circuits — heart rate up, technique honest. Water break at 20.', mins: 22 },
        { phase: 'Live rally games', detail: 'King of the court, then the doubles-scramble variation we missed. Water break at 40.', mins: 23 },
        { phase: 'Cool-down & stretch', detail: 'Bring the heart rate down, mobility work.', mins: 6 },
      ],
    },
  },

  // ── ts6 · Daniel Cruz · Match play 75m · Competitive sets — serve+1 patterns ─
  // Tactical framing: game-plan points covered/missed, between-point routines
  // noted, homework NOT set (flag it).
  ts6: {
    transcriptExcerpts: [
      { at: '03:45', text: 'Full warm-up including serves — settle the routine before we compete.' },
      { at: '13:20', text: 'Rehearse it: serve wide, first forehand into the open court. That is your plus-one.' },
      { at: '28:30', text: 'There it is — serve, plus-one forehand, point over. Textbook.' },
      { at: '41:15', text: 'Good reset between points — towel, breathe, plan the next one. Keep that routine.' },
      { at: '58:40', text: 'On the return you’re just blocking it back — we need a return-plus-one too, you’re too passive.' },
      { at: '71:00', text: 'Strong set. Log it for the match report — that serve+1 is competition-ready.' },
    ],
    focusPointResults: [
      { point: 'Serve+1 forehand pattern in live sets', status: 'covered',
        evidence: '28:30 · "Serve, plus-one forehand, point over. Textbook."',
        note: 'The go-to pattern showed up repeatedly under real point pressure — genuinely competition-ready.' },
      { point: 'Stick to between-point routines under pressure', status: 'covered',
        evidence: '41:15 · "Good reset between points — towel, breathe, plan the next one."',
        note: 'Routine held even when behind in a game; a real strength now.' },
      { point: 'Return+1 — neutralise the second serve', status: 'missed',
        evidence: '58:40 · "On the return you’re just blocking it back — too passive."',
        note: 'Not on the plan and never drilled — the return game is passive and is the clear next priority.' },
    ],
    drillResults: [
      { drill: 'Serve+1 pattern rehearsal', ran: true, note: 'Sharp — transferred straight into the competitive sets.' },
      { drill: 'Return+1 block-and-build', ran: false, note: 'Not run — the session was serve-focused; the return weakness surfaced live.' },
      { drill: 'Competitive sets (first to 4)', ran: true, note: 'Two full sets; serve+1 held up under pressure.' },
    ],
    runSheetCoverage: [
      { phase: 'Warm-up & serve routine', plannedMins: 11, airtime: 'full' },
      { phase: 'Pattern rehearsal', plannedMins: 15, airtime: 'full' },
      { phase: 'Competitive sets', plannedMins: 41, airtime: 'full' },
      { phase: 'Debrief & notes', plannedMins: 8, airtime: 'full' },
    ],
    coachingNotes: {
      cuesUsed: ['Serve wide, first forehand to the open court', 'Reset: towel, breathe, plan', 'Plus-one, not just the serve', 'Compete, minimal interruption'],
      positiveToCorrectiveRatio: '6 : 4 positive to corrective',
      homeworkSet: false,
      summary: 'Tactically a strong session — the serve+1 is match-ready and the between-point routines are holding under pressure. The gap is the return game: he is purely passive on second-serve returns. ⚠ No homework was set — Daniel should leave with a return+1 task before his next match.',
    },
    nextPlanDraft: {
      focus: 'Return+1 — build a point off the second-serve return',
      workOn: [
        'Step in and attack the second-serve return instead of blocking',
        'Add a return+1 forehand to the open court',
        'Keep the between-point reset routine that is already working',
      ],
      drills: ['Return+1 block-and-build', 'Step-in second-serve return targets', 'Competitive sets — return games only'],
      plan: [
        { phase: 'Warm-up & serve routine', detail: 'Full warm-up incl. serves and returns; settle the routine.', mins: 11 },
        { phase: 'Pattern rehearsal', detail: 'Rehearse the return+1 — step in, attack the second serve, first forehand to the open court.', mins: 15 },
        { phase: 'Competitive sets', detail: 'Play out sets where only the returner can win the first two shots — force the aggressive return.', mins: 41 },
        { phase: 'Debrief & notes', detail: 'What worked, log for the match report, and SET HOMEWORK this time — return+1 shadow reps.', mins: 8 },
      ],
    },
  },
}
