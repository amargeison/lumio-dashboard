'use client'

// Authored printable content, keyed by the slug in a resource's `lumio:<slug>` url.
//
// House rules (from src/lib/coach/agent-persona.ts — keep these):
//  • DIAGNOSE, don't describe. `diagnosis` names the fault, why it matters and
//    what it is costing the player. If it would be true of any player at any
//    stage, rewrite it.
//  • Every page ends with a SUCCESS CRITERION the player can measure themselves
//    against — a number, a target, something observable. Never "improved feel".
//  • Cues are what the coach SAYS on court, in quotes, not a description of them.
//  • Faults are fault → why it matters → the correction, not a list of mistakes.
//  • British English. Concrete over generic. Depth through insight, never padding.
//
// A slug with no entry here still prints via the fallback in resource-printables,
// so the library is never broken while this file is being filled in.

import type { Printable } from './resource-printables'

export const PRINTABLE_CONTENT: Record<string, Printable> = {

  // ─── WHITE ────────────────────────────────────────────────────────────────
  'white-catch-drop-hit': {
    kind: 'drill',
    diagnosis: 'Beginners meet the ball level with or behind the hip. From there the racket face has already begun to close, so the ball dumps into the net and the player concludes they are "no good at tennis". It is almost never a swing problem — it is a contact-point problem, and every stroke they build on top of it will inherit the fault.',
    objective: 'A contact point out in front of the leading hip that the player can find without being told.',
    setup: ['Player at the service line, coach two metres away.', 'Basket of soft or red balls.', 'One cone placed level with the player’s front foot as the contact marker.'],
    progressions: [
      { name: 'Catch it', detail: 'Coach drops a ball; player catches it with the racket hand out in front, level with the cone. No racket at all yet.', reps: '10 each side' },
      { name: 'Drop and hit', detail: 'Player drops their own ball and hits it over the net from that same spot. Self-fed so nothing is rushed.', reps: '10 each side' },
      { name: 'Coach drop, player hit', detail: 'Coach drops to the cone. Player steps in and strikes at the marker.', reps: '15 each side' },
      { name: 'Two-bounce rally', detail: 'Gentle cooperative rally, ball allowed to bounce twice. Contact must still be at the cone.', reps: '5 minutes' },
    ],
    cues: ['"Catch it where you can see it" — if it is beside you, it is already late.', '"Hit the cone, not the ball" — gives a fixed place to arrive at.', '"Let it drop to your pocket" — stops the player reaching up at a falling ball.'],
    faults: [
      { fault: 'Contact beside or behind the hip', why: 'Racket face closes; ball goes down into the net', fix: 'Back to step 1. If they cannot catch it in front, they cannot hit it in front.' },
      { fault: 'Ball met above shoulder height', why: 'No stroke available; becomes a slap', fix: 'Let it drop. Count "bounce — two — hit" out loud so they wait.' },
      { fault: 'Feet planted, reaching with the arm', why: 'Contact point moves every time and cannot be repeated', fix: 'Small step in on every ball, even when the ball comes to them.' },
    ],
    success: 'Eight of ten balls struck level with the cone and cleared over the net, without the coach naming the contact point.',
    progress: 'Harder: move the feed wider so they must step across. Easier: hold the ball out and let them hit it from your hand before dropping it.',
    court: { zones: [{ x: 0.115, y: 0.62, w: 0.77, h: 0.12, label: 'Player starts here', colour: '#9aa1b1' }], note: 'Everything happens inside the service boxes at this stage — the full court is a later problem.' },
    notesLines: 3,
  },

  'white-rally-ladder': {
    kind: 'drill',
    diagnosis: 'Rallies end at two or three shots because the player treats every ball as a chance to win the point. They have never been asked to keep one going, so they have no idea what a sustainable shot feels like. Until tolerance exists there is nothing to coach — you cannot fix a forehand that only appears twice a rally.',
    objective: 'A cooperative rally of ten, which is the first genuine milestone in the game.',
    setup: ['Both players inside the service boxes, red or orange ball.', 'Coach counts out loud — the count is the point of the drill.', 'Target: 3, then 5, then 10 consecutive.'],
    progressions: [
      { name: 'Rally to three', detail: 'Any height, any pace. Just three in a row. Celebrate it.', reps: 'until hit twice' },
      { name: 'Rally to five', detail: 'Same, but the ball must bounce inside the service box.', reps: 'until hit twice' },
      { name: 'Rally to ten', detail: 'Ten consecutive. If it breaks at eight, restart at one — the restart is the lesson.', reps: '10 minutes' },
      { name: 'Ladder against yourself', detail: 'Record the best streak of the session and write it on the card. Beat it next week.', reps: 'once' },
    ],
    cues: ['"Aim for the middle and up" — height is what buys time.', '"Your job is the next one, not this one."', '"Slow is a skill" — pace is not the same as quality.'],
    faults: [
      { fault: 'Swinging hard on ball two', why: 'Rally never reaches a length where technique matters', fix: 'Cap the pace: the ball must bounce twice on your side if the opponent lets it.' },
      { fault: 'Aiming at the lines', why: 'Errors come from ambition, not technique', fix: 'Target is the middle third only. Lines do not exist this week.' },
      { fault: 'Counting stops when the rally breaks', why: 'Player gets frustrated and disengages', fix: 'Restart at one immediately and without comment. The restart is normal.' },
    ],
    success: 'Ten consecutive balls inside the service boxes, twice in one session.',
    notesLines: 3,
  },

  'white-ready-position': {
    kind: 'drill',
    diagnosis: 'A racket carried low and in one hand costs the unit turn before the ball has even bounced — the player has to lift the racket before they can turn, and by then they are late. Every "slow around the court" complaint at this stage is really a ready-position problem.',
    objective: 'Racket up, two hands on it, weight forward — held automatically, not on command.',
    setup: ['Player on the baseline, no ball to begin with.', 'Mirror or phone camera if available.'],
    progressions: [
      { name: 'Freeze checks', detail: 'Coach calls "ready". Player takes the position and holds. Coach checks racket height, both hands on, knees soft, weight on the balls of the feet.', reps: '10 holds' },
      { name: 'Shadow turn', detail: 'From ready, turn the shoulders both ways without stepping. The racket goes with the body, not with the arm.', reps: '15 each side' },
      { name: 'Ready between feeds', detail: 'Coach feeds slowly. Player must be back in ready before the next feed is released.', reps: '20 balls' },
      { name: 'The pause test', detail: 'Coach randomly withholds the feed. If the player is not in ready when the ball comes, the ball does not come.', reps: '10 balls' },
    ],
    cues: ['"Racket up where you can see it."', '"Two hands, always" — the non-hitting hand is what turns you.', '"Small and springy, not big and stiff."'],
    faults: [
      { fault: 'Racket hangs at the knees', why: 'Preparation starts late on every ball', fix: 'Hold at sternum height. If it drops, the feed stops.' },
      { fault: 'One hand on the grip', why: 'No unit turn available', fix: 'Non-racket hand on the throat between every ball.' },
      { fault: 'Standing flat on the heels', why: 'No first step; player is rooted', fix: 'Small bounce between feeds — the beginning of a split-step.' },
    ],
    success: 'Twenty consecutive feeds where the player is back in a correct ready position before the next ball is released, without a reminder.',
    notesLines: 2,
  },

  'white-continental-grip': {
    kind: 'drill',
    diagnosis: 'A frying-pan grip works for about six months. It makes the first forehand easy and then blocks the serve, every volley and the slice permanently — and by then it is a habit with hundreds of hours behind it. Establishing continental now costs a fortnight of awkwardness and saves two years of unlearning.',
    objective: 'Finding continental unprompted, and holding it through a volley and a serve.',
    setup: ['Racket, no ball to begin.', 'A small sticker or tape on bevel two as a landmark.'],
    progressions: [
      { name: 'Shake hands with it', detail: 'Racket on edge, shake hands with the handle. Mark where the base knuckle sits.', reps: '10 finds' },
      { name: 'Find it blind', detail: 'Player looks away, takes the grip, then checks. Repeat until it is found by feel.', reps: '15 finds' },
      { name: 'Hammer the ball down', detail: 'Bounce the ball down onto the court with the racket edge-on. Only works in continental.', reps: '30 bounces' },
      { name: 'Grip through a volley', detail: 'Short volley feeds. Grip must be unchanged before and after.', reps: '20 balls' },
    ],
    cues: ['"Shake hands with the racket."', '"Edge first, then face" — the edge leads on serves and volleys.', '"If it feels odd, it is probably right this week."'],
    faults: [
      { fault: 'Slides to a forehand grip for volleys', why: 'Backhand volley becomes impossible', fix: 'Alternate forehand and backhand volleys so there is no time to change.' },
      { fault: 'Grip changes mid-rally', why: 'Serve and volley never consolidate', fix: 'Tape landmark; coach checks after every four balls.' },
    ],
    success: 'Twenty volleys, alternating sides, with the grip unchanged throughout and found by feel at the start.',
    notesLines: 2,
  },

  'white-6-week-block': {
    kind: 'plan',
    diagnosis: 'Complete beginners are usually given six weeks of unconnected fun sessions and arrive at week seven with no measurable skill. Sequencing matters: contact point must come before rallying, and rallying before anything tactical, or each week undoes the last.',
    goal: 'Take a complete beginner from fed balls to a ten-ball cooperative rally, with the White racket criteria as the exit test.',
    weeks: [
      { w: 1, focus: 'Contact point', main: 'Catch, drop, hit. Self-fed balls only.', measure: '8/10 struck in front of the hip' },
      { w: 2, focus: 'Ready & grip', main: 'Ready position holds, continental grip found by feel.', measure: '20 feeds with ready held unprompted' },
      { w: 3, focus: 'Forehand shape', main: 'Low-to-high with a fixed contact point. Cooperative feeds.', measure: '10 consecutive over the net' },
      { w: 4, focus: 'Backhand shape', main: 'Two-handed backhand, same contact-point rules.', measure: '8 consecutive over the net' },
      { w: 5, focus: 'Rally tolerance', main: 'Rally ladder — three, five, then ten.', measure: 'Rally of 5 achieved twice' },
      { w: 6, focus: 'Play & assess', main: 'Mini-tennis games and the White racket assessment.', measure: 'Rally of 10; White criteria met' },
    ],
    success: 'The player sustains a ten-ball cooperative rally inside the service boxes on two separate occasions, holds a correct ready position without prompting, and finds the continental grip by feel.',
    notesLines: 3,
  },

  'white-balance-basics': {
    kind: 'drill',
    diagnosis: 'Players who fall away from the shot cannot recover for the next one, so the second ball of every rally is played on the run. It looks like a fitness problem and gets treated as one; it is actually a balance and landing problem, and fifteen minutes off court fixes more of it than an hour of sprints.',
    objective: 'Landing and stopping under control, so the player finishes each shot able to move again.',
    setup: ['Off court or on a spare court. No racket needed.', 'Four cones in a small square.'],
    progressions: [
      { name: 'Stick the landing', detail: 'Small two-footed hop forward, land and freeze for three seconds. No wobble.', reps: '10 reps' },
      { name: 'Single-leg hold', detail: 'Stand on one leg, eyes forward, hold 20 seconds each side. Then eyes closed.', reps: '2 each side' },
      { name: 'Side shuffle and stop', detail: 'Shuffle cone to cone, stop dead on the coach’s call and hold balanced.', reps: '8 stops' },
      { name: 'Hop, stop, turn', detail: 'Hop out, stick the landing, then turn the shoulders as if hitting. Balance must survive the turn.', reps: '10 reps' },
    ],
    cues: ['"Land quiet" — noisy landings are uncontrolled ones.', '"Nose over toes, not behind your heels."', '"Stop, then hit. Not stop while hitting."'],
    faults: [
      { fault: 'Falls backwards on landing', why: 'Weight goes away from the shot; no recovery step', fix: 'Slow it down, shorter hop, hold the freeze for longer.' },
      { fault: 'Arms flail for balance', why: 'Balance is being rescued rather than held', fix: 'Hands on hips until the landing is stable, then reintroduce arms.' },
    ],
    success: 'Ten consecutive landings held for three seconds with no step, wobble or arm flail — including the hop-stop-turn.',
    notesLines: 2,
  },

  'white-confidence-card': {
    kind: 'worksheet',
    diagnosis: 'Beginners quit because they only notice the misses. Progress at this stage is real but invisible — a rally that reaches five instead of two is a genuine jump that nobody records. This card makes it visible to the player and to the parent who will read it.',
    rows: [
      { label: 'Longest rally', detail: 'Write the number every week. It only goes up.' },
      { label: 'One thing that felt easier', detail: 'Something that was hard last month and is not now.' },
      { label: 'One thing to work on', detail: 'Agreed with your coach — just one.' },
    ],
    prompts: [
      { heading: 'This week I am proud of', hint: 'Anything. Turning up in the rain counts.', lines: 2 },
      { heading: 'Next week I want to try', lines: 2 },
    ],
    success: 'Four weeks completed in a row, with the longest-rally number higher at week four than at week one.',
    notesLines: 2,
  },

  'parent-ball-pathway': {
    kind: 'worksheet',
    diagnosis: 'Parents push towards the yellow ball too early because nobody has explained why the balls are different. A child moved up before they are ready loses the rallies that build technique, and the technique that would have earned the move never develops. This page is written for the parent, not the coach.',
    rows: [
      { label: 'Red ball', detail: 'Slowest and largest, on a small court. Builds contact point and rallying at a pace a child can actually control.' },
      { label: 'Orange ball', detail: 'Faster, on a three-quarter court. Introduces real footwork and the first patterns.' },
      { label: 'Green ball', detail: 'Close to a full ball, on a full court. Where serving and tactics become genuine.' },
      { label: 'Yellow ball', detail: 'The standard ball. Moving up too early is the single most common mistake made in junior tennis.' },
    ],
    prompts: [
      { heading: 'Questions for your coach', hint: 'What would my child need to show to move up? What are we working on now?', lines: 3 },
    ],
    success: 'You can explain to another parent why your child is on the ball they are on, and what they are working on to progress.',
  },

  'white-mini-games': {
    kind: 'drill',
    diagnosis: 'Beginners lose focus when a session is all feeding, and a distracted beginner learns nothing regardless of how good the feed is. These games teach tracking, contact and rallying while looking like play — the coaching is hidden inside the scoring.',
    objective: 'Thirty minutes of genuine ball-striking that a child experiences as games rather than drills.',
    setup: ['Service boxes only, red balls.', 'Cones, and a scoreboard the players can see.'],
    progressions: [
      { name: 'Beat the coach', detail: 'Player rallies against the coach. Player scores a point per ball over the net; coach scores if it misses.', reps: '5 minutes' },
      { name: 'Target smash', detail: 'Cones in the box. Knock one over to win it. Rally must reach three shots before targets count.', reps: '5 minutes' },
      { name: 'Around the world', detail: 'Players rotate after each shot. Miss and you sit one out.', reps: '5 minutes' },
      { name: 'Rally king', detail: 'Whoever holds the longest rally of the session wears the crown until beaten.', reps: '10 minutes' },
    ],
    cues: ['"Three before targets" — keeps the rally in every game.', '"Your point, my point" — keeps the score alive and the focus up.'],
    faults: [
      { fault: 'Game becomes a hitting contest', why: 'Rallies collapse and no skill is practised', fix: 'Rally-of-three rule before any point can be won.' },
      { fault: 'Same child wins everything', why: 'Others disengage', fix: 'Handicap: the stronger player must rally five before scoring.' },
    ],
    success: 'Every player in the group holds at least one rally of five during the games, without being fed by the coach.',
    notesLines: 2,
  },

  // ─── YELLOW ───────────────────────────────────────────────────────────────
  'yellow-two-hander': {
    kind: 'drill',
    diagnosis: 'A backhand steered with the arms alone has no margin and no depth, so it lands short and invites the opponent forward. The player then hits it harder, which makes it worse. The fault is almost always that the shoulders never turned — the arms are doing a job the body should be doing.',
    objective: 'A two-handed backhand driven by a shoulder turn, met in front of the front hip.',
    setup: ['Player on the baseline, coach feeding from mid-court.', 'Both hands on the grip — left hand doing most of the work for a right-hander.', 'Cone level with the front foot as the contact marker.'],
    progressions: [
      { name: 'Turn only', detail: 'No ball. On the coach\u2019s call, turn the shoulders so the back is half-visible. Racket goes with the body.', reps: '15 turns' },
      { name: 'Drop feed', detail: 'Coach drops close. Player turns early, then drives low to high through the cone.', reps: '15 balls' },
      { name: 'Moving feed', detail: 'Feed one metre either side. Turn must be complete before the bounce.', reps: '20 balls' },
      { name: 'Cross-court rally', detail: 'Backhand to backhand, aiming past the service line.', reps: '5 minutes' },
    ],
    cues: ['"Show them your back pocket" — that is the turn, in one image.', '"Left hand drives, right hand steers" (reverse for a left-hander).', '"Finish over the shoulder" — the follow-through proves the swing path.'],
    faults: [
      { fault: 'Arms swing, shoulders stay square', why: 'No power source; ball lands short', fix: 'Back to shadow turns. Coach holds the player\u2019s front shoulder and turns it for them.' },
      { fault: 'Contact beside the back hip', why: 'Racket face open; ball floats', fix: 'Cone marker at the front foot, contact must happen past it.' },
      { fault: 'Top hand comes off at contact', why: 'Loses control and depth', fix: 'Both hands stay on through the finish — check the follow-through position.' },
    ],
    success: 'Fifteen of twenty backhands land past the service line, with a visible shoulder turn completed before the ball bounces.',
    progress: 'Harder: feed deeper and wider so the turn must happen on the move. Easier: return to drop feeds and slow the count down.',
    court: { zones: [{ x: 0.5, y: 0.06, w: 0.385, h: 0.22, label: 'Past the service line', colour: '#d9a91f' }], note: 'Depth is the measure here, not power. Anything landing short does not count.' },
    notesLines: 3,
  },

  'yellow-crosscourt-targets': {
    kind: 'drill',
    diagnosis: 'Balls land short and central, which is the most inviting ball in tennis — it gives the opponent an easy step-in and takes the court away from the player who hit it. Players do not do this deliberately; they simply have no target other than "in", and "in" includes the worst ball on the court.',
    objective: 'A default rally ball that lands cross-court and past the service line, hit on demand rather than by luck.',
    setup: ['Throw-down lines or cones marking a cross-court zone in each corner.', 'Cooperative rally, both players from the baseline.', 'Scoreboard visible — the target zone scores, the rest does not.'],
    progressions: [
      { name: 'Zone rally', detail: 'Cooperative cross-court rally. Count only the balls landing in the marked zone.', reps: '10 in the zone' },
      { name: 'Both wings', detail: 'Forehand cross, then backhand cross. Switch on the coach\u2019s call.', reps: '10 each' },
      { name: 'Zone points', detail: 'Play points where a ball outside the zone loses the point even if it lands in.', reps: '11 points' },
      { name: 'Change of direction', detail: 'Three cross-court, then one down the line. The line ball only counts from a zone ball.', reps: '8 sets' },
    ],
    cues: ['"Over the low part of the net" — cross-court is geometrically the safer ball.', '"Aim a metre inside the line, not at it."', '"Deep first, angle later."'],
    faults: [
      { fault: 'Aiming at the lines', why: 'Errors from ambition, not technique', fix: 'Move the zone a metre inside the lines and score only that.' },
      { fault: 'Ball lands short but in', why: 'Invites the opponent to attack', fix: 'Short balls score zero. Depth is the only currency this session.' },
      { fault: 'Down the line every third ball', why: 'Lowest-margin shot chosen from a neutral ball', fix: 'Down the line is unlocked only from a ball inside the zone.' },
    ],
    success: 'Ten consecutive rally balls landing in the cross-court zone, then eleven points played where an out-of-zone ball loses the point.',
    court: { zones: [
      { x: 0.115, y: 0.06, w: 0.34, h: 0.2, label: 'Zone', colour: '#d9a91f' },
      { x: 0.545, y: 0.74, w: 0.34, h: 0.2, label: 'Zone', colour: '#d9a91f' },
    ], note: 'Cross-court zones, a metre inside both the sideline and the baseline. Anything outside scores nothing.' },
    notesLines: 3,
  },

  'yellow-net-clearance': {
    kind: 'drill',
    diagnosis: 'Most unforced errors at this stage are net errors, not long ones — and a net error is a wasted point with no upside whatsoever. Players aim at the top of the net because it feels accurate. Raising the target by a metre removes more errors than any technical change available at this level.',
    objective: 'A metre of net clearance as the default rally ball, not as a defensive option.',
    setup: ['A rope, ribbon or line of cones a metre above the net — a spare net band works.', 'Cooperative rallying from the baseline.'],
    progressions: [
      { name: 'Over the rope', detail: 'Cooperative rally where every ball must pass between the net and the rope. Under the rope does not count.', reps: '10 consecutive' },
      { name: 'Rope and depth', detail: 'Same, plus the ball must land past the service line.', reps: '10 consecutive' },
      { name: 'Rope under pressure', detail: 'Points played with the rope rule live.', reps: '11 points' },
      { name: 'Rope removed', detail: 'Rope taken away. Player keeps the same trajectory from memory.', reps: '5 minutes' },
    ],
    cues: ['"A metre over, every time."', '"Height is not defensive — height is margin."', '"If it clips the tape, it was the right shot badly executed. If it goes into the tape, it was the wrong target."'],
    faults: [
      { fault: 'Flattens out when pressed', why: 'Error rate spikes exactly when it matters', fix: 'Rope stays up during the points phase. Under the rope loses the point.' },
      { fault: 'Height achieved by scooping', why: 'No pace, floats and sits up', fix: 'Low to high with the racket face on edge — height from swing path, not from an open face.' },
    ],
    success: 'Twenty consecutive rally balls over the rope and past the service line, then eleven points with the rope rule live and fewer than three net errors.',
    notesLines: 2,
  },

  'yellow-recovery-t': {
    kind: 'drill',
    diagnosis: 'Players admire the shot they have just hit and get wrong-footed by the reply. They are not slow — they simply never started moving back. At this stage a rally is lost one shot after the good shot, and the player blames their fitness rather than their habit.',
    objective: 'An automatic recovery step towards the middle before the opponent strikes the ball.',
    setup: ['A cone or throw-down marker at the centre mark.', 'Coach feeds alternately wide to each corner.'],
    progressions: [
      { name: 'Hit and touch', detail: 'Player hits, then must touch the centre marker with a foot before the next feed is released.', reps: '20 balls' },
      { name: 'Shuffle, don\u2019t stroll', detail: 'Same, but recovery is a side shuffle facing the net, never a turn and jog.', reps: '20 balls' },
      { name: 'Split at the marker', detail: 'Recovery finishes with a split-step timed to the coach\u2019s feed.', reps: '20 balls' },
      { name: 'Live points', detail: 'Points played. Coach calls out any ball hit without a recovery first.', reps: '11 points' },
    ],
    cues: ['"Hit and get home."', '"Face the net the whole way" — turning your back costs you the next ball.', '"Land as they hit, not after."'],
    faults: [
      { fault: 'Watches the shot before moving', why: 'Half a second lost on every ball', fix: 'Feed released the instant they hit, so there is no time to watch.' },
      { fault: 'Turns and jogs back', why: 'Cannot change direction from that position', fix: 'Side shuffle only. Turning the hips is an automatic restart of the rep.' },
      { fault: 'Recovers to the exact centre every time', why: 'Wrong position after a wide ball', fix: 'Introduce recovering to the bisector, not the middle, once the habit exists.' },
    ],
    success: 'Twenty consecutive feeds where the player touches the recovery marker and splits before the next ball, with no reminder from the coach.',
    court: { zones: [{ x: 0.42, y: 0.82, w: 0.16, h: 0.12, label: 'Home', colour: '#d9a91f' }], note: 'Recovery marker at the centre mark. Later this becomes the bisector of the opponent\u2019s angles rather than a fixed spot.' },
    notesLines: 2,
  },

  'yellow-serve-throw': {
    kind: 'drill',
    diagnosis: 'A serve pushed with a stiff arm caps out at a speed the player will outgrow within a year, and it loads the shoulder in exactly the way that causes trouble later. The throwing action has to come first; the toss is then built to suit it. Building the toss first is the most common sequencing mistake in junior coaching.',
    objective: 'A serve that comes from a throwing action, with the toss arranged around it.',
    setup: ['Foam or soft balls to begin, so throwing is safe.', 'Player side-on to the net, feet set.'],
    progressions: [
      { name: 'Throw the ball', detail: 'Player throws a ball over the net, side-on, from the serve stance. No racket at all.', reps: '15 throws' },
      { name: 'Throw the racket (safely)', detail: 'Same action holding the racket, stopping at contact height. Feel the same sequence.', reps: '15 shadows' },
      { name: 'Toss to the throw', detail: 'Now add the toss — placed where the throwing hand naturally arrives, not where a book says.', reps: '20 serves' },
      { name: 'Serve at 60%', detail: 'Whole action, low pace, into the box. Rhythm over speed.', reps: '20 serves' },
    ],
    cues: ['"Throw it, don\u2019t push it."', '"Elbow leads, hand follows."', '"Slow legs, fast arm" — the speed comes last, not first.'],
    faults: [
      { fault: 'Straight arm from start to finish', why: 'No racket-head speed and a loaded shoulder', fix: 'Back to throwing a ball. If they cannot throw it, they cannot serve it.' },
      { fault: 'Toss too far in front', why: 'Player chases it and the action breaks down', fix: 'Let three tosses drop without hitting and mark where they land. Adjust to the throw.' },
      { fault: 'Serving hard immediately', why: 'Action collapses under effort', fix: 'Cap at 60% for the whole session. Speed is not on the agenda this week.' },
    ],
    success: 'Fifteen of twenty serves land in the box at roughly 60% pace, with a visible elbow-leads-hand sequence the coach can see from the side.',
    notesLines: 3,
  },

  'warmup-dynamic': {
    kind: 'drill',
    diagnosis: 'Cold players hit late for the first twenty minutes and then decide they are having a bad day — and a bad first twenty minutes of a one-hour lesson is a third of the session gone. The warm-up is not a formality; it is what makes minute one of the session usable.',
    objective: 'A ten-minute on-court warm-up that leaves the player ready to hit properly on the first ball.',
    setup: ['Baseline to service line, no racket for the first half.'],
    progressions: [
      { name: 'Raise', detail: 'Two lengths of easy jogging, then side shuffles and carioca, both directions.', reps: '3 minutes' },
      { name: 'Mobilise', detail: 'Leg swings, hip openers, trunk rotations, shoulder circles. Controlled, not bounced.', reps: '3 minutes' },
      { name: 'Activate', detail: 'Split-steps on the spot, short accelerations to the service line, three lateral bounds each way.', reps: '2 minutes' },
      { name: 'Potentiate', detail: 'Shadow swings on both wings, then five shadow serves building to full speed.', reps: '2 minutes' },
    ],
    cues: ['"Warm up to play, not to tick a box."', '"Controlled range, not bounced range" — bouncing a cold muscle is how you strain one.'],
    faults: [
      { fault: 'Static stretching before hitting', why: 'Reduces power output and does not prepare movement', fix: 'Move stretching to the cool-down. Warm-up is dynamic only.' },
      { fault: 'Skipped when running late', why: 'The first twenty minutes are then wasted anyway', fix: 'Cut the session content, not the warm-up. It is cheaper.' },
    ],
    success: 'The player strikes the first ball of the session cleanly and in balance, and can say the warm-up made a difference without being asked leadingly.',
    notesLines: 2,
  },

  'yellow-between-points': {
    kind: 'worksheet',
    diagnosis: 'One bad point becomes three because nothing separates them. The player carries the last error into the next serve, tightens, and misses again — and by then it looks like a technical collapse when it started as twenty unmanaged seconds. A routine simple enough for a junior to actually use is worth more than a sophisticated one they abandon.',
    rows: [
      { label: '1 · Turn away', detail: 'Face the back fence. The point is finished either way.' },
      { label: '2 · One breath', detail: 'Breathe out slowly, longer than you breathed in. Shoulders drop.' },
      { label: '3 · Pick your target', detail: 'Decide where the next serve or return is going before you turn round.' },
      { label: '4 · Go', detail: 'Routine, then play. No changing your mind at the toss.' },
    ],
    prompts: [
      { heading: 'When do you forget to do it?', hint: 'Be specific — which score, which opponent, which shot.', lines: 2 },
      { heading: 'Your own words for step 3', hint: 'Something you would actually say to yourself.', lines: 2 },
    ],
    success: 'You complete all four steps on every point of two consecutive service games — including the games you lose. A coach watching from the side can see it without being told when to look.',
  },

  'yellow-scoring-sheet': {
    kind: 'worksheet',
    diagnosis: 'Players avoid entering competitions because they are quietly unsure about scoring, calls or what to do at a changeover — and they will rarely say so. It has nothing to do with tennis ability and it stops good players competing for months. One page removes the excuse.',
    rows: [
      { label: 'Game scoring', detail: '15, 30, 40, game. 40-40 is deuce; you need two points clear from there.' },
      { label: 'Set scoring', detail: 'First to six games, two clear. At 6-6 you play a tie-break unless told otherwise.' },
      { label: 'Tie-break', detail: 'First to seven, two clear. Change ends every six points. Serve one, then two each.' },
      { label: 'Calling the score', detail: 'Server calls it, out loud, before every point. Your score first.' },
      { label: 'Line calls', detail: 'You call your own side. If you are not sure, the ball was in. That is the rule, not politeness.' },
      { label: 'Changeovers', detail: 'Change ends after the first game, then every two games. Ninety seconds.' },
    ],
    prompts: [{ heading: 'Anything you are still unsure about', hint: 'Write it down and ask your coach — everyone has one.', lines: 2 }],
    success: 'You can call the score correctly through a full set, including a tie-break, without checking with anyone.',
  },

  'yellow-first-comp': {
    kind: 'worksheet',
    diagnosis: 'A first match is usually lost in the car park rather than on court. The player has no idea what the day looks like, so every unfamiliar thing becomes evidence that they should not be there. Preparing player and parent for the shape of the day makes nerves normal instead of a surprise.',
    rows: [
      { label: 'Before you leave', detail: 'Two rackets if you have them, water, food you actually like, spare shirt, sun cream.' },
      { label: 'When you arrive', detail: 'Find the referee\u2019s desk and check in. Then find your court and warm up properly.' },
      { label: 'The warm-up', detail: 'Five minutes with your opponent, including serves. It is part of the match, not a chat.' },
      { label: 'During the match', detail: 'Call your score before every point. Take your ninety seconds at changeovers. Drink.' },
      { label: 'Afterwards', detail: 'Shake hands whatever happened. Then tell your coach one thing that went well and one thing you would change.' },
    ],
    prompts: [
      { heading: 'What are you most nervous about?', hint: 'Naming it makes it smaller. Everyone has one.', lines: 2 },
      { heading: 'One thing you will do well regardless of the result', hint: 'Something you control — your routine, your effort, your attitude.', lines: 2 },
    ],
    success: 'You complete the day start to finish, keep your between-points routine going in at least one full game, and can name one thing you did well regardless of the score.',
  },
}
