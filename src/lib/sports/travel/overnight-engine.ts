// src/lib/sports/travel/overnight-engine.ts
//
// The overnight decision engine — PORTAL-AGNOSTIC core logic.
//
// Takes a trip's inputs (kickoff, one-way drive time, squad+staff
// headcount, distance) and outputs BOTH a same-day cost AND an overnight
// cost, the difference, and a NON-BINDING recommendation. It never forces a
// choice — a secretary may eat the fatigue to save money; that's their
// call. The whole point is the club seeing both numbers side by side.
//
// Reads every rate/threshold from trip-rates.ts (single source of truth).
// No live API calls — pure function of its inputs. Drive time in demo comes
// from canned fixtures; on a live portal the caller populates it from Maps
// before calling this.

import { TRIP_RATES, TRIP_THRESHOLDS } from './trip-rates'
import type {
  Trip,
  CostBreakdown,
  CostLine,
  TripCostComparison,
  TripRecommendation,
} from './trip-types'

const gbp = (n: number) => Math.round(n * 100) / 100

/** Total people travelling (players + staff). Falls back to 0-safe. */
function headcount(t: Pick<Trip, 'squadHeadcount' | 'staffHeadcount'>): number {
  return Math.max(0, (t.squadHeadcount || 0) + (t.staffHeadcount || 0))
}

/** Rooms needed for an overnight stay, from headcount and occupancy. */
function roomsFor(people: number): number {
  if (people <= 0) return 0
  return Math.ceil(people / TRIP_RATES.roomOccupancy)
}

/** Coach cost for the round trip = 2 × one-way distance × per-mile rate.
 *  Returns 0 when distance is unknown (demo fixtures always supply it). */
function coachCost(distanceMiles: number | null | undefined): number {
  if (!distanceMiles || distanceMiles <= 0) return 0
  return gbp(2 * distanceMiles * TRIP_RATES.coachPerMile)
}

// ─── Same-day (day-trip) breakdown ────────────────────────────────────────
function buildDayTrip(
  distanceMiles: number | null | undefined,
  people: number,
  lateReturn: boolean,
): CostBreakdown {
  const lines: CostLine[] = []

  const coach = coachCost(distanceMiles)
  if (coach > 0) {
    lines.push({
      label: 'Coach — return',
      amount: coach,
      detail: distanceMiles
        ? `2 × ${distanceMiles}mi @ £${TRIP_RATES.coachPerMile.toFixed(2)}/mi`
        : undefined,
    })
  }

  // A long same-day return typically needs a food/comfort stop on the way
  // home. Only added when the return is flagged late (it's the marginal
  // cost that makes the day-trip option less comfortable, not cheaper).
  if (lateReturn && people > 0) {
    const food = gbp(people * TRIP_RATES.dayTripFoodStopPerHead)
    lines.push({
      label: 'Food / comfort stop',
      amount: food,
      detail: `${people} × £${TRIP_RATES.dayTripFoodStopPerHead.toFixed(2)}/head`,
    })
  }

  const total = gbp(lines.reduce((s, l) => s + l.amount, 0))
  return { total, lines }
}

// ─── Overnight breakdown ──────────────────────────────────────────────────
function buildOvernight(
  distanceMiles: number | null | undefined,
  people: number,
  nights: number,
): CostBreakdown {
  const lines: CostLine[] = []

  // Coach still required (same return distance). On a true overnight you
  // might split the drive across two days, but the round-trip mileage is
  // unchanged, so the coach line is the same as the day trip.
  const coach = coachCost(distanceMiles)
  if (coach > 0) {
    lines.push({
      label: 'Coach — return',
      amount: coach,
      detail: distanceMiles
        ? `2 × ${distanceMiles}mi @ £${TRIP_RATES.coachPerMile.toFixed(2)}/mi`
        : undefined,
    })
  }

  const rooms = roomsFor(people)
  const nightsSafe = Math.max(1, nights || 1)
  if (rooms > 0) {
    const hotel = gbp(rooms * nightsSafe * TRIP_RATES.hotelPerRoomNight)
    lines.push({
      label: 'Hotel',
      amount: hotel,
      detail: `${rooms} rooms × ${nightsSafe} night${nightsSafe > 1 ? 's' : ''} @ £${TRIP_RATES.hotelPerRoomNight.toFixed(0)}/room`,
    })
  }

  if (people > 0) {
    const meals = gbp(people * nightsSafe * TRIP_RATES.mealPerHead)
    lines.push({
      label: 'Evening meal',
      amount: meals,
      detail: `${people} × ${nightsSafe} night${nightsSafe > 1 ? 's' : ''} @ £${TRIP_RATES.mealPerHead.toFixed(2)}/head`,
    })
  }

  const total = gbp(lines.reduce((s, l) => s + l.amount, 0))
  return { total, lines }
}

// ─── Late-return calculation ──────────────────────────────────────────────
/** Returns the estimated same-day arrival-home Date and whether it lands
 *  at/after the late-return threshold. arrival = kickoff + match duration +
 *  post-match buffer + one-way drive home. */
