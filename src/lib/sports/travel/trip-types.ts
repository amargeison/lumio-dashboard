// src/lib/sports/travel/trip-types.ts
//
// Travel & Logistics — shared, PORTAL-AGNOSTIC type surface.
//
// These types are deliberately free of any womens-specific shape. The
// Women's portal is built first, but Club/Woking and Non-League will import
// the SAME engine + data-source against these types via the copy-and-
// retheme port (only the View component is re-themed per portal; the data
// model and decision logic are shared).
//
// Mirrors the DB schema in supabase/migrations/106_sports_travel.sql. Kept
// in sync by hand (no codegen in this repo). Flights / private charter are
// Pro Phase 2 and intentionally absent.

export type SupplierType = 'coach' | 'hotel' | 'catering' | 'minibus' | 'other'

export type TripStatus =
  | 'planning' | 'enquiring' | 'confirmed' | 'completed' | 'cancelled'

/** Engine recommendation snapshot. 'none' = no strong steer (short drive). */
export type TripRecommendation = 'day_trip' | 'overnight' | 'none'

/** A travel supplier (vendor) a club books for away days. rate_* are
 *  TEMPORARY placeholder per-unit rates — see trip-rates.ts. All optional
 *  because no live supplier rate feed exists yet. */
export interface TripSupplier {
  id: string
  clubId: string
  name: string
  supplierType: SupplierType
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  region?: string | null
  notes?: string | null
  ratePerMile?: number | null
  ratePerRoomNight?: number | null
  ratePerHead?: number | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

/** One away trip. one_way* + headcounts feed the decision engine.
 *  is_overnight / nights_count carry the CHOSEN plan; the engine always
 *  computes BOTH costs regardless of the chosen plan. */
export interface Trip {
  id: string
  clubId: string
  title: string
  opponent?: string | null
  competition?: string | null
  venue?: string | null
  /** ISO 8601. */
  kickoffAt: string
  matchDurationMinutes: number
  /** Canned in demo; Maps-derived on a live portal. */
  oneWayDriveMinutes?: number | null
  oneWayDistanceMiles?: number | null
  squadHeadcount: number
  staffHeadcount: number
  isOvernight: boolean
  nightsCount: number
  coachSupplierId?: string | null
  hotelSupplierId?: string | null
  cateringSupplierId?: string | null
  recommendation: TripRecommendation
  status: TripStatus
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

/** Input to the create-trip flow. Engine fields (recommendation,
 *  isOvernight default) are derived/defaulted by the data layer. */
export interface NewTripInput {
  title: string
  opponent?: string
  competition?: string
  venue?: string
  kickoffAt: string
  matchDurationMinutes?: number
  oneWayDriveMinutes?: number
  oneWayDistanceMiles?: number
  squadHeadcount: number
  staffHeadcount: number
  /** Secretary's initial choice; defaults to false (day trip). */
  isOvernight?: boolean
  nightsCount?: number
  coachSupplierId?: string
  hotelSupplierId?: string
  cateringSupplierId?: string
  notes?: string
}

// ─── Cost comparison (engine output) ──────────────────────────────────────

/** A single named cost line, e.g. "Coach (2 × 140mi @ £2.40/mi)". */
export interface CostLine {
  label: string
  amount: number
  detail?: string
}

/** One side of the comparison (day-trip OR overnight). */
export interface CostBreakdown {
  total: number
  lines: CostLine[]
}

/** The core feature: BOTH costs + the difference + a non-binding
 *  recommendation. The human decides; the system never forces a choice. */
export interface TripCostComparison {
  dayTrip: CostBreakdown
  overnight: CostBreakdown
  /** overnight.total − dayTrip.total. Positive = overnight costs more. */
  difference: number
  recommendation: TripRecommendation
  /** Plain-English reason for the recommendation, shown under the figures. */
  rationale: string
  /** True when the return leg would land after the late-night threshold. */
  lateReturn: boolean
  /** Estimated arrival-home time (ISO) on a same-day return. */
  estimatedReturnAt?: string
  /** Echoes the inputs used, so the UI can show "based on…". */
  inputs: {
    oneWayDriveMinutes: number | null
    headcount: number
    distanceMiles: number | null
  }
}

// ─── Draft artefacts (recommend → draft → handoff) ────────────────────────

export type DraftType =
  | 'coach_enquiry'
  | 'hotel_enquiry'
  | 'meal_stop'
  | 'itinerary'
  | 'social_post'

/** A generated draft the human reviews + edits before (simulated) send.
 *  In demo these are canned; on a live portal `body` comes from a real
 *  Anthropic call. `to` is the resolved supplier email (or a placeholder
 *  in demo). */
export interface TripDraft {
  type: DraftType
  subject: string
  body: string
  to?: string | null
  /** Supplier this draft would be sent to, for the handoff confirmation. */
  supplierName?: string | null
  /** True when content is canned/placeholder (demo) rather than AI-live. */
  isCanned: boolean
}

/** Result of a (simulated or real) send. In demo, `simulated` is true and
 *  no Resend call fires. */
export interface DraftSendResult {
  simulated: boolean
  message: string
  to?: string | null
}

export type DataMode = 'demo' | 'live'
