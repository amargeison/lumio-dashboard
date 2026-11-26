// Rally Ten demo — Community (weekend families). Hand-written and fictional: the three
// demo venues, a mix of families who signed up directly and school families who now
// come at weekends, one lapsed, one on the waiting list. Dates are counted back from
// today, so the statuses read the same whenever the demo is opened. Nothing here is
// ever written anywhere.

export interface DemoCommunityFamily {
  id: string; guardian: string; email: string; children: { name: string; age: number }[]
  source: 'school' | 'community' | 'both'; venueId: string; signedUpDaysAgo: number | null
  visitsDaysAgo: number[]; hasLogin: boolean; consentData: boolean; consentPhoto: boolean
  lapsed?: boolean; waitlisted?: boolean; checkinCode: string
}

export const DEMO_COMMUNITY_CAPACITY: Record<string, number | null> = { northvale: 40, copperfield: 6, ellisford: null }

export const DEMO_COMMUNITY: DemoCommunityFamily[] = [
  { id: 'dc1', guardian: 'Priya Hallam', email: 'priya.hallam@example.com', children: [{ name: 'Ella Hallam', age: 8 }, { name: 'Sam Hallam', age: 6 }], source: 'both', venueId: 'northvale', signedUpDaysAgo: 70, visitsDaysAgo: [63, 56, 42, 35, 21, 14, 7], hasLogin: true, consentData: true, consentPhoto: true, checkinCode: 'DEMOHALLAM01' },
  { id: 'dc2', guardian: 'Marcus Oyelaran', email: 'marcus.o@example.com', children: [{ name: 'Tobi Oyelaran', age: 9 }], source: 'community', venueId: 'northvale', signedUpDaysAgo: 20, visitsDaysAgo: [14, 7], hasLogin: true, consentData: true, consentPhoto: false, checkinCode: 'DEMOOYELAR02' },
  { id: 'dc3', guardian: 'Grace Whitlow', email: 'grace.whitlow@example.com', children: [{ name: 'Lily Whitlow', age: 7 }], source: 'community', venueId: 'copperfield', signedUpDaysAgo: 5, visitsDaysAgo: [], hasLogin: false, consentData: true, consentPhoto: true, checkinCode: 'DEMOWHITLO03' },
  { id: 'dc4', guardian: 'Dan Fairbairn', email: 'dan.fairbairn@example.com', children: [{ name: 'Noah Fairbairn', age: 10 }, { name: 'Ava Fairbairn', age: 8 }], source: 'both', venueId: 'copperfield', signedUpDaysAgo: null, visitsDaysAgo: [49, 28, 21, 7], hasLogin: true, consentData: true, consentPhoto: true, checkinCode: 'DEMOFAIRBA04' },
  { id: 'dc5', guardian: 'Sophie Kendrick', email: 'sophie.k@example.com', children: [{ name: 'Mia Kendrick', age: 6 }], source: 'community', venueId: 'ellisford', signedUpDaysAgo: 120, visitsDaysAgo: [112, 105, 98, 70], hasLogin: false, consentData: true, consentPhoto: false, checkinCode: 'DEMOKENDRI05' },
  { id: 'dc6', guardian: 'Tom Ashworth', email: 'tom.ashworth@example.com', children: [{ name: 'Jack Ashworth', age: 9 }], source: 'both', venueId: 'northvale', signedUpDaysAgo: null, visitsDaysAgo: [21], hasLogin: true, consentData: true, consentPhoto: true, checkinCode: 'DEMOASHWOR06' },
  { id: 'dc7', guardian: 'Leah Mercer', email: 'leah.mercer@example.com', children: [{ name: 'Isla Mercer', age: 7 }, { name: 'Finn Mercer', age: 5 }], source: 'community', venueId: 'ellisford', signedUpDaysAgo: 40, visitsDaysAgo: [35, 28, 14, 7, 0], hasLogin: true, consentData: true, consentPhoto: true, checkinCode: 'DEMOMERCER07' },
  { id: 'dc8', guardian: 'Ravi Shah', email: 'ravi.shah@example.com', children: [{ name: 'Anaya Shah', age: 8 }], source: 'community', venueId: 'northvale', signedUpDaysAgo: 150, visitsDaysAgo: [140, 133], hasLogin: false, consentData: true, consentPhoto: false, lapsed: true, checkinCode: 'DEMOSHAHRA08' },
  { id: 'dc9', guardian: 'Hannah Pike', email: 'hannah.pike@example.com', children: [{ name: 'Oscar Pike', age: 7 }], source: 'community', venueId: 'copperfield', signedUpDaysAgo: 2, visitsDaysAgo: [], hasLogin: false, consentData: true, consentPhoto: true, waitlisted: true, checkinCode: 'DEMOPIKEHA09' },
  { id: 'dc10', guardian: 'Joe Lindqvist', email: 'joe.lindqvist@example.com', children: [{ name: 'Elsa Lindqvist', age: 9 }], source: 'both', venueId: 'ellisford', signedUpDaysAgo: null, visitsDaysAgo: [10, 3], hasLogin: false, consentData: true, consentPhoto: true, checkinCode: 'DEMOLINDQV10' },
]