function computeReturn(
  kickoffAt: string,
  matchDurationMinutes: number,
  oneWayDriveMinutes: number | null | undefined,
): { returnAt: Date | null; late: boolean } {
  if (oneWayDriveMinutes == null) return { returnAt: null, late: false }
  const kickoff = new Date(kickoffAt)
  if (isNaN(kickoff.getTime())) return { returnAt: null, late: false }

  const totalMin =
    (matchDurationMinutes || 110) +
    TRIP_THRESHOLDS.postMatchDepartBufferMinutes +
    oneWayDriveMinutes
  const returnAt = new Date(kickoff.getTime() + totalMin * 60_000)

  // "Late" = arrival is on a later calendar day than kickoff, OR at/after
  // the threshold hour on the same day. lateReturnHour 24 means strictly
  // past midnight relative to the kickoff day.
  const crossesMidnight = returnAt.getDate() !== kickoff.getDate()
    || returnAt.getMonth() !== kickoff.getMonth()
    || returnAt.getFullYear() !== kickoff.getFullYear()
  const late = crossesMidnight || returnAt.getHours() >= (TRIP_THRESHOLDS.lateReturnHour % 24 || 24)

  return { returnAt, late }
}

// ─── Public API ───────────────────────────────────────────────────────────

/** The core comparison. ALWAYS returns both costs + the difference + a
 *  non-binding recommendation. Pure; safe to call on every render. */
export function compareTripCosts(
  t: Pick<
    Trip,
    | 'kickoffAt'
    | 'matchDurationMinutes'
    | 'oneWayDriveMinutes'
    | 'oneWayDistanceMiles'
    | 'squadHeadcount'
    | 'staffHeadcount'
    | 'nightsCount'
  >,
): TripCostComparison {
  const people = headcount(t)
  const { returnAt, late } = computeReturn(
    t.kickoffAt,
    t.matchDurationMinutes,
    t.oneWayDriveMinutes,
  )

  const dayTrip = buildDayTrip(t.oneWayDistanceMiles, people, late)
  const overnight = buildOvernight(
    t.oneWayDistanceMiles,
    people,
    t.nightsCount && t.nightsCount > 0 ? t.nightsCount : 1,
  )

  const difference = gbp(overnight.total - dayTrip.total)

  const driveMin = t.oneWayDriveMinutes ?? null
  const longDrive = driveMin != null && driveMin > TRIP_THRESHOLDS.fatigueDriveMinutes

  // Recommendation heuristic (v1): recommend overnight when the drive is
  // long AND the same-day return would land late. Otherwise no strong
  // steer toward overnight; if the drive is short, lean day trip. The
  // figures are always shown either way.
  let recommendation: TripRecommendation = 'none'
  let rationale: string
  const hrs = driveMin != null ? (driveMin / 60).toFixed(1) : '—'
  const threshHrs = (TRIP_THRESHOLDS.fatigueDriveMinutes / 60).toFixed(1)

  if (longDrive && late) {
    recommendation = 'overnight'
    rationale =
      `One-way drive is ${hrs}h (over the ${threshHrs}h fatigue threshold) and a ` +
      `same-day return would get the squad home after midnight. Overnight ` +
      `recommended on player-welfare grounds — but the day-trip saving of ` +
      `£${Math.abs(difference).toFixed(0)} is shown so the call is yours.`
  } else if (longDrive) {
    recommendation = 'none'
    rationale =
      `Long drive (${hrs}h, over the ${threshHrs}h threshold) but the squad ` +
      `would still be home before midnight, so it's a judgement call — ` +
      `overnight costs £${Math.abs(difference).toFixed(0)} ${difference >= 0 ? 'more' : 'less'}.`
  } else if (late) {
    recommendation = 'none'
    rationale =
      `Late return (home after midnight) despite a sub-${threshHrs}h drive — ` +
      `weigh the £${Math.abs(difference).toFixed(0)} overnight ${difference >= 0 ? 'premium' : 'saving'} ` +
      `against a late night.`
  } else {
    recommendation = 'day_trip'
    rationale =
      `Short ${hrs}h drive with a reasonable return time — a day trip is the ` +
      `straightforward, cheaper option (saves £${Math.abs(difference).toFixed(0)}).`
  }

  return {
    dayTrip,
    overnight,
    difference,
    recommendation,
    rationale,
    lateReturn: late,
    estimatedReturnAt: returnAt ? returnAt.toISOString() : undefined,
    inputs: {
      oneWayDriveMinutes: driveMin,
      headcount: people,
      distanceMiles: t.oneWayDistanceMiles ?? null,
    },
  }
}

/** Convenience: just the recommendation enum, e.g. to snapshot onto a row
 *  at create time. */
export function recommendFor(
  t: Parameters<typeof compareTripCosts>[0],
): TripRecommendation {
  return compareTripCosts(t).recommendation
}
