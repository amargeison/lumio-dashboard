// Multi-coach staff model (Staff feature, Phase A — data only, no UI).
//
// The portal was single-coach (COACH_ORG = Pete Griffiths). This file introduces
// the wider coaching team, their bookings and their players, WITHOUT touching any
// of Pete's existing views: Pete's own data still lives in coach-data.ts
// (BOOKINGS / PLAYERS, now tagged coachId:'pete') and is unchanged. Everything
// here is additive — the combined accessors (ALL_BOOKINGS / ALL_PLAYERS) and the
// per-coach stat helpers are what Phase B's StaffView will render.

import {
  COACH_ORG, BOOKINGS, PLAYERS, TODAY, dateForDay,
  type Booking, type Player,
} from './coach-data'
import { getAssignments } from './player-assign-store'

export type CoachRole = 'Head' | 'Senior' | 'Coach' | 'Assistant' | 'Apprentice'

export type Coach = {
  id: string
  name: string
  initials: string
  role: CoachRole
  accreditation: string          // LTA level / qualification
  specialisms: string[]          // Performance, Mini/Red, Cardio, Adult, Doubles…
  availability: string           // days/times summary
  hoursPerWeek: number           // contracted coaching hours
  status: 'active' | 'leave'
  homeVenue: string
  photo?: string
  // DBS & safeguarding (optional — set when a coach is added with these details).
  dbsNumber?: string
  dbsIssued?: string
  dbsExpiry?: string
  safeguardingTrained?: boolean
  safeguardingDate?: string
  // Contact & calendar (optional — captured on add).
  email?: string
  phone?: string
  calendarProvider?: string
}

const HOME = COACH_ORG.venue.split(' · ')[0]   // 'Riverside Tennis Centre'

// 15 coaches. Pete is the Head, reconciled from COACH_ORG (name + accreditation),
// so the head coach appears in his own team rather than being mysteriously absent.
export const COACHES: Coach[] = [
  { id: 'pete',   name: COACH_ORG.coach,   initials: 'VJ', role: 'Head',      accreditation: COACH_ORG.cert,                  specialisms: ['Performance', 'Match play'],     availability: 'Mon–Sat · full days', hoursPerWeek: 32, status: 'active', homeVenue: HOME },
  { id: 'rachel', name: 'Rachel Adeyemi',  initials: 'RA', role: 'Senior',    accreditation: 'Senior Performance Coach',         specialisms: ['Performance', 'Doubles'],        availability: 'Mon–Fri · days',      hoursPerWeek: 30, status: 'active', homeVenue: HOME },
  { id: 'marcus', name: 'Marcus Bell',     initials: 'MB', role: 'Senior',    accreditation: 'Senior Performance Coach',         specialisms: ['Cardio', 'Adult'],               availability: 'Tue–Sat · days',      hoursPerWeek: 30, status: 'active', homeVenue: HOME },
  { id: 'sofia',  name: 'Sofia Nilsson',   initials: 'SN', role: 'Senior',    accreditation: 'Qualified Coach',          specialisms: ['Performance', 'Junior'],         availability: 'Mon–Fri · days',      hoursPerWeek: 28, status: 'active', homeVenue: HOME },
  { id: 'david',  name: 'David Okonkwo',   initials: 'DO', role: 'Coach',     accreditation: 'Qualified Coach',          specialisms: ['Junior', 'Mini/Red'],            availability: 'Mon–Fri · afternoons',hoursPerWeek: 26, status: 'active', homeVenue: HOME },
  { id: 'elena',  name: 'Elena Petrova',   initials: 'EP', role: 'Coach',     accreditation: 'Qualified Coach',          specialisms: ['Cardio', 'Adult'],               availability: 'Tue–Sun · days',      hoursPerWeek: 26, status: 'active', homeVenue: HOME },
  { id: 'jamie',  name: 'Jamie Sutton',    initials: 'JS', role: 'Coach',     accreditation: 'Qualified Coach',          specialisms: ['Adult', 'Doubles'],              availability: 'Wed–Sun · days',      hoursPerWeek: 24, status: 'active', homeVenue: HOME },
  { id: 'aisha',  name: 'Aisha Khan',      initials: 'AK', role: 'Coach',     accreditation: 'Qualified Coach',          specialisms: ['Junior', 'Performance'],         availability: 'Mon–Fri · days',      hoursPerWeek: 24, status: 'active', homeVenue: HOME },
  { id: 'theo',   name: 'Theo Hargreaves', initials: 'TH', role: 'Coach',     accreditation: 'Qualified Coach',          specialisms: ['Performance', 'Match play'],     availability: 'Mon–Sat · days',      hoursPerWeek: 24, status: 'active', homeVenue: HOME },
  { id: 'grace',  name: 'Grace Lin',       initials: 'GL', role: 'Coach',     accreditation: 'Qualified Coach',          specialisms: ['Junior', 'Mini/Red'],            availability: 'Thu–Mon · days',      hoursPerWeek: 22, status: 'active', homeVenue: HOME },
  { id: 'ben',    name: 'Ben Carter',      initials: 'BC', role: 'Assistant', accreditation: 'Coaching Assistant',        specialisms: ['Mini/Red', 'Cardio'],            availability: 'Sat–Sun + eves',      hoursPerWeek: 18, status: 'active', homeVenue: HOME },
  { id: 'nadia',  name: 'Nadia Rashid',    initials: 'NR', role: 'Assistant', accreditation: 'Coaching Assistant',        specialisms: ['Junior', 'Adult'],               availability: 'Mon–Fri · eves',      hoursPerWeek: 18, status: 'active', homeVenue: HOME },
  { id: 'luca',   name: 'Luca Romano',     initials: 'LR', role: 'Assistant', accreditation: 'Coaching Assistant',        specialisms: ['Mini/Red', 'Junior'],            availability: 'Wed–Sun · days',      hoursPerWeek: 16, status: 'active', homeVenue: HOME },
  { id: 'chloe',  name: 'Chloe Foster',    initials: 'CF', role: 'Apprentice',accreditation: 'Coaching apprentice (in training)',     specialisms: ['Mini/Red'],                      availability: 'Sat–Sun',             hoursPerWeek: 12, status: 'active', homeVenue: HOME },
  { id: 'ollie',  name: 'Ollie Grant',     initials: 'OG', role: 'Apprentice',accreditation: 'Coaching apprentice (in training)',     specialisms: ['Mini/Red', 'Junior'],            availability: 'Fri–Sun',             hoursPerWeek: 12, status: 'active', homeVenue: HOME },
]

