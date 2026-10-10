// ─── TEN PROJECT — PORTAL BRAND + DEMO COPY ─────────────────────────────────
// The identity strings and curated demo prose the shared portal views used to
// hard-code, lifted out verbatim so the same views can serve other datasets
// (see src/app/tenproject/[slug]/_components/ImpactDataContext.tsx).
//   BRAND — who the portal belongs to (kept on the live Ten Project portal)
//   COPY  — demo narrative that sits alongside demo-data.ts (blanked when live)
// `{name}` placeholders are filled from BRAND plus call-site values via fill().
// Other datasets (src/data/impact/*) must provide the same shape.

export const TEN_PROJECT_BRAND = {
  org: 'Ten Project',
  orgUpper: 'TEN PROJECT',
  legal: 'Ten Project Ltd',
  portal: 'Ten Project Portal',
  hq: 'Ten Project HQ',
  volunteer: 'TENOR',
  volunteers: 'TENORs',
  volunteerUpper: 'TENOR',
  volunteersUpper: 'TENORS',
  logo: '/tenproject_logo.png',
  logoDark: '/tenproject_logo_dark.png',
  logoAlt: 'Ten Project',
  favicon32: '/tenproject-favicon-32.png',
  favicon64: '/tenproject-favicon-64.png',
  faviconAlt: 'TP',
  domain: 'tenproject.org.uk',
  emailDomain: 'tenproject.org.uk',
  town: 'Morden, London',
  address: '7 Cranmer Close, Morden, London SM4 4SU',
  tagline: 'LEARN. PLAY. TOGETHER.',
  hashtag: '#tenproject',
  socialHandle: 'tenprojectuk',
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
    lines: ['Kingsmead Rec Ground — Saturdays 1.30–2.30pm', 'Back from Saturday 6 September', 'Free · all equipment provided · every family welcome'],
    cta: 'Confirm we’re coming →',
  },
  sections: [
    { title: 'NEW SCHOOLS JOINING THIS TERM', body: 'A warm welcome to Meridian Park Primary, starting their first 10-week programme in September — 45 children get their welcome packs in week one. If you know a school that should be next, tell them about us (or forward this email to the head!).' },
    { title: 'WHAT A SUMMER THAT WAS', body: '2,000+ children a week in school, 950+ family visits to weekend sessions, and 100% of surveyed families said they’d recommend us. Thank you — this programme is you.' },
    { title: '#TENPROJECT — WIN A TRIP TO WIMBLEDON', body: 'Share a photo or clip of your family practising with the tag #tenproject for the chance to win our Wimbledon trip. Only ever shared with your consent — full details in the parent app.' },
  ],
  fundraising: {
    school: 'St Clement’s Primary',
    raised: 2150,
    target: 3200,
    line: 'St Clement’s families are £1,050 from bringing Ten Project back for 2026/27 — and match funding kicks in at £2,560. The Sponsored Ball Hit is 10 October. Every pound counts.',
  },
  signoff: 'See you on court — LEARN. PLAY. TOGETHER.\nHarry & the Ten Project team',
}

const NEWSLETTER_WEEK4: NewsletterContent = {
  subject: 'Week 4 — BACKHAND week! Your Saturday session details inside 🎾',
  preheader: 'Two hands on the grip, one bounce only — see you Saturday.',
  heroKicker: 'WEEK 4 OF 10',
  heroTitle: 'IT’S BACKHAND WEEK',
  intro: 'This week the children are learning the backhand — favourite hand at the bottom of the grip, swing low to high. Ask them to show you, then come and try it together this weekend.',
  sessionCard: {
    title: 'YOUR FAMILY SESSION',
    lines: ['Kingsmead Rec Ground — this Saturday 1.30–2.30pm', 'Scan the QR at the gate to check in', 'Free · all equipment provided'],
    cta: 'Confirm we’re coming →',
  },
  sections: [
    { title: 'WATCH THE BACKHAND VIDEO', body: 'Two minutes forty of everything they’re learning this week — take it to your court, try it at home, but most of all try it as a family.' },
    { title: 'STICKER WATCH', body: 'The Shots stickers are landing in booklets this week. When one comes home, that’s your cue: “show me!”' },
  ],
  signoff: 'See you Saturday — LEARN. PLAY. TOGETHER.\nHarry & the Ten Project team',
}

