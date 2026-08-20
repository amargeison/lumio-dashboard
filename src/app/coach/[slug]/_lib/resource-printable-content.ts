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
}
