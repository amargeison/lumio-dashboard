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

import type {
  Trip, TripSupplier, TripDraft, DraftType,
  AwayStatusRow, ResearchResults, SeasonStat,
} from '@/lib/sports/travel/trip-types'

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


// ─── Away-fixture status tracker (the "what's booked" board) ──────────────
// Ported from the Club Operations travel tab, themed for Oakridge. Opponents
// align with the cost-compare trips above (tripId links across), plus two
// further fixtures so the board reads like a real season.
export const OAKRIDGE_AWAY_STATUS: AwayStatusRow[] = [
  { id: 'aw-hartwell', date: 'Sun 17 May', opponent: 'Hartwell Women',          venue: 'Hartwell Community Stadium', distanceMiles: 31,  coach: 'done',    hotel: 'na',   meals: 'done',    overall: 'complete',    tripId: 'trip-hartwell-away' },
  { id: 'aw-tyneside', date: 'Sun 24 May', opponent: 'Tyneside Athletic Women', venue: 'Riverbank Arena, Newcastle', distanceMiles: 214, coach: 'done',    hotel: 'partial', meals: 'partial', overall: 'in_progress', tripId: 'trip-tyneside-away' },
  { id: 'aw-westport', date: 'Fri 29 May', opponent: 'Westport City Women',     venue: 'Harbour Park, Westport',     distanceMiles: 158, coach: 'done',    hotel: 'na',   meals: 'partial', overall: 'in_progress', tripId: 'trip-westport-away' },
  { id: 'aw-marsh',    date: 'Sun 07 Jun', opponent: 'Marsh Rovers Women',      venue: 'Marsh Lane',                 distanceMiles: 92,  coach: 'done',    hotel: 'na',   meals: 'done',    overall: 'complete',    tripId: null },
  { id: 'aw-calder',   date: 'Sun 21 Jun', opponent: 'Calderport Women',        venue: 'Calder Park',                distanceMiles: 176, coach: 'partial', hotel: 'none', meals: 'none',    overall: 'not_started', tripId: null },
]

// ─── Canned Travel Researcher results (NO live search/AI in demo) ─────────
// A realistic ranked set across coach / hotel / meals. savedSupplierId !=
// null = maps to one of the club's saved suppliers; null = AI-DISCOVERED
// (the key value-prop: a club new to a division with no hotels/caterers
// saved still gets the best, cheapest options found FOR them).
export const OAKRIDGE_RESEARCH: ResearchResults = {
  coaches: [
    { id: 'cq-pennine',  operator: 'Pennine Coachways',  vehicle: '53-seat executive coach', seats: 53, priceReturn: 1027, etaNote: 'Pickup 09:30 · home ~late evening', score: 92, badge: 'Best value', savedSupplierId: 'sup-pennine-coach' },
    { id: 'cq-northgate',operator: 'Northgate Travel',   vehicle: '49-seat coach',           seats: 49, priceReturn: 880,  etaNote: 'Pickup 09:45 · driver hours OK',   score: 88, badge: 'Cheapest',   savedSupplierId: null },
    { id: 'cq-citywide', operator: 'Citywide Coaches',   vehicle: '57-seat exec + WiFi/WC',  seats: 57, priceReturn: 1180, etaNote: 'Pickup 09:15 · onboard catering', score: 84, badge: 'Best rated', savedSupplierId: null },
    { id: 'cq-citylink', operator: 'CityLink Minibus Hire', vehicle: '2 × 16-seat minibus',  seats: 32, priceReturn: 760,  etaNote: 'Self-drive or with driver',         score: 78, badge: null,         savedSupplierId: 'sup-citylink-minibus' },
  ],
  hotels: [
    { id: 'hq-parkside', name: 'Parkside Lodge Hotel',  stars: 3, area: 'Newcastle',  distanceToVenue: '6 min from ground',  pricePerNight: 75, totalPrice: 900,  rating: 8.4, amenities: ['Twin rooms','Breakfast','Coach parking'], score: 90, badge: 'Best value', savedSupplierId: 'sup-parkside-hotel' },
    { id: 'hq-premier',  name: 'Riverside Premier Inn', stars: 3, area: 'Quayside',    distanceToVenue: '9 min from ground',  pricePerNight: 69, totalPrice: 828,  rating: 8.2, amenities: ['Breakfast','WiFi','Parking'],           score: 86, badge: 'Cheapest',   savedSupplierId: null },
    { id: 'hq-quayside', name: 'The Quayside Hotel',    stars: 4, area: 'Quayside',    distanceToVenue: '4 min from ground',  pricePerNight: 95, totalPrice: 1140, rating: 8.7, amenities: ['Restaurant','Gym','Coach parking'],     score: 83, badge: 'Best rated', savedSupplierId: null },
    { id: 'hq-station',  name: 'Station Lodge B&B',     stars: 0, area: 'City centre', distanceToVenue: '12 min from ground', pricePerNight: 58, totalPrice: 696,  rating: 8.0, amenities: ['Breakfast','Parking'],                  score: 78, badge: null,         savedSupplierId: null },
  ],
  meals: [
    { id: 'mq-roadside', name: 'Roadside Kitchen (M6 J38)',     kind: 'Food stop (return)',  perHead: 8,  total: 192, note: 'Pre-order hot meals ~2h after full-time',     score: 88, badge: 'Best value', savedSupplierId: 'sup-roadside-kitchen' },
    { id: 'mq-venue',    name: 'Riverbank Arena — match caterer', kind: 'Pre-match @ venue', perHead: 12, total: 288, note: 'Pasta/chicken + veggie, served 3h before KO',  score: 85, badge: null,         savedSupplierId: null },
    { id: 'mq-hotel',    name: 'Parkside Lodge — team dinner',   kind: 'Hotel dinner',        perHead: 14, total: 336, note: 'Evening meal, overnight stays only',           score: 82, badge: null,         savedSupplierId: null },
    { id: 'mq-halfway',  name: 'The Halfway Diner',              kind: 'Food stop (return)',  perHead: 7,  total: 168, note: 'Booth seating, quick turnaround',             score: 80, badge: 'Cheapest',   savedSupplierId: null },
  ],
}

export const OAKRIDGE_SEASON_STATS: SeasonStat[] = [
  { label: 'Away trips',     value: '12',     sub: 'this season' },
  { label: 'Overnight stays', value: '3',     sub: '4 nights total' },
  { label: 'Est. travel spend', value: '£18.4k', sub: 'coach · hotel · meals' },
]