export const TEN_PROJECT_COPY = {
  // Portal chrome (src/app/impact/[slug]/page.tsx role picker + headers)
  portal: {
    schoolRoleDesc: 'St Clement’s — fundraising dashboard & events',
    schoolTitle: 'St Clement’s Primary — School view',
    schoolSub: 'Ran Ten Project 2025/26 · fundraising to bring it back for 2026/27',
    parentSub: 'Sarah Whitfield · Mia (7) & Tom (5) · Oakridge Primary',
    coachTitle: 'Coach — Natalie Brooks',
    tenorTitle: 'TENOR — David Okafor',
    tenorSub: 'Saturday family session at Kingsmead Rec Ground',
  },
  hq: {
    campaignSchoolId: 'stclements',
  },
  school: {
    statusTitle: 'Completed 2025/26 · fundraising to return for 2026/27',
    statusBody: 'Your ten weeks ran last summer and finished with the Festival. Because direct PE & Sport Premium funding has ended, your 2026/27 programme is now being fundraised — you’re {pct}% of the way there.',
    programmeRows: [
      ['Cohorts', 'Y2, Y3 and Y4 — 62 children across 3 classes', 'grey'],
      ['Coach', 'Lucy Tran (LTA Level 2)', 'grey'],
      ['Linked weekend venue', 'Kingsmead Rec Ground · Sat 1.30pm — 11 families continued', 'red'],
      ['Equipment', 'Full set retained by the school (good condition, checked 30 Jun)', 'grey'],
      ['Next step', 'Reach the fundraising target → programme flips to CONFIRMED and week 1 is scheduled', 'red'],
    ] as [string, string, Tone3][],
    campaignSub: 'Raising the cost of your 10-week {org} programme for 2026/27. {supporters} supporters so far.',
    publicPageUrl: '/fundraise/st-clements-demo',
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
    videoUrl: 'https://www.youtube.com/channel/UC3-1ehFIPwAKgH98SXfLf1w',
    stickerNote: 'Mia earned The Shots sticker today — tap to see the wall 🎉',
    competitionTitle: '#tenproject competition',
    competitionBody: ' — share a family practice photo or clip for the chance to win a trip to Wimbledon! (Only ever shared with your consent.)',
  },
  coach: {
    messageRecipient: 'Oakridge Primary',
    weekendContext: 'Saturday\'s family session at Kingsmead — you lead, TENORs run the register',
    familyPlanTitle: 'Week 4 session plan — BACKHAND (family)',
    schoolPlanTitle: 'Week 4 session plan — BACKHAND (school)',
    trendNote: ' — above the programme average of 91%.',
    todayTitle: 'Oakridge Primary — Y3 Falcons · Week 4 of 10',
    todaySub: 'Today 1.15–2.15pm · {skill} block · Mrs Patel (PE lead) assisting — hand-over segment in together time',
    kitPill: 'KIT: 24 rackets · red balls · cones',
    nextPill: 'NEXT: Y4 Kestrels 2.20pm',
  },
  tenor: {
    messageRecipient: 'Kingsmead families',
    sessionDuty: 'you + 2 {volunteers} on duty · equipment in the green store box',
  },
  comms: {
    aiDraftMessage: 'Quick update: this Saturday’s family session is at Kingsmead Rec Ground, 1.30–2.30pm — backhand week! All equipment provided, scan in at the gate. See you there. LEARN. PLAY. TOGETHER.',
    newsletterAngles: [
      'September restart — venues, dates and the big year ahead (welcome Meridian Park, summer results, #tenproject competition, St Clement’s fundraising push)',
      'Half-term special — holiday practice ideas, sticker league table, and the Sponsored Ball Hit countdown',
    ],
    draftTitles: [
      'September restart — venues & the year ahead (AI draft)',
      'Half-term special — practice + Ball Hit countdown (AI draft)',
    ],
    inboxStats: [['3', 'AWAITING REPLY'], ['121', 'REACHABLE IN-APP'], ['2/wk', 'SCHEDULED COMMS'], ['4', 'CHANNELS IN ONE INBOX']] as [string, string][],
    replaceTitle: 'No more Mailchimp',
    replaceNote: 'Scoped per venue and tracked per family — so a Leeds family never gets a Kingston session. Mailchimp can’t do that.',
    draftIncludes: 'subject + preheader · hero · personalised session card (each family sees their venue) · new-schools welcome · summer results · #tenproject Wimbledon competition · St Clement’s fundraising bar · footer with preferences/unsubscribe.',
  },
  newsletters: {
    september: NEWSLETTER_SEPTEMBER,
    week4: NEWSLETTER_WEEK4,
  },
  insights: {
    reachNote: 'Peak 2,140/week in July — the December dip is the school holidays, not attrition.',
    growthNote: '3.3× in five terms.',
    conversionNote: 'Willowbrook’s 26% is the benchmark — its recipe (early activation, one linked venue) is being rolled out.',
    boroughNote: '3 boroughs, 6 schools, 3 community venues — with a Brookhaven expansion enquiry in the pipeline.',
    socialValueNote: '£4.70 back for every £1 — through raised activity, reduced inactivity risk, family wellbeing and volunteer contribution.',
  },
  social: {
    defaultTags: ['#tenproject', '#LearnPlayTogether'],
    reach7d: '38K',
    growthLabel: '+26%',
    performance: [['1.3M', 'REACH'], ['9.4%', 'ENGAGEMENT'], ['504', 'LINK CLICKS'], ['+710', 'NEW FOLLOWERS']] as [string, string][],
  },
  people: {
    assignmentOptions: ['Unassigned', 'Oakridge Primary', 'Meridian Park Primary (Sept)', 'Kingsmead Rec Ground (Sat)', 'Bramley Green Courts (Sat)', 'Elmwood Park Courts (Sun)'],
  },
  settings: {
    commsRows: [
      ['Sender name', 'Ten Project'],
      ['Reply-to', 'info@tenproject.org.uk'],
      ['Newsletter footer', 'Charity details · unsubscribe · preference centre (auto-added)'],
    ] as [string, string][],
    orgRows: [
      ['Organisation', 'Ten Project Ltd'],
      ['Registered address', '7 Cranmer Close, Morden, London, SM4 4SU'],
      ['Programme admin', 'Harry Lloyd — harry@tenproject.org.uk'],
      ['Safeguarding lead', 'HQ safeguarding lead · 07700 900789'],
      ['Demo PIN', '••••••'],
    ] as [string, string][],
    importLabel: 'Mailchimp import',
    importDesc: 'One-off import of the existing family mailing list',
  },
  equipment: {
    orderNote: 'Order drafted for {count} items — Zsig quote requested for court kit, print order for booklets/stickers. Awaiting your approval in Comms.',
  },
  // Generated documents (src/app/tenproject/[slug]/_lib/*)
  funder: {
    termReportLabel: 'TERM REPORT · AUTUMN 2026',
    termReportSub: 'Autumn term 2026 · prepared for schools, boroughs and trust partners · AI-drafted from registers, QR check-ins and family surveys',
    growthLine: '3.3× growth in five terms. Every figure is backed by named-child registers captured at the point of delivery.',
    bidParas: [
      `Ten Project delivers free, game-based tennis to children aged 4–10 through a 10-week programme embedded in primary-school curriculum time, supplemented by free weekend parent-and-child sessions on public community courts. This term the programme reached 2,140 children per week across our partner schools, with 91% average attendance — every figure evidenced by named-child digital registers captured at the point of delivery.`,
      `The programme's distinctive outcome is school-to-community conversion: of 214 children reached at a typical school, 57% of families activate the programme's parent app, 21% attend a free weekend family session, and 14% become regular attendees. Weekend participation grew from 14 family visits in week one to 44 by week ten. Families surveyed report improvements across Confidence (88%), Exercise (84%) and Family life (81%), alongside Socialising, Well-Being, Focus and Academic Attainment — with 100% saying they would recommend the programme.`,
      `Delivery is fully safeguarded: LTA Level 2/3 accredited coaches with enhanced DBS checks, LTA Safeguarding training, First Aid certification and £5m insurance, all tracked with automatic expiry alerts. All sessions are free to families; 48% of participants are girls, and a third of community venues run sessions designed to include children and adults with learning, sensory and physical disabilities.`,
      `Grant funding directly unlocks named schools: with PE & Sport Premium direct payments ending, unfunded schools now raise their programme cost through supervised fundraising campaigns with transparent, per-pound tracking. A funder can sponsor a school outright or match-fund its campaign — and receives termly impact reporting generated from the same registers and surveys quoted above, per school, per borough or whole-programme.`,
    ],
    governorAttendance: 'Attendance held above 90% for the whole programme — week 10, the {org} Festival, was the best-attended session of the year.',
    snippetParas: [
      `TEN PROJECT AT ST CLEMENT'S — WHAT A TERM! 🎾`,
      ``,
      `This {term}, {children} children across Y2–Y4 took part in Ten Project — ten weeks of free, game-based tennis in school, learning the forehand, backhand, volley and serve, and earning {stickers} Success Stickers along the way. Attendance was {attendance}, and {completed} children completed all ten weeks and received their certificate at the Ten Project Festival.`,
      ``,
      `It doesn't stop there: free weekend Family Sessions run on local community courts, where parents and children play together — 11 of our families already go. Every family is welcome, all equipment is provided, and it's completely free.`,
      ``,
      `HELP BRING TEN PROJECT BACK FOR 2026/27 — with school sports funding changing, we're raising the programme cost ourselves. We're already at £{raised} of £{target}! Look out for the Sponsored Ball Hit on 10 October, and you can donate any time via the school's Ten Project fundraising page.`,
      ``,
      `LEARN. PLAY. TOGETHER.`,
    ],
  },
  events: {
    // Letter-style school name (straight apostrophe, as on the printed letters)
    schoolName: 'St Clement\'s Primary',
    newsletterFamilies: '450',
  },
}
