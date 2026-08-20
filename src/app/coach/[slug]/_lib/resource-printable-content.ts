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

  'yellow-adult-8-session': {
    kind: 'plan',
    diagnosis: 'Returning adults arrive with one serviceable forehand and nothing else, and lessons drift into rallying because it is the only thing that works. Eight weeks later they have a slightly better forehand and no reason to keep paying. The block below deliberately spends weeks two and three on the backhand — the shot they will avoid unless a plan makes them face it.',
    goal: 'A player who can hold a rally on both wings, get a second serve in under pressure, and knows what to do with a short ball.',
    weeks: [
      { w: 1, focus: 'Assess & forehand', main: 'Baseline assessment, then contact point and shape on the forehand.', measure: '10-ball cooperative rally' },
      { w: 2, focus: 'Backhand build', main: 'Grip, turn and contact. Fed balls only — no rallying yet.', measure: '8/10 fed backhands over and in' },
      { w: 3, focus: 'Backhand under rally', main: 'Backhand cross-court cooperative rally.', measure: '6 consecutive backhands' },
      { w: 4, focus: 'Serve action', main: 'Throwing action first, then toss, then the whole serve at 60%.', measure: '10/20 serves in at 60%' },
      { w: 5, focus: 'Return & start', main: 'Return position and a neutral deep return.', measure: '12/20 returns past the service line' },
      { w: 6, focus: 'Short ball', main: 'Recognising the short ball, approach and first volley.', measure: 'Approach and volley won 5 of 10' },
      { w: 7, focus: 'Doubles shape', main: 'Positioning, whose ball, and the basic poach.', measure: 'Correct starting position all set' },
      { w: 8, focus: 'Play', main: 'Sets played, coach observing only. Review and next block agreed.', measure: 'Full set completed; plan agreed' },
    ],
    success: 'The player completes a full set, holds a six-ball rally on the backhand as well as the forehand, and gets a second serve in from 30-40 without a double fault.',
    notesLines: 3,
  },

  // ─── ORANGE ───────────────────────────────────────────────────────────────
  'orange-volley-progression': {
    kind: 'drill',
    diagnosis: 'Players swing at volleys because they treat them as short groundstrokes. The racket goes back, the ball is met late and behind the body, and the volley either sits up to be passed or drops into the net. It costs the player every point they earn by getting forward — which is why most players at this stage stop going forward at all.',
    objective: 'A blocked volley struck in front of the body with a still racket head, and the confidence to close the net behind it.',
    setup: ['Coach feeds from the baseline, basket of 30+.', 'Player starts at the service line, continental grip, racket up.', 'Two cones on the service line as the closing marker.'],
    progressions: [
      { name: 'Catch, don\u2019t hit', detail: 'Player catches the fed ball with the non-racket hand at the contact point. Establishes where the ball should be met before a racket is involved.', reps: '10 each side' },
      { name: 'Block volley, no backswing', detail: 'Racket stays in front. Coach feeds waist height. The only movement is a small step across and a firm wrist.', reps: '15 each side' },
      { name: 'Step and close', detail: 'Same feed, but the player moves through the cones after contact and finishes inside the service box.', reps: '10 each side' },
      { name: 'Two-ball point', detail: 'Feed a mid-court approach, then a passing ball. Player approaches, volleys, and plays the point out.', reps: '12 points' },
    ],
    cues: ['"Meet it where you can see it" — contact in front, inside the peripheral vision.', '"Short to the ball, long through it" — no takeback, but keep the racket moving forward.', '"Land as they hit" — the split-step times to the opponent\u2019s contact, not to your own arrival.'],
    faults: [
      { fault: 'Racket takes a backswing', why: 'Late contact, no control of depth', fix: 'Restart at step 2 with the coach holding the racket throat — the player feels the block with no swing available.' },
      { fault: 'Volley played beside the hip', why: 'Ball sits up and gets passed', fix: 'Return to the catching drill. If they cannot catch it in front, they cannot volley it in front.' },
      { fault: 'Stops moving after contact', why: 'Caught mid-court on the reply', fix: 'Cones become a gate they must pass through before the next feed is released.' },
    ],
    success: 'Eight of ten volleys land past the service line with the player finishing inside the service box, without the racket passing behind the shoulder.',
    progress: 'Harder: feed lower and wider, or add a lob into the two-ball point. Easier: feed from mid-court and slow the ball down before dropping the feed distance back.',
    court: { zones: [
      { x: 0.115, y: 0.06, w: 0.385, h: 0.2, label: 'Deep', colour: '#f08a24' },
      { x: 0.5, y: 0.06, w: 0.385, h: 0.2, label: 'Deep', colour: '#f08a24' },
      { x: 0.115, y: 0.62, w: 0.77, h: 0.12, label: 'Close through here', colour: '#3A8EE0' },
    ], note: 'Player starts on the service line, volleys deep into either orange zone, then closes.' },
    notesLines: 3,
  },

  'orange-6-week-block': {
    kind: 'plan',
    diagnosis: 'Racket awards get handed out on time served rather than evidence, which devalues every award above them — players notice quickly when the badge means nothing. This block sequences the Orange criteria and puts a measure against each week so the award is earned in front of the player.',
    goal: 'Meet the Orange racket criteria on evidence, with the player able to say what they did to earn it.',
    weeks: [
      { w: 1, focus: 'Rally depth', main: 'Cross-court zone rallying, depth past the service line.', measure: '10 consecutive in the zone' },
      { w: 2, focus: 'Recovery', main: 'Hit and recover to the middle, split-step timed to the feed.', measure: '20 feeds with recovery unprompted' },
      { w: 3, focus: 'First pattern', main: 'Wide then middle. Two-shot patterns introduced.', measure: 'Pattern executed 6 of 10' },
      { w: 4, focus: 'Net', main: 'Approach, split, first volley as one movement.', measure: '8/10 volleys past the service line' },
      { w: 5, focus: 'Serve targets', main: 'Body, wide and T called before the toss.', measure: '3 of 5 to the called target' },
      { w: 6, focus: 'Assess', main: 'Match play plus the Orange racket assessment.', measure: 'Orange criteria met' },
    ],
    success: 'The player holds a ten-ball cross-court rally with depth, recovers without prompting, executes a named two-shot pattern six times in ten, and serves to a called target three times in five.',
    notesLines: 3,
  },

  'orange-two-shot-patterns': {
    kind: 'drill',
    diagnosis: 'Players hit good individual shots in no particular order and then wonder why points do not go anywhere. Nothing is wrong with the strokes — there is simply no intention connecting them. A pattern is the first time a player makes the opponent do something rather than just returning the ball.',
    objective: 'One deliberate two-shot pattern the player can name, set up and finish.',
    setup: ['Cones marking a wide zone and a middle zone on the far side.', 'Coach feeds neutral balls from the baseline.'],
    progressions: [
      { name: 'Name it', detail: 'Coach explains the pattern: pull them wide, then hit behind them or into the space. Player repeats it back in their own words.', reps: 'once' },
      { name: 'Fed pattern', detail: 'Coach feeds; player hits wide, coach returns from the corner, player plays the second ball into the open space.', reps: '10 each side' },
      { name: 'Pattern under rally', detail: 'Cooperative rally where the player must set up and finish the pattern at least once every six balls.', reps: '5 minutes' },
      { name: 'Pattern points', detail: 'Points played. A point won via the pattern scores double.', reps: '11 points' },
    ],
    cues: ['"Wide first, then behind" — the first ball creates the second.', '"Move them, then move the ball."', '"Do not finish from a bad ball" — the pattern only starts from a neutral or better position.'],
    faults: [
      { fault: 'Goes for the finish from the first ball', why: 'The opponent was never moved; low-percentage winner attempted', fix: 'First ball must land in the wide zone before the finish counts.' },
      { fault: 'Hits the second ball back to the same corner', why: 'Undoes the work of the first ball', fix: 'Call the target out loud before the second ball for a few reps.' },
      { fault: 'Cannot name the pattern afterwards', why: 'It was an accident, not a decision', fix: 'Player states the pattern before each point starts.' },
    ],
    success: 'Six of ten points where the player sets up and finishes the named pattern, and can describe it unprompted at the end of the session.',
    court: { zones: [
      { x: 0.115, y: 0.1, w: 0.25, h: 0.24, label: '1 · Wide', colour: '#f08a24' },
      { x: 0.63, y: 0.1, w: 0.255, h: 0.24, label: '2 · Space', colour: '#3A8EE0' },
    ], note: 'Ball one into the wide zone to move them; ball two into the space it opened.' },
    notesLines: 3,
  },

  'orange-approach-volley': {
    kind: 'drill',
    diagnosis: 'Approaches float and get passed because the player stops running once they have hit. They arrive flat-footed just inside the baseline — the worst place on the court — and volley from their shoelaces. The fault is not the approach shot; it is that the approach and the volley are being treated as two separate events.',
    objective: 'Approach, split and first volley executed as one continuous movement.',
    setup: ['Coach feeds a short ball to mid-court.', 'Cone at the service line as the split marker.'],
    progressions: [
      { name: 'Approach only', detail: 'Player hits the short ball down the line and keeps moving to the cone. No volley yet — just arrive balanced.', reps: '10 each side' },
      { name: 'Split at the cone', detail: 'Same, but the split-step must land as the coach makes contact with the next ball.', reps: '10 each side' },
      { name: 'Approach and volley', detail: 'Full sequence: approach, split, first volley into the open court.', reps: '12 each side' },
      { name: 'Live point', detail: 'Coach can pass or lob. Player plays it out from wherever they arrive.', reps: '12 points' },
    ],
    cues: ['"Hit it and go" — the shot is not finished until you are at the cone.', '"Down the line to approach" — cross-court approaches give away the pass.', '"Split as they hit, not when you arrive."'],
    faults: [
      { fault: 'Stops on the baseline after the approach', why: 'Volley taken at the feet from no-man\u2019s land', fix: 'Cone gate — the ball is not released until they pass it.' },
      { fault: 'Approach hit cross-court', why: 'Opens the down-the-line pass', fix: 'Only down-the-line approaches score for two sessions.' },
      { fault: 'Split-step timed to arrival', why: 'Rooted when the pass comes', fix: 'Coach calls "now" at their own contact until the timing sticks.' },
    ],
    success: 'Eight of twelve sequences where the split lands on the coach\u2019s contact and the first volley is played in front of the service line.',
    notesLines: 2,
  },

  'orange-unit-turn': {
    kind: 'drill',
    diagnosis: 'Late preparation shows up as a jammed contact point and an arm-only swing — the player looks rushed even on slow balls. The cause is almost always that the turn waits for the bounce. Turning before the bounce buys back roughly half a second on every ball, which is more than any footwork drill will give you.',
    objective: 'A shoulder turn completed before the ball bounces on the player\u2019s side.',
    setup: ['Coach feeds from mid-court, slow and predictable to begin.', 'Coach calls "turn" at their own contact.'],
    progressions: [
      { name: 'Call and turn', detail: 'Coach calls "turn" as they strike. Player turns immediately, before tracking where the ball is going.', reps: '15 balls' },
      { name: 'Turn and freeze', detail: 'Player turns and freezes as the ball bounces so the coach can check the position, then plays the ball.', reps: '15 balls' },
      { name: 'Silent turn', detail: 'No call. Player turns on their own read.', reps: '20 balls' },
      { name: 'Rally with turns', detail: 'Cooperative rally. Coach calls out any ball where the turn came after the bounce.', reps: '5 minutes' },
    ],
    cues: ['"Turn on their contact, not on your bounce."', '"Non-hitting hand across" — that is what turns the shoulders.', '"Early and slow beats late and fast."'],
    faults: [
      { fault: 'Turn happens after the bounce', why: 'Contact jams up; swing becomes arm-only', fix: 'Back to the coach calling "turn". Exaggerate how early it feels.' },
      { fault: 'Racket goes back but shoulders stay square', why: 'No coil, so no power source', fix: 'Freeze check — the coach should see the player\u2019s back shoulder from across the net.' },
    ],
    success: 'Twenty consecutive balls where the shoulder turn is complete before the ball bounces, verified by the coach on a freeze check every fifth ball.',
    notesLines: 2,
  },

  'orange-serve-targets': {
    kind: 'drill',
    diagnosis: 'A serve aimed only at "the box" is a serve the returner never has to respect — they stand in one place and swing freely. Adding targets does not require more power; it requires the player to decide before the toss, which is a habit rather than a skill.',
    objective: 'Three named targets — body, wide, T — hit on demand from a called intention.',
    setup: ['Cones or targets in each service box at wide, body and T.', 'Basket of balls, both boxes.'],
    progressions: [
      { name: 'One target at a time', detail: 'Five serves to the T only, then five wide, then five body.', reps: '15 each box' },
      { name: 'Call it first', detail: 'Player names the target out loud before the toss, then serves.', reps: '15 serves' },
      { name: 'Coach calls', detail: 'Coach names the target as the player steps up. Adds the decision under mild pressure.', reps: '15 serves' },
      { name: 'Under score', detail: 'Serve out games. Target must still be called before every first serve.', reps: '3 games' },
    ],
    cues: ['"Decide, then toss" — never the other way round.', '"Body serve is a real serve, not a miss."', '"Same toss, different target" — a readable toss gives it away.'],
    faults: [
      { fault: 'Toss moves with the target', why: 'Returner reads the serve before it is struck', fix: 'Mark the toss position on the court and keep it identical across all three targets.' },
      { fault: 'Only ever serves to the T', why: 'Predictable; returner cheats across', fix: 'Coach calls the target so the player cannot default.' },
      { fault: 'Decides during the toss', why: 'Action breaks down mid-serve', fix: 'Call it out loud until the decision reliably comes first.' },
    ],
    success: 'Three of five serves to the called target in each of the three positions, with the toss landing in the same spot each time.',
    court: { zones: [
      { x: 0.115, y: 0.26, w: 0.13, h: 0.24, label: 'Wide', colour: '#f08a24' },
      { x: 0.37, y: 0.26, w: 0.13, h: 0.24, label: 'T', colour: '#f08a24' },
    ], note: 'Targets in the deuce box shown; mirror them for the advantage court. Body serve sits between the two.' },
    notesLines: 2,
  },

  'orange-agility-ladder': {
    kind: 'drill',
    diagnosis: 'Split-steps are late because feet are slow, not because the player lacks fitness — and a late split means the first step goes nowhere. Fifteen minutes of off-court foot speed transfers directly to the first metre on court, which is the metre that decides whether a ball is reachable.',
    objective: 'Faster foot contacts and a split-step that lands rather than lands late.',
    setup: ['Agility ladder or six throw-down lines.', 'Off court or on a spare court.'],
    progressions: [
      { name: 'One foot per box', detail: 'Through the ladder, one contact per box, as fast as control allows.', reps: '4 lengths' },
      { name: 'Two feet per box', detail: 'Both feet in each box. Quick and quiet.', reps: '4 lengths' },
      { name: 'Lateral in-out', detail: 'Side-on, both feet in then both feet out. Both directions.', reps: '4 lengths' },
      { name: 'Ladder into split', detail: 'Through the ladder, then a split-step on the coach\u2019s call and an explosive first step either way.', reps: '8 reps' },
    ],
    cues: ['"Quiet feet are fast feet."', '"Ground contact, not ground time."', '"The ladder is the warm-up — the split at the end is the point."'],
    faults: [
      { fault: 'Heavy, slapping contacts', why: 'Ground time too long; no speed gained', fix: 'Slow it down until it is quiet, then rebuild speed.' },
      { fault: 'Ladder done well, split forgotten', why: 'The transfer to tennis is lost', fix: 'Never finish a set without the split and first step.' },
    ],
    success: 'Four clean lengths of each pattern with quiet feet, finishing with eight split-steps that land on the call and produce an immediate first step.',
    notesLines: 2,
  },

  'orange-effort-card': {
    kind: 'worksheet',
    diagnosis: 'Juniors judge a match purely by the result, so a good performance in a loss teaches them nothing and a poor performance in a win teaches them the wrong thing. Scoring the things they control changes what they pay attention to — and it gives the parent in the car afterwards something to ask about other than the score.',
    rows: [
      { label: 'Effort', detail: 'Did you run for every ball, including the ones you were not going to reach?' },
      { label: 'Routine', detail: 'Did you do your between-points routine, including when you were behind?' },
      { label: 'Attitude', detail: 'Racket down, head up, opponent respected — all match, not just when winning.' },
      { label: 'The plan', detail: 'Did you stick to what you and your coach agreed before the match?' },
    ],
    prompts: [
      { heading: 'Score each one out of 5 — be honest', hint: 'The score of the match does not go on this card anywhere.', lines: 2 },
      { heading: 'One thing to do better next time', lines: 2 },
    ],
    success: 'Four cards completed across four matches, and the player can point to something that improved which has nothing to do with whether they won.',
  },

  'orange-home-practice': {
    kind: 'worksheet',
    diagnosis: 'Parents ask what to do between lessons and get told "keep practising", which is not an instruction anybody can follow. Fifteen specific minutes against a wall does more for a developing player than an extra half-hour lesson a month, and it costs nothing.',
    rows: [
      { label: 'Ball control · 3 min', detail: 'Bounce the ball up on the racket face, then down to the ground, then alternate. Count your record.' },
      { label: 'Wall rally · 5 min', detail: 'Forehands against a wall, aiming above a chalk line a metre up. Count your longest streak.' },
      { label: 'Backhand wall · 4 min', detail: 'Same again on the backhand — the side that will be avoided unless it is written down.' },
      { label: 'Serve toss · 3 min', detail: 'Toss and catch without moving your feet. Ten in a row landing in the same spot.' },
    ],
    prompts: [
      { heading: 'Your records — beat them next week', hint: 'Longest wall rally, most tosses in a row.', lines: 2 },
      { heading: 'Days you practised this week', lines: 2 },
    ],
    success: 'Fifteen minutes on four days in a week, with the wall-rally record higher at the end of the week than at the start.',
  },

  'orange-doubles-basics': {
    kind: 'drill',
    diagnosis: 'Club doubles is usually two players watching one ball. Nobody has agreed who covers what, so the middle ball goes unplayed and both players blame the other. Positioning has to be settled before anything tactical is worth coaching.',
    objective: 'Correct starting positions and a clear rule for whose ball it is.',
    setup: ['Four players, or two plus the coach.', 'Throw-down markers at the four starting positions.'],
    progressions: [
      { name: 'Stand where you belong', detail: 'Set up server, server\u2019s partner, returner and returner\u2019s partner on the markers. Coach checks every position.', reps: '4 rotations' },
      { name: 'Whose ball', detail: 'Coach feeds down the middle. The player whose forehand it is takes it — call "mine" out loud.', reps: '12 feeds' },
      { name: 'Move as a pair', detail: 'Pairs shift together left and right, staying connected. Coach feeds wide to test the gap.', reps: '10 feeds' },
      { name: 'Points from position', detail: 'Points played. Any point where a player started in the wrong position is replayed.', reps: '11 points' },
    ],
    cues: ['"Call it, every time" — silence is how middle balls are lost.', '"Move together, like you are on a rope."', '"Server\u2019s partner is at the net, not on the baseline keeping them company."'],
    faults: [
      { fault: 'Both players on the baseline', why: 'Gives up the net and the point', fix: 'Replay any point that starts with two players back.' },
      { fault: 'Middle ball left by both', why: 'Point lost with nobody at fault', fix: 'Forehand takes the middle. Call it out loud until it is automatic.' },
      { fault: 'Partners drift apart when pulled wide', why: 'Gap opens down the middle', fix: 'Rope drill — pairs move together, distance between them fixed.' },
    ],
    success: 'Eleven points played with correct starting positions every time, and every middle ball called and taken by one player without hesitation.',
    notesLines: 2,
  },

  // ─── GREEN ────────────────────────────────────────────────────────────────
  'green-serve-mechanics': {
    kind: 'drill',
    diagnosis: 'An inconsistent toss forces a different serve every single time, which means no fault is ever fixable — coach and player are both chasing a moving target. Everything above the toss stays broken until the toss is fixed, so it goes first regardless of what else looks wrong.',
    objective: 'A repeatable toss and trophy position the player can rebuild themselves when it drifts.',
    setup: ['A hoop, cone or racket laid on the court to mark the toss landing spot.', 'Basket of balls, one box.'],
    progressions: [
      { name: 'Toss and let it drop', detail: 'Player tosses and lets the ball land without hitting. It must land in the marked spot.', reps: '10 tosses' },
      { name: 'Trophy and hold', detail: 'Toss, reach trophy position, hold for two seconds. Coach checks racket tip up, front shoulder closed, weight loaded.', reps: '10 holds' },
      { name: 'From trophy only', detail: 'Start at trophy — no wind-up. Feel the racket drop behind the back before contact.', reps: '15 serves' },
      { name: 'Whole action, 60%', detail: 'Full serve at low pace. Rhythm before speed, every time.', reps: '20 serves' },
    ],
    cues: ['"Place it, do not throw it" — the toss is a lift, not a throw.', '"Racket tip to the sky at trophy."', '"Slow to trophy, fast from trophy."'],
    faults: [
      { fault: 'Toss lands in a different place each time', why: 'Every serve is a new serve; nothing can be corrected', fix: 'Back to step 1. Ten in the hoop before a racket is swung.' },
      { fault: 'Toss too far behind the head', why: 'Back arches, shoulder loads badly, serve goes long', fix: 'Mark the spot slightly inside the baseline and in front of the tossing shoulder.' },
      { fault: 'No pause at trophy', why: 'Rushed action with no racket drop', fix: 'Two-second hold on every rep until the position is reliable.' },
    ],
    success: 'Eight of ten tosses land in the marked spot, and fifteen of twenty serves land in the box at 60% pace with a visible trophy position.',
    notesLines: 3,
  },

  'green-8-week-block': {
    kind: 'plan',
    diagnosis: 'An inconsistent toss forces a different serve every time, so no fault is ever fixable. This block is sequenced behind fixing the toss first, because nothing above it can hold until it does — and it ends with the serve under a real score rather than in a basket.',
    goal: 'Meet the Green racket serve criteria with a repeatable action the player can rebuild themselves.',
    weeks: [
      { w: 1, focus: 'Toss consistency', main: 'Toss into a hoop at full extension, no racket. Then toss and catch.', measure: '8/10 tosses land in the hoop' },
      { w: 2, focus: 'Trophy position', main: 'Shadow serves to trophy, hold two seconds, check racket tip and front shoulder.', measure: '10 clean coach-checked holds' },
      { w: 3, focus: 'Racket drop', main: 'Serve from trophy only — no wind-up. Feel the drop behind the back.', measure: '15 serves in from a trophy start' },
      { w: 4, focus: 'Full action, low pace', main: 'Whole serve at 60% into the box. Rhythm over speed.', measure: '60% of first serves in at 60% pace' },
      { w: 5, focus: 'Pronation & spin', main: 'Edge-on to contact, brush up the back of the ball.', measure: 'Visible spin on 10 of 15' },
      { w: 6, focus: 'Targets', main: 'Body, wide and T. Five serves each, called before the toss.', measure: '3 of 5 to the called target' },
      { w: 7, focus: 'Second serve', main: 'Heavy topspin second, full two-serve routine with a consequence for a double.', measure: 'No more than 2 doubles in 5 games' },
      { w: 8, focus: 'Under score', main: 'Serving out games from 30-30, full routine every point.', measure: 'Green racket serve criteria met' },
    ],
    success: 'The player serves out two games from 30-30 using the full routine, hits three of five to a called target, and doubles no more than twice across five service games. Earned on evidence, not on eight weeks having passed.',
    notesLines: 3,
  },

  'green-three-zone': {
    kind: 'drill',
    diagnosis: 'Short balls invite attack, and at this stage opponents finally punish them — the same ball that was harmless a year ago now loses the point. Players cannot fix what they cannot name, so the court gets divided into zones they can call out and aim at.',
    objective: 'Landing zones the player can name and hit on demand, with deep as the default.',
    setup: ['Throw-down lines dividing the far court into three depth zones: short, middle, deep.', 'Cooperative rally from the baseline.'],
    progressions: [
      { name: 'Name the zone', detail: 'Player calls out which zone each of their own balls landed in, immediately after it bounces.', reps: '20 balls' },
      { name: 'Deep only', detail: 'Cooperative rally counting only balls landing in the deep zone.', reps: '10 in the zone' },
      { name: 'Called zone', detail: 'Coach calls a zone before each feed; player hits it.', reps: '20 balls' },
      { name: 'Zone points', detail: 'Points where a ball landing short loses the point regardless of whether it was in.', reps: '11 points' },
    ],
    cues: ['"Deep is the default, short is a decision."', '"Call it, then own it" — naming the zone builds the feedback loop.', '"Depth comes from height, not from force."'],
    faults: [
      { fault: 'Cannot tell where their own ball landed', why: 'No feedback loop; the fault repeats forever', fix: 'Calling the zone out loud on every ball until it is accurate.' },
      { fault: 'Hits harder to get depth', why: 'Error rate climbs; depth still inconsistent', fix: 'Net-clearance rope. Depth from trajectory, not pace.' },
    ],
    success: 'Ten consecutive rally balls into the deep zone, and eight of ten balls landing in a coach-called zone.',
    court: { zones: [
      { x: 0.115, y: 0.06, w: 0.77, h: 0.16, label: 'Deep', colour: '#3fbf6a' },
      { x: 0.115, y: 0.22, w: 0.77, h: 0.13, label: 'Middle', colour: '#d9a91f' },
      { x: 0.115, y: 0.35, w: 0.77, h: 0.15, label: 'Short', colour: '#e0483f' },
    ], note: 'Deep scores, middle is neutral, short loses the point during the points phase.' },
    notesLines: 2,
  },

  'green-play-to-twelve': {
    kind: 'drill',
    diagnosis: 'Players go for the winner on ball four because nobody has ever asked them to hit ball twelve. Their tolerance is set by habit rather than ability, and against a steadier opponent they lose matches they are technically capable of winning.',
    objective: 'Extending rally tolerance to twelve balls without a drop in quality.',
    setup: ['Both players baseline, cooperative to begin.', 'Coach counts out loud — the number is the point of the drill.'],
    progressions: [
      { name: 'Count to eight', detail: 'Cooperative rally to eight. Quality maintained — no floating just to survive.', reps: '5 rallies' },
      { name: 'Count to twelve', detail: 'Same to twelve. Any rally that breaks restarts at one.', reps: '5 rallies' },
      { name: 'Twelve then play', detail: 'Twelve cooperative balls, then the point is live.', reps: '11 points' },
      { name: 'Tolerance points', detail: 'Points played where any winner attempted before ball six loses the point.', reps: '11 points' },
    ],
    cues: ['"The rally is not a queue for the winner."', '"Neutral is a shot, not a failure."', '"Win the rally, do not end it."'],
    faults: [
      { fault: 'Quality drops to survive the count', why: 'Trains floating, which is worse than the original problem', fix: 'Add the depth zone — short balls do not count towards the total.' },
      { fault: 'Goes for it at ball five every time', why: 'Loses to steadier players', fix: 'Six-ball rule in the points phase, strictly enforced.' },
    ],
    success: 'Five rallies of twelve balls with every ball landing past the service line, then eleven points with no winner attempted before ball six.',
    notesLines: 2,
  },

  'green-return-positions': {
    kind: 'drill',
    diagnosis: 'Returners stand in one spot for every serve, so the server dictates from the first ball of every point. The player is not choosing a position — they have only ever had one. Two positions and a reason to pick between them changes the whole complexion of the return game.',
    objective: 'A deep position and a stepped-in position, chosen deliberately by serve type.',
    setup: ['Markers a metre behind the baseline and just inside it.', 'Coach or partner serving.'],
    progressions: [
      { name: 'Deep return', detail: 'From the deep marker, return every first serve. Aim is depth, not a winner.', reps: '15 returns' },
      { name: 'Stepped in', detail: 'From inside the baseline, return second serves. Take the ball early.', reps: '15 returns' },
      { name: 'Pick your spot', detail: 'Server mixes first and second serves. Returner moves to the appropriate marker before the toss.', reps: '20 returns' },
      { name: 'Return games', detail: 'Play return games. Position must be chosen and stated before each point.', reps: '3 games' },
    ],
    cues: ['"Back on the first, in on the second."', '"Deep and central beats clever and short."', '"Move before the toss, not during it."'],
    faults: [
      { fault: 'Same position for every serve', why: 'Server dictates every point', fix: 'Markers on the court; the point does not start until they are on one.' },
      { fault: 'Goes for a winner off the second serve', why: 'Gives back the advantage', fix: 'Target is deep and central for two sessions. Winners come later.' },
      { fault: 'Moves in as the ball is struck', why: 'Caught between positions and off balance', fix: 'Position set before the toss, split-step on their contact.' },
    ],
    success: 'Twelve of twenty returns land past the service line, with the correct position chosen before the toss on every point of three return games.',
    notesLines: 2,
  },

  'green-endurance-intervals': {
    kind: 'drill',
    diagnosis: 'Level drops in the third set because training never went past twenty minutes of continuous work. It is rarely a general fitness problem — it is that tennis is repeated short efforts with short recoveries, and running steadily for half an hour trains almost none of that.',
    objective: 'Repeated efforts matched to real point length, with real recovery times.',
    setup: ['Court, cones at the baseline corners and the centre.', 'Stopwatch or phone timer.'],
    progressions: [
      { name: 'Point-length efforts', detail: 'Side-to-side movement for 8 seconds, 20 seconds recovery. That is the shape of an actual point.', reps: '10 reps' },
      { name: 'Extended points', detail: '20 seconds of work, 25 seconds recovery. Longer rallies.', reps: '8 reps' },
      { name: 'Changeover set', detail: 'Six efforts, then 90 seconds rest — one game with a changeover.', reps: '3 sets' },
      { name: 'With a racket', detail: 'Same intervals shadowing strokes, so the movement pattern matches the game.', reps: '2 sets' },
    ],
    cues: ['"Work like a point, rest like a point."', '"Recovery is training too — do not cut it short."'],
    faults: [
      { fault: 'Efforts too long and too slow', why: 'Trains the wrong energy system entirely', fix: 'Cap at 20 seconds and demand full intensity.' },
      { fault: 'Skipping the recovery', why: 'Turns it into a steady run', fix: 'Timer runs the session, not the player.' },
    ],
    success: 'Three full changeover sets completed with the last effort of the final set at the same intensity as the first.',
    notesLines: 2,
  },

  'green-goal-setting': {
    kind: 'worksheet',
    diagnosis: 'Players train hard with no idea what they are training towards, so effort goes into whatever felt worst last week. Written goals across all four areas stop the technical work crowding out everything else — which it always does, because it is the most visible.',
    rows: [
      { label: 'Technical', detail: 'One shot or mechanic. Be specific — "second serve toss consistency", not "my serve".' },
      { label: 'Tactical', detail: 'One pattern or decision. What will you do more of, and when?' },
      { label: 'Physical', detail: 'One measurable thing. A time, a number, a distance.' },
      { label: 'Mental', detail: 'One habit. Usually a routine, and usually the one that slips under pressure.' },
    ],
    prompts: [
      { heading: 'How will you know you have got there?', hint: 'A number or an observable thing, not "it feels better".', lines: 3 },
      { heading: 'Review — what actually changed?', hint: 'Fill this in at the end of the term, honestly.', lines: 3 },
    ],
    success: 'All four goals written with a measure attached, and at the end of term you can say which ones moved and which did not — without guessing.',
  },

  'green-lta-pathway': {
    kind: 'worksheet',
    diagnosis: 'Families make decisions about competition, coaching and squads without knowing how the pathway fits together, so they either push too hard too early or miss the window entirely. Understanding the map is what makes the decisions calm.',
    rows: [
      { label: 'Ball stages', detail: 'Red, orange, green, then yellow. The ball matches the court size and the player, not their age.' },
      { label: 'LTA Youth Start', detail: 'Learning to rally and play. The goal is competence and enjoyment, not results.' },
      { label: 'LTA Youth Compete', detail: 'Graded competition — a structure that means a first tournament is against similar players.' },
      { label: 'County & regional', detail: 'Selection based on results and assessment. Where consistent competition starts to matter.' },
      { label: 'National & performance', detail: 'Full-time training environments. Relevant to very few, and much later than most parents expect.' },
    ],
    prompts: [
      { heading: 'Where is your player now, honestly?', lines: 2 },
      { heading: 'What is the next step — and what would earn it?', hint: 'Ask your coach for the specific criteria.', lines: 3 },
    ],
    success: 'You can explain where your player sits, what the next stage is, and what specifically would earn it — without reference to their age.',
  },

  'green-serve-plus-one': {
    kind: 'drill',
    diagnosis: 'A good serve is wasted when the next ball has no plan — the player wins the advantage with the serve and then hands it straight back with an aimless second shot. At this stage the serve is finally good enough for the shot after it to be the thing that matters.',
    objective: 'A pre-decided first groundstroke linked to the serve.',
    setup: ['Cones marking the open court on both sides.', 'Basket of balls; coach returns the serve.'],
    progressions: [
      { name: 'Serve wide, forehand cross', detail: 'Serve wide, coach returns, player hits the forehand into the open court. Decided in advance.', reps: '10 each side' },
      { name: 'Serve T, forehand behind', detail: 'Serve down the T, then hit behind the returner as they recover.', reps: '10 each side' },
      { name: 'Call the pattern', detail: 'Player names the serve and the plus-one before the toss.', reps: '15 points' },
      { name: 'Under score', detail: 'Serve games where a point won on the plus-one scores double.', reps: '3 games' },
    ],
    cues: ['"Serve to create the next ball, not to win the point."', '"Decide both shots before the toss."', '"Wide serve opens the court — use it or the serve was wasted."'],
    faults: [
      { fault: 'No plan for ball three', why: 'The advantage the serve created is given straight back', fix: 'Both shots named out loud before the toss.' },
      { fault: 'Plus-one hit back to the returner', why: 'Undoes the serve entirely', fix: 'Cones in the open court; only those score.' },
      { fault: 'Serves for an ace instead', why: 'Low percentage, and the pattern never gets practised', fix: 'Aces score zero for this drill.' },
    ],
    success: 'Six of ten points where the serve and the planned plus-one are both executed, and the player names the pattern before every toss.',
    court: { zones: [
      { x: 0.115, y: 0.26, w: 0.13, h: 0.24, label: '1 · Wide', colour: '#3fbf6a' },
      { x: 0.63, y: 0.1, w: 0.255, h: 0.22, label: '2 · Open court', colour: '#3A8EE0' },
    ], note: 'Wide serve to open the court, then the plus-one into the space it created.' },
    notesLines: 3,
  },

  // ─── BLUE ─────────────────────────────────────────────────────────────────
  'blue-slice-backhand': {
    kind: 'drill',
    diagnosis: 'A player with one backhand has one answer to every ball, so a good opponent simply keeps feeding the shot they cannot vary. The slice is not a defensive shot at this level — it is what lets the player change rhythm, approach, and buy time without losing the point.',
    objective: 'A slice that stays low, travels forward, and can be used to defend or to approach.',
    setup: ['Continental grip.', 'Coach feeds waist height from mid-court.', 'A rope or line low over the net to demand a flat trajectory.'],
    progressions: [
      { name: 'Knife the ball', detail: 'Short swing, high to low, racket face slightly open. Ball must stay below the rope.', reps: '15 balls' },
      { name: 'Carry, do not chop', detail: 'Longer follow-through out towards the target. The ball should travel, not sit up.', reps: '15 balls' },
      { name: 'Defensive slice', detail: 'Coach feeds deep and heavy; player slices high and deep to reset the point.', reps: '12 balls' },
      { name: 'Approach slice', detail: 'Short ball, sliced down the line, player follows it in.', reps: '10 each side' },
    ],
    cues: ['"High to low, and out towards the target."', '"Carry it, do not chop it" — chopping makes it sit up.', '"Stay down through the shot" — standing up lifts the ball.'],
    faults: [
      { fault: 'Ball floats and sits up', why: 'Gets attacked; worse than the shot it replaced', fix: 'Rope over the net. Anything above it does not count.' },
      { fault: 'Chopping down with no follow-through', why: 'No depth; lands short', fix: 'Finish out towards the target, not down at the court.' },
      { fault: 'Standing up through contact', why: 'Face opens; ball lifts', fix: 'Knees bent, eyes level through the shot. Coach checks head height at contact.' },
    ],
    success: 'Twelve of fifteen slices stay below the rope and land past the service line, and the approach slice is used successfully in five of ten live points.',
    notesLines: 2,
  },

  'blue-inside-out': {
    kind: 'drill',
    diagnosis: 'Running around the backhand achieves nothing if the forehand then goes cross-court — the player has vacated half the court to hit the ball back where the opponent already is. It is a footwork drill and a target drill at the same time, and coaching either one alone leaves it broken.',
    objective: 'Correct footwork around the backhand with the ball going inside-out into the open court.',
    setup: ['Cone marking the inside-out target in the far corner.', 'Coach feeds to the backhand side.'],
    progressions: [
      { name: 'Footwork only', detail: 'Shadow the movement around the ball — small steps, get outside it, not behind it.', reps: '10 reps' },
      { name: 'Fed inside-out', detail: 'Feed to the backhand corner; player runs around and hits inside-out to the cone.', reps: '12 balls' },
      { name: 'Recover after', detail: 'Same, but the player must recover past the centre mark before the next feed.', reps: '12 balls' },
      { name: 'Inside-in option', detail: 'Coach calls "out" or "in" as the feed is released. Adds the decision.', reps: '15 balls' },
    ],
    cues: ['"Get outside the ball, not behind it."', '"Run around it to hurt them, not to avoid the backhand."', '"Recover further — you have opened your own court."'],
    faults: [
      { fault: 'Hits it cross-court after running around', why: 'Court vacated for nothing', fix: 'Cone target; only inside-out counts for two sessions.' },
      { fault: 'Ends up behind the ball, cramped', why: 'No swing space; arm-only shot', fix: 'Back to shadow footwork — the last step goes across, not backwards.' },
      { fault: 'No recovery afterwards', why: 'Wide open on the reply', fix: 'Must touch past the centre mark before the next ball is fed.' },
    ],
    success: 'Nine of twelve inside-out forehands land in the target zone with a recovery step past the centre mark on every rep.',
    court: { zones: [
      { x: 0.63, y: 0.06, w: 0.255, h: 0.22, label: 'Inside-out', colour: '#3A8EE0' },
      { x: 0.42, y: 0.82, w: 0.16, h: 0.12, label: 'Recover', colour: '#3fbf6a' },
    ], note: 'Ball goes to the far corner; the player recovers past the centre mark before the next feed.' },
    notesLines: 2,
  },

  'blue-ball-reading': {
    kind: 'drill',
    diagnosis: 'At this level most errors are decision errors rather than stroke errors — the player attacks a defensive ball, or floats a neutral one they should have driven. Technique is fine; the read is missing. Naming the ball before choosing the shot is what separates it out.',
    objective: 'Reading each incoming ball as attack, neutral or defend, and choosing the matching shot.',
    setup: ['Coach feeds a mix of deep, mid and short balls.', 'Player calls the ball type out loud before hitting it.'],
    progressions: [
      { name: 'Call it', detail: 'Player calls "attack", "neutral" or "defend" as the ball crosses the net. No shot requirement yet.', reps: '20 balls' },
      { name: 'Call and match', detail: 'Same, but the shot must match the call — defend goes high and deep, attack goes forward.', reps: '20 balls' },
      { name: 'Coach checks the call', detail: 'Coach overrules a wrong call. Player replays the ball with the correct response.', reps: '20 balls' },
      { name: 'Live points', detail: 'Points played; coach notes any shot that did not match the ball it came from.', reps: '11 points' },
    ],
    cues: ['"Read it, then hit it — in that order."', '"Deep and low means defend. Short and sitting means attack. Everything else is neutral."', '"There is no shame in a neutral ball."'],
    faults: [
      { fault: 'Attacks a defensive ball', why: 'Highest-frequency error at this level', fix: 'Calling out loud until the read is automatic, then remove the call.' },
      { fault: 'Everything called neutral', why: 'Attackable balls go unpunished', fix: 'Coach feeds obvious short balls and insists on the attack call.' },
      { fault: 'Correct call, wrong shot', why: 'Read exists but the response is not linked', fix: 'Replay the ball immediately with the matching response.' },
    ],
    success: 'Eighteen of twenty calls agreed by the coach, with the shot matching the call each time — and the same accuracy sustained through eleven live points.',
    notesLines: 3,
  },

  'blue-second-serve': {
    kind: 'drill',
    diagnosis: 'A second serve practised without consequence collapses at 30-40, because the player has never felt what that serve is like when it matters. Basket practice builds the action; only a score builds the serve.',
    objective: 'A second serve with spin and a target that holds up under a real score.',
    setup: ['Basket of balls.', 'A consequence agreed before starting — press-ups, a lost point, court sprints.'],
    progressions: [
      { name: 'Spin only', detail: 'Second serves with clear topspin, no target. Height over the net and a dipping ball.', reps: '20 serves' },
      { name: 'Spin to a target', detail: 'Second serve to the backhand side of the box.', reps: '20 serves' },
      { name: 'Two-serve routine', detail: 'First serve then second serve, full routine. Double faults carry the agreed consequence.', reps: '15 pairs' },
      { name: 'From 30-40', detail: 'Serve out points starting at 30-40 down. Second serves only.', reps: '10 points' },
    ],
    cues: ['"Spin is safety — more spin, not less, when it is tight."', '"Same routine on the second as the first."', '"Aim higher over the net, not softer."'],
    faults: [
      { fault: 'Slows the arm down on the second', why: 'Less spin, so less margin, exactly when margin is needed', fix: 'Same racket-head speed, more upward brush. Coach watches the swing speed, not the ball.' },
      { fault: 'Abandons the routine on the second serve', why: 'Rushed and tight', fix: 'Full routine on every serve of every rep, no exceptions.' },
    ],
    success: 'Fifteen pairs served with no more than two double faults, then eight of ten points started from 30-40 with a second serve in.',
    notesLines: 2,
  },

  'blue-passing-shots': {
    kind: 'drill',
    diagnosis: 'Players panic when an opponent comes in and go for an outright winner from a poor position — the one shot least likely to work. The dipping ball at the feet wins far more points and is almost never practised, because it does not feel like a winner.',
    objective: 'A low dipping first pass as the default, with the winner taken on the second ball.',
    setup: ['Coach approaches to the net after a short feed.', 'A target zone at the coach\u2019s feet, just past the service line.'],
    progressions: [
      { name: 'Dip it at their feet', detail: 'Player aims only for the low zone at the net player\u2019s feet. No winners allowed.', reps: '15 balls' },
      { name: 'Dip then pass', detail: 'First ball dips, coach volleys up, player passes on the second ball.', reps: '12 sequences' },
      { name: 'Lob option', detail: 'Coach closes tight; player lobs instead. Choosing between dip and lob is the skill.', reps: '12 balls' },
      { name: 'Live', detail: 'Points where the coach comes in every time. Player chooses.', reps: '11 points' },
    ],
    cues: ['"Make them play a difficult volley, do not try to beat them outright."', '"Low first, winner second."', '"If they are tight to the net, go over them."'],
    faults: [
      { fault: 'Goes for a winner off the first pass', why: 'Very low percentage; hands the point over', fix: 'Winners score zero for the first two progressions.' },
      { fault: 'Panics and floats it', why: 'Free volley for the net player', fix: 'Target zone at the feet; nothing else counts.' },
      { fault: 'Never lobs', why: 'Net player closes with impunity', fix: 'Coach stands tight until the player lobs at least three times.' },
    ],
    success: 'Ten of fifteen first passes land in the low zone at the net player\u2019s feet, and in eleven live points the player uses a lob at least twice.',
    court: { zones: [{ x: 0.115, y: 0.5, w: 0.77, h: 0.12, label: 'At their feet', colour: '#3A8EE0' }], note: 'The first pass targets the zone just past the service line — a difficult low volley, not an attempted winner.' },
    notesLines: 2,
  },

  'blue-10-week-block': {
    kind: 'plan',
    diagnosis: 'Players at this stage hit well in practice and lose to people who hit worse. The gap is not technical, so more technical work will not close it — this block deliberately spends most of its weeks on decisions, patterns and competing.',
    goal: 'Move a player from hitting well to competing well, measured by tactical outcomes rather than stroke quality.',
    weeks: [
      { w: 1, focus: 'Baseline audit', main: 'Match play observed. Coach records where points are actually lost.', measure: 'Written audit agreed with the player' },
      { w: 2, focus: 'Ball reading', main: 'Attack / neutral / defend calls.', measure: '18/20 calls agreed' },
      { w: 3, focus: 'Rally tolerance', main: 'Play to twelve; no winners before ball six.', measure: '5 rallies of 12' },
      { w: 4, focus: 'Serve+1', main: 'Serve and a planned first groundstroke.', measure: 'Pattern executed 6 of 10' },
      { w: 5, focus: 'Return+1', main: 'Deep neutral return, then a planned second ball.', measure: '12/20 returns past the service line' },
      { w: 6, focus: 'Transition', main: 'Recognising and taking the short ball.', measure: '8/10 approaches followed in' },
      { w: 7, focus: 'Passing & defence', main: 'Dipping pass, lob, and resetting from defence.', measure: '10/15 passes at the feet' },
      { w: 8, focus: 'Second serve', main: 'Spin, target and consequence.', measure: 'Max 2 doubles in 5 games' },
      { w: 9, focus: 'Big points', main: 'Pre-decided patterns at 30-30 and break point.', measure: 'Pattern named before every big point' },
      { w: 10, focus: 'Compete', main: 'Sets played, coach observing only. Re-run the week 1 audit.', measure: 'Audit shows fewer decision errors' },
    ],
    success: 'The week-10 audit shows measurably fewer decision errors than week 1, and the player can name their serve+1 and return+1 patterns without prompting.',
    notesLines: 3,
  },

  'blue-core-power': {
    kind: 'drill',
    diagnosis: 'Racket-head speed generated by the arm alone stalls at a ceiling and tends to injure the shoulder on the way there. Power in tennis comes from the ground through the trunk; if the trunk cannot transmit it, the arm compensates and pays for it.',
    objective: 'Rotational power that transfers into the swing rather than being generated by the arm.',
    setup: ['Medicine ball (2\u20134kg), a wall, and floor space.', 'Twice a week, not on heavy on-court days.'],
    progressions: [
      { name: 'Rotational throws', detail: 'Side-on to the wall, throw the med ball with a full trunk rotation. Both sides.', reps: '3 × 8 each side' },
      { name: 'Overhead slams', detail: 'Full extension overhead, slam down. Mirrors the serve chain.', reps: '3 × 10' },
      { name: 'Pallof press', detail: 'Anti-rotation hold against a band. Trains the trunk to resist as well as produce.', reps: '3 × 30s each side' },
      { name: 'Dead bug', detail: 'Slow and controlled, lower back flat to the floor throughout.', reps: '3 × 10 each side' },
    ],
    cues: ['"Power from the ground, through the hips, out through the ball."', '"Fast on the throw, slow on the control work."'],
    faults: [
      { fault: 'Throwing with the arms only', why: 'Trains exactly the fault you are trying to fix', fix: 'Feet planted, initiate from the back hip. Coach watches the hips, not the ball.' },
      { fault: 'Back arches on overhead work', why: 'Loads the lumbar spine instead of the trunk', fix: 'Lighter ball, ribs down, brace before the throw.' },
    ],
    success: 'Three full sets of each completed twice a week for four weeks, with the rotational throw distance increased and no compensation through the lower back.',
    notesLines: 2,
  },

  'blue-prematch-routine': {
    kind: 'worksheet',
    diagnosis: 'Players arrive on court still thinking about the journey, the opponent or the draw, and lose the first three games before they are present. Those games are not recoverable in a short match format — the routine is what makes the first game count.',
    rows: [
      { label: '60 minutes before', detail: 'Eat, and check your bag. Rackets, water, spare shirt. Nothing decided in a hurry.' },
      { label: '30 minutes before', detail: 'Dynamic warm-up. Actually sweat before you hit a ball.' },
      { label: '15 minutes before', detail: 'Hit if you can. If not, shadow swings and serve motions.' },
      { label: '5 minutes before', detail: 'Your plan, in one sentence. What you will do more of today.' },
      { label: 'Walking on', detail: 'One breath. Your first-game intention. Then play.' },
    ],
    prompts: [
      { heading: 'Your one-sentence plan', hint: 'Not a list. One thing you will do more of.', lines: 2 },
      { heading: 'What usually knocks you off it?', lines: 2 },
    ],
    success: 'You complete the routine before three consecutive matches and win at least two of the three first games — not because of the routine alone, but because you were present for them.',
  },

  'blue-inner-game-notes': {
    kind: 'worksheet',
    diagnosis: 'The mental side gets read about far more than it gets practised. These notes are deliberately reduced to what a coach can put on court this week, because a mental skill that never becomes a drill stays a nice idea.',
    rows: [
      { label: 'Self 1 and Self 2', detail: 'The instructing voice versus the body that already knows. Most interference comes from over-instructing yourself mid-point.' },
      { label: 'Non-judgemental awareness', detail: 'Notice what happened without labelling it good or bad. "The ball went long" not "I am terrible".' },
      { label: 'On-court drill: bounce-hit', detail: 'Say "bounce" when the ball bounces and "hit" at contact. Occupies the instructing voice and sharpens tracking.' },
      { label: 'On-court drill: guess the height', detail: 'Call how high over the net each ball passed. Builds attention without technical instruction.' },
    ],
    prompts: [
      { heading: 'What do you say to yourself mid-point?', hint: 'Write it down exactly. Most players have never noticed.', lines: 2 },
      { heading: 'Try bounce-hit for one set — what changed?', lines: 3 },
    ],
    success: 'You play a full set using bounce-hit and can describe what changed in your attention — without describing whether you won.',
  },

  'blue-big-points': {
    kind: 'worksheet',
    diagnosis: 'Under pressure players either freeze or over-hit, and both come from the same cause: deciding what to do while the point is already starting. Pre-deciding the pattern removes the decision from exactly the moment the player is least able to make it.',
    rows: [
      { label: '30-30', detail: 'The point that decides the game. What is your serve and your plus-one?' },
      { label: 'Break point down', detail: 'Highest-percentage serve you own. Not your best serve — your most reliable one.' },
      { label: 'Break point up', detail: 'Return deep and central. Make them play. Do not go for it.' },
      { label: 'Set point', detail: 'The pattern you trust most, from the whole match. Written before you walk on.' },
    ],
    prompts: [
      { heading: 'Your patterns — fill these in before the match', hint: 'Specific. "Wide serve, forehand into the space", not "play aggressively".', lines: 4 },
      { heading: 'After the match — did you use them?', lines: 3 },
    ],
    success: 'You can state your pattern for all four situations before the match, and afterwards identify at least two big points where you actually used it.',
  },

  // ─── PURPLE ───────────────────────────────────────────────────────────────
  'purple-drop-shot': {
    kind: 'drill',
    diagnosis: 'Drop shots sit up because the hand tightens at contact — the player squeezes the grip to be accurate and kills the touch that makes the shot work. It is then read early because the preparation looks nothing like a groundstroke.',
    objective: 'A disguised drop shot that stays low, with the recovery step that follows it.',
    setup: ['Coach feeds a short ball to mid-court.', 'Target zone inside the service box on both sides.'],
    progressions: [
      { name: 'Soft hands', detail: 'Drop shots from a stationary feed. Grip pressure as light as the player can manage.', reps: '12 balls' },
      { name: 'Same preparation', detail: 'Identical setup to a drive. Only the contact changes.', reps: '12 balls' },
      { name: 'Drive or drop', detail: 'Coach calls "drive" or "drop" as the ball is released. Preparation must be identical for both.', reps: '15 balls' },
      { name: 'Drop then move', detail: 'Play the drop, then move in — because a good drop invites a reply you must cover.', reps: '12 balls' },
    ],
    cues: ['"Hold it like a bird" — grip pressure is the whole shot.', '"Same swing, different hands."', '"Play it and go in — a drop shot you do not follow is a gift."'],
    faults: [
      { fault: 'Ball bounces up invitingly', why: 'Easy put-away for the opponent', fix: 'Lighter grip and more open face at contact. Target zone inside the service box only.' },
      { fault: 'Preparation gives it away', why: 'Read early; opponent is already moving', fix: 'Coach calls drive or drop late so the preparation cannot differ.' },
      { fault: 'Admires the shot and stays back', why: 'Beaten by the reply', fix: 'Must be inside the service line before the next feed is released.' },
    ],
    success: 'Nine of twelve drops land inside the service box with two bounces before the service line, hit from a preparation the coach cannot distinguish from a drive.',
    court: { zones: [{ x: 0.115, y: 0.26, w: 0.77, h: 0.16, label: 'Drop zone', colour: '#a855f7' }], note: 'Short and low inside the service box. A drop landing beyond it is just a bad approach.' },
    notesLines: 2,
  },

  'purple-lob-overhead': {
    kind: 'drill',
    diagnosis: 'Players lob only in desperation and smash only badly, so both shots stay poor and the net player is never threatened. Trained as a deliberate exchange rather than as emergencies, the lob becomes a tactic and the overhead becomes a finish.',
    objective: 'An offensive lob that clears and lands deep, and an overhead struck from a proper position.',
    setup: ['One player at the net, one at the baseline. Coach feeds to start.'],
    progressions: [
      { name: 'Lob to depth', detail: 'Baseline player lobs over the net player into the back third. Height and depth, not panic.', reps: '12 lobs' },
      { name: 'Overhead footwork', detail: 'Net player turns sideways and shuffles back under the ball — never backpedals.', reps: '12 overheads' },
      { name: 'The exchange', detail: 'Lob, overhead, and play the point out from there.', reps: '12 sequences' },
      { name: 'Offensive lob', detail: 'Topspin lob attempted from a neutral ball, not from defence.', reps: '10 balls' },
    ],
    cues: ['"Lob deep, not high" — height without depth is a smash.', '"Turn and shuffle, never backpedal" — backpedalling is how people fall.', '"Point at it" — the non-hitting hand tracks the ball on the overhead.'],
    faults: [
      { fault: 'Lobs land mid-court', why: 'Free overhead for the net player', fix: 'Back-third target zone. Anything short scores zero.' },
      { fault: 'Backpedals for the overhead', why: 'Off balance, and a genuine fall risk', fix: 'Turn sideways immediately. Coach stops any rep that starts with a backwards step.' },
      { fault: 'Only lobs when stretched', why: 'Predictable; net player camps in', fix: 'Offensive lob required from a neutral ball at least three times per set of reps.' },
    ],
    success: 'Nine of twelve lobs land in the back third, and every overhead is played having turned sideways with no backwards step.',
    notesLines: 2,
  },

  'purple-height-variety': {
    kind: 'drill',
    diagnosis: 'One-speed players are read by ball three — the opponent settles into the rhythm and starts stepping in. Variety is not decoration at this level; it is what stops a better ball-striker from timing you.',
    objective: 'Heavy, flat and low produced on demand as deliberate choices.',
    setup: ['A rope or ribbon a metre above the net.', 'Cooperative rally, then points.'],
    progressions: [
      { name: 'Three heights', detail: 'Ten balls well above the rope, ten just over it, ten low and flat. Player names each before hitting.', reps: '30 balls' },
      { name: 'Called height', detail: 'Coach calls the height as the ball is released.', reps: '20 balls' },
      { name: 'Change every third', detail: 'Cooperative rally where the height must change at least every third ball.', reps: '5 minutes' },
      { name: 'Variety points', detail: 'Points played. Any three consecutive balls at the same height loses the point.', reps: '11 points' },
    ],
    cues: ['"Change the height before you change the direction" — it is safer and more disruptive.', '"Heavy is a weapon, not a defence."', '"Make them hit at a different height every time."'],
    faults: [
      { fault: 'All three heights look the same', why: 'No actual variety produced', fix: 'Rope as the reference. Coach calls out any ball that did not match.' },
      { fault: 'Loses depth when changing height', why: 'Variety at the cost of position', fix: 'Depth zone stays live throughout — a short ball does not count regardless of height.' },
    ],
    success: 'Eleven points played with no three consecutive balls at the same height, and depth maintained past the service line throughout.',
    notesLines: 2,
  },

  'purple-kick-serve': {
    kind: 'drill',
    diagnosis: 'A flat second serve is a liability against a returner who can step in — the player either doubles or gets attacked, and both cost the game. The kick serve is the shot that makes the second serve safe to hit properly.',
    objective: 'A second serve with genuine kick, hit at full racket speed rather than pushed.',
    setup: ['Basket of balls.', 'Toss marker slightly further left (for a right-hander) than the flat serve.'],
    progressions: [
      { name: 'Toss position', detail: 'Toss placed above the head and slightly left. Let ten drop to check placement.', reps: '10 tosses' },
      { name: 'Brush across', detail: 'From trophy, brush up and across the back of the ball — seven to one on a clock face.', reps: '15 serves' },
      { name: 'Over the rope', detail: 'A rope a metre over the net. The kick serve must clear it and still land in.', reps: '20 serves' },
      { name: 'Full speed', detail: 'Same action at full racket speed — spin comes from brush, not from slowing down.', reps: '20 serves' },
    ],
    cues: ['"Brush seven to one" — the swing path, in one image.', '"Up, not out" — the kick serve goes up over the net first.', '"Full speed, more brush" — never slow the arm to get it in.'],
    faults: [
      { fault: 'Slowing the arm to keep it in', why: 'Less spin, so less margin — the opposite of what is needed', fix: 'Rope over the net. Only full-speed serves that clear it count.' },
      { fault: 'Toss in the flat-serve position', why: 'No angle available to brush across', fix: 'Toss marker on the court; ten drops before hitting.' },
      { fault: 'Back arches to reach the ball', why: 'Lower-back load and an inconsistent contact', fix: 'Toss lower and more over the head, and load through the legs instead.' },
    ],
    success: 'Fifteen of twenty kick serves clear the rope and land in, hit at full racket speed with visible kick off the bounce.',
    notesLines: 3,
  },

  'purple-serve-volley': {
    kind: 'drill',
    diagnosis: 'Players reach the net having stopped moving and volley from their shoelaces, then conclude serve and volley does not work for them. The fault is the split-step timing: it is being timed to their own arrival rather than to the returner\u2019s contact.',
    objective: 'A first volley played in front of the service line from a split timed to the return.',
    setup: ['Returner or coach returning.', 'Cone marking where the split should happen — usually around the service line.'],
    progressions: [
      { name: 'Serve and move', detail: 'Serve, then move forward. No volley yet — just get past the cone in balance.', reps: '10 serves' },
      { name: 'Split on their contact', detail: 'Serve, move, split as the returner strikes. Wherever that happens is where you are.', reps: '12 serves' },
      { name: 'First volley deep', detail: 'Full sequence, first volley deep and down the middle rather than for a winner.', reps: '15 serves' },
      { name: 'Play it out', detail: 'Serve, volley, play the point.', reps: '11 points' },
    ],
    cues: ['"Split when they hit, not when you arrive."', '"First volley deep — the winner is the second one."', '"Two steps and split beats four steps and stopped."'],
    faults: [
      { fault: 'Split-step timed to arrival', why: 'Rooted when the return comes', fix: 'Coach calls "now" on the returner\u2019s contact until the timing is automatic.' },
      { fault: 'Goes for a winner on the first volley', why: 'Low percentage from mid-court', fix: 'Deep and central only for the first three progressions.' },
      { fault: 'Runs too far in', why: 'Caught by the low ball at the feet', fix: 'Split wherever you are when they hit. Distance is not the goal.' },
    ],
    success: 'Twelve of fifteen first volleys played in front of the service line, with the split landing on the returner\u2019s contact every time.',
    notesLines: 2,
  },

  'purple-game-style': {
    kind: 'plan',
    diagnosis: 'Players at this level plateau because they train everything equally — every weakness gets attention and no strength ever becomes a weapon. Matches are won by what you are good at, not by having no weaknesses.',
    goal: 'A named game style, with training weighted towards the two shots that will actually win points.',
    weeks: [
      { w: 1, focus: 'Audit', main: 'Chart three sets: where points are won and lost, and with which shot.', measure: 'Written chart, no opinions' },
      { w: 2, focus: 'Name the style', main: 'Aggressive baseliner, counter-puncher, all-court or serve-volley. Pick one honestly.', measure: 'Style named and agreed' },
      { w: 3, focus: 'Weapon one', main: 'The shot that wins most points, drilled to be reachable more often.', measure: 'Weapon used in 40% of won points' },
      { w: 4, focus: 'Weapon two', main: 'The setup shot that creates the weapon.', measure: 'Setup executed 6 of 10' },
      { w: 5, focus: 'The liability', main: 'The one shot that loses points fastest — made adequate, not excellent.', measure: 'Error rate on that shot halved' },
      { w: 6, focus: 'Play the style', main: 'Sets played committing to the style even when losing. Re-chart.', measure: 'Chart shows the style being played' },
    ],
    success: 'The week-6 chart shows the player winning points with their named weapon more often than in week 1, and they can describe their game style in one sentence without hedging.',
    notesLines: 3,
  },

  'purple-cod-speed': {
    kind: 'drill',
    diagnosis: 'Straight-line speed is not tennis speed. Points are decided by stopping, changing direction and re-accelerating within two metres — and a player who trains by running lengths gets fitter without getting faster to the ball.',
    objective: 'Faster deceleration and re-acceleration in the shapes points actually make.',
    setup: ['Cones in a five-metre spread across the baseline.', 'Off-court or on a spare court, twice weekly.'],
    progressions: [
      { name: 'Decelerate and hold', detail: 'Sprint five metres, stop dead in three steps, hold balanced for two seconds.', reps: '8 reps' },
      { name: 'Side shuffle turns', detail: 'Shuffle to a cone, plant the outside foot, drive back the other way.', reps: '10 each direction' },
      { name: 'Spider', detail: 'Baseline centre to five cones and back, touching each. Timed.', reps: '4 runs' },
      { name: 'Reactive', detail: 'Coach points; player drives that way, stops, resets. No pattern to anticipate.', reps: '12 reps' },
    ],
    cues: ['"Stopping is the skill — anyone can run."', '"Plant the outside foot, do not shuffle round the turn."', '"Low through the change of direction."'],
    faults: [
      { fault: 'Drifts through the stop', why: 'Cannot change direction; late on the next ball', fix: 'Two-second balanced hold on every deceleration rep.' },
      { fault: 'Stands tall through turns', why: 'No force available to push back the other way', fix: 'Lower the hips before the plant. Coach checks height at the turn.' },
    ],
    success: 'Spider run time improved across four sessions, with every deceleration rep held balanced for two seconds and no drifting through the stop.',
    notesLines: 2,
  },

  'purple-scouting-card': {
    kind: 'worksheet',
    diagnosis: 'Players plan for their own game and never for the opponent in front of them, so the same tactical mistakes get repeated against completely different players. Five things identified inside two service games is enough to change a match.',
    rows: [
      { label: 'Weaker wing', detail: 'Which side breaks down first under pressure or depth?' },
      { label: 'Second serve', detail: 'Where does it go, and can it be attacked? Watch their first two service games.' },
      { label: 'Movement', detail: 'Are they weaker moving forward or backward? Test it early with a short ball.' },
      { label: 'Under pressure', detail: 'What do they do at 30-30 — go bigger, or get safe?' },
      { label: 'Their pattern', detail: 'What do they do most often on the big points? Almost everyone has one.' },
    ],
    prompts: [
      { heading: 'Fill in during the first two service games', hint: 'Do not wait until you are losing to start noticing.', lines: 3 },
      { heading: 'Your plan for the rest of the match', hint: 'One sentence, based on the above.', lines: 2 },
    ],
    success: 'You can fill all five rows inside two service games and state a one-sentence plan that follows from them — in three consecutive matches.',
  },

  'purple-winning-ugly': {
    kind: 'worksheet',
    diagnosis: 'The classic on match-craft, reduced to the handful of ideas that actually change how a club or county player competes on Saturday. Read whole it is a good book; used like this it is a tactic sheet.',
    rows: [
      { label: 'Win the warm-up', detail: 'Not by hitting hard — by watching. It is five free minutes of scouting.' },
      { label: 'Play the score', detail: 'Different points deserve different risk. 40-0 and 30-40 are not the same shot selection.' },
      { label: 'Make them prove it', detail: 'Against a big hitter, the safest tactic is often more balls, not better ones.' },
      { label: 'Change what is not working', detail: 'Losing 6-2 doing your favourite thing means the favourite thing is wrong today.' },
      { label: 'Own the changeovers', detail: 'Ninety seconds to decide one thing. Use them rather than sitting in them.' },
    ],
    prompts: [
      { heading: 'Which of these do you already do?', lines: 2 },
      { heading: 'Pick ONE for your next three matches', hint: 'One, properly, beats five vaguely.', lines: 2 },
    ],
    success: 'Across three matches you can name the one idea you were working on and give a specific example of using it in each.',
  },

  'purple-poaching': {
    kind: 'drill',
    diagnosis: 'A net player who never moves is a spectator their partner has to cover for — the returner plays freely down the middle knowing nobody will take it. The poach is not about winning the volley; it is about making the returner think.',
    objective: 'A committed poach, a convincing fake, and the switch behind both.',
    setup: ['Four players or two plus the coach.', 'Server, server\u2019s partner at net, returner.'],
    progressions: [
      { name: 'Poach on the call', detail: 'Server calls the poach before serving. Net player moves on the returner\u2019s contact and finishes.', reps: '12 points' },
      { name: 'Switch behind', detail: 'Same, but the server crosses to cover the vacated side. Both move, always.', reps: '12 points' },
      { name: 'The fake', detail: 'Net player moves and recovers. The returner sees movement and misses.', reps: '10 points' },
      { name: 'Poacher\u2019s choice', detail: 'Net player decides. Server must read and switch accordingly.', reps: '11 points' },
    ],
    cues: ['"Commit — a half-poach is worse than none."', '"Move on their contact, not before."', '"If you cross, your partner crosses. Always."'],
    faults: [
      { fault: 'Poaches early and gets lobbed or passed', why: 'Returner sees it and redirects', fix: 'Move on the returner\u2019s contact, not on the serve.' },
      { fault: 'Server does not switch', why: 'Half the court left open', fix: 'Any point where both did not move is replayed.' },
      { fault: 'Half-commits and stops', why: 'Covers neither ball', fix: 'Poach all the way across or stay. No middle option.' },
    ],
    success: 'Ten of twelve poaches finished or forced an error, with the server switching on every one — and the fake producing at least two returner errors.',
    notesLines: 2,
  },

  // ─── BROWN ────────────────────────────────────────────────────────────────
  'brown-serve-pressure': {
    kind: 'drill',
    diagnosis: 'First-serve percentage collapses at 4-5 because it has only ever been measured in a basket. The action is fine; what has never been trained is producing it when the game is on it. Practising serves without a score trains a different skill from the one the match requires.',
    objective: 'A first-serve percentage that holds up from real scores.',
    setup: ['Basket, plus a scoreboard.', 'A consequence agreed in advance for a service game lost.'],
    progressions: [
      { name: 'Baseline percentage', detail: 'Twenty first serves from a basket. Record the percentage — this is the number to defend.', reps: '20 serves' },
      { name: 'From 30-30', detail: 'Serve out games starting at 30-30. Record first-serve percentage again.', reps: '5 games' },
      { name: 'From 30-40', detail: 'Serve out games starting at 30-40 down.', reps: '5 games' },
      { name: 'Serve for the set', detail: 'Serve out at 5-4 with the set on it, full routine every point.', reps: '5 games' },
    ],
    cues: ['"Same routine, same speed, same target."', '"The pressure serve is the one you own, not the one you like."', '"Percentage over power at 30-40."'],
    faults: [
      { fault: 'Percentage drops sharply under score', why: 'The exact failure the drill exists to expose', fix: 'Drop to the second-best first serve. A 70% serve you hit beats a 90% serve you miss.' },
      { fault: 'Routine shortens under pressure', why: 'Rushed toss and a rushed action', fix: 'Coach counts the bounces out loud until the routine holds.' },
      { fault: 'Goes bigger at break point', why: 'Doubles at exactly the wrong moment', fix: 'Target called before the toss; big serves score zero at break point.' },
    ],
    success: 'First-serve percentage across five games from 30-40 is within ten points of the basket baseline recorded at the start.',
    notesLines: 3,
  },

  'brown-return-plus-one': {
    kind: 'drill',
    diagnosis: 'Returns go for too much and hand back the break point that took three games to earn. The player treats the return as their chance rather than as the start of a point they are already winning by being at 0-30.',
    objective: 'A deep neutral return followed by a planned second ball.',
    setup: ['Server or coach serving.', 'Target zone deep and central, plus cones for the plus-one.'],
    progressions: [
      { name: 'Deep and central', detail: 'Return every serve deep and down the middle. No angles, no winners.', reps: '20 returns' },
      { name: 'Return then plus-one', detail: 'Deep return, then a planned second ball into the open court.', reps: '15 sequences' },
      { name: 'Call it', detail: 'Player names the plus-one before the serve is struck.', reps: '15 points' },
      { name: 'Break points', detail: 'Points played from 0-30, returns only. Neutral return required.', reps: '12 points' },
    ],
    cues: ['"Neutralise, then build."', '"Deep and central is a winning return."', '"The break comes from the rally, not the return."'],
    faults: [
      { fault: 'Goes for a winner off the return', why: 'Gives back an advantage already earned', fix: 'Winners score zero. Deep and central only for two sessions.' },
      { fault: 'Return lands short', why: 'Server steps in and takes control', fix: 'Depth zone past the service line; short returns lose the point.' },
      { fault: 'No plan for ball three', why: 'Neutral return wasted', fix: 'Plus-one named out loud before the serve.' },
    ],
    success: 'Fourteen of twenty returns land past the service line and central, and the named plus-one is executed in eight of twelve break-point rehearsals.',
    court: { zones: [{ x: 0.3, y: 0.06, w: 0.4, h: 0.2, label: 'Deep & central', colour: '#a06a3c' }], note: 'The return target is deliberately the least ambitious zone on the court. That is the point.' },
    notesLines: 2,
  },

  'brown-closing-out': {
    kind: 'drill',
    diagnosis: 'Leads of 5-2 become 5-5 because the player stops doing what built the lead — they get safe, shorten the swing and wait for the opponent to lose. The opponent, having nothing to lose, starts playing freely. It is a decision failure, not a nerve failure, and it can be rehearsed.',
    objective: 'Closing out a set by continuing to play, not by protecting.',
    setup: ['Sets started from a lead.', 'Coach records what changes in the player\u2019s shot selection.'],
    progressions: [
      { name: 'Serve at 5-3', detail: 'Serve out from 5-3, full routine, normal patterns.', reps: '5 games' },
      { name: 'Return at 5-4', detail: 'Break to win the set from 5-4 up. Neutral returns still required.', reps: '5 games' },
      { name: 'From 5-2', detail: 'Play out from 5-2 with the opponent starting free.', reps: '3 sets' },
      { name: 'Review', detail: 'Coach reads back what changed in shot selection between 5-2 and 5-4.', reps: 'once' },
    ],
    cues: ['"Play the same tennis that got you here."', '"Safe is not a tactic — it is a hope."', '"One point at a time, but the same point you have been playing."'],
    faults: [
      { fault: 'Rally balls get shorter and slower', why: 'Invites the opponent back in', fix: 'Depth zone stays live in the closing games. Short balls lose the point.' },
      { fault: 'Stops going to the weapon', why: 'The thing that built the lead is abandoned', fix: 'Weapon must be used at least twice per closing game.' },
      { fault: 'Serves smaller at 5-4', why: 'First-serve percentage drops and pressure grows', fix: 'Same target, same speed, called before the toss.' },
    ],
    success: 'Three sets closed out from 5-2 with the coach\u2019s chart showing no drop in rally depth or weapon usage between 5-2 and set point.',
    notesLines: 3,
  },

  'brown-defend-turn': {
    kind: 'drill',
    diagnosis: 'Players defend by hitting harder, which loses the point twice — once immediately through the error, and once by teaching them that defending does not work. Defence is height, depth and time, and the moment it becomes attack has to be recognised rather than guessed.',
    objective: 'Defending to reset the point, and recognising the ball that turns it.',
    setup: ['Coach feeds deep and wide, pushing the player behind the baseline.', 'Depth zone marked on the far court.'],
    progressions: [
      { name: 'High and deep', detail: 'From a defensive position, hit high and deep down the middle. Buy time, do not attempt a winner.', reps: '15 balls' },
      { name: 'Recover after', detail: 'Same, plus full recovery towards the middle before the next feed.', reps: '15 balls' },
      { name: 'Spot the turn', detail: 'Coach mixes in a short ball. Player must recognise it and step in.', reps: '20 balls' },
      { name: 'Defend to attack', detail: 'Live points starting from a defensive feed.', reps: '11 points' },
    ],
    cues: ['"Height buys you time — time is the whole point of defending."', '"Middle of the court, not the corners, when you are stretched."', '"The ball that lands short is your invitation — take it."'],
    faults: [
      { fault: 'Tries to hit a winner from defence', why: 'Very low percentage; loses the point outright', fix: 'Winners from behind the baseline score zero.' },
      { fault: 'Defends short', why: 'Opponent stays on the attack', fix: 'Depth zone; short defensive balls lose the point.' },
      { fault: 'Misses the transition ball', why: 'Stays in defence when the point had turned', fix: 'Coach calls "short" out loud until the recognition is automatic.' },
    ],
    success: 'Twelve of fifteen defensive balls land past the service line, and the player steps in on eight of ten short balls without being told.',
    notesLines: 2,
  },

  'brown-match-tactics': {
    kind: 'worksheet',
    diagnosis: 'A plan made in the warm-up is forgotten by 2-2, because it was never written down and nothing prompts a review. Written before, checked at changeovers and reviewed after, it becomes a habit rather than an intention.',
    rows: [
      { label: 'My one sentence', detail: 'What I will do more of today. Not a list.' },
      { label: 'Their weakness', detail: 'The one thing I will keep testing.' },
      { label: 'My big-point pattern', detail: 'Decided now, not at 30-30.' },
      { label: 'Changeover check', detail: 'Am I still doing my one thing? Yes or no.' },
    ],
    prompts: [
      { heading: 'Before — fill this in', lines: 3 },
      { heading: 'At 3-3 — is the plan working?', hint: 'If not, what is the one change?', lines: 2 },
      { heading: 'After — what actually happened?', hint: 'Regardless of the result.', lines: 3 },
    ],
    success: 'Completed before, during and after three consecutive matches, with the mid-match check actually filled in rather than added afterwards.',
  },

  'brown-tournament-block': {
    kind: 'plan',
    diagnosis: 'Players arrive at their target event either flat from training too hard the week before, or undercooked from tapering too early. Peaking is a sequencing problem, and doing it by feel produces a good tournament roughly one time in three.',
    goal: 'Arrive at the target event sharp, fresh and match-ready.',
    weeks: [
      { w: 1, focus: 'Volume base', main: 'Highest on-court hours of the block. Technical work while there is time for it.', measure: 'Hours logged' },
      { w: 2, focus: 'Volume base', main: 'Same load. Physical block at its heaviest.', measure: 'Strength sessions completed' },
      { w: 3, focus: 'Intensity up', main: 'Shorter sessions, higher quality. Patterns under pressure.', measure: 'Pattern executed 6/10' },
      { w: 4, focus: 'Match play', main: 'Practice sets against varied opponents.', measure: '4 sets played' },
      { w: 5, focus: 'Match play', main: 'Competitive matches. Tactics sheet used every time.', measure: '3 matches, sheets completed' },
      { w: 6, focus: 'Sharpen', main: 'Volume down, intensity held. Serve and return emphasis.', measure: 'First-serve % under score' },
      { w: 7, focus: 'Taper', main: 'Short, sharp sessions. Nothing new introduced.', measure: 'Feeling fresh, not flat' },
      { w: 8, focus: 'Event week', main: 'Light hitting, routines, sleep and food. Compete.', measure: 'Arrive fresh; play the plan' },
    ],
    success: 'The player arrives at the event having done no new technical work for two weeks, reports feeling fresh rather than flat, and executes their written plan in the first match.',
    notesLines: 3,
  },

  'brown-fuelling': {
    kind: 'worksheet',
    diagnosis: 'Cramp and fade in the second match of a day are planning failures rather than fitness failures. Players who train well eat like it is a rest day and then wonder why the third set disappears.',
    rows: [
      { label: '3 hours before', detail: 'Proper meal — carbohydrate led, low fat, familiar. Nothing you have not eaten before a match.' },
      { label: '1 hour before', detail: 'Small top-up: banana, cereal bar. Start drinking now, not on court.' },
      { label: 'During, every changeover', detail: 'A few mouthfuls of drink every changeover, whether thirsty or not. Add electrolytes if it is hot.' },
      { label: 'Over 90 minutes', detail: 'Something with carbohydrate — gel, banana, sweets. Not just water.' },
      { label: 'Within 30 min after', detail: 'Carbohydrate and protein together. This is what makes match two possible.' },
      { label: 'Between matches', detail: 'A proper meal if there is time; a substantial snack if there is not. Keep drinking.' },
    ],
    prompts: [
      { heading: 'Your plan for a two-match day', hint: 'Write actual foods you like and will eat.', lines: 3 },
      { heading: 'What went wrong last time?', lines: 2 },
    ],
    success: 'You complete a two-match day without cramp or a noticeable fade, having followed your written plan rather than improvising at the venue.',
  },

  'brown-recovery-between': {
    kind: 'worksheet',
    diagnosis: 'A won first round is frequently lost in the ninety minutes after it — the player sits, stiffens, eats nothing and walks back out cold. Recovery between matches is a protocol, not a rest.',
    rows: [
      { label: 'First 10 minutes', detail: 'Keep moving. Easy walk, then a gentle cool-down. Do not sit straight down.' },
      { label: 'Refuel', detail: 'Carbohydrate and protein within thirty minutes. Non-negotiable.' },
      { label: 'Change', detail: 'Dry shirt, dry socks. Small thing, big difference to how you feel.' },
      { label: 'Mobility', detail: 'Ten minutes of easy stretching and mobility, not aggressive stretching.' },
      { label: 'Switch off', detail: 'Twenty minutes away from the courts. Do not watch your next opponent.' },
      { label: '30 min before', detail: 'Full dynamic warm-up again. You are starting cold whatever you feel.' },
    ],
    prompts: [
      { heading: 'Your between-matches checklist', lines: 3 },
      { heading: 'What do you usually skip?', hint: 'Be honest — it is normally the warm-up before match two.', lines: 2 },
    ],
    success: 'You follow the protocol between two matches on the same day and start the second match without the first three games feeling cold.',
  },

  'brown-periodisation': {
    kind: 'worksheet',
    diagnosis: 'Coaches plan week to week and then wonder why players peak in February. Without a shape to the year, load stays flat, events are met wherever they fall, and there is never a genuine recovery block.',
    rows: [
      { label: 'Preparation', detail: 'High volume, lower intensity. Technical change happens here or not at all.' },
      { label: 'Pre-competition', detail: 'Volume down, intensity up. Patterns and match play.' },
      { label: 'Competition', detail: 'Maintain, do not build. Nothing new is introduced.' },
      { label: 'Transition', detail: 'Genuine recovery. Not "less tennis" — actually off.' },
      { label: 'The rule', detail: 'You cannot rebuild a technique during a competition block. Decide which block you are in first.' },
    ],
    prompts: [
      { heading: 'Map your player\u2019s next 12 months', hint: 'Mark the events that matter, then work backwards.', lines: 4 },
      { heading: 'Where is the transition block?', hint: 'If there is not one, that is the finding.', lines: 2 },
    ],
    success: 'A twelve-month map exists with target events marked, blocks named, and at least one genuine transition period written in.',
  },

  'brown-tight-points': {
    kind: 'worksheet',
    diagnosis: 'Tight arms at 30-40 are a breathing and routine problem before they are a technique problem. The player knows how to hit the shot — they have hit it a thousand times — but the twenty seconds beforehand have gone unmanaged.',
    rows: [
      { label: 'Notice it', detail: 'Name the physical signs: shallow breath, fast walk, gripping tighter. You cannot manage what you do not notice.' },
      { label: 'Slow down', detail: 'Walk slower to the line, not faster. Tight players rush.' },
      { label: 'Breathe out', detail: 'One long breath out. Longer out than in. It works, and it is free.' },
      { label: 'Decide early', detail: 'Pick the serve or the return target before you reach the line.' },
      { label: 'Commit', detail: 'Full swing. A tentative shot on a big point loses it more reliably than a bold miss.' },
    ],
    prompts: [
      { heading: 'What are YOUR signs of being tight?', hint: 'Specific and physical.', lines: 2 },
      { heading: 'Your cue for the big points', lines: 2 },
      { heading: 'After the match — did it hold at 30-40?', lines: 2 },
    ],
    success: 'Across three matches you can name your tightness signs and give an example of catching them at 30-40 and playing the point at full commitment anyway.',
  },

  // ─── RED ──────────────────────────────────────────────────────────────────
  'red-serve-plus-one-patterns': {
    kind: 'drill',
    diagnosis: 'At this level a serve without a pattern behind it is a neutral rally started on your own terms and then wasted. The serve is good enough to create an advantage; the player simply has not decided in advance what to do with it, so ball three becomes improvisation at exactly the moment structure pays most.',
    objective: 'Three serve+1 patterns owned well enough to be named and executed under a score.',
    setup: ['Cones marking the plus-one targets.', 'Coach or partner returning.'],
    progressions: [
      { name: 'Wide, then behind', detail: 'Wide serve in the deuce court, forehand behind the returner as they recover.', reps: '12 points' },
      { name: 'T, then open court', detail: 'Serve down the T, then the forehand into the space it opened.', reps: '12 points' },
      { name: 'Body, then forehand', detail: 'Body serve to jam the return, then step round for the forehand.', reps: '12 points' },
      { name: 'Called under score', detail: 'Serve games where the pattern is named before the toss and a point won on it scores double.', reps: '4 games' },
    ],
    cues: ['"The serve creates the ball you want to hit."', '"Behind them, not away from them" — recovering players are moving.', '"Decide both shots before the toss, every time."'],
    faults: [
      { fault: 'Plus-one hit cross-court by default', why: 'Returner is already recovering there', fix: 'Cone targets; only the planned target scores.' },
      { fault: 'Serves for an ace instead', why: 'Percentage drops, pattern never practised', fix: 'Aces score zero for this drill.' },
      { fault: 'Pattern abandoned at break point', why: 'The point where structure matters most', fix: 'Pattern named out loud before every big point.' },
    ],
    success: 'Eight of twelve points in each pattern executed as planned, and the pattern named before every toss across four service games.',
    court: { zones: [
      { x: 0.115, y: 0.26, w: 0.13, h: 0.24, label: '1 · Wide', colour: '#e0483f' },
      { x: 0.63, y: 0.08, w: 0.255, h: 0.2, label: '2 · Behind', colour: '#3A8EE0' },
    ], note: 'Serve wide to move them, then hit behind them as they recover — not into the space they are running towards.' },
    notesLines: 3,
  },

  'red-open-stance': {
    kind: 'drill',
    diagnosis: 'Players load the open stance well and then recover late, so the next ball is played on the run and the one after that is lost. The loading is coached; the recovery almost never is, which is why the fault survives into performance tennis.',
    objective: 'Load, explode and recover treated as one action rather than three.',
    setup: ['Coach feeds wide to the forehand.', 'Recovery marker past the centre.'],
    progressions: [
      { name: 'Load and hold', detail: 'Wide feed, load onto the outside leg, hold the position at contact for a beat.', reps: '10 balls' },
      { name: 'Load and push', detail: 'Same, but push off the outside leg immediately after contact — the recovery starts with the shot.', reps: '12 balls' },
      { name: 'Recover past the marker', detail: 'Must pass the marker before the next feed is released.', reps: '15 balls' },
      { name: 'Two-ball wide', detail: 'Wide, then wide the other side. Only possible with a proper push-off.', reps: '10 pairs' },
    ],
    cues: ['"The shot ends when you are home, not at contact."', '"Push off the outside leg — that leg is a spring, not a post."', '"Load, explode, recover — one movement."'],
    faults: [
      { fault: 'Steps back to the middle after hitting', why: 'Too slow; late on the next ball', fix: 'Push off the outside leg at contact. Coach watches the leg, not the ball.' },
      { fault: 'Falls away from the shot', why: 'Loses depth and cannot recover', fix: 'Load and hold reps until balance survives contact.' },
      { fault: 'Recovers to the centre regardless', why: 'Wrong position after a wide ball', fix: 'Recover to the bisector of the angles, not to a fixed spot.' },
    ],
    success: 'Ten consecutive two-ball wide sequences where the player reaches the second ball in balance, having passed the recovery marker each time.',
    notesLines: 2,
  },

  'red-backhand-dtl': {
    kind: 'drill',
    diagnosis: 'The down-the-line backhand gets attempted from the wrong ball and misses by inches — over the highest part of the net, into the narrowest part of the court, usually from a defensive position. The shot is not the problem; the ball it is being hit from is.',
    objective: 'Recognising the ball that earns the down-the-line backhand, and executing it from that ball only.',
    setup: ['Cone in the down-the-line target zone.', 'Coach feeds a mix of neutral and attackable balls.'],
    progressions: [
      { name: 'From a sitting ball', detail: 'Coach feeds short and central. Player steps in and hits down the line.', reps: '12 balls' },
      { name: 'Name the ball', detail: 'Coach mixes feeds; player calls "yes" or "no" on whether it earns the line ball.', reps: '20 balls' },
      { name: 'Call and hit', detail: 'Only hit down the line on a "yes" ball. Cross-court on everything else.', reps: '20 balls' },
      { name: 'Live', detail: 'Points played. Line backhand from a defensive ball loses the point.', reps: '11 points' },
    ],
    cues: ['"Down the line is a reward, not a rescue."', '"Step in, or go cross."', '"Highest net, shortest court — earn it first."'],
    faults: [
      { fault: 'Attempts it from behind the baseline', why: 'Lowest-percentage shot from the worst position', fix: 'Line ball only from inside the baseline for two sessions.' },
      { fault: 'Aims too close to the line', why: 'Misses by inches from a good decision', fix: 'Cone a metre inside; the cone is the target, not the line.' },
      { fault: 'Cannot tell which ball earns it', why: 'Decision, not technique', fix: 'Yes/no calling drill until the coach agrees with 18 of 20.' },
    ],
    success: 'Eighteen of twenty balls correctly identified as line-ball or not, and eight of twelve line backhands from a "yes" ball land in the target zone.',
    notesLines: 2,
  },

  'red-first-strike': {
    kind: 'drill',
    diagnosis: 'Players who are comfortable in long rallies are often passive in short ones — they are excellent at ball nine and vague at ball two. Against opponents who take time away, the match is decided in the first three balls of every point.',
    objective: 'Points won or clearly controlled inside three balls.',
    setup: ['Serve and return, live.', 'Coach counts and stops the point at ball four.'],
    progressions: [
      { name: 'Three-ball points', detail: 'Point stops at ball four regardless. Whoever is in control at that moment wins it.', reps: '12 points' },
      { name: 'Serving side', detail: 'Same, serve+1 must be executed as planned.', reps: '12 points' },
      { name: 'Returning side', detail: 'Same, return+1 must be executed.', reps: '12 points' },
      { name: 'Open', detail: 'Full points, but the coach records who controlled ball three.', reps: '11 points' },
    ],
    cues: ['"First strike, not first mistake" — controlled aggression, not a swing.', '"Ball three is the point."', '"Control is not the same as winner."'],
    faults: [
      { fault: 'Waits for the rally to develop', why: 'Gives control to the aggressive opponent', fix: 'Three-ball cap makes waiting impossible.' },
      { fault: 'Over-hits to force it', why: 'Errors replace passivity — no better', fix: 'Control at ball four wins the point; winners are not required.' },
    ],
    success: 'The player controls ball three in seven of eleven open points, judged by the coach rather than by whether the point was won.',
    notesLines: 2,
  },

  'red-two-week-taper': {
    kind: 'plan',
    diagnosis: 'Players train hardest the week before the event because it feels responsible, and arrive heavy-legged and flat. The taper is not doing less for its own sake — it is holding intensity while dropping volume, so sharpness rises as fatigue falls.',
    goal: 'Arrive at the target event fresh and sharp rather than trained and tired.',
    weeks: [
      { w: '2 out · Mon', focus: 'Intensity', main: 'Short high-quality session. Patterns at full pace, 60 minutes.', measure: 'Quality held throughout' },
      { w: '2 out · Wed', focus: 'Match play', main: 'Practice sets. Full routines.', measure: '2 sets played' },
      { w: '2 out · Fri', focus: 'Serve & return', main: 'Serve percentage under score; returns deep.', measure: 'First-serve % recorded' },
      { w: '2 out · Sat', focus: 'Physical', main: 'Last full physical session of the block.', measure: 'Completed' },
      { w: '1 out · Mon', focus: 'Sharpen', main: '45 minutes, high intensity, low volume. Nothing new.', measure: 'Feeling sharp' },
      { w: '1 out · Wed', focus: 'Patterns', main: 'Serve+1 and return+1 only. 45 minutes.', measure: 'Patterns clean' },
      { w: '1 out · Fri', focus: 'Light', main: '30 minutes hitting, serves, done. Travel.', measure: 'Legs fresh' },
      { w: 'Event', focus: 'Compete', main: 'Warm-up, routines, play. No technical thoughts.', measure: 'Plan executed in match 1' },
    ],
    success: 'The player reports fresh legs on day one, has introduced no new technical work for fourteen days, and executes their written plan in the first match.',
    notesLines: 3,
  },

  'red-strength-block': {
    kind: 'drill',
    diagnosis: 'On-court volume rises through a competition year and the shoulders and hips give way first — almost always in players whose off-court work is either absent or aesthetic. This block is built for robustness: the ability to keep training, not the ability to look trained.',
    objective: 'Twice-weekly strength work that protects the joints tennis loads hardest.',
    setup: ['Gym or bands and body weight.', 'Twice weekly, never the day before a match.'],
    progressions: [
      { name: 'Lower push', detail: 'Split squats or step-ups. Single-leg, because tennis is single-leg.', reps: '3 × 8 each leg' },
      { name: 'Hinge', detail: 'Romanian deadlift or hip hinge with a band. Protects the hamstrings and the lower back.', reps: '3 × 8' },
      { name: 'Upper pull', detail: 'Rows and band pull-aparts. More pulling than pushing — the serve does the pushing.', reps: '3 × 10' },
      { name: 'Shoulder health', detail: 'External rotations and scapular work. Light, controlled, every session.', reps: '3 × 12 each side' },
    ],
    cues: ['"Robustness, not aesthetics."', '"Pull more than you push" — the serve already trains the pushing.', '"Never the day before a match."'],
    faults: [
      { fault: 'All pushing, no pulling', why: 'Shoulder imbalance; the classic serve injury', fix: 'Two pulling exercises for every pushing one.' },
      { fault: 'Double-leg work only', why: 'Does not match how tennis loads the legs', fix: 'Split squats and single-leg hinges as the default.' },
      { fault: 'Scheduled the day before matches', why: 'Turns up flat', fix: 'Fix the two days in the week and protect them.' },
    ],
    success: 'Two sessions completed weekly for six weeks with no missed shoulder-health work and no session placed the day before a match.',
    notesLines: 2,
  },

  'red-prehab': {
    kind: 'drill',
    diagnosis: 'The serving shoulder and the lead hip take load every single session and get trained last, if at all. By the time either complains it is a six-week problem rather than a fifteen-minute one. This goes before practice, not after, because after never happens.',
    objective: 'Fifteen minutes that protects the two joints tennis breaks most often.',
    setup: ['Resistance band and a wall. Before every on-court session.'],
    progressions: [
      { name: 'Band external rotation', detail: 'Elbow at the side, rotate out slowly. Control on the way back.', reps: '2 × 15 each side' },
      { name: 'Pull-aparts', detail: 'Band at chest height, pull apart, squeeze the shoulder blades.', reps: '2 × 15' },
      { name: 'Hip 90/90', detail: 'Seated hip rotations both directions, slow and controlled.', reps: '2 × 10 each side' },
      { name: 'Glute bridge & clam', detail: 'Bridges then banded clams. The lead hip stabiliser most players never train.', reps: '2 × 12 each' },
    ],
    cues: ['"Fifteen minutes now or six weeks later."', '"Slow on the way back" — the controlled phase is the useful one.'],
    faults: [
      { fault: 'Done after the session, so not done', why: 'Zero protective effect', fix: 'Before court, as part of the warm-up. Non-negotiable.' },
      { fault: 'Band too heavy', why: 'Bigger muscles take over from the stabilisers', fix: 'Light band, slow tempo. It should feel easy and boring.' },
    ],
    success: 'Completed before every on-court session for four weeks, with no shoulder or hip complaint through the block.',
    notesLines: 2,
  },

  'red-intent-card': {
    kind: 'worksheet',
    diagnosis: 'Talented players lose to lesser ones by conceding a handful of points a set — the ball they do not chase, the return they do not set for, the point they write off at 40-0 down. It is never described as a choice, but that is what it is, and making it measurable is what changes it.',
    rows: [
      { label: 'Every ball chased', detail: 'Including the ones you will not reach. Count the ones you gave up on.' },
      { label: 'Set for every return', detail: 'Full split-step and position, including at 40-0 down.' },
      { label: 'Full routine', detail: 'Between every point, including the ones that do not matter.' },
      { label: 'Body language', detail: 'What would someone watching from the far side say about how you are competing?' },
    ],
    prompts: [
      { heading: 'How many points did you concede this match?', hint: 'Not lost — conceded. There is a difference and you know it.', lines: 2 },
      { heading: 'When does it happen?', hint: 'Usually a specific score. Find yours.', lines: 2 },
    ],
    success: 'Across three matches the number of conceded points falls, and you can name the score at which you are most likely to concede one.',
  },

  'red-match-review': {
    kind: 'worksheet',
    diagnosis: 'Players remember the last two points of a match and call it analysis, so the same pattern loses them the same match six times. A framework turns a feeling about the match into something you can actually train next week.',
    rows: [
      { label: 'How points were won', detail: 'Which shot, which pattern, which situation. Count them if you can.' },
      { label: 'How points were lost', detail: 'Unforced, forced, or decision error. The three are different problems.' },
      { label: 'The big points', detail: 'What did you do at 30-30 and break point? Did you have a plan?' },
      { label: 'Their game', detail: 'What worked against you, and did you change anything?' },
      { label: 'One thing to train', detail: 'Just one, taken into next week\u2019s sessions.' },
    ],
    prompts: [
      { heading: 'Fill in within 24 hours', hint: 'Later than that and you are writing fiction.', lines: 4 },
      { heading: 'The one thing for next week', lines: 2 },
    ],
    success: 'Three consecutive matches reviewed within 24 hours, with the "one thing" from each appearing in the following week\u2019s sessions.',
  },

  'red-opponent-types': {
    kind: 'drill',
    diagnosis: 'A player with one game style is beaten by the first opponent who neutralises it, and then has nothing. Rehearsing against the three archetypes turns "I could not play today" into a tactical problem with a known answer.',
    objective: 'A prepared plan against the pusher, the ball-basher and the net-rusher.',
    setup: ['Coach or partner plays the archetype deliberately for a set of points.'],
    progressions: [
      { name: 'The pusher', detail: 'Opponent returns everything with no pace. Player must construct rather than out-hit.', reps: '11 points' },
      { name: 'The ball-basher', detail: 'Opponent hits big and erratically. Player must extend rallies and take pace off.', reps: '11 points' },
      { name: 'The net-rusher', detail: 'Opponent comes in constantly. Dipping passes and lobs required.', reps: '11 points' },
      { name: 'Blind', detail: 'Coach picks an archetype without saying which. Player identifies it and adapts inside three points.', reps: '3 sets of 6' },
    ],
    cues: ['"Against a pusher, patience is a weapon — impatience is their weapon."', '"Against a basher, take the pace off and make them generate it."', '"Against a net-rusher, low first then the winner."'],
    faults: [
      { fault: 'Tries to out-hit the pusher', why: 'Exactly the game they want; error count climbs', fix: 'Construct with depth and angle; winners score zero for two sets of points.' },
      { fault: 'Trades with the ball-basher', why: 'Plays to their strength', fix: 'Height and depth to take the pace away, then attack the short ball.' },
      { fault: 'Does not recognise the archetype', why: 'Adapts too late, usually a set down', fix: 'Blind rounds; must name the archetype inside three points.' },
    ],
    success: 'In the blind rounds the player identifies the archetype within three points and states the correct counter-plan on all three occasions.',
    notesLines: 3,
  },

  // ─── BLACK ────────────────────────────────────────────────────────────────
  'black-reset-routine': {
    kind: 'worksheet',
    diagnosis: 'At this level matches turn on the twenty seconds after an error, not on the error itself. One lost point becomes a lost game because nothing separates them. A reset routine is not a relaxation exercise — it is the mechanism that stops the last point contaminating the next one.',
    rows: [
      { label: '1 · Release', detail: 'Turn to the back fence. The point is over whether you liked it or not.' },
      { label: '2 · Breathe', detail: 'One slow breath out, longer than the breath in. Drops the shoulders and the heart rate.' },
      { label: '3 · Decide', detail: 'Choose the next serve or return target before you turn round. One decision.' },
      { label: '4 · Commit', detail: 'Bounce, routine, go. No re-deciding at the toss.' },
    ],
    prompts: [
      { heading: 'When does it slip?', hint: 'The routine holds fine at 40-0. Name the exact moments it stops.', lines: 2 },
      { heading: 'Your three cues', hint: 'After an unforced error · after a bad call · serving at break point down.', lines: 3 },
      { heading: 'Match review — did it hold?', lines: 3 },
    ],
    success: 'Across a full match you complete all four steps on every point of two consecutive service games — including the games you lose. A coach watching from the side can tick it off without being told when to look.',
  },

  'black-changeover-checklist': {
    kind: 'worksheet',
    diagnosis: 'Players wait for a coach who, in most competition, is not allowed to speak. Ninety seconds gets spent sitting rather than deciding, and the same losing pattern runs for another two games. Three questions turn a rest into a decision.',
    rows: [
      { label: 'What is working?', detail: 'Name one thing. Do more of it — most players stop doing what is working without noticing.' },
      { label: 'What are they doing to me?', detail: 'Their pattern. If you cannot name it, that is the answer — start watching.' },
      { label: 'What is my one change?', detail: 'One. Not four. Changing everything is the same as changing nothing.' },
    ],
    prompts: [
      { heading: 'Practise it — fill this in at every changeover of a practice set', lines: 4 },
      { heading: 'Which question do you skip?', hint: 'Almost everyone skips the second one.', lines: 2 },
    ],
    success: 'You complete all three questions at every changeover of a full practice set, and can name the one change you made in each of the last three sets you played.',
  },

  'black-patterns-fatigue': {
    kind: 'drill',
    diagnosis: 'Patterns hold for a set and then disappear, because they have only ever been rehearsed fresh. In the third set the player reverts to whatever is easiest, which is usually the shot that lost them the first set. A pattern you cannot execute tired is not a pattern you own.',
    objective: 'Serve+1 and return+1 executed cleanly when physically tired.',
    setup: ['Court, cones, and a physical loading protocol between point sets.'],
    progressions: [
      { name: 'Fresh baseline', detail: 'Execute both patterns fresh. Record the success rate — this is the number to defend.', reps: '12 points' },
      { name: 'Load', detail: 'Six side-to-side efforts of twenty seconds with short recovery.', reps: '1 set' },
      { name: 'Patterns tired', detail: 'Immediately repeat the pattern points. Compare the rate.', reps: '12 points' },
      { name: 'Repeat', detail: 'Load, patterns, load, patterns. Three rounds.', reps: '3 rounds' },
    ],
    cues: ['"Tired is when the pattern is worth having."', '"Same routine, same decision — the legs change, the plan does not."', '"Shorten the point, not the thinking."'],
    faults: [
      { fault: 'Abandons the pattern when tired', why: 'Reverts to the easiest shot, which is rarely the right one', fix: 'Pattern named out loud before every point in the tired rounds.' },
      { fault: 'Routine shortens with fatigue', why: 'Rushed decisions exactly when they are hardest', fix: 'Coach counts the routine out loud in the final round.' },
    ],
    success: 'Pattern success rate in round three is within twenty percent of the fresh baseline, with the routine intact on every point.',
    notesLines: 3,
  },

  'black-serve-disguise': {
    kind: 'drill',
    diagnosis: 'A readable toss gives the return away before the ball is struck — and at this level the returner is good enough to use it. The player has usually built three good serves with three different tosses, which is three serves an opponent can see coming.',
    objective: 'One toss position producing three different serves.',
    setup: ['Toss marker on the court.', 'A partner returning, watching only the toss.'],
    progressions: [
      { name: 'Find the common toss', detail: 'Toss position that allows flat, slice and kick. Slightly compromised for each, readable for none.', reps: '15 tosses' },
      { name: 'Three from one', detail: 'Flat, slice and kick from the identical toss.', reps: '5 each' },
      { name: 'Returner guesses', detail: 'Partner calls which serve is coming, from the toss alone. Aim is for them to be wrong.', reps: '20 serves' },
      { name: 'Pattern it', detail: 'Serve games where the same serve may not be hit twice in a row to the same target.', reps: '4 games' },
    ],
    cues: ['"One toss, three serves."', '"A slightly worse serve they cannot read beats a perfect serve they can."', '"Vary the target before you vary the toss."'],
    faults: [
      { fault: 'Toss moves for the kick serve', why: 'Returner sees the second serve coming', fix: 'Marker on the court; returner calls the serve until they cannot.' },
      { fault: 'Same serve to the same target repeatedly', why: 'Pattern read by the third service game', fix: 'No repeat rule in the games phase.' },
    ],
    success: 'The returner correctly predicts the serve from the toss fewer than eight times in twenty, with all three serves landing in at an acceptable rate.',
    notesLines: 2,
  },

  'black-finishing-net': {
    kind: 'drill',
    diagnosis: 'The volley that decides the match is the one played tight and short — the player has done the hard work to get forward and then snatches at the finish. Approaches get coached endlessly; the finish almost never does.',
    objective: 'Finishing the point from the net under pressure, not merely arriving there.',
    setup: ['Coach feeds a passing ball or a lob at random.', 'Target zones in both corners.'],
    progressions: [
      { name: 'Finish deep', detail: 'First volley into a corner, away from the passer.', reps: '12 balls' },
      { name: 'Two volleys', detail: 'First volley deep, second volley finishes. Move forward between them.', reps: '12 sequences' },
      { name: 'Lob or pass', detail: 'Coach chooses at random. Overhead or volley as required.', reps: '15 balls' },
      { name: 'Under score', detail: 'Points from 30-30, player must come in every point.', reps: '11 points' },
    ],
    cues: ['"Finish into the corner, not at them."', '"Move in between the volleys — the second one is the finish."', '"Firm wrist, quiet racket."'],
    faults: [
      { fault: 'Snatches at the finish', why: 'Volley goes short or wide from a winning position', fix: 'Target zones; only corners count. Slow the racket down.' },
      { fault: 'Stops moving after the first volley', why: 'Second ball played from too far back', fix: 'Must gain a step between volleys or the rep restarts.' },
      { fault: 'Caught by the lob', why: 'Closing without watching the returner', fix: 'Random lob/pass rounds until the reaction is automatic.' },
    ],
    success: 'Nine of twelve two-volley sequences finished into a target corner, and eleven pressure points played coming in every time with fewer than three snatched finishes.',
    notesLines: 2,
  },

  'black-season-plan': {
    kind: 'plan',
    diagnosis: 'Players and coaches plan the next block and never the year, so events get met wherever they fall, technical work is attempted mid-competition and there is never a genuine off-week. The map is what makes every smaller decision easy.',
    goal: 'A twelve-month map with target events, blocks and real recovery written in before the year starts.',
    weeks: [
      { w: 'Oct–Dec', focus: 'Preparation', main: 'Highest volume. Technical change happens here or not at all. Physical base built.', measure: 'Hours logged; technical goal set' },
      { w: 'Jan–Feb', focus: 'Pre-competition', main: 'Volume down, intensity up. Patterns and practice sets.', measure: 'Patterns at 6/10 under score' },
      { w: 'Mar–Jul', focus: 'Competition', main: 'Maintain and compete. Nothing new introduced. Target events marked.', measure: 'Target events played to plan' },
      { w: 'Aug', focus: 'Transition', main: 'Genuine recovery. Not less tennis — actually off.', measure: 'Two weeks fully off' },
      { w: 'Sep', focus: 'Re-prepare', main: 'Rebuild base. Review the year honestly before setting the next one.', measure: 'Written review completed' },
    ],
    success: 'A twelve-month map exists on paper with target events marked, blocks named, and at least two consecutive weeks of genuine transition written in and taken.',
    notesLines: 3,
  },

  'black-load-management': {
    kind: 'worksheet',
    diagnosis: 'Overuse injuries arrive after the best training month, not the worst — the player feels good, adds volume, and the tissue does not keep up with the enthusiasm. Tracking load is what turns that from bad luck into a decision.',
    rows: [
      { label: 'Weekly hours', detail: 'On-court plus physical. Write it down; do not estimate at the end of the month.' },
      { label: 'The 10% rule', detail: 'Weekly load rising more than about 10% is where problems start. Feeling good is not a reason to break it.' },
      { label: 'Session RPE', detail: 'Rate each session 1–10 for effort. Hours alone hide intensity spikes.' },
      { label: 'Warning signs', detail: 'Sleep, appetite, morning stiffness, motivation. All drop before an injury, not after.' },
      { label: 'The easy day', detail: 'A week of hard sessions is not a hard week if none of them are easy. There must be easy days.' },
    ],
    prompts: [
      { heading: 'Log the last four weeks', hint: 'Hours and RPE. Look for the jump.', lines: 4 },
      { heading: 'Where is your easy day?', hint: 'If there is not one, that is the finding.', lines: 2 },
    ],
    success: 'Four weeks logged with hours and RPE, no week-to-week jump above roughly 10%, and at least one genuinely easy day scheduled every week.',
  },

  'black-training-week': {
    kind: 'plan',
    diagnosis: 'A week of hard sessions is not a hard week — it is an unsustainable one, and the quality of the hard days quietly drops until nothing is hard at all. Balance is what allows the difficult sessions to actually be difficult.',
    goal: 'A week where the hard days are genuinely hard because the easy days are genuinely easy.',
    weeks: [
      { w: 'Mon', focus: 'Quality', main: 'Technical or pattern work at high quality. Strength session.', measure: 'Quality held to the end' },
      { w: 'Tue', focus: 'Easy', main: 'Light hitting, movement, prehab. Deliberately easy.', measure: 'Actually easy — check it' },
      { w: 'Wed', focus: 'Match play', main: 'Practice sets with full routines and a written plan.', measure: '2 sets, sheets completed' },
      { w: 'Thu', focus: 'Easy / off', main: 'Recovery, mobility, or off entirely.', measure: 'Legs recovered' },
      { w: 'Fri', focus: 'Intensity', main: 'Serve, return and first-strike work. Strength session.', measure: 'First-serve % under score' },
      { w: 'Sat', focus: 'Compete', main: 'Match or competitive sets.', measure: 'Plan executed' },
      { w: 'Sun', focus: 'Off', main: 'Off. Properly.', measure: 'No tennis' },
    ],
    success: 'Two consecutive weeks run to this shape, with the Wednesday and Saturday sessions at a higher quality than in the weeks before it — because the easy days were kept easy.',
    notesLines: 3,
  },

  'black-mental-reading': {
    kind: 'worksheet',
    diagnosis: 'For the player whose limit is now psychological rather than technical, reading about the mental game is not the same as practising it. Each idea below has a drill attached, because a mental skill that never becomes something you do on court stays a nice idea.',
    rows: [
      { label: 'Attention beats instruction', detail: 'Drill: bounce-hit for a full set. Occupies the instructing voice and sharpens tracking.' },
      { label: 'Process over outcome', detail: 'Drill: score a set on your four intent markers only. Do not record who won.' },
      { label: 'Pressure is physical first', detail: 'Drill: breathing routine at every 30-30, rehearsed in practice sets so it exists in matches.' },
      { label: 'Reframing errors', detail: 'Drill: after each error, one sentence — what happened and what next. No judgement words.' },
      { label: 'Confidence follows evidence', detail: 'Drill: keep a written record of what you did well. Confidence built on nothing collapses under pressure.' },
    ],
    prompts: [
      { heading: 'Pick one and run it for a fortnight', hint: 'One, properly. Which and why?', lines: 2 },
      { heading: 'What changed?', lines: 3 },
    ],
    success: 'One idea run as a drill for two weeks, with a written note of what changed in your attention or your competing — independent of results.',
  },

  'black-self-coaching': {
    kind: 'worksheet',
    diagnosis: 'Independent players improve between lessons; dependent ones only improve during them — and at this level most of the hours are unsupervised. A player who cannot run their own session is capped by their coach\u2019s diary.',
    rows: [
      { label: 'Set the objective', detail: 'One thing, before you go on. Written, not thought.' },
      { label: 'Warm up properly', detail: 'The same warm-up you would get from a coach. Nobody is going to make you.' },
      { label: 'Build the drill', detail: 'A target, a rep count, and a success measure. Without a measure it is just hitting.' },
      { label: 'Feed back to yourself', detail: 'Every ten balls: did that meet the measure? Adjust once, then continue.' },
      { label: 'Finish with a score', detail: 'Play something competitive so the work has to survive pressure.' },
      { label: 'Write one line', detail: 'What worked, what to do next time. Sixty seconds, and it makes the next session better.' },
    ],
    prompts: [
      { heading: 'Plan your next solo session', hint: 'Objective, drill, measure, competitive finish.', lines: 4 },
      { heading: 'Afterwards — did you hit the measure?', lines: 2 },
    ],
    success: 'Three solo sessions run to this structure with a written measure for each, and you can say which ones hit the measure and which did not.',
  },
}
