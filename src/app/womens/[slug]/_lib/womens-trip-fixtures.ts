// src/app/womens/[slug]/_lib/womens-trip-fixtures.ts
//
// DEMO fixtures for the Women's Travel & Logistics module — Oakridge Women
// FC (WSL 2). This is the portal-specific demo seed; it is the ONLY place
// womens-demo sample data lives. Per the Demo AI content rule:
//
//   - Drive times / distances here are CANNED fixed values (no live Maps).
//   - Drafts here are PRE-WRITTEN canned content (no live Anthropic).
//   - "Send" is simulated by the data layer (no live Resend).
//
// NEVER use real founding-member names here — opponents, suppliers and
// contacts are all fictional. The three trips are chosen to exercise every
// branch of the decision engine: a clear day trip, a clear overnight, and a
// borderline late-but-short-drive call.
//
// When this module ports to Club/Woking and Non-League, each portal gets
// its OWN equivalent fixtures file (copy-and-retheme); this file is not
// shared.

import type { Trip, TripSupplier, TripDraft, DraftType } from '@/lib/sports/travel/trip-types'

export const OAKRIDGE_CLUB_ID = 'demo-oakridge-women'

// ─── Suppliers ────────────────────────────────────────────────────────────
// Fictional vendors. rate_* left null on purpose — the comparison reads the
// central placeholder rates (trip-rates.ts), demonstrating that the module
// works with zero per-supplier rate data entered.
export const OAKRIDGE_SUPPLIERS: TripSupplier[] = [
  {
    id: 'sup-pennine-coach',
    clubId: OAKRIDGE_CLUB_ID,
    name: 'Pennine Coachways',
    supplierType: 'coach',
    contactName: 'Dale Hutchins',
    contactEmail: 'bookings@pennine-coachways.example',
    contactPhone: '01535 0100 220',
    region: 'North West',
    notes: '53-seat exec coach with hold space for kit. Used last season.',
    ratePerMile: null,
    ratePerRoomNight: null,
    ratePerHead: null,
    isActive: true,
  },
  {
    id: 'sup-citylink-minibus',
    clubId: OAKRIDGE_CLUB_ID,
    name: 'CityLink Minibus Hire',
    supplierType: 'minibus',
    contactName: 'Priya Nandra',
    contactEmail: 'hire@citylink-minibus.example',
    contactPhone: '0161 0100 778',
    region: 'North West',
    notes: '17-seat minibuses, self-drive or with driver. Good for staff/U21 splits.',
    ratePerMile: null,
    ratePerRoomNight: null,
    ratePerHead: null,
    isActive: true,
  },
  {
    id: 'sup-parkside-hotel',
    clubId: OAKRIDGE_CLUB_ID,
    name: 'Parkside Lodge Hotel',
    supplierType: 'hotel',
    contactName: 'Events Desk',
    contactEmail: 'groups@parksidelodge.example',
    contactPhone: '0191 0100 455',
    region: 'North East',
    notes: 'Group rates for sports teams, twin rooms, early breakfast available.',
    ratePerMile: null,
    ratePerRoomNight: null,
    ratePerHead: null,
    isActive: true,
  },
  {
    id: 'sup-roadside-kitchen',
    clubId: OAKRIDGE_CLUB_ID,
    name: 'Roadside Kitchen (M6 J38)',
    supplierType: 'catering',
    contactName: 'Manager',
    contactEmail: 'groups@roadsidekitchen.example',
    contactPhone: '01539 0100 901',
    region: 'North West',
    notes: 'Pre-order hot meals for squad food stops on long returns.',
    ratePerMile: null,
    ratePerRoomNight: null,
    ratePerHead: null,
    isActive: true,
  },
]

// ─── Trips ────────────────────────────────────────────────────────────────
// kickoffAt uses 2026 dates consistent with the womens demo season. Canned
// drive minutes + distance are the engine inputs.
const SQUAD = 18
const STAFF = 6

