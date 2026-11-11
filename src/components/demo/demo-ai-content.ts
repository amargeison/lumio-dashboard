// Canned AI content for the public demo pages.
// The demo must never call the live dept-summary AI route (real Claude spend), so the
// demo AI Summary card and Insights modal read from these maps instead.
// Written from DEPT_CONTEXT in the live dept-summary route, in the
// same format the live prompts ask for. Fictional names only.

export interface DemoSummary {
  bullets: string[]
  watchOut: string
}

export interface DemoInsights {
  executiveSummary: string
  achievements: string[]
  improvements: string[]
  risks: string[]
  actions: string[]
}

export const DEMO_SUMMARIES: Record<string, DemoSummary> = {
  // ── Schools ──────────────────────────────────────────────────────────────
  'school-office': {
    bullets: [
      '📊 Attendance is 94.2% — just below the 95% target, chase persistent absentees today',
      '📝 12 absence notes pending — clear them before registers close this afternoon',
      '📨 3 parent communications ready to send — review and release before 3pm',
      '🛡️ 4 staff still due safeguarding training — book them into this term\'s session',
    ],
    watchOut: '⚠️ Watch out for: unexplained absences turning into unauthorised codes if notes aren\'t chased today',
  },
  'hr-staff': {
    bullets: [
      '👥 42 staff on roll, 2 currently on sick leave — cover is arranged for both',
      '📚 4 training courses overdue — send reminders and set completion dates this week',
      '📢 1 vacancy open — shortlist due so interviews can run before half term',
      '💚 Wellbeing check-ins due for staff returning from sickness absence',
    ],
    watchOut: '⚠️ Watch out for: overdue mandatory training showing as a compliance gap at inspection',
  },
  'curriculum': {
    bullets: [
      '⭐ 85% of lessons rated good or outstanding — strongest result this year',
      '📋 3 subject reviews due this term — confirm dates with subject leads',
      '🧸 New EYFS framework rollout underway — check Reception planning reflects the changes',
      '📦 Resource requests outstanding — prioritise those linked to subject review areas',
    ],
    watchOut: '⚠️ Watch out for: subject reviews bunching up at the end of term alongside report writing',
  },
  'safeguarding': {
    bullets: [
      '🛡️ 6 open concerns — review each and confirm next actions are recorded',
      '📞 2 LADO referrals this term — ensure outcomes and follow-ups are logged',
      '✅ All DBS checks current — single central record is up to date',
      '📅 Section 175 audit in 3 weeks — start gathering evidence now',
    ],
    watchOut: '⚠️ Watch out for: any concern without a recorded action before the Section 175 audit',
  },
  'send-dsl': {
    bullets: [
      '📋 14 pupils on the SEND register, 6 with EHCPs',
      '📅 3 annual reviews due this month — send invitations to families and professionals',
      '🔍 2 new referrals awaiting assessment — schedule initial observations this week',
      '🎯 Review intervention impact data ahead of the next provision map update',
    ],
    watchOut: '⚠️ Watch out for: annual review paperwork missing the statutory deadline',
  },
  'finance-school': {
    bullets: [
      '💷 £1.2M budget with 68% spent year to date — broadly on profile',
      '📉 £42k underspend against forecast — agree how it will be committed',
      '🧾 2 grant claims outstanding — submit before the funding deadline',
      '📊 Prepare budget monitoring summary for the next governors\' meeting',
    ],
    watchOut: '⚠️ Watch out for: unclaimed grant income if the 2 outstanding claims slip past deadline',
  },
  'admissions': {
    bullets: [
      '📝 34 Reception applications received so far',
      '🎯 89% conversion from open day — follow up with families who haven\'t applied',
      '⚖️ 3 appeals pending — confirm panel dates and send paperwork',
      '🏫 Intake at 90% of PAN — monitor in-year applications closely',
    ],
    watchOut: '⚠️ Watch out for: appeal paperwork deadlines falling during a busy admissions week',
  },
  'ofsted': {
    bullets: [
      '📅 Last inspection 18 months ago rated Good — the window is opening',
      '📂 Evidence folder 78% complete — focus on the remaining gaps first',
      '🔶 2 areas for improvement still outstanding — show clear progress evidence',
      '⭐ Lesson quality and safeguarding records are current strengths to lead with',
    ],
    watchOut: '⚠️ Watch out for: the call coming before the evidence folder and AFI updates are complete',
  },
  'trust': {
    bullets: [
      '🏫 8 schools in the trust: 1 Outstanding, 6 Good, 1 Requires Improvement',
      '🎯 Focus central support on the RI school\'s improvement plan',
      '📅 Governance meeting in 2 weeks — circulate papers a week ahead',
      '📊 Share cross-trust comparison data with heads before the meeting',
    ],
    watchOut: '⚠️ Watch out for: the RI school being re-inspected before improvements are embedded',
  },
  'students': {
    bullets: [
      '👥 420 pupils on roll with 94% attendance this week',
      '⚠️ 12 behaviour incidents this week — look for patterns by year group',
      '🚫 3 fixed-term exclusions this term — confirm reintegration meetings happened',
      '💬 Contact parents of pupils with repeat incidents before Friday',
    ],
    watchOut: '⚠️ Watch out for: repeat behaviour incidents escalating to further exclusions',
  },
  'wraparound': {
    bullets: [
      '🥣 Breakfast club 38 of 45 places booked — room for 7 more',
      '🎨 After-school club 52 of 60 places booked — near capacity',
      '👥 2 staff absences to cover — confirm ratios before sessions start',
      '🛡️ Check all wraparound staff safeguarding training is current',
    ],
    watchOut: '⚠️ Watch out for: staff-to-child ratios if absences aren\'t covered before tonight',
  },
  'facilities-school': {
    bullets: [
      '🔧 3 maintenance jobs open — chase the oldest with the contractor',
      '🔥 Fire drill due this month — book it and log the evacuation time',
      '🌡️ Boiler service scheduled next week — warn staff about heating downtime',
      '🛝 Playground resurfacing approved — agree dates outside term time',
    ],
    watchOut: '⚠️ Watch out for: the fire drill slipping into next month and breaking the termly cycle',
  },
  'timetable': {
    bullets: [
      '📋 4 cover lessons needed today — assign before period 1',
      '✅ 2 room clashes resolved this morning',
      '⚖️ 1 teacher over their allocation limit — rebalance before next week',
      '📅 Check cover pattern for absence trends by department',
    ],
    watchOut: '⚠️ Watch out for: the same staff picking up repeated cover and breaching workload limits',
  },
  'reports': {
    bullets: [
      '📝 End-of-term reports due in 3 weeks — 45% submitted so far',
      '📊 Data drop next Friday — remind staff to enter assessments',
      '🤝 2 moderation sessions planned — confirm attendance from each phase',
      '🔍 Spot-check data quality before the drop to avoid rework',
    ],
    watchOut: '⚠️ Watch out for: reports and the data drop landing in the same week',
  },
  'classes': {
    bullets: [
      '🏫 14 classes with an average size of 28.5',
      '⚠️ 2 classes over 30 — review whether rooms and staffing still fit',
      '👋 1 new pupil arriving next week — confirm class and buddy',
      '📋 Registers complete today — no missing marks',
    ],
    watchOut: '⚠️ Watch out for: the new arrival pushing another class over 30',
  },

  // ── Football ─────────────────────────────────────────────────────────────
  'squad': {
    bullets: [
      '⚽ 22 of 25 players fit for Saturday vs Riverside',
      '🏥 Martinez (hamstring), O\'Brien (ankle) and Santos (knee) unavailable',
      '🟥 Thompson suspended — plan a replacement in midfield',
      '📈 Squad form solid — keep the core of last week\'s starting XI',
    ],
    watchOut: '⚠️ Watch out for: thin cover in midfield with Thompson suspended and three injuries',
  },
  'tactics': {
    bullets: [
      '📐 4-2-3-1 delivering a 68% win rate — stick with it Saturday',
      '🎯 Set-piece conversion at 14% — keep the near-post routines',
      '🔥 Riverside turn it over 34% of the time under a high press',
      '🧠 Drill pressing triggers in this week\'s tactical session',
    ],
    watchOut: '⚠️ Watch out for: leaving space in behind when the press is beaten',
  },
  'medical': {
    bullets: [
      '🏥 3 players injured — Santos closest to return (7 Apr)',
      '📅 Martinez targeting 14 Apr, O\'Brien 21 Apr at the earliest',
      '🏃 Silva on modified training — monitor GPS load closely',
      '💚 Review wellness scores before Saturday\'s squad selection',
    ],
    watchOut: '⚠️ Watch out for: rushing Santos back before the knee passes final tests',
  },
  'scouting': {
    bullets: [
      '🎯 Bid submitted for Diallo at £1.8m — awaiting response',
      '👀 Ferreira still on watch — one more live report needed',
      '📝 12 scout reports filed this month',
      '🌍 4 scouts active across 6 leagues',
    ],
    watchOut: '⚠️ Watch out for: rival interest in Diallo pushing the price up',
  },
  'academy': {
    bullets: [
      '🏆 U21s won 3-0 — Collins scored a hat-trick',
      '⭐ 3 players judged first-team ready — plan training exposure',
      '📨 4 scholarship offers out — chase replies this week',
      '📋 EPPP audit next month — confirm evidence is complete',
    ],
    watchOut: '⚠️ Watch out for: EPPP documentation gaps showing up at the audit',
  },
  'transfers': {
    bullets: [
      '💷 £4.2m transfer budget remaining',
      '🤝 Diallo bid countered at £2.1m by the selling club',
      '⏰ Window closes in 11 days — set a decision deadline',
      '📋 Keep a fallback target ready if the Diallo deal stalls',
    ],
    watchOut: '⚠️ Watch out for: running out of window time while negotiations drag on',
  },
  'analytics': {
    bullets: [
      '📊 xG 42.6 — overperforming by +5.4, expect some regression',
      '🛡️ xGA 28.3 — defensive shape holding up well',
      '⚽ 58% average possession with 84% pass accuracy',
      '➡️ 43% of chances come down the right — exploit it vs Riverside',
    ],
    watchOut: '⚠️ Watch out for: becoming predictable if attacks keep favouring the right side',
  },
  'media': {
    bullets: [
      '🎙️ Press conference at 2pm today — brief the manager on injury questions',
      '📨 4 media requests pending including Crown Broadcasting and Northbridge Sport',
      '📈 124k social followers with engagement up 18%',
      '📰 Local gazette interview request — slot it in after the presser',
    ],
    watchOut: '⚠️ Watch out for: off-message answers on injuries or the Diallo bid',
  },
  'matchday': {
    bullets: [
      '🏟️ Riverside United at home, Saturday 3pm',
      '🎟️ Expected attendance 8,200',
      '🍽️ Corporate hospitality 94% full',
      '📋 14 of 22 ops checklist items done — 8 still open',
    ],
    watchOut: '⚠️ Watch out for: the 8 open checklist items not closing before Friday',
  },
  'training': {
    bullets: [
      '🧠 Tactical session at 10am focused on pressing triggers',
      '🎯 Set pieces at 11:30',
      '💪 Recovery group of 3 players in the gym from 9am',
      '📊 Average squad load at 72% — on plan for Saturday',
    ],
    watchOut: '⚠️ Watch out for: load creeping up on players returning from injury',
  },
  'finance-football': {
    bullets: [
      '💷 £4.2m transfer budget available',
      '📊 Wage bill £2.1m a year — 62% of revenue against a 60% target',
      '📈 £3.4m revenue year to date, matchday revenue up 8%',
      '⚖️ PSR position stable — keep wages in check',
    ],
    watchOut: '⚠️ Watch out for: new signings pushing the wage ratio further above 60%',
  },
  'staff-football': {
    bullets: [
      '👥 32 staff in total: 8 coaching, 4 medical, 4 scouts',
      '🧤 GK coach on UEFA Pro course Monday to Wednesday',
      '🏥 Head physio on holiday 14–18 Apr — confirm medical cover',
      '📋 Scout assignments set for the week',
    ],
    watchOut: '⚠️ Watch out for: thin medical cover while the head physio is away',
  },
  'facilities-football': {
    bullets: [
      '🌱 Main pitch in excellent condition after Tuesday\'s re-seed',
      '💧 Training pitch 2 waterlogged — move sessions to pitch 1',
      '📹 CCTV upgrade scheduled next week',
      '💡 Floodlight inspection passed',
    ],
    watchOut: '⚠️ Watch out for: training pitch 2 still out of use if rain continues',
  },
}

