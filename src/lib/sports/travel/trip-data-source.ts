// src/lib/sports/travel/trip-data-source.ts
//
// Travel & Logistics data adapter — the demo/live mode switch.
//
// This is the single seam between the UI and where trip data comes from.
// Mirrors the "demo content vs live source" split the rest of the sports
// portal uses (slug-gated demo data), but packages it as a proper adapter
// with a `mode` so a future signed LIVE client fires real Supabase / Maps /
// Anthropic / Resend calls with NO UI rework.
//
//   mode: 'demo'  → canned fixtures, in-memory writes, canned drafts,
//                   simulated sends. NO external API calls. This is the ONLY
//                   path exercised today (womens-demo is a public demo).
//
//   mode: 'live'  → Supabase reads/writes against sports_trips /
//                   sports_trip_suppliers (RLS-enforced), real Maps drive
//                   lookups, real Anthropic drafts, real Resend sends.
//                   SCAFFOLDED but NOT exercised this session — every live
//                   method is implemented enough to wire, with the external
//                   calls marked TODO so the contract is locked.
//
// Portal-agnostic: the Women's portal passes its Oakridge fixtures in; the
// Club/NL ports will pass their own. The adapter itself has no womens code.

import type {
  Trip,
  TripSupplier,
  NewTripInput,
  TripDraft,
  DraftType,
  DraftSendResult,
  TripCostComparison,
  DataMode,
} from './trip-types'
import { compareTripCosts, recommendFor } from './overnight-engine'

// Demo seed is injected so this shared file never imports a portal. The
// Women's portal supplies these from womens-trip-fixtures.ts.
export interface TripDemoSeed {
  trips: Trip[]
  suppliers: TripSupplier[]
  getCannedDraft: (trip: Trip, type: DraftType, supplierName?: string | null) => TripDraft
}

export interface TripDataSource {
  mode: DataMode
  listTrips(): Promise<Trip[]>
  listSuppliers(): Promise<TripSupplier[]>
  createTrip(input: NewTripInput): Promise<Trip>
  /** Pure engine call — same in demo and live. */
  compare(trip: Trip): TripCostComparison
  generateDraft(trip: Trip, type: DraftType): Promise<TripDraft>
  sendDraft(trip: Trip, draft: TripDraft): Promise<DraftSendResult>
}