export const OAKRIDGE_TRIPS: Trip[] = [
  // 1) Clear DAY TRIP — short hop, home well before midnight.
  {
    id: 'trip-hartwell-away',
    clubId: OAKRIDGE_CLUB_ID,
    title: 'Hartwell Women (A)',
    opponent: 'Hartwell Women',
    competition: 'WSL 2',
    venue: 'Hartwell Community Stadium',
    kickoffAt: '2026-05-17T14:00:00.000Z',
    matchDurationMinutes: 110,
    oneWayDriveMinutes: 48,          // CANNED — ~0.8h
    oneWayDistanceMiles: 31,         // CANNED
    squadHeadcount: SQUAD,
    staffHeadcount: STAFF,
    isOvernight: false,
    nightsCount: 0,
    coachSupplierId: 'sup-pennine-coach',
    hotelSupplierId: null,
    cateringSupplierId: null,
    recommendation: 'day_trip',
    status: 'confirmed',
    notes: 'Local derby — standard day trip, coach booked.',
  },

  // 2) Clear OVERNIGHT — long northern away, late Sunday kickoff, same-day
  //    return would land well after midnight.
  {
    id: 'trip-tyneside-away',
    clubId: OAKRIDGE_CLUB_ID,
    title: 'Tyneside Athletic Women (A)',
    opponent: 'Tyneside Athletic Women',
    competition: 'WSL 2',
    venue: 'Riverbank Arena, Newcastle',
    kickoffAt: '2026-05-24T17:30:00.000Z',   // evening TV pick — same-day return lands ~00:38
    matchDurationMinutes: 110,
    oneWayDriveMinutes: 258,         // CANNED — 4.3h, over the 3.5h threshold
    oneWayDistanceMiles: 214,        // CANNED
    squadHeadcount: SQUAD,
    staffHeadcount: STAFF,
    isOvernight: true,
    nightsCount: 1,
    coachSupplierId: 'sup-pennine-coach',
    hotelSupplierId: 'sup-parkside-hotel',
    cateringSupplierId: null,
    recommendation: 'overnight',
    status: 'planning',
    notes: 'Long trip north — overnight under review vs same-day saving.',
  },

  // 3) BORDERLINE — sub-threshold drive but a late evening kickoff means a
  //    same-day return still lands after midnight. No strong steer.
  {
    id: 'trip-westport-away',
    clubId: OAKRIDGE_CLUB_ID,
    title: 'Westport City Women (A)',
    opponent: 'Westport City Women',
    competition: 'FA Cup — R4',
    venue: 'Harbour Park, Westport',
    kickoffAt: '2026-05-29T19:45:00.000Z',
    matchDurationMinutes: 110,
    oneWayDriveMinutes: 182,         // CANNED — ~3.0h, under threshold
    oneWayDistanceMiles: 158,        // CANNED
    squadHeadcount: SQUAD,
    staffHeadcount: STAFF,
    isOvernight: false,
    nightsCount: 0,
    coachSupplierId: 'sup-pennine-coach',
    hotelSupplierId: null,
    cateringSupplierId: 'sup-roadside-kitchen',
    recommendation: 'none',
    status: 'planning',
    notes: 'Evening cup tie — late finish; weighing overnight vs food-stop return.',
  },
]

// ─── Canned drafts (pre-written; no live Anthropic) ───────────────────────
// Keyed by `${tripId}:${draftType}`. The coach_enquiry drafts are fully
// written (that's the wired end-to-end flow). Other types are canned stubs
// so every draft button returns SOMETHING in demo without an API call.