// The wider team's bookings across the same 8–14 Jun week. All on Courts 4–6 at
// slots Pete never uses (Pete is Courts 1–4 at specific times), so no court+time
// collides — the recon's main flag. coachId ties each to a member of COACHES.
const STAFF_BOOKINGS_SEED: Omit<Booking, 'date'>[] = [
  { id: 's1',  day: 0, start: '09:00', end: '10:00', player: 'Mini Reds (5)',       type: 'Group',      court: 'Court 5', status: 'confirmed', coachId: 'rachel' },
  { id: 's2',  day: 2, start: '16:00', end: '17:00', player: 'Sophie Marsh',        type: 'Private',    court: 'Court 5', status: 'confirmed', coachId: 'rachel' },
  { id: 's3',  day: 1, start: '10:00', end: '11:00', player: 'Oliver Tan',          type: 'Private',    court: 'Court 6', status: 'confirmed', coachId: 'marcus' },
  { id: 's4',  day: 3, start: '14:00', end: '15:00', player: 'Cardio Group (6)',    type: 'Cardio',     court: 'Court 6', status: 'confirmed', coachId: 'marcus' },
  { id: 's5',  day: 0, start: '13:00', end: '14:00', player: 'Ella Brooks',         type: 'Private',    court: 'Court 6', status: 'confirmed', coachId: 'sofia'  },
  { id: 's6',  day: 4, start: '10:00', end: '11:00', player: 'Performance Sq (4)',  type: 'Group',      court: 'Court 5', status: 'confirmed', coachId: 'sofia'  },
  { id: 's7',  day: 2, start: '09:00', end: '10:00', player: 'Noah Pike',           type: 'Private',    court: 'Court 4', status: 'confirmed', coachId: 'david'  },
  { id: 's8',  day: 5, start: '14:00', end: '15:00', player: 'Junior Match (4)',    type: 'Match play', court: 'Court 5', status: 'confirmed', coachId: 'david'  },
  { id: 's9',  day: 1, start: '13:00', end: '14:30', player: 'Cardio Tennis (8)',   type: 'Cardio',     court: 'Court 5', status: 'confirmed', coachId: 'elena'  },
  { id: 's10', day: 3, start: '10:00', end: '11:00', player: 'Maya Cole',           type: 'Private',    court: 'Court 5', status: 'confirmed', coachId: 'elena'  },
  { id: 's11', day: 4, start: '16:00', end: '17:00', player: 'Finn Walsh',          type: 'Private',    court: 'Court 6', status: 'confirmed', coachId: 'jamie'  },
  { id: 's12', day: 6, start: '11:00', end: '12:00', player: 'Adult Group (6)',     type: 'Group',      court: 'Court 5', status: 'confirmed', coachId: 'jamie'  },
  { id: 's13', day: 0, start: '10:00', end: '11:00', player: 'Zara Iqbal',          type: 'Private',    court: 'Court 4', status: 'confirmed', coachId: 'aisha'  },
  { id: 's14', day: 2, start: '17:00', end: '18:00', player: 'Reuben Cox',          type: 'Private',    court: 'Court 6', status: 'confirmed', coachId: 'aisha'  },
  { id: 's15', day: 1, start: '09:00', end: '10:00', player: 'Lucas Reed',          type: 'Private',    court: 'Court 4', status: 'confirmed', coachId: 'theo'   },
  { id: 's16', day: 5, start: '09:00', end: '10:00', player: 'Performance Match (2)',type: 'Match play',court: 'Court 6', status: 'confirmed', coachId: 'theo'   },
  { id: 's17', day: 3, start: '13:00', end: '14:00', player: 'Junior Squad (5)',    type: 'Group',      court: 'Court 4', status: 'confirmed', coachId: 'grace'  },
  { id: 's18', day: 4, start: '11:00', end: '12:00', player: 'Isla Fern',           type: 'Private',    court: 'Court 4', status: 'pending',   coachId: 'grace'  },
  { id: 's19', day: 0, start: '11:00', end: '12:00', player: 'Harry Dean',          type: 'Private',    court: 'Court 5', status: 'confirmed', coachId: 'ben'    },
  { id: 's20', day: 6, start: '13:00', end: '14:00', player: 'Cardio Group (5)',    type: 'Cardio',     court: 'Court 6', status: 'confirmed', coachId: 'ben'    },
  { id: 's21', day: 1, start: '16:00', end: '17:00', player: 'Amelia Frost',        type: 'Private',    court: 'Court 6', status: 'confirmed', coachId: 'nadia'  },
  { id: 's22', day: 4, start: '17:00', end: '18:00', player: 'Kai Mercer',          type: 'Private',    court: 'Court 5', status: 'confirmed', coachId: 'nadia'  },
  { id: 's23', day: 2, start: '10:00', end: '11:00', player: 'Dylan Vance',         type: 'Private',    court: 'Court 5', status: 'confirmed', coachId: 'luca'   },
  { id: 's24', day: 5, start: '12:00', end: '13:00', player: 'Mini Reds (6)',       type: 'Group',      court: 'Court 6', status: 'confirmed', coachId: 'luca'   },
  { id: 's25', day: 3, start: '09:00', end: '10:00', player: 'Evie Hart',           type: 'Private',    court: 'Court 6', status: 'confirmed', coachId: 'chloe'  },
  { id: 's26', day: 4, start: '10:00', end: '11:00', player: 'Theo Day',            type: 'Private',    court: 'Court 6', status: 'confirmed', coachId: 'ollie'  },
  { id: 's27', day: 6, start: '14:00', end: '15:00', player: 'Sunday Juniors (5)',  type: 'Group',      court: 'Court 5', status: 'confirmed', coachId: 'chloe'  },
]

