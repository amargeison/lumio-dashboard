// ─── LUMIO IMPACT DEMO — BRAND + COPY (/impact/demo) ─────────────────────────
// The fictional Northvale Sport Foundation / "Rally Ten" identity and demo copy
// for the shared portal views. Same shape as src/data/tenproject/portal-copy.ts.
// All entities are fictional (docs/brand-universe.md §D).

export const IMPACT_DEMO_BRAND = {
  org: 'Rally Ten',
  orgUpper: 'RALLY TEN',
  legal: 'Northvale Sport Foundation',
  portal: 'Lumio Impact portal',
  hq: 'Rally Ten HQ',
  volunteer: 'Court Captain',
  volunteers: 'Court Captains',
  volunteerUpper: 'COURT CAPTAIN',
  volunteersUpper: 'COURT CAPTAINS',
  logo: '/lumio-impact-logo-web.png',
  logoDark: '/lumio-impact-logo-web.png',
  logoAlt: 'Lumio Impact',
  favicon32: '/lumio-impact-icon-64.png',
  favicon64: '/lumio-impact-icon-64.png',
  faviconAlt: 'LI',
  domain: 'northvalesport.org.uk',
  emailDomain: 'northvalesport.org.uk',
  town: 'Northvale',
  address: '14 Larkspur Row, Northvale NV3 7QD',
  tagline: 'EVERY CHILD. EVERY RALLY.',
  hashtag: '#rallyten',
  socialHandle: 'rallytenuk',
}

type Tone3 = 'green' | 'grey' | 'red'
type NewsletterContent = {
  subject: string
  preheader: string
  heroKicker: string
  heroTitle: string
  intro: string
  sessionCard: { title: string; lines: string[]; cta: string }
  sections: { title: string; body: string }[]
  fundraising?: { school: string; raised: number; target: number; line: string }
  signoff: string
}

const NEWSLETTER_SEPTEMBER: NewsletterContent = {
  subject: 'WE’RE BACK! Your September sessions — venues, dates & a big year ahead 🎾',
  preheader: 'Free family tennis returns — find your venue and save your Saturdays.',
  heroKicker: 'SEPTEMBER RESTART',
  heroTitle: 'WE’RE BACK — AND SO ARE YOUR SATURDAYS',
  intro: 'The school holidays are nearly done, the courts are calling, and our Free Community Family Sessions are back from the first weekend of September. Everything you need is below — your venue, your time, and one tap to tell us you’re coming.',
  sessionCard: {
    title: 'YOUR FAMILY SESSION',
    lines: ['Northvale Rec Ground — Saturdays 1.30–2.30pm', 'Back from Saturday 6 September', 'Free · all equipment provided · every family welcome'],
    cta: 'Confirm we’re coming →',
  },
  sections: [
    { title: 'NEW SCHOOLS JOINING THIS TERM', body: 'A warm welcome to Thornleigh Green Primary, starting their first 10-week programme in September — 45 children get their welcome packs in week one. If you know a school that should be next, tell them about us (or forward this email to the head!).' },
    { title: 'WHAT A SUMMER THAT WAS', body: '2,000+ children a week in school, 950+ family visits to weekend sessions, and 100% of surveyed families said they’d recommend us. Thank you — this programme is you.' },
    { title: '#RALLYTEN — WIN A DAY AT THE MERIDIAN OPEN', body: 'Share a photo or clip of your family practising with the tag #rallyten for the chance to win a family day at the Meridian Open. Only ever shared with your consent — full details in the parent app.' },
  ],
  fundraising: {
    school: 'St Aldric’s C of E Primary',
    raised: 2150,
    target: 3200,
    line: 'St Aldric’s families are £1,050 from bringing Rally Ten back for 2026/27 — and match funding kicks in at £2,560. The Sponsored Ball Hit is 10 October. Every pound counts.',
  },
  signoff: 'See you on court — EVERY CHILD. EVERY RALLY.\nJoanna & the Rally Ten team',
}