function coachEnquiryBody(trip: Trip): string {
  const date = new Date(trip.kickoffAt).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return [
    `Hi Pennine Coachways team,`,
    ``,
    `We'd like to enquire about coach hire for an Oakridge Women FC away fixture:`,
    ``,
    `  • Fixture:    ${trip.title} — ${trip.competition}`,
    `  • Date:       ${date}`,
    `  • Kick-off:   ${new Date(trip.kickoffAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    `  • Venue:      ${trip.venue}`,
    `  • Passengers: ${trip.squadHeadcount} squad + ${trip.staffHeadcount} staff (${trip.squadHeadcount + trip.staffHeadcount} total)`,
    `  • Journey:    approx. ${trip.oneWayDistanceMiles} miles each way (~${trip.oneWayDriveMinutes ? (trip.oneWayDriveMinutes / 60).toFixed(1) : '—'}h)`,
    `  • Kit hold:   yes, please — full match kit + medical bags`,
    ``,
    `Could you confirm availability and a quote for a return journey on the day?` +
      (trip.isOvernight ? ` This is an overnight trip, so we'd need the coach to stay with us — please include any overnight driver/parking costs.` : ''),
    ``,
    `Many thanks,`,
    `Oakridge Women FC — Club Operations`,
  ].join('\n')
}

export function getCannedDraft(trip: Trip, type: DraftType, supplierName?: string | null): TripDraft {
  const dateShort = new Date(trip.kickoffAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  switch (type) {
    case 'coach_enquiry':
      return {
        type,
        subject: `Coach hire enquiry — Oakridge Women FC, ${trip.title}, ${dateShort}`,
        body: coachEnquiryBody(trip),
        to: 'bookings@pennine-coachways.example',
        supplierName: supplierName ?? 'Pennine Coachways',
        isCanned: true,
      }
    case 'hotel_enquiry':
      return {
        type,
        subject: `Group accommodation enquiry — Oakridge Women FC, ${dateShort}`,
        body:
          `Hi Parkside Lodge Hotel,\n\nWe'd like to enquire about group accommodation for an ` +
          `Oakridge Women FC overnight away trip on ${dateShort}. We'd need approx. ` +
          `${Math.ceil((trip.squadHeadcount + trip.staffHeadcount) / 2)} twin rooms for ` +
          `${trip.nightsCount || 1} night, with an early breakfast and secure coach parking.\n\n` +
          `Could you confirm availability and a group rate?\n\nMany thanks,\nOakridge Women FC — Club Operations`,
        to: 'groups@parksidelodge.example',
        supplierName: supplierName ?? 'Parkside Lodge Hotel',
        isCanned: true,
      }
    case 'meal_stop':
      return {
        type,
        subject: `Squad meal stop — ${trip.title}, ${dateShort}`,
        body:
          `Pre-order for a squad food stop on the return leg: ${trip.squadHeadcount + trip.staffHeadcount} hot meals, ` +
          `arriving approx. 2 hours after full-time. Standard post-match menu (pasta/chicken option + veggie option).`,
        to: 'groups@roadsidekitchen.example',
        supplierName: supplierName ?? 'Roadside Kitchen (M6 J38)',
        isCanned: true,
      }
    case 'itinerary':
      return {
        type,
        subject: `Matchday itinerary — ${trip.title}`,
        body:
          `MATCHDAY ITINERARY — ${trip.title} (${trip.competition})\n` +
          `Venue: ${trip.venue}\nKO: ${new Date(trip.kickoffAt).toLocaleString('en-GB')}\n\n` +
          `• Depart Oakridge: TBC (allow ~${trip.oneWayDriveMinutes ? (trip.oneWayDriveMinutes / 60).toFixed(1) : '—'}h travel)\n` +
          `• Arrival / pre-match meal\n• Warm-up\n• Kick-off\n• Full-time / cool-down\n` +
          (trip.isOvernight ? `• Check in to hotel / evening meal\n` : `• Depart for home / food stop\n`),
        to: null,
        supplierName: null,
        isCanned: true,
      }
    case 'social_post':
      return {
        type,
        subject: `Social post — ${trip.title}`,
        body:
          `🟣 MATCHDAY 🟣\nWe're on the road! Oakridge Women head to ${trip.opponent} ` +
          `for ${trip.competition}. KO ${new Date(trip.kickoffAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.\n` +
          `Come on you Oaks! #OakridgeWomen #UpTheOaks`,
        to: null,
        supplierName: null,
        isCanned: true,
      }
    default:
      return {
        type,
        subject: `Draft — ${trip.title}`,
        body: 'Canned demo draft.',
        to: null,
        supplierName: null,
        isCanned: true,
      }
  }
}