export const STAFF_BOOKINGS: Booking[] = STAFF_BOOKINGS_SEED.map(b => ({ ...b, date: dateForDay(b.day) }))

// The whole club's week: Pete's bookings + everyone else's. Phase B reads this;
// Pete's own views keep reading BOOKINGS (his slice) and are unchanged.
export const ALL_BOOKINGS: Booking[] = [...BOOKINGS, ...STAFF_BOOKINGS]

// The wider team's players (Pete's are in coach-data PLAYERS, tagged 'pete').
const STAFF_PLAYERS_SEED: Player[] = [
  { id: 'sp1',  name: 'Sophie Marsh',  initials: 'SM', age: 13, group: 'Performance', beltIndex: 5, seed: 11, goal: 'Tidy up the second serve',        attendance: 92, nextSession: 'Wed 16:00', status: 'green', trend: 'up',   coachId: 'rachel' },
  { id: 'sp2',  name: 'Oliver Tan',    initials: 'OT', age: 12, group: 'Performance', beltIndex: 4, seed: 12, goal: 'Forehand depth & shape',          attendance: 88, nextSession: 'Tue 10:00', status: 'green', trend: 'flat', coachId: 'rachel' },
  { id: 'sp3',  name: 'Lily Stone',    initials: 'LS', age: 15, group: 'Performance', beltIndex: 6, seed: 13, goal: 'Net play under pressure',         attendance: 90, nextSession: 'Fri 14:00', status: 'amber', trend: 'up',   coachId: 'rachel' },
  { id: 'sp4',  name: 'Ella Brooks',   initials: 'EB', age: 34, group: 'Adult',       beltIndex: 3, seed: 14, goal: 'Match-play consistency',          attendance: 80, nextSession: 'Mon 13:00', status: 'green', trend: 'flat', coachId: 'marcus' },
  { id: 'sp5',  name: 'Greg Powell',   initials: 'GP', age: 45, group: 'Adult',       beltIndex: 2, seed: 15, goal: 'Cardio fitness & footwork',       attendance: 76, nextSession: 'Thu 14:00', status: 'amber', trend: 'up',   coachId: 'marcus' },
  { id: 'sp6',  name: 'Noah Pike',     initials: 'NP', age: 10, group: 'Junior',      beltIndex: 2, seed: 16, goal: 'Rally length & control',          attendance: 94, nextSession: 'Wed 09:00', status: 'green', trend: 'up',   coachId: 'sofia'  },
  { id: 'sp7',  name: 'Maya Cole',     initials: 'MC', age: 13, group: 'Performance', beltIndex: 5, seed: 17, goal: 'Topspin backhand build',         attendance: 89, nextSession: 'Thu 10:00', status: 'green', trend: 'up',   coachId: 'sofia'  },
  { id: 'sp8',  name: 'Reuben Cox',    initials: 'RC', age: 9,  group: 'Junior',      beltIndex: 1, seed: 18, goal: 'Serve over the net',              attendance: 85, nextSession: 'Wed 17:00', status: 'amber', trend: 'flat', coachId: 'david'  },
  { id: 'sp9',  name: 'Isla Fern',     initials: 'IF', age: 8,  group: 'Junior',      beltIndex: 1, seed: 19, goal: 'Ready position & split step',     attendance: 91, nextSession: 'Fri 11:00', status: 'green', trend: 'up',   coachId: 'david'  },
  { id: 'sp10', name: 'Greta Voss',    initials: 'GV', age: 41, group: 'Adult',       beltIndex: 3, seed: 20, goal: 'Doubles positioning',             attendance: 78, nextSession: 'Tue 13:00', status: 'amber', trend: 'flat', coachId: 'elena'  },
  { id: 'sp11', name: 'Sam Doyle',     initials: 'SD', age: 29, group: 'Adult',       beltIndex: 4, seed: 21, goal: 'Serve power & placement',         attendance: 83, nextSession: 'Sat 09:00', status: 'green', trend: 'up',   coachId: 'elena'  },
  { id: 'sp12', name: 'Amara Singh',   initials: 'AS', age: 36, group: 'Adult',       beltIndex: 3, seed: 22, goal: 'Return of serve',                 attendance: 81, nextSession: 'Wed 18:00', status: 'green', trend: 'flat', coachId: 'jamie'  },
  { id: 'sp13', name: 'Kai Mercer',    initials: 'KM', age: 14, group: 'Performance', beltIndex: 5, seed: 23, goal: 'Inside-out forehand',             attendance: 87, nextSession: 'Fri 17:00', status: 'green', trend: 'up',   coachId: 'jamie'  },
  { id: 'sp14', name: 'Zara Iqbal',    initials: 'ZI', age: 11, group: 'Junior',      beltIndex: 3, seed: 24, goal: 'Backhand drive consistency',      attendance: 93, nextSession: 'Mon 10:00', status: 'green', trend: 'up',   coachId: 'aisha'  },
  { id: 'sp15', name: 'Toby Hale',     initials: 'TH', age: 12, group: 'Performance', beltIndex: 4, seed: 25, goal: 'Court coverage & recovery',       attendance: 86, nextSession: 'Thu 16:00', status: 'amber', trend: 'flat', coachId: 'aisha'  },
  { id: 'sp16', name: 'Lucas Reed',    initials: 'LR', age: 15, group: 'Performance', beltIndex: 6, seed: 26, goal: 'Serve+1 patterns',                attendance: 95, nextSession: 'Tue 09:00', status: 'green', trend: 'up',   coachId: 'theo'   },
  { id: 'sp17', name: 'Nina Park',     initials: 'NK', age: 16, group: 'Performance', beltIndex: 7, seed: 27, goal: 'Match temperament',               attendance: 96, nextSession: 'Sat 09:00', status: 'green', trend: 'up',   coachId: 'theo'   },
  { id: 'sp18', name: 'Evie Hart',     initials: 'EH', age: 7,  group: 'Junior',      beltIndex: 0, seed: 28, goal: 'Racket skills & coordination',    attendance: 90, nextSession: 'Thu 09:00', status: 'green', trend: 'up',   coachId: 'grace'  },
  { id: 'sp19', name: 'Max Turner',    initials: 'MT', age: 9,  group: 'Junior',      beltIndex: 2, seed: 29, goal: 'Cross-court rally',               attendance: 84, nextSession: 'Mon 16:00', status: 'amber', trend: 'flat', coachId: 'grace'  },
  { id: 'sp20', name: 'Harry Dean',    initials: 'HD', age: 8,  group: 'Junior',      beltIndex: 1, seed: 30, goal: 'Throwing & serve motion',         attendance: 88, nextSession: 'Mon 11:00', status: 'green', trend: 'up',   coachId: 'ben'    },
  { id: 'sp21', name: 'Amelia Frost',  initials: 'AF', age: 13, group: 'Performance', beltIndex: 4, seed: 31, goal: 'Volley confidence',               attendance: 82, nextSession: 'Tue 16:00', status: 'amber', trend: 'up',   coachId: 'nadia'  },
  { id: 'sp22', name: 'Owen Pryce',    initials: 'OP', age: 27, group: 'Adult',       beltIndex: 2, seed: 32, goal: 'Consistent first serve',          attendance: 74, nextSession: 'Mon 19:00', status: 'amber', trend: 'flat', coachId: 'nadia'  },
  { id: 'sp23', name: 'Dylan Vance',   initials: 'DV', age: 10, group: 'Junior',      beltIndex: 2, seed: 33, goal: 'Forehand contact point',          attendance: 92, nextSession: 'Wed 10:00', status: 'green', trend: 'up',   coachId: 'luca'   },
  { id: 'sp24', name: 'Freya Hill',    initials: 'FH', age: 8,  group: 'Junior',      beltIndex: 1, seed: 34, goal: 'Mini-tennis match play',          attendance: 89, nextSession: 'Sat 12:00', status: 'green', trend: 'up',   coachId: 'luca'   },
  { id: 'sp25', name: 'Theo Day',      initials: 'TD', age: 7,  group: 'Junior',      beltIndex: 0, seed: 35, goal: 'Hand-eye & balance',              attendance: 87, nextSession: 'Fri 10:00', status: 'green', trend: 'flat', coachId: 'ollie'  },
  { id: 'sp26', name: 'Ruby Vale',     initials: 'RV', age: 9,  group: 'Junior',      beltIndex: 1, seed: 36, goal: 'Rally cooperation',               attendance: 91, nextSession: 'Sun 14:00', status: 'green', trend: 'up',   coachId: 'chloe'  },
]