const NEWSLETTER_WEEK4: NewsletterContent = {
  subject: 'Week 4 — BACKHAND week! Your Saturday session details inside 🎾',
  preheader: 'Two hands on the grip, one bounce only — see you Saturday.',
  heroKicker: 'WEEK 4 OF 10',
  heroTitle: 'IT’S BACKHAND WEEK',
  intro: 'This week the children are learning the backhand — favourite hand at the bottom of the grip, swing low to high. Ask them to show you, then come and try it together this weekend.',
  sessionCard: {
    title: 'YOUR FAMILY SESSION',
    lines: ['Northvale Rec Ground — this Saturday 1.30–2.30pm', 'Scan the QR at the gate to check in', 'Free · all equipment provided'],
    cta: 'Confirm we’re coming →',
  },
  sections: [
    { title: 'WATCH THE BACKHAND VIDEO', body: 'Two minutes forty of everything they’re learning this week — take it to your court, try it at home, but most of all try it as a family.' },
    { title: 'STICKER WATCH', body: 'The Shots stickers are landing in booklets this week. When one comes home, that’s your cue: “show me!”' },
  ],
  signoff: 'See you Saturday — EVERY CHILD. EVERY RALLY.\nJoanna & the Rally Ten team',
}

export const IMPACT_DEMO_COPY = {
  // Portal chrome (src/app/impact/[slug]/page.tsx role picker + headers)
  portal: {
    schoolRoleDesc: 'St Aldric’s — fundraising dashboard & events',
    schoolTitle: 'St Aldric’s C of E Primary — School view',
    schoolSub: 'Ran Rally Ten 2025/26 · fundraising to bring it back for 2026/27',
    parentSub: 'Rachel Ashby · Ella (7) & Sam (5) · Hollinsmere Primary',
    coachTitle: 'Coach — Hannah Moreton',
    tenorTitle: 'Court Captain — Martin Adeyinka',
    tenorSub: 'Saturday family session at Northvale Rec Ground',
  },
  hq: {
    campaignSchoolId: 'staldrics',
  },
  school: {
    statusTitle: 'Completed 2025/26 · fundraising to return for 2026/27',
    statusBody: 'Your ten weeks ran last summer and finished with the Festival. Because direct PE & Sport Premium funding has ended, your 2026/27 programme is now being fundraised — you’re {pct}% of the way there.',
    programmeRows: [
      ['Cohorts', 'Y2, Y3 and Y4 — 62 children across 3 classes', 'grey'],
      ['Coach', 'Kezia Lowe (LTA Level 2)', 'grey'],
      ['Linked weekend venue', 'Northvale Rec Ground · Sat 1.30pm — 11 families continued', 'red'],
      ['Equipment', 'Full set retained by the school (good condition, checked 30 Jun)', 'grey'],
      ['Next step', 'Reach the fundraising target → programme flips to CONFIRMED and week 1 is scheduled', 'red'],
    ] as [string, string, Tone3][],
    campaignSub: 'Raising the cost of your 10-week {org} programme for 2026/27. {supporters} supporters so far.',
    publicPageUrl: '/fundraise/st-aldrics-demo',
    moneyIn: [
      ['Online donations (public page)', '£512'],
      ['Sponsored Ball Hit pledges (collected)', '£1,455 of £1,780 pledged'],
      ['Cash logged (fair stall + cake sale)', '£183'],
      ['Gift Aid eligible (est.)', '£96'],
    ] as [string, string][],
    aiEvent: { id: 'f5', name: 'Spring Sponsored Ball Hit', type: 'Sponsored ball hit', date: '20 Mar', status: 'planned' as const, raised: 0, target: 900 },
  },
  schoolInsights: {
    attendanceNote: 'Week 10 (the Festival) was the best-attended session of the year.',
  },
  parent: {
    videoUrl: '#',
    stickerNote: 'Ella earned The Shots sticker today — tap to see the wall 🎉',
    competitionTitle: '#rallyten competition',
    competitionBody: ' — share a family practice photo or clip for the chance to win a family day at the Meridian Open! (Only ever shared with your consent.)',
  },
  coach: {
    messageRecipient: 'Hollinsmere Primary',
    weekendContext: 'Saturday\'s family session at Northvale — you lead, Court Captains run the register',
    familyPlanTitle: 'Week 4 session plan — BACKHAND (family)',
    schoolPlanTitle: 'Week 4 session plan — BACKHAND (school)',
    trendNote: ' — above the programme average of 91%.',
    todayTitle: 'Hollinsmere Primary — Y3 Otters · Week 4 of 10',
    todaySub: 'Today 1.15–2.15pm · {skill} block · Mrs Bhatt (PE lead) assisting — hand-over segment in together time',
    kitPill: 'KIT: 24 rackets · red balls · cones',
    nextPill: 'NEXT: Y4 Foxes 2.20pm',
  },
  tenor: {
    messageRecipient: 'Northvale families',
    sessionDuty: 'you + 2 {volunteers} on duty · equipment in the green store box',
  },
  comms: {
    aiDraftMessage: 'Quick update: this Saturday’s family session is at Northvale Rec Ground, 1.30–2.30pm — backhand week! All equipment provided, scan in at the gate. See you there. EVERY CHILD. EVERY RALLY.',
    newsletterAngles: [
      'September restart — venues, dates and the big year ahead (welcome Thornleigh Green, summer results, #rallyten competition, St Aldric’s fundraising push)',
      'Half-term special — holiday practice ideas, sticker league table, and the Sponsored Ball Hit countdown',
    ],
    draftTitles: [
      'September restart — venues & the year ahead (AI draft)',
      'Half-term special — practice + Ball Hit countdown (AI draft)',
    ],
    inboxStats: [['3', 'AWAITING REPLY'], ['121', 'REACHABLE IN-APP'], ['2/wk', 'SCHEDULED COMMS'], ['4', 'CHANNELS IN ONE INBOX']] as [string, string][],
    replaceTitle: 'No more separate email tools',
    replaceNote: 'Scoped per venue and tracked per family — so a Northvale family never gets an Ellisford session. A generic mailing tool can’t do that.',
    draftIncludes: 'subject + preheader · hero · personalised session card (each family sees their venue) · new-schools welcome · summer results · #rallyten Meridian Open competition · St Aldric’s fundraising bar · footer with preferences/unsubscribe.',
  },
  newsletters: {
    september: NEWSLETTER_SEPTEMBER,
    week4: NEWSLETTER_WEEK4,
  },
  insights: {
    reachNote: 'Peak 2,140/week in July — the December dip is the school holidays, not attrition.',
    growthNote: '3.3× in five terms.',
    conversionNote: 'Fernley Park’s 26% is the benchmark — its recipe (early activation, one linked venue) is being rolled out.',
    boroughNote: '3 boroughs, 6 schools, 3 community venues — with a Kestwick expansion enquiry in the pipeline.',
    socialValueNote: '£4.70 back for every £1 — through raised activity, reduced inactivity risk, family wellbeing and volunteer contribution.',
  },
  social: {
    defaultTags: ['#rallyten', '#EveryRally'],
    reach7d: '38K',
    growthLabel: '+26%',
    performance: [['1.3M', 'REACH'], ['9.4%', 'ENGAGEMENT'], ['504', 'LINK CLICKS'], ['+710', 'NEW FOLLOWERS']] as [string, string][],
  },
  people: {
    assignmentOptions: ['Unassigned', 'Hollinsmere Primary', 'Thornleigh Green Primary (Sept)', 'Northvale Rec Ground (Sat)', 'Copperfield Green Courts (Sat)', 'Ellisford Park Courts (Sun)'],
  },
  settings: {
    commsRows: [
      ['Sender name', 'Rally Ten · Northvale Sport Foundation'],
      ['Reply-to', 'info@northvalesport.org.uk'],
      ['Newsletter footer', 'Charity details · unsubscribe · preference centre (auto-added)'],
    ] as [string, string][],
    orgRows: [
      ['Organisation', 'Northvale Sport Foundation'],
      ['Registered address', '14 Larkspur Row, Northvale, NV3 7QD'],
      ['Programme admin', 'Joanna Pryce — joanna@northvalesport.org.uk'],
      ['Safeguarding lead', 'HQ safeguarding lead · 07700 900789'],
      ['Demo PIN', '••••••'],
    ] as [string, string][],
    importLabel: 'Mailing-list import',
    importDesc: 'One-off import of the existing family mailing list',
  },
  equipment: {
    orderNote: 'Order drafted for {count} items — Vanta Sports quote requested for court kit, print order for booklets/stickers. Awaiting your approval in Comms.',
  },
  // Generated documents (shared doc generators)
  funder: {
    termReportLabel: 'TERM REPORT · AUTUMN 2026',
    termReportSub: 'Autumn term 2026 · prepared for schools, boroughs and trust partners · AI-drafted from registers, QR check-ins and family surveys',
    growthLine: '3.3× growth in five terms. Every figure is backed by named-child registers captured at the point of delivery.',
    bidParas: [
      `Rally Ten delivers free, game-based tennis to children aged 4–10 through a 10-week programme embedded in primary-school curriculum time, supplemented by free weekend parent-and-child sessions on public community courts. This term the programme reached 2,140 children per week across our partner schools, with 91% average attendance — every figure evidenced by named-child digital registers captured at the point of delivery.`,
      `The programme's distinctive outcome is school-to-community conversion: of 214 children reached at a typical school, 57% of families activate the programme's parent app, 21% attend a free weekend family session, and 14% become regular attendees. Weekend participation grew from 14 family visits in week one to 44 by week ten. Families surveyed report improvements across Confidence (88%), Exercise (84%) and Family life (81%), alongside Socialising, Well-Being, Focus and Academic Attainment — with 100% saying they would recommend the programme.`,
      `Delivery is fully safeguarded: LTA Level 2/3 accredited coaches with enhanced DBS checks, LTA Safeguarding training, First Aid certification and £5m insurance, all tracked with automatic expiry alerts. All sessions are free to families; 48% of participants are girls, and a third of community venues run sessions designed to include children and adults with learning, sensory and physical disabilities.`,
      `Grant funding directly unlocks named schools: with PE & Sport Premium direct payments ending, unfunded schools now raise their programme cost through supervised fundraising campaigns with transparent, per-pound tracking. A funder can sponsor a school outright or match-fund its campaign — and receives termly impact reporting generated from the same registers and surveys quoted above, per school, per borough or whole-programme.`,
    ],
    governorAttendance: 'Attendance held above 90% for the whole programme — week 10, the {org} Festival, was the best-attended session of the year.',
    snippetParas: [
      `RALLY TEN AT ST ALDRIC'S — WHAT A TERM! 🎾`,
      ``,
      `This {term}, {children} children across Y2–Y4 took part in Rally Ten — ten weeks of free, game-based tennis in school, learning the forehand, backhand, volley and serve, and earning {stickers} Skill Stickers along the way. Attendance was {attendance}, and {completed} children completed all ten weeks and received their certificate at the Rally Ten Festival.`,
      ``,
      `It doesn't stop there: free weekend Family Sessions run on local community courts, where parents and children play together — 11 of our families already go. Every family is welcome, all equipment is provided, and it's completely free.`,
      ``,
      `HELP BRING RALLY TEN BACK FOR 2026/27 — with school sports funding changing, we're raising the programme cost ourselves. We're already at £{raised} of £{target}! Look out for the Sponsored Ball Hit on 10 October, and you can donate any time via the school's Rally Ten fundraising page.`,
      ``,
      `EVERY CHILD. EVERY RALLY.`,
    ],
  },
  events: {
    // Letter-style school name (straight apostrophe, as on the printed letters)
    schoolName: 'St Aldric\'s C of E Primary',
    newsletterFamilies: '450',
  },
}
