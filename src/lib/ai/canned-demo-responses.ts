// ───────────────────────────────────────────────────────────────────────────
// Canned demo responses for B-category AI surfaces.
//
// B-category = surfaces where a demo session short-circuits to a pre-written
// response instead of calling the LLM. Every entry uses scrubbed demo names
// (Fairweather, Caldwell, Alex Rivera, Jake Morrison, James Halton, Marcus
// Cole, etc.) — never real pros.
//
// Routing: sport page files check `session?.isDemoShell !== false` and pull
// the appropriate field from CANNED[sport] BEFORE firing /api/ai/*. Live
// sessions (isDemoShell === false) skip this module entirely.
// ───────────────────────────────────────────────────────────────────────────

type SportCanned = {
  dashboardSummary?: string
  morningBriefing?: string
  matchDebrief?: string
  contentPlanner?: string
  sessionReview?: string
  practiceReview?: string
  preRoundBrief?: string
  rangeAnalysis?: string
  netsReview?: string
  matchReport?: string
  contractSummary?: string
  fightWeekBrief?: string
  fightDebrief?: string
  preSeasonSummary?: string
}

export const CANNED: Record<'tennis' | 'cricket' | 'golf' | 'darts' | 'boxing', SportCanned> = {
  // ────────────────────────────────────────────────────────────────────────
  tennis: {
    dashboardSummary: [
      '• Serve velocity up 3% over the last 4 sessions — Coach Caldwell flagged the grip-pressure drill as working.',
      '• Opponent scout (Halton): second serve on the ad court sits at 42% to the T — target with the forehand return.',
      '• Travel: Wednesday flight to Barcelona confirmed, hotel block holds until 14:00.',
      '• Physio: left shoulder ROM back to 94%, cleared for full practice loads this week.',
    ].join('\n'),
    morningBriefing: [
      'Good morning. Here\'s the state of play for today.',
      '',
      'Practice is on at 09:30 with Coach Caldwell — focus block is second-serve placement from the ad court, building off Monday\'s tape review. Jake Morrison joins at 11:00 for a one-hour hit, deliberately short to protect the left shoulder which is still loading back up from last week\'s tightness.',
      '',
      'Scout is on James Halton ahead of Friday. Key read: his first-step recovery on wide forehand returns is the slowest of his opening-round pool, and he drifts to a safe middle-ball pattern when you stretch him early in the rally. Play the wide-serve out-swing as your opening-point pattern and keep him moving cross-court before the down-the-line pass.',
      '',
      'Media obligation at 14:30 — 8 minutes with the tour broadcaster, pre-agreed topics. Travel is packed for Barcelona, flight 07:40 Wednesday, hotel reception has your early check-in held.',
      '',
      'One ask from Physio: no extra serves off-session today.',
    ].join('\n'),
    practiceReview: [
      'Session review — 90 minutes, courts 3 and 4, Coach Caldwell leading.',
      '',
      'Serve block (0-30 min): 38 first serves to the T at 72% accuracy, +4 points vs the last three-session average. Placement is sharper than velocity today — the grip-pressure cue has clearly landed. Second serve to the ad court sat at 58% kick-into-body, which is exactly where the Halton plan needs it to be.',
      '',
      'Return + rally block (30-75 min): the wide-forehand return pattern is tightening up, but you\'re still reaching on the down-the-line change of direction off the ad court when the ball lands deep. Caldwell would like 15 focused reps of that exact shot tomorrow — feed drill, no points.',
      '',
      'Physical load (75-90 min): 22 sets of cross-court plyos, RPE 7. Left shoulder held cleanly. No flag.',
      '',
      'Actionable for tomorrow: 15 reps deep-ball DTL from ad court. Hold the grip cue.',
    ].join('\n'),
    matchDebrief: [
      'Post-match debrief — 6-4, 3-6, 7-5 (3h12m).',
      '',
      'What worked. The wide-serve out-swing pattern on the ad court was the match-winner — 71% of first serves landed inside the 18-inch target zone and you won 14 of the 19 points that started there. Halton never adjusted his return position, which was the read we had from the Caldwell scout.',
      '',
      'What didn\'t. Set two unravelled through the service games at 3-3 and 4-3 when the second-serve kick flattened — six unreturned second serves became four winners against you in six games. Fatigue read on the shoulder or a lapse in the grip-pressure cue? Tape will tell us tonight.',
      '',
      'Decider: the 5-all return game was the pivot. You went deep-middle twice in a row and moved him into a clean forehand setup — that\'s the Caldwell wide-stretch pattern paying out exactly as scripted.',
      '',
      'For next round: keep the ad-court pattern. Tape review at 09:00 — focus is the 3-3 set-two service game.',
    ].join('\n'),
  },

  // ────────────────────────────────────────────────────────────────────────
  cricket: {
    preSeasonSummary: [
      'Pre-season camp summary — Oakridge CC, two-week block at Abu Dhabi.',
      '',
      'Coverage: 14 sessions (7 nets, 4 fielding, 2 fitness, 1 strategy). 16 of 18 squad attending full blocks; Harrison returning from calf (phase 3 RTP), Dawson workload-managed with A:C ratio sitting at 1.62 (red flag for the opening rounds).',
      '',
      'Highlights. Harry Fairweather is hitting peak form early — averaging 62 off seamers in simulated nets and reading length off both hands cleanly. Marcus Cole\'s short-ball plan against left-arm seam has added a quantifiable 9 run-equivalent across 30 simulated overs. Bowling: Ridley\'s away-swing has been the story — reverse-seam consistency inside sessions is a step forward from last August. Merriman\'s off-spin has a clean new variation working against left-handers.',
      '',
      'Concerns. Middle-order depth past number five looks thin on the first read. We\'ll want one more simulated innings from Webb and Shaw before the Lancashire opener, and the Dawson workload flag means the opening four-day XI will need a seam backup plan.',
      '',
      'Strategic takeaway for the opener: our top-order average batting first on seaming surfaces is 44.2 over the last 18 months. If we win the toss at Oakridge Park, bat first, trust the work.',
    ].join('\n'),
    contentPlanner: [
      '1. Pre-season highlights reel — 60-second vertical cut for Instagram/TikTok. Lead with Fairweather nets, close on Ridley\'s reverse-swing session. Overlay the "Road to Round 1" sponsor card from Crownmark Cricket.',
      '',
      '2. Player Q&A carousel — 5 slides, Marcus Cole answering fan submissions from last week\'s supporter drop. Tone: dry and specific, not PR-polished.',
      '',
      '3. Long-form blog — 900-word "What we built in Abu Dhabi" write-up for the members\' site. Pair with a six-photo gallery from the camp. Soft gate: members-only for 72h, then open.',
      '',
      '4. Matchday assets — pre-book the Fairweather headshot template for the Round 1 announce, build a template for the toss-result graphic in club colours with the Crownmark Cricket stripe.',
      '',
      '5. Fan-engagement push — "Pick your XI for Lancashire" poll across Instagram Stories, X, and the members\' app. Winner gets a signed training top.',
    ].join('\n'),
    contractSummary: [
      'Player contract summary — Harry Fairweather.',
      '',
      'Term: 3 years through end of 2029 season. Structure: combined central + county fee, weighted 60/40 county-first (consistent with Crownmark-sponsored middle-order tier).',
      '',
      'Financial: £165k year one, £180k year two, £200k year three. Bonus triggers — 500-run aggregate per format: £8k bonus, 1,000-run aggregate: £20k bonus. One image-rights carve-out negotiated for Crownmark Cricket (matchday + two sponsor shoots per year).',
      '',
      'Availability clauses: full county availability across all four competitions, 10 calendar days pre-franchise window released for The Hundred or overseas (subject to head coach sign-off). No IPL release clause in this contract — flagged for the 2028 extension talks.',
      '',
      'Exit + extension: mutual review at end of year two. Club option to extend one year at the year-three rate, exercisable by Sept of year two.',
      '',
      'Flags for the board: commercial image-rights schedule (Crownmark) needs legal sign-off before announce. No other red flags.',
    ].join('\n'),
    netsReview: [
      'Nets session review — 70 minutes, indoor nets 1-3, seam-friendly surfaces.',
      '',
      'Top order. Fairweather: 28 balls faced, front-foot trigger clean, late back-foot decision-making sharp against Ridley\'s back-of-length. One dismissal (played-on to Fenwick, late inside-edge), rest of session was control. Marcus Cole: 22 balls, short-ball plan against Kent is clearly grooved now — two hooks pulled cleanly, one left, no flinch.',
      '',
      'Middle order. Webb: 30 balls, worked off the hip well but wasted three deliveries outside off on the drive in minutes 12-15. Fix: leave the channel until you\'ve scored 15. Shaw: short session after the workload call, 15 balls, clean rhythm.',
      '',
      'Bowlers. Ridley continues to build the away-swing — consistent shape across a 6-over spell, no fall-off in the back half. Fenwick needs a run-up tweak: six no-balls in the session. Kent off-pace on the length early, recovered in the middle block. Merriman\'s off-spin variation is doing exactly what we want against the left-handers.',
      '',
      'Action items: Fenwick run-up remark tomorrow, Webb\'s leave-channel rep, Ridley stays on current plan.',
    ].join('\n'),
    matchReport: [
      'Match report — Oakridge CC vs Lancashire, Day 1, County Championship.',
      '',
      'Oakridge CC 298/6 at stumps (Fairweather 112*, Marcus Cole 68, Webb 42; Sinclair 3-67, Kellett 2-54).',
      '',
      'Oakridge won the toss and chose to bat on a seam-friendly Oakridge Park pitch that offered help to the new ball for the opening session. Harry Fairweather brought up a 142-ball century — his first of the season — with 14 fours and one six, building a 115-run third-wicket partnership with Marcus Cole that anchored the innings through a tricky middle session.',
      '',
      'Lancashire\'s Sinclair bowled a hostile opening spell (8-2-19-2) that removed the openers inside the first 14 overs, but Fairweather and Cole rode out the spell by playing straight and leaving the channel. The afternoon session belonged to Oakridge: 112 runs in 29 overs, no wickets, with Cole scoring at a 68 strike rate before he edged a loose drive to slip off Kellett.',
      '',
      'Ridley expected to lead the reply with the new ball tomorrow. Weather: forecast clear, first session likely to firm up the surface.',
      '',
      'Quote — Head Coach: "We trusted the work from the camp. Fairweather looked like he had time on everything."',
    ].join('\n'),
  },

  // ────────────────────────────────────────────────────────────────────────
  golf: {
    dashboardSummary: [
      '• Driving distance +4yds vs 30-day baseline — Coach Halton flagged the new tempo drill as the likely driver.',
      '• Short game: 8ft putting conversion up to 71% (was 63%) after Monday\'s green-reading block.',
      '• Travel: Wednesday transfer to Valderrama is confirmed; pro-am pairing received from the host.',
      '• Mental prep: two sessions booked with James Halton (sports psych) Thursday + Friday morning.',
    ].join('\n'),
    morningBriefing: [
      'Morning briefing — practice day 3 of the pre-tournament block.',
      '',
      'Range window is 08:30-10:00 with Coach Halton, focus is the new tempo drill on the driver. We want the same 2.8-to-1 back-swing to down-swing ratio we\'ve been building all week, and Halton would like 20 reps before moving to iron play.',
      '',
      'Short game at 10:30-12:00 on the practice green with James Halton (sports psych) shadowing — Monday\'s green-reading block has bumped 8-foot conversion from 63% to 71% and we want that to hold under pressure. Drills today: 3-ball games at 8ft, 12ft, 18ft, with a forfeit for missed centres.',
      '',
      'Afternoon: course walk at Valderrama with the caddy at 14:00. Holes 4, 10, and 17 are the read-and-commit holes from the course book — extra focus there. Weather Thursday suggests a hard right-to-left cross on the back nine, so the fade into 17 green is back on the plan.',
      '',
      'Media: 8-minute tour-broadcast pre-round interview at 16:30, topics pre-agreed.',
    ].join('\n'),
    contentPlanner: [
      '1. Pre-tournament vlog — 90-second cut from the range session with Coach Halton. Lead with the tempo-drill slow-mo, close on a full-swing 7-iron flush.',
      '',
      '2. Course reconnaissance carousel — 5 slides with caddy\'s notes on holes 4, 10, and 17 at Valderrama. Pair with the wind forecast graphic in the sponsor (Crownmark) template.',
      '',
      '3. Fan-submitted question reel — 60-second horizontal, three questions from Instagram Stories, answered on the putting green. Tone: calm and specific.',
      '',
      '4. Long-form blog — 700-word "Why we\'re working on the tempo drill" write-up for the members\' site. Pair with the 2.8:1 diagram from Coach Halton.',
      '',
      '5. Matchday assets — Thursday tee-time card in club colours with the Crownmark Cricket stripe; prepare a scoreboard-refresh template for the live feed.',
    ].join('\n'),
    rangeAnalysis: [
      'Range session analysis — 60 minutes, bay 4, launch monitor attached.',
      '',
      'Driver (0-20 min): 24 swings, 18 in the committed tempo range (2.75-2.85 ratio), 6 outside. Carry average 291yds (+4 vs 30-day), dispersion tightened to 14yds side-to-side (was 21 last week). Sessions with the new tempo cue are landing — Coach Halton flagged two swings in the outside bracket as late-session fatigue, not a technique slip.',
      '',
      'Mid-irons (20-45 min): 7-iron carry average 178yds with +/- 3 yards dispersion, which is tour-level consistency. 8-iron draw shape is back — the right-to-left flight is sitting where we want it into holes that demand it at Valderrama (hole 10 specifically).',
      '',
      'Wedges (45-60 min): flagged one issue. 60° from 45-70yds is landing softer than planned, five of eight landing short of the target by 3-5yds. Coach Halton wants 15 minutes on the practice bunker tomorrow to groove the carry number.',
      '',
      'Action: wedge block tomorrow, hold the tempo cue on driver.',
    ].join('\n'),
    preRoundBrief: [
      'Pre-round brief — Valderrama, Thursday, 10:42 tee.',
      '',
      'Course: firm surface, early dew off by tee-time. Wind forecast is hard right-to-left cross from hole 12 onwards — the fade into 17 green is back on, 9-iron from 162yds accepting a 6-yard right-to-left drift.',
      '',
      'Opening three holes. Hole 1: three-wood off the tee to the 230-yard mark, pitching wedge in — first-tee nerves are real, commit to the pitching wedge number, do not over-swing. Hole 2: driver, but stay right of the middle — bail-out left is dead. Hole 3: par-3, 178yds, 7-iron draw as practiced this morning.',
      '',
      'Read-and-commit holes (from the course walk): hole 4 pin is front-right, play to the middle. Hole 10 is today\'s aggressive chance — 3-wood off the tee, wedge in, attack the back-left pin. Hole 17: fade-in, do not short-side yourself, centre of green is a win.',
      '',
      'Mental prep: two breath cycles on every tee. James Halton will be in the pre-round tent at 10:20 for the final reset.',
      '',
      'Committed plan — trust the tempo work.',
    ].join('\n'),
    matchDebrief: [
      'Round debrief — Valderrama, Thursday round, 71 (-1).',
      '',
      'Front nine (34): the tempo work from Wednesday\'s range session held up cleanly. 7 of 9 fairways found, 6 of 9 greens in regulation, one birdie and no bogeys. The hole-4 read-and-commit plan worked exactly as practiced — middle of the green, two-putt par, no drama.',
      '',
      'Back nine (37): hole 10 was the aggressive chance we talked about in the pre-round brief and it paid off (birdie, 3-wood + pitching wedge to 12ft). Hole 14 bogey came from a committed shot that came up 4yds short — that\'s on the wedge number we flagged in the range analysis yesterday, and Coach Halton and I will look at it tomorrow morning before round 2. Hole 17 fade-in held up under the left-to-right cross, as planned.',
      '',
      'Mental: the two-breath cue on the tee sat cleanly. James Halton reports no red flags from the on-course read.',
      '',
      'Actionable for round 2: 15 minutes on 60° wedge from 45-70yds tomorrow at 08:15. Hold the tempo cue. Stay aggressive on the par-5s.',
    ].join('\n'),
  },

  // ────────────────────────────────────────────────────────────────────────
  darts: {
    dashboardSummary: [
      '• Three-dart average sits at 98.4 over the last 20 legs — +2.1 vs the 30-day baseline.',
      '• Coach Halton flagged the new stance drill as working — 180 rate is at 11.3% (was 9.1%).',
      '• Travel: Birmingham hotel confirmed, practice suite booked 14:00-16:00 Wednesday.',
      '• Mental prep: breath-cue session with James Halton tomorrow at 09:30.',
    ].join('\n'),
    sessionReview: [
      'Practice session review — 90 minutes, home practice suite, Coach Halton observing.',
      '',
      'Warm-up block (0-20 min): 9-dart finishing drill, hit 7 of 10 — cleanest number of the week. Grouping on 20 is tighter than Monday, no wide releases.',
      '',
      'Doubles block (20-60 min): D16 conversion sat at 74% (was 61% last Friday), D20 at 68%, D18 at 70%. The stance drill is clearly landing — the second-dart release is calmer and the throw arc is more consistent. Coach Halton wants one more week on the current cue before we move on.',
      '',
      'Leg play (60-90 min): six full legs simulated, three won in 15 darts or fewer, average 97.8. Flagged: the 141 out-shot attempt went to a 50 finish with one dart remaining — under pressure the out-shot maths slipped. James Halton will add a 5-minute pressure-leg block to tomorrow\'s mental-prep session.',
      '',
      'Action: hold the stance cue. Add pressure out-shot block tomorrow.',
    ].join('\n'),
    matchDebrief: [
      'Match debrief — Premier League Darts, Night 7, Birmingham.',
      '',
      'Result: 6-4 win over Marcus Cole. Three-dart average 99.7, checkout percentage 47%, 180s: 3.',
      '',
      'What worked. The new stance drill held up under broadcast pressure — D16 conversion was 5 of 6 on the deciding doubles, which is the exact number we\'ve been building in practice. The 141 out-shot in leg 6 was the turning point, and it came from the pressure-leg block we\'ve been running all week.',
      '',
      'What didn\'t. Legs 3 and 7 ran long (17 darts average) and the single-on-a-double miss in leg 3 gave Cole a look he shouldn\'t have had. The post-break reset in leg 8 was slow — two wide first darts before settling.',
      '',
      'Read for Night 8: hold the stance cue. Add one extra 5-minute pressure-leg block at 15:00 before walking on. Mental-prep two-breath reset on every bullseye re-approach.',
      '',
      'Coach Halton: "Cleanest night at the doubles in six weeks."',
    ].join('\n'),
    contentPlanner: [
      '1. Practice suite vlog — 75-second vertical from today\'s doubles block. Lead with the 141 checkout in slow-motion, close on the stance-drill breakdown graphic.',
      '',
      '2. Fan Q&A carousel — 5 slides answering the top fan questions from Monday\'s X drop. Keep tone dry and specific, not PR-polished.',
      '',
      '3. Long-form blog — 600-word "Why the stance drill is working" piece for the members\' site, pair with the launch-monitor chart.',
      '',
      '4. Match-night assets — Night 8 walk-on card in Crownmark Cricket sponsor colours; refresh the out-shot scoreboard template in club stripe.',
      '',
      '5. Community push — "Pick your 9-dart finish" interactive on Instagram Stories and X; winner gets a practice-night ticket.',
    ].join('\n'),
  },

  // ────────────────────────────────────────────────────────────────────────
  boxing: {
    dashboardSummary: [
      '• Fight week 3 of 12 — weight check on Monday was 72.8kg, 1.8kg to cut, on track.',
      '• Sparring: 4 rounds with Alex Rivera Saturday — coach read it as the cleanest jab work in six weeks.',
      '• Camp: Jake Morrison (strength) reports power-clean RPE at 8, session loads sitting on plan.',
      '• Travel: weigh-in hotel confirmed, team transfer booked for Thursday 14:00.',
    ].join('\n'),
    fightWeekBrief: [
      'Fight week brief — championship weight bout, Saturday 22:00.',
      '',
      'Weight plan. We\'re 1.8kg over the championship weight this morning. Jake Morrison\'s plan cuts 0.6kg Monday, 0.6kg Tuesday, and finishes the cut with a 30-minute warm-room sweat on Thursday evening — no water-loading protocol this week on doctor\'s order.',
      '',
      'Training load. Three sparring sessions this week (Monday, Tuesday, Thursday). Monday: 6 rounds, tempo work against Alex Rivera. Tuesday: 8 rounds, specific opponent patterns against a southpaw look. Thursday: 4 rounds, taper, no new ideas. Pad-work blocks Tuesday and Thursday, focus is the jab-step pattern we\'ve been building for the early rounds.',
      '',
      'Mental prep. Two sessions with James Halton (sports psych), Tuesday and Friday morning, plus a 20-minute visualisation block the night before. No new pre-fight habits introduced this week — trust the routine.',
      '',
      'Media. Tuesday press call at 15:00 (pre-agreed topics only, 10 minutes). Thursday weigh-in face-off — eyes on the opponent, no trash talk, on-brand for the Crownmark Cricket sponsorship.',
      '',
      'Saturday. Team walk-in at 19:30, warm-up from 20:00, corner crew confirmed.',
    ].join('\n'),
    fightDebrief: [
      'Fight debrief — Saturday championship bout, W UD 12.',
      '',
      'Judges: 116-112, 115-113, 117-111. Official punch stats: 248 of 702 thrown (35.3%), jab 126 of 397, power 122 of 305. Opponent: 189 of 643 (29.4%).',
      '',
      'What worked. The jab-step pattern from camp did exactly what we built it for — round 1 through 4 landed 41 jabs and set the rhythm of the whole fight. The read-and-commit body work in rounds 6 and 7 slowed the opponent\'s footwork for the championship rounds, which was the mid-fight plan the coach called.',
      '',
      'What didn\'t. Round 8 we drifted to the ropes twice after a clinch break and took three clean counters off it. The fix is the pivot-out drill we added after the Rivera sparring session in week 7 — it was there in camp and it wasn\'t there on the night. Mental note for the next fight.',
      '',
      'Championship rounds (10-12). Back on the jab, back on the step, outscored the opponent 46 to 21 in landed punches. Exactly the plan.',
      '',
      'Post-fight: ice and physio tonight. Rest day Sunday. Camp review with coach and Jake Morrison Tuesday morning.',
    ].join('\n'),
    contentPlanner: [
      '1. Fight-week vlog — 90-second cut from Tuesday\'s pad session. Lead with the jab-step pattern in slow motion, close on the weigh-in face-off graphic.',
      '',
      '2. Camp content series — 3-part carousel on Instagram: the cut, the sparring plan, the mental prep with James Halton. Release Monday / Wednesday / Friday of fight week.',
      '',
      '3. Long-form blog — 800-word "Inside fight week" write-up for members\' site, with quotes from Jake Morrison (strength) and the coach.',
      '',
      '4. Fight-night assets — walk-in card in Crownmark Cricket sponsor colours, refresh the scorecard-refresh template for the live social feed between rounds.',
      '',
      '5. Fan-engagement push — "Predict the round" poll for Instagram Stories and X; winners get a signed glove.',
    ].join('\n'),
  },
}

export type SportKey = keyof typeof CANNED