// ─── Shared helpers ───────────────────────────────────────────────────────

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function hydrateNewTrip(clubId: string, input: NewTripInput): Trip {
  const base: Trip = {
    id: uid('trip'),
    clubId,
    title: input.title,
    opponent: input.opponent ?? null,
    competition: input.competition ?? null,
    venue: input.venue ?? null,
    kickoffAt: input.kickoffAt,
    matchDurationMinutes: input.matchDurationMinutes ?? 110,
    oneWayDriveMinutes: input.oneWayDriveMinutes ?? null,
    oneWayDistanceMiles: input.oneWayDistanceMiles ?? null,
    squadHeadcount: input.squadHeadcount ?? 0,
    staffHeadcount: input.staffHeadcount ?? 0,
    isOvernight: input.isOvernight ?? false,
    nightsCount: input.nightsCount ?? (input.isOvernight ? 1 : 0),
    coachSupplierId: input.coachSupplierId ?? null,
    hotelSupplierId: input.hotelSupplierId ?? null,
    cateringSupplierId: input.cateringSupplierId ?? null,
    recommendation: 'none',
    status: 'planning',
    notes: input.notes ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  // Snapshot the engine recommendation at create time.
  base.recommendation = recommendFor(base)
  return base
}

// ─── DEMO adapter ─────────────────────────────────────────────────────────
// In-memory only. Created trips live for the session (a refresh resets to
// seed) — exactly the demo behaviour we want; no DB writes on demo clicks.

function createDemoSource(clubId: string, seed: TripDemoSeed): TripDataSource {
  // Clone so demo edits don't mutate the imported module constants.
  const trips: Trip[] = seed.trips.map((t) => ({ ...t }))
  const suppliers: TripSupplier[] = seed.suppliers.map((s) => ({ ...s }))

  return {
    mode: 'demo',

    async listTrips() {
      // Sorted by kickoff, soonest first — matches the live query order.
      return [...trips].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
    },

    async listSuppliers() {
      return [...suppliers]
    },

    async createTrip(input) {
      const trip = hydrateNewTrip(clubId, input)
      trips.push(trip)
      return trip
    },

    compare(trip) {
      return compareTripCosts(trip)
    },

    async generateDraft(trip, type) {
      // DEMO: canned, pre-written content. NO Anthropic call.
      const supplierName = resolveSupplierName(trip, type, suppliers)
      return seed.getCannedDraft(trip, type, supplierName)
    },

    async sendDraft(trip, draft) {
      // DEMO: simulated. NO Resend email is sent.
      const who = draft.supplierName || draft.to || 'the supplier'
      return {
        simulated: true,
        message: `Enquiry would be sent to ${who} (demo — no email sent).`,
        to: draft.to ?? null,
      }
    },
  }
}

function resolveSupplierName(
  trip: Trip,
  type: DraftType,
  suppliers: TripSupplier[],
): string | null {
  const idByType: Partial<Record<DraftType, string | null | undefined>> = {
    coach_enquiry: trip.coachSupplierId,
    hotel_enquiry: trip.hotelSupplierId,
    meal_stop: trip.cateringSupplierId,
  }
  const id = idByType[type]
  if (!id) return null
  return suppliers.find((s) => s.id === id)?.name ?? null
}

// ─── LIVE adapter (SCAFFOLD — not exercised today) ────────────────────────
// Implemented enough to lock the contract. External calls (Maps, Anthropic,
// Resend) are marked TODO. Supabase reads/writes use the anon client so RLS
// (migration 106) is enforced for the signed-in user.

function createLiveSource(clubId: string): TripDataSource {
  // Lazy client init so demo never constructs a Supabase client.
  async function sb() {
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return {
    mode: 'live',

    async listTrips() {
      const client = await sb()
      const { data, error } = await client
        .from('sports_trips')
        .select('*')
        .eq('club_id', clubId)
        .order('kickoff_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map(rowToTrip)
    },

    async listSuppliers() {
      const client = await sb()
      const { data, error } = await client
        .from('sports_trip_suppliers')
        .select('*')
        .eq('club_id', clubId)
        .eq('is_active', true)
      if (error) throw error
      return (data ?? []).map(rowToSupplier)
    },

    async createTrip(input) {
      // TODO(live): if oneWayDriveMinutes/Distance are absent, call the Maps
      // drive-time lookup here before insert. Demo supplies them canned.
      const client = await sb()
      const draft = hydrateNewTrip(clubId, input)
      const { data, error } = await client
        .from('sports_trips')
        .insert(tripToRow(draft))
        .select('*')
        .single()
      if (error) throw error
      return rowToTrip(data)
    },

    compare(trip) {
      return compareTripCosts(trip)
    },

    async generateDraft(trip, type) {
      // TODO(live): call /api/ai/womens (or the shared sports AI route) with
      // the trip context to generate this draft via Anthropic. Until that's
      // wired, fall back to a minimal non-canned shell so the contract holds.
      return {
        type,
        subject: `Draft (${type}) — ${trip.title}`,
        body: '[live AI draft not yet wired — see TODO in trip-data-source.ts]',
        to: null,
        supplierName: null,
        isCanned: false,
      }
    },

    async sendDraft(trip, draft) {
      // TODO(live): send via Resend (RESEND_API_KEY) to draft.to and log the
      // enquiry against the trip. Lumio never books directly — this only
      // sends the enquiry the human approved.
      return {
        simulated: false,
        message: `[live send not yet wired — see TODO in trip-data-source.ts]`,
        to: draft.to ?? null,
      }
    },
  }
}

// ─── Row mappers (snake_case DB ⇄ camelCase domain) ───────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToTrip(r: any): Trip {
  return {
    id: r.id,
    clubId: r.club_id,
    title: r.title,
    opponent: r.opponent,
    competition: r.competition,
    venue: r.venue,
    kickoffAt: r.kickoff_at,
    matchDurationMinutes: r.match_duration_minutes,
    oneWayDriveMinutes: r.one_way_drive_minutes,
    oneWayDistanceMiles: r.one_way_distance_miles,
    squadHeadcount: r.squad_headcount,
    staffHeadcount: r.staff_headcount,
    isOvernight: r.is_overnight,
    nightsCount: r.nights_count,
    coachSupplierId: r.coach_supplier_id,
    hotelSupplierId: r.hotel_supplier_id,
    cateringSupplierId: r.catering_supplier_id,
    recommendation: r.recommendation,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function tripToRow(t: Trip): Record<string, unknown> {
  return {
    club_id: t.clubId,
    title: t.title,
    opponent: t.opponent,
    competition: t.competition,
    venue: t.venue,
    kickoff_at: t.kickoffAt,
    match_duration_minutes: t.matchDurationMinutes,
    one_way_drive_minutes: t.oneWayDriveMinutes,
    one_way_distance_miles: t.oneWayDistanceMiles,
    squad_headcount: t.squadHeadcount,
    staff_headcount: t.staffHeadcount,
    is_overnight: t.isOvernight,
    nights_count: t.nightsCount,
    coach_supplier_id: t.coachSupplierId,
    hotel_supplier_id: t.hotelSupplierId,
    catering_supplier_id: t.cateringSupplierId,
    recommendation: t.recommendation,
    status: t.status,
    notes: t.notes,
  }
}

function rowToSupplier(r: any): TripSupplier {
  return {
    id: r.id,
    clubId: r.club_id,
    name: r.name,
    supplierType: r.supplier_type,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    region: r.region,
    notes: r.notes,
    ratePerMile: r.rate_per_mile,
    ratePerRoomNight: r.rate_per_room_night,
    ratePerHead: r.rate_per_head,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Factory ──────────────────────────────────────────────────────────────
/** Build a data source for the given mode. `seed` is required for demo and
 *  ignored for live. */
export function getTripDataSource(
  mode: DataMode,
  clubId: string,
  seed?: TripDemoSeed,
): TripDataSource {
  if (mode === 'demo') {
    if (!seed) throw new Error('getTripDataSource(demo) requires a demo seed')
    return createDemoSource(clubId, seed)
  }
  return createLiveSource(clubId)
}
