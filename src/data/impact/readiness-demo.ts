// Fictional evidence behind the demo's readiness scores. The scores themselves
// come from the same engine as a live portal (src/lib/impact/readiness.ts): to
// change how a demo school looks, change its evidence here, never the engine.

import type { SchoolEvidence } from '@/lib/impact/readiness'

type Roles = { flagship: string; complete: string; fundraising: string; confirmed: string; enquiry: string }

const blank = { registeredChildren: 0, sessions: 0, weeks: 0, attendancePct: null, weekendSessions: 0, venueLinked: false, events: 0, cpdRecords: 0, cpdPeople: 0, responses: 0, positivePct: null, fundedPct: null, sendRecordedPct: null, familyContactPct: null, yearGroups: 0, children: 0 }

export const demoReadinessEvidence = (r: Roles): SchoolEvidence[] => [
  // Running well, teacher hand-over and family activation still growing.
  { ...blank, id: r.flagship, name: 'flagship', status: 'running', stage: 'running', children: 58, registeredChildren: 55, sessions: 8, weeks: 4, attendancePct: 94, yearGroups: 2, sendRecordedPct: 100, familyContactPct: 62, venueLinked: true, events: 1, cpdRecords: 1, cpdPeople: 1, responses: 12, positivePct: 92, funding: 'funded', safeguardingLead: true },
  // The strongest delivery, with nothing funded for next year.
  { ...blank, id: r.complete, name: 'complete', status: 'complete', stage: 'complete', children: 61, registeredChildren: 61, sessions: 20, weeks: 10, attendancePct: 92, yearGroups: 3, sendRecordedPct: 100, familyContactPct: 84, weekendSessions: 6, venueLinked: true, events: 1, cpdRecords: 2, cpdPeople: 2, responses: 24, positivePct: 96, funding: 'unfunded', safeguardingLead: true },
  // Good evidence from last year, fundraising to come back.
  { ...blank, id: r.fundraising, name: 'fundraising', status: 'fundraising', stage: 'complete', children: 52, registeredChildren: 52, sessions: 20, weeks: 10, attendancePct: 93, yearGroups: 2, sendRecordedPct: 90, familyContactPct: 58, venueLinked: true, events: 2, cpdRecords: 1, cpdPeople: 1, responses: 18, positivePct: 94, funding: 'fundraising', fundedPct: 64, safeguardingLead: true },
  // Booked and staffed, with delivery yet to start.
  { ...blank, id: r.confirmed, name: 'confirmed', status: 'confirmed', stage: 'confirmed', children: 45, yearGroups: 2, sendRecordedPct: 40, venueLinked: true, funding: 'funded', safeguardingLead: true },
  // A first enquiry: nothing to evidence yet.
  { ...blank, id: r.enquiry, name: 'enquiry', status: 'enquiry', stage: 'none', funding: 'unknown', safeguardingLead: false },
]
