// src/lib/sports/travel/trip-rates.ts
//
// ⚠️ TEMPORARY PLACEHOLDER RATES — NOT REAL SUPPLIER PRICING. ⚠️
//
// Central config for every rate the same-day-vs-overnight cost comparison
// reads. These are sensible, clearly-labelled placeholders so the
// comparison renders TODAY with no live supplier feed. They are trivial to
// swap: change the numbers here (or, later, override per-supplier via the
// sports_trip_suppliers.rate_* columns) and the whole module updates.
//
// Sourcing real rates is future work:
//   - Per-supplier negotiated rates → sports_trip_suppliers.rate_* (already
//     in the schema, nullable today).
//   - Pooled cross-club rate benchmarking (by region + squad size) → a
//     KNOWN future feature; needs multiple clubs on the platform first.
//     "Coming soon" only — no logic here.
//
// All money is GBP. Keep this file the SINGLE source of rate truth — do not
// inline magic numbers in the engine or the UI.

export const TRIP_RATES = {
  // Coach hire, per mile, return journey priced as 2 × one-way distance.
  // TEMPORARY placeholder.
  coachPerMile: 2.4,

  // Minibus alternative (smaller squads), per mile. TEMPORARY placeholder.
  minibusPerMile: 1.1,

  // Hotel, per room per night. TEMPORARY placeholder. Room occupancy is
  // derived from headcount via roomOccupancy below.
  hotelPerRoomNight: 75,

  // Players/staff per room (twin rooms are standard for away trips).
  // TEMPORARY assumption.
  roomOccupancy: 2,

  // Evening meal per head on an overnight stay (hotel/restaurant).
  // TEMPORARY placeholder.
  mealPerHead: 14,

  // Food/comfort stop per head on a long same-day return (the "service
  // station / pre-arranged meal stop" line). TEMPORARY placeholder.
  dayTripFoodStopPerHead: 8,
} as const

// ─── Decision-engine tuning constants ─────────────────────────────────────
// Behavioural thresholds for the overnight recommendation. Configurable in
// ONE place per the spec; v1 defaults below.

export const TRIP_THRESHOLDS = {
  // One-way drive time (minutes) above which player-fatigue starts to
  // weigh toward an overnight stay. Default 3.5h = 210 min.
  fatigueDriveMinutes: 3.5 * 60,

  // "Late return" boundary — if the same-day arrival home lands at/after
  // this local hour (24h clock), the return is flagged late. ~midnight.
  lateReturnHour: 24, // i.e. 00:00 next day

  // Buffer added after the final whistle before the squad boards the coach
  // (cool-down, shower, load up). Minutes. TEMPORARY assumption.
  postMatchDepartBufferMinutes: 60,
} as const

export type TripRates = typeof TRIP_RATES
export type TripThresholds = typeof TRIP_THRESHOLDS