export const DEMO_INSIGHTS: Record<string, DemoInsights> = {
  // ── Schools ──────────────────────────────────────────────────────────────
  'school-office': {
    executiveSummary: 'The school office is running smoothly with attendance at 94.2%, just below the 95% target. Admin workload is manageable, though absence notes and outgoing communications need clearing. Safeguarding training for 4 staff is the main compliance item.',
    achievements: ['✅ Attendance holding steady at 94.2%', '✅ Visitor sign-in and first aid logs kept up to date', '✅ Parent communications going out on schedule'],
    improvements: ['🔶 12 absence notes still pending', '🔶 3 communications waiting to be sent', '🔶 Urgent parent responses need a faster turnaround'],
    risks: ['🔴 4 staff overdue for safeguarding training'],
    actions: ['➡️ Book the 4 staff onto safeguarding training this week', '➡️ Clear absence notes before registers close', '➡️ Send the 3 pending communications today', '➡️ Run a persistent absence check against the 95% target'],
  },
  'hr-staff': {
    executiveSummary: 'Staffing is stable at 42, with 2 on sick leave and cover in place. Training compliance is the main gap, with 4 courses overdue. One vacancy is open and recruitment should move before half term.',
    achievements: ['✅ Absence cover arranged for both staff on sick leave', '✅ No contracts expiring without a plan', '✅ Leave requests processed promptly'],
    improvements: ['🔶 4 training courses overdue', '🔶 CPD bookings below target this month', '🔶 Return-to-work check-ins need scheduling'],
    risks: ['🔴 Overdue mandatory training could be flagged at inspection'],
    actions: ['➡️ Send training reminders with firm completion dates', '➡️ Shortlist for the open vacancy this week', '➡️ Schedule return-to-work meetings', '➡️ Promote CPD opportunities in the staff bulletin'],
  },
  'curriculum': {
    executiveSummary: 'Teaching quality is strong, with 85% of lessons rated good or outstanding. Three subject reviews are due this term, and the new EYFS framework is being rolled out. Planning and resources are mostly on track.',
    achievements: ['✅ 85% of lessons rated good or outstanding', '✅ Scheme of work gaps reduced', '✅ EYFS framework rollout started on time'],
    improvements: ['🔶 3 subject reviews still to schedule', '🔶 Resource requests waiting for approval', '🔶 Moderation session to be planned'],
    risks: ['🔴 Subject reviews bunching up at the end of term'],
    actions: ['➡️ Confirm dates for all 3 subject reviews', '➡️ Check Reception planning against the new EYFS framework', '➡️ Approve priority resource requests', '➡️ Book the moderation session'],
  },
  'safeguarding': {
    executiveSummary: 'Safeguarding systems are secure. All DBS checks are current and staff training is at 95%. There are 6 open concerns and 2 LADO referrals this term, and the Section 175 audit is 3 weeks away.',
    achievements: ['✅ All DBS checks current', '✅ Staff safeguarding training at 95%', '✅ LADO referrals made promptly'],
    improvements: ['🔶 6 open concerns need recorded next steps', '🔶 1 action overdue', '🔶 Evidence for the Section 175 audit not yet collated'],
    risks: ['🔴 Section 175 audit in 3 weeks with open actions outstanding'],
    actions: ['➡️ Review all 6 open concerns this week', '➡️ Close the overdue action and log the outcome', '➡️ Start the Section 175 evidence pack', '➡️ Push training compliance to 100%'],
  },
  'send-dsl': {
    executiveSummary: 'The SEND register holds 14 pupils, 6 with EHCPs. Three annual reviews are due this month and two new referrals are waiting for assessment. Provision is working well, but timescales are tight.',
    achievements: ['✅ SEND register up to date', '✅ SEMH concerns reduced since last period', '✅ EHCP provision delivered as planned'],
    improvements: ['🔶 3 annual reviews due this month', '🔶 2 referrals awaiting assessment', '🔶 Intervention impact data needs updating'],
    risks: ['🔴 Annual review paperwork at risk of missing the statutory deadline'],
    actions: ['➡️ Send annual review invitations this week', '➡️ Schedule observations for the new referrals', '➡️ Update the provision map with impact data', '➡️ Brief class teachers on EHCP targets'],
  },
  'finance-school': {
    executiveSummary: 'The £1.2M budget is 68% spent year to date, and the school is £42k under forecast. Finances are healthy, but 2 grant claims are outstanding and the underspend needs a clear plan.',
    achievements: ['✅ Spending on profile at 68% year to date', '✅ £42k underspend against forecast', '✅ Budget remaining above the 70% threshold'],
    improvements: ['🔶 2 grant claims outstanding', '🔶 3 supplier invoices unpaid', '🔶 Expense claims waiting for approval'],
    risks: ['🔴 Grant income lost if claims miss the deadline'],
    actions: ['➡️ Submit both grant claims this week', '➡️ Agree a plan to commit the underspend', '➡️ Clear unpaid invoices and expense claims', '➡️ Prepare the budget report for governors'],
  },
  'admissions': {
    executiveSummary: 'Admissions are strong, with 34 Reception applications and 89% conversion from the open day. Intake is at 90% of PAN. Three appeals are pending and need careful handling.',
    achievements: ['✅ 89% conversion from open day', '✅ 34 Reception applications received', '✅ Pending admissions reduced'],
    improvements: ['🔶 3 appeals waiting for panel dates', '🔶 Follow-up with open-day families who haven\'t applied', '🔶 In-year application tracking'],
    risks: ['🔴 Appeal deadlines clashing with peak admissions workload'],
    actions: ['➡️ Confirm appeal panel dates', '➡️ Contact open-day families who haven\'t applied', '➡️ Monitor numbers against PAN weekly', '➡️ Update the admissions pack for next year'],
  },
  'ofsted': {
    executiveSummary: 'The school was last rated Good 18 months ago and is entering the inspection window. The evidence folder is 78% complete and 2 areas for improvement are outstanding. Readiness is good but needs a final push.',
    achievements: ['✅ Evidence folder 78% complete', '✅ Strong lesson quality data ready to share', '✅ Safeguarding records current'],
    improvements: ['🔶 2 areas for improvement still outstanding', '🔶 22% of the evidence folder incomplete', '🔶 Subject leads\' deep-dive preparation'],
    risks: ['🔴 Inspection call could arrive before evidence is complete'],
    actions: ['➡️ Close the remaining evidence gaps', '➡️ Document progress on both areas for improvement', '➡️ Run mock deep dives with subject leads', '➡️ Brief governors on readiness'],
  },
  'trust': {
    executiveSummary: 'The trust runs 8 schools: 1 Outstanding, 6 Good and 1 Requires Improvement. Overall performance is strong, and central support should focus on the RI school. A governance meeting is due in 2 weeks.',
    achievements: ['✅ 7 of 8 schools rated Good or better', '✅ Cross-trust data sharing in place', '✅ Governance cycle on schedule'],
    improvements: ['🔶 1 school rated Requires Improvement', '🔶 Comparison data not yet shared with heads', '🔶 Board papers to finalise'],
    risks: ['🔴 RI school re-inspected before improvements are embedded'],
    actions: ['➡️ Increase central support for the RI school', '➡️ Circulate governance papers a week ahead', '➡️ Share school comparison data with heads', '➡️ Agree trust-wide priorities for next term'],
  },
  'students': {
    executiveSummary: 'There are 420 pupils on roll with 94% attendance. Behaviour needs attention: 12 incidents this week and 3 fixed-term exclusions this term. Pupil welfare systems are working, but patterns need closer analysis.',
    achievements: ['✅ Attendance steady at 94%', '✅ No exclusions pending', '✅ Welfare referrals handled promptly'],
    improvements: ['🔶 12 behaviour incidents this week', '🔶 Parent contacts outstanding', '🔶 Reintegration follow-ups to confirm'],
    risks: ['🔴 Repeat incidents escalating to further exclusions'],
    actions: ['➡️ Analyse behaviour incidents by year group', '➡️ Contact parents of repeat offenders', '➡️ Confirm all reintegration meetings took place', '➡️ Review the behaviour policy with heads of year'],
  },
  'wraparound': {
    executiveSummary: 'Wraparound care is well used: breakfast club is 38 of 45 booked and after-school club 52 of 60. Two staff absences need covering to keep ratios safe.',
    achievements: ['✅ High booking rates in both clubs', '✅ After-school club close to capacity', '✅ Session activity plans in place'],
    improvements: ['🔶 2 staff absences to cover', '🔶 7 breakfast club places unfilled', '🔶 Staff training records need checking'],
    risks: ['🔴 Staff-to-child ratios at risk if absences aren\'t covered'],
    actions: ['➡️ Arrange cover for both absences today', '➡️ Promote the spare breakfast club places to parents', '➡️ Check wraparound staff safeguarding training', '➡️ Review the waiting list for after-school club'],
  },
  'facilities-school': {
    executiveSummary: 'The site is in good condition, with 3 maintenance jobs open. A fire drill is due this month and the boiler service is next week. Playground resurfacing has been approved.',
    achievements: ['✅ Playground resurfacing approved', '✅ No H&S incidents this month', '✅ Boiler service booked'],
    improvements: ['🔶 3 maintenance jobs open', '🔶 Fire drill not yet scheduled', '🔶 Compliance checks due'],
    risks: ['🔴 Fire drill slipping past this month'],
    actions: ['➡️ Book the fire drill this week', '➡️ Chase the contractor on open jobs', '➡️ Warn staff about heating downtime during the boiler service', '➡️ Schedule resurfacing outside term time'],
  },
  'timetable': {
    executiveSummary: 'The timetable is broadly stable. There are 4 cover lessons today, and 2 room clashes were resolved this morning. One teacher is over their allocation limit and needs rebalancing.',
    achievements: ['✅ 2 room clashes resolved', '✅ No unresolved room conflicts', '✅ Change requests being processed'],
    improvements: ['🔶 4 cover lessons needed today', '🔶 1 teacher over allocation', '🔶 Pending change requests'],
    risks: ['🔴 Repeated cover breaching staff workload limits'],
    actions: ['➡️ Assign today\'s cover before period 1', '➡️ Rebalance the over-allocated teacher', '➡️ Clear pending change requests', '➡️ Track cover patterns by department'],
  },
  'reports': {
    executiveSummary: 'End-of-term reports are due in 3 weeks and 45% have been submitted. The data drop is next Friday and 2 moderation sessions are planned. Timelines are achievable with steady progress.',
    achievements: ['✅ 45% of reports already submitted', '✅ Moderation sessions planned', '✅ Data drop date communicated'],
    improvements: ['🔶 55% of reports outstanding', '🔶 Assessment data entry incomplete', '🔶 Data quality spot checks needed'],
    risks: ['🔴 Report and data deadlines landing in the same week'],
    actions: ['➡️ Send staff a report progress reminder', '➡️ Spot-check data before the drop', '➡️ Confirm moderation attendance', '➡️ Set an interim report deadline'],
  },
  'classes': {
    executiveSummary: 'There are 14 classes with an average size of 28.5. Two classes are over 30 and a new pupil arrives next week. Registers are complete and behaviour incidents are down.',
    achievements: ['✅ No missed registers', '✅ Behaviour incidents down on last period', '✅ Homework overdue figure falling'],
    improvements: ['🔶 2 classes over 30', '🔶 Cover lessons today', '🔶 Homework completion still above target'],
    risks: ['🔴 New arrival pushing another class over 30'],
    actions: ['➡️ Place the new pupil in a class under 30', '➡️ Review rooms for the oversized classes', '➡️ Confirm today\'s cover', '➡️ Follow up on overdue homework'],
  },

  // ── Football ─────────────────────────────────────────────────────────────
  'squad': {
    executiveSummary: 'The squad is in good shape, with 22 of 25 players fit for Saturday\'s home game against Riverside. Martinez, O\'Brien and Santos are injured and Thompson is suspended, leaving midfield thin.',
    achievements: ['✅ 22 of 25 players fit', '✅ Strong recent form', '✅ Consistent starting XI'],
    improvements: ['🔶 Midfield depth with Thompson suspended', '🔶 3 long-term injuries', '🔶 Rotation for fringe players'],
    risks: ['🔴 Further injury in midfield leaves no natural cover'],
    actions: ['➡️ Confirm Thompson\'s replacement in training', '➡️ Manage minutes for key players', '➡️ Check the injury timeline with medical', '➡️ Give academy options a look in training'],
  },
  'tactics': {
    executiveSummary: 'The 4-2-3-1 is delivering a 68% win rate and set-piece conversion is 14%. Riverside are vulnerable to a high press, turning the ball over 34% of the time.',
    achievements: ['✅ 68% win rate in 4-2-3-1', '✅ 14% set-piece conversion', '✅ Clear opposition analysis for Saturday'],
    improvements: ['🔶 Recovery shape when the press is beaten', '🔶 Defending second balls from set pieces', '🔶 Variation in attacking patterns'],
    risks: ['🔴 Space in behind if the high press is bypassed'],
    actions: ['➡️ Drill pressing triggers in this week\'s session', '➡️ Keep the near-post set-piece routines', '➡️ Rehearse rest-defence shape', '➡️ Share the Riverside clips with the squad'],
  },
  'medical': {
    executiveSummary: 'Three players are injured. Santos is closest to a return on 7 April, Martinez is targeting 14 April and O\'Brien 21 April at the earliest. Silva is on modified training.',
    achievements: ['✅ Clear return-to-play timelines for all 3 injuries', '✅ Santos rehab ahead of schedule', '✅ Silva managed on modified training'],
    improvements: ['🔶 GPS load monitoring for returning players', '🔶 Wellness check-ins before selection', '🔶 Medical cover during the head physio\'s holiday'],
    risks: ['🔴 Re-injury risk if Santos returns too early'],
    actions: ['➡️ Run final fitness tests before clearing Santos', '➡️ Monitor Silva\'s load daily', '➡️ Review wellness data before Saturday', '➡️ Confirm physio cover for 14–18 Apr'],
  },
  'scouting': {
    executiveSummary: 'Scouting is active, with 12 reports this month from 4 scouts across 6 leagues. A £1.8m bid for Diallo is in and Ferreira remains under observation.',
    achievements: ['✅ 12 scout reports filed', '✅ Coverage across 6 leagues', '✅ Diallo bid submitted on schedule'],
    improvements: ['🔶 Ferreira needs another live report', '🔶 Fallback target list to refresh', '🔶 Report turnaround time'],
    risks: ['🔴 Rival interest pushing up Diallo\'s price'],
    actions: ['➡️ Send a scout to Ferreira\'s next match', '➡️ Refresh the fallback target list', '➡️ Align with transfers on the Diallo counter', '➡️ Review league coverage gaps'],
  },
  'academy': {
    executiveSummary: 'The academy is performing strongly: the U21s won 3-0 with a Collins hat-trick, and 3 players are judged first-team ready. The EPPP audit is next month.',
    achievements: ['✅ U21s won 3-0', '✅ Collins hat-trick', '✅ 3 players first-team ready'],
    improvements: ['🔶 4 scholarship offers awaiting replies', '🔶 EPPP evidence pack to finalise', '🔶 First-team training exposure for pathway players'],
    risks: ['🔴 EPPP documentation gaps at the audit'],
    actions: ['➡️ Finalise the EPPP evidence pack', '➡️ Chase scholarship replies', '➡️ Schedule first-team sessions for pathway players', '➡️ Review development plans for all 42 players'],
  },
  'transfers': {
    executiveSummary: 'There is £4.2m left in the transfer budget and the window closes in 11 days. The selling club countered the Diallo bid at £2.1m, so a decision is needed soon.',
    achievements: ['✅ £4.2m budget still available', '✅ Diallo bid submitted', '✅ Clear target shortlist'],
    improvements: ['🔶 Response to the £2.1m counter', '🔶 Fallback options if Diallo stalls', '🔶 Wage structure for new signings'],
    risks: ['🔴 Running out of window time during negotiations'],
    actions: ['➡️ Decide on the Diallo counter within 48 hours', '➡️ Prepare a fallback target', '➡️ Check new wages against the PSR position', '➡️ Set an internal deadline before the window closes'],
  },
  'analytics': {
    executiveSummary: 'Attacking output is strong, with xG at 42.6 and finishing outperforming it by 5.4. xGA is 28.3, average possession 58% and pass accuracy 84%. 43% of chances come down the right.',
    achievements: ['✅ Overperforming xG by +5.4', '✅ 84% pass accuracy', '✅ Solid defensive record (xGA 28.3)'],
    improvements: ['🔶 Over-reliance on the right side', '🔶 Likely finishing regression', '🔶 Chance creation down the left'],
    risks: ['🔴 Predictable attacking patterns opponents can scout'],
    actions: ['➡️ Develop left-side attacking routines', '➡️ Target Riverside\'s weak flank', '➡️ Track finishing against xG weekly', '➡️ Share pressing data with coaches'],
  },
  'media': {
    executiveSummary: 'Media activity is busy: a press conference at 2pm and 4 requests pending, including Crown Broadcasting and Northbridge Sport. Social following is 124k with engagement up 18%.',
    achievements: ['✅ Social engagement up 18%', '✅ 124k followers', '✅ Strong media interest'],
    improvements: ['🔶 4 media requests pending', '🔶 Pre-briefing on sensitive topics', '🔶 Content plan for matchday'],
    risks: ['🔴 Off-message comments on injuries or transfers'],
    actions: ['➡️ Brief the manager before the 2pm presser', '➡️ Respond to the pending requests', '➡️ Schedule matchday social content', '➡️ Agree lines on the Diallo bid'],
  },
  'matchday': {
    executiveSummary: 'Preparations for Saturday\'s 3pm home game against Riverside United are on track. Expected attendance is 8,200 and hospitality is 94% full. 14 of 22 ops checklist items are done.',
    achievements: ['✅ Hospitality 94% full', '✅ Strong expected attendance of 8,200', '✅ Ops checklist well advanced'],
    improvements: ['🔶 8 checklist items still open', '🔶 Steward briefing to confirm', '🔶 Remaining hospitality places to sell'],
    risks: ['🔴 Open checklist items not closed by Friday'],
    actions: ['➡️ Close the remaining checklist items by Friday', '➡️ Confirm steward numbers', '➡️ Push the last hospitality places', '➡️ Run a pre-match safety briefing'],
  },
  'training': {
    executiveSummary: 'Training is on plan: a 10am tactical session on pressing triggers and set pieces at 11:30. Three players are in the recovery group and average load is 72%.',
    achievements: ['✅ Average load on plan at 72%', '✅ Sessions aligned to Saturday\'s game plan', '✅ Recovery group well managed'],
    improvements: ['🔶 Load management for returning players', '🔶 Set-piece repetition', '🔶 Session data capture'],
    risks: ['🔴 Load spikes for players returning from injury'],
    actions: ['➡️ Cap load for players returning from injury', '➡️ Run set pieces at match intensity', '➡️ Review GPS data after each session', '➡️ Plan a lighter session the day before the game'],
  },
  'finance-football': {
    executiveSummary: 'Revenue is £3.4m year to date and matchday income is up 8%. The wage bill of £2.1m a year is 62% of revenue against a 60% target. £4.2m remains in the transfer budget.',
    achievements: ['✅ Matchday revenue up 8%', '✅ £3.4m revenue year to date', '✅ Transfer budget intact'],
    improvements: ['🔶 Wage ratio 2 points above target', '🔶 Commercial revenue growth', '🔶 Cost control on non-playing staff'],
    risks: ['🔴 New signings pushing the wage ratio further above 60%'],
    actions: ['➡️ Model PSR impact before any signing', '➡️ Set a wage cap for incoming players', '➡️ Grow commercial and hospitality income', '➡️ Review the budget monthly with the board'],
  },
  'staff-football': {
    executiveSummary: 'The club has 32 staff: 8 coaching, 4 medical and 4 scouts. The GK coach is on a UEFA Pro course Monday to Wednesday and the head physio is on holiday 14–18 April.',
    achievements: ['✅ Coaching staff development (UEFA Pro)', '✅ Full scouting team active', '✅ Admin running smoothly'],
    improvements: ['🔶 GK coaching cover Monday to Wednesday', '🔶 Medical cover 14–18 Apr', '🔶 Staff rota visibility'],
    risks: ['🔴 Thin medical cover while the head physio is away'],
    actions: ['➡️ Confirm GK session cover', '➡️ Arrange a locum physio for 14–18 Apr', '➡️ Publish the staff rota for the month', '➡️ Review CPD plans for coaching staff'],
  },
  'facilities-football': {
    executiveSummary: 'The main pitch is in excellent condition after Tuesday\'s re-seed and the floodlight inspection passed. Training pitch 2 is waterlogged, and the CCTV upgrade is next week.',
    achievements: ['✅ Main pitch re-seeded and in excellent condition', '✅ Floodlight inspection passed', '✅ CCTV upgrade scheduled'],
    improvements: ['🔶 Training pitch 2 waterlogged', '🔶 Drainage on secondary pitches', '🔶 Works schedule coordination'],
    risks: ['🔴 Pitch 2 out of use if wet weather continues'],
    actions: ['➡️ Move sessions to pitch 1', '➡️ Get a drainage quote for pitch 2', '➡️ Confirm CCTV install dates', '➡️ Plan the next pitch maintenance cycle'],
  },
}

