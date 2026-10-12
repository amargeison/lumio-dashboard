// ─── PE & SCHOOL SPORT PARTNERSHIPS NETWORK — REFERENCE CONTENT ─────────────
// Factual (Pattern 2) policy content for the Sport Network tab, shared by every
// Impact / Ten Project portal. This file is the verified baseline; the Update
// button (POST /api/impact/sport-network) refreshes a stored copy from gov.uk /
// DfE / Youth Sport Trust and the tab prefers that copy when it's newer.
// Keep entries short, plain-English and sourced.

export interface SportNetworkContent {
  updatedAt: string            // ISO date the facts were last verified
  hero: { kicker: string; title: string; body: string }
  keyFacts: { title: string; body: string }[]
  premium: { title: string; rows: [string, string][] }
  timeline: { when: string; label: string; done: boolean }[]
  guidance: { title: string; source: string; date: string; url: string }[]
  footnote: string
  sources: { title: string; url: string }[]
}

export const SPORT_NETWORK_BASELINE: SportNetworkContent = {
  updatedAt: '2026-10-10',
  hero: {
    kicker: 'FUNDING TRANSITION · 2026/27',
    title: 'PE & School Sport Partnerships Network — your one-stop shop',
    body: 'The PE & School Sport Partnerships Network is operational from January 2027, and the PE & Sport Premium continues for 2026/27. This is where every school’s readiness for the new model lives — who’s on track, who needs a push, the key dates and the latest DfE guidance.',
  },
  keyFacts: [
    { title: 'Almost £1bn in total', body: '£580m for the Partnerships Network, £200m for school sport facilities (now including maintaining and improving buildings and grounds), and a £100m payment to help primary schools transition to the new approach.' },
    { title: 'Universal + targeted support', body: 'Every school gets universal support (online training, on-demand resources); targeted support follows need — specialist coaches, teacher development, extra-curricular activity, swimming and water safety.' },
    { title: 'Clubs, NGBs and pathways', body: 'Schools are connected to grassroots clubs and national governing bodies such as the FA and Swim England, with pathways into sport beyond the school day.' },
    { title: 'Year 1 to Year 11', body: 'Dedicated PE support now extends to secondary pupils as well as primary — Year 1 through Year 11.' },
    { title: 'Two hours of PE a week', body: 'The expectation of two hours of PE a week stands, alongside a “core enrichment entitlement” for every child (Every child achieving and thriving).' },
  ],
  premium: {
    title: 'PE & Sport Premium continues for 2026/27',
    rows: [
      ['17 or more pupils', '£6,240 + £10 per pupil'],
      ['16 or fewer pupils', '£390 per pupil'],
      ['Allocations published', 'October 2026'],
      ['Payment — maintained schools', '30 October 2026'],
      ['Payment — academies', '9 November 2026'],
      ['Payment — non-maintained special schools', '18 December 2026'],
      ['Expenditure return due', '31 July 2027 (opens June 2027)'],
    ],
  },
  timeline: [
    { when: 'May 2026', label: 'Government announces the PE & School Sport Partnerships Network (~£1bn)', done: true },
    { when: 'Sept 2026', label: 'PE & Sport Premium conditions of grant 2026/27 published', done: true },
    { when: 'Oct 2026', label: 'Premium allocations published; maintained-school payments 30 Oct', done: false },
    { when: 'Nov–Dec 2026', label: 'Academy payments 9 Nov; non-maintained special schools 18 Dec', done: false },
    { when: 'Jan 2027', label: 'PE & School Sport Partnerships Network operational', done: false },
    { when: 'Jul 2027', label: 'Premium expenditure return due (31 Jul)', done: false },
  ],
  guidance: [
    { title: 'Primary PE and sport premium: conditions of grant 2026 to 2027', source: 'GOV.UK / DfE', date: 'Sept 2026', url: 'https://www.gov.uk/government/publications/pe-and-sport-premium-conditions-of-grant-2026-to-2027' },
    { title: 'PE and sport premium for primary schools', source: 'GOV.UK / DfE', date: 'ongoing', url: 'https://www.gov.uk/government/publications/pe-and-sport-premium-for-primary-schools' },
    { title: 'How we are helping kids stay active at school', source: 'DfE Education Hub', date: 'May 2026', url: 'https://educationhub.blog.gov.uk/2026/05/how-we-are-helping-kids-stay-active-at-school/' },
    { title: 'Primary PE & Sport Premium — support for schools', source: 'Youth Sport Trust', date: 'ongoing', url: 'https://www.youthsporttrust.org/school-support/primary-pe-sport-premium' },
  ],
  footnote: 'Readiness scores are an indicative framework built from the published direction for the Partnerships Network and the Premium’s key indicators — they’ll be reconciled to DfE’s detailed requirements as they’re published.',
  sources: [
    { title: 'GOV.UK — PE and sport premium conditions of grant 2026 to 2027', url: 'https://www.gov.uk/government/publications/pe-and-sport-premium-conditions-of-grant-2026-to-2027' },
    { title: 'DfE Education Hub — How we are helping kids stay active at school', url: 'https://educationhub.blog.gov.uk/2026/05/how-we-are-helping-kids-stay-active-at-school/' },
  ],
}