export const STAFF_PLAYERS: Player[] = STAFF_PLAYERS_SEED
export const ALL_PLAYERS: Player[] = [...PLAYERS, ...STAFF_PLAYERS]

// ─── Per-coach derived stats (computed, never stored) ───────────────────────
// All derived from coach-filtered bookings (not the Pete-only session status
// model — other coaches have no session status). Phase B renders these.

const minutesBetween = (start: string, end: string) => {
  const at = (t: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t); return m ? +m[1] * 60 + +m[2] : 0 }
  return Math.max(at(end) - at(start), 0)
}

export type CoachStats = {
  today: number          // bookings today
  week: number           // bookings this week (all bookings are within the demo week)
  players: number        // players assigned
  hoursBooked: number    // coaching hours booked this week
  utilisation: number    // hoursBooked / hoursPerWeek, 0–100
}

export function coachById(id: string): Coach | undefined {
  return COACHES.find(c => c.id === id)
}
export function bookingsForCoach(coachId: string): Booking[] {
  return ALL_BOOKINGS.filter(b => b.coachId === coachId)
}
export function playersForCoach(coachId: string): Player[] {
  // An assignment override (head coach reassigning) wins over the static link.
  const overrides = getAssignments()
  return ALL_PLAYERS.filter(p => (overrides[p.id] ?? p.coachId) === coachId)
}

export function coachStats(coachId: string): CoachStats {
  const bks = bookingsForCoach(coachId).filter(b => b.status !== 'cancelled')
  const minutes = bks.reduce((sum, b) => sum + minutesBetween(b.start, b.end), 0)
  const hoursBooked = Math.round((minutes / 60) * 10) / 10
  const coach = coachById(coachId)
  return {
    today: bks.filter(b => b.date === TODAY).length,
    week: bks.length,
    players: playersForCoach(coachId).length,
    hoursBooked,
    utilisation: coach && coach.hoursPerWeek > 0 ? Math.min(100, Math.round((hoursBooked / coach.hoursPerWeek) * 100)) : 0,
  }
}