export const DEMO_SUMMARY_FALLBACK: DemoSummary = {
  bullets: [
    '📊 Key metrics are tracking well this period',
    '✅ No critical blockers identified',
    '📈 Performance is above baseline',
    '👥 Team capacity is healthy',
  ],
  watchOut: '⚠️ Watch out for: make sure reporting data is up to date',
}

export const DEMO_INSIGHTS_FALLBACK: DemoInsights = {
  executiveSummary: 'The department is performing within expected parameters. Key metrics are tracking close to target, with minor variances in efficiency and throughput.',
  achievements: ['✅ Core KPIs met or exceeded target', '✅ Team engagement scores improved', '✅ No critical incidents reported'],
  improvements: ['🔶 Process efficiency below optimal — review workflows', '🔶 Data quality needs attention in some areas', '🔶 Cross-department communication could improve'],
  risks: ['🔴 End-of-period reporting deadline approaching'],
  actions: ['➡️ Schedule a department review meeting this week', '➡️ Review and update key processes', '➡️ Address data quality gaps', '➡️ Plan next period objectives'],
}

// The demo pages pass some keys that differ from the route's DEPT_PROMPTS keys
// (e.g. football sends 'finance', schools facilities sends 'facilities').
const PORTAL_ALIASES: Record<string, Record<string, string>> = {
  schools: { facilities: 'facilities-school', finance: 'finance-school' },
  football: { finance: 'finance-football', staff: 'staff-football', facilities: 'facilities-football' },
}

function resolveKey(dept: string, portal?: string): string {
  return (portal && PORTAL_ALIASES[portal]?.[dept]) || dept
}

export function getDemoSummary(dept: string, portal?: string): DemoSummary {
  return DEMO_SUMMARIES[resolveKey(dept, portal)] || DEMO_SUMMARY_FALLBACK
}

export function getDemoInsights(dept: string, portal?: string): DemoInsights {
  return DEMO_INSIGHTS[resolveKey(dept, portal)] || DEMO_INSIGHTS_FALLBACK
}
