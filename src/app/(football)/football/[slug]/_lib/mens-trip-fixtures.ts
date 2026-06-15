// src/app/(football)/football/[slug]/_lib/mens-trip-fixtures.ts
//
// DEMO fixtures for the Men's Pro Travel & Logistics module — Oakridge FC
// (EFL Championship). Portal-specific demo seed (mirrors the Women's
// womens-trip-fixtures.ts). Per the Demo AI content rule: drive times are
// CANNED, drafts are PRE-WRITTEN, "send" is simulated. Opponents, suppliers
// and contacts are all fictional (Meridian/Apex/Crown universe-safe).

import type {
  Trip, TripSupplier, TripDraft, DraftType,
  AwayStatusRow, ResearchResults, SeasonStat,
} from '@/lib/sports/travel/trip-types'

export const OAKRIDGE_MEN_CLUB_ID = 'demo-oakridge-men'

// ─── Suppliers ────────────────────────────────────────────────────────────
export const OAKRIDGE_MEN_SUPPLIERS: TripSupplier[] = [
  {
    id: 'sup-coachline', clubId: OAKRIDGE_MEN_CLUB_ID, name: 'Coachline Travel',
    supplierType: 'coach', contactName: 'Dale Hutchins', contactEmail: 'bookings@coachline-travel.example',
    contactPhone: '01535 0100 220', region: 'North West',
    notes: '53-seat executive coach with WiFi, galley and hold space for kit. Contracted 2024–27.',
    ratePerMile: null, ratePerRoomNight: null, ratePerHead: null, isActive: true,
  },
  {
    id: 'sup-midland-minibus', clubId: OAKRIDGE_MEN_CLUB_ID, name: 'Midland Minibus Hire',
    supplierType: 'minibus', contactName: 'Priya Nandra', contactEmail: 'hire@midland-minibus.example',
    contactPhone: '0121 0100 778', region: 'Midlands',
    notes: '17-seat minibuses, self-drive or with driver. Good for staff / U21 splits.',
    ratePerMile: null, ratePerRoomNight: null, ratePerHead: null, isActive: true,
  },
  {
    id: 'sup-northgate-hotel', clubId: OAKRIDGE_MEN_CLUB_ID, name: 'Northgate Park Hotel',
    supplierType: 'hotel', contactName: 'Events Desk', contactEmail: 'groups@northgatepark.example',
    contactPhone: '0191 0100 455', region: 'North East',
    notes: '4★ · 26 twin rooms · meeting suite. Preferred rate for north away days.',
    ratePerMile: null, ratePerRoomNight: null, ratePerHead: null, isActive: true,
  },
  {
    id: 'sup-fuel-catering', clubId: OAKRIDGE_MEN_CLUB_ID, name: 'Fuel Performance Catering',
    supplierType: 'catering', contactName: 'Manager', contactEmail: 'orders@fuelperformance.example',
    contactPhone: '01539 0100 901', region: 'National',
    notes: 'Sports-nutrition menus with a dietary-list workflow. Pre-match or return food stops.',
    ratePerMile: null, ratePerRoomNight: null, ratePerHead: null, isActive: true,
  },
]

// ─── Trips ────────────────────────────────────────────────────────────────
const SQUAD = 20
const STAFF = 12

export const OAKRIDGE_MEN_TRIPS: Trip[] = [
  // 1) Clear DAY TRIP — short hop, afternoon kick-off.
  {
    id: 'trip-eastcliff-away', clubId: OAKRIDGE_MEN_CLUB_ID, title: 'Eastcliff Town (A)',
    opponent: 'Eastcliff Town', competition: 'EFL Championship', venue: 'Eastcliff Stadium',
    kickoffAt: '2026-04-05T14:00:00.000Z', matchDurationMinutes: 115,
    oneWayDriveMinutes: 72, oneWayDistanceMiles: 64,
    squadHeadcount: SQUAD, staffHeadcount: STAFF, isOvernight: false, nightsCount: 0,
    coachSupplierId: 'sup-coachline', hotelSupplierId: null, cateringSupplierId: null,
    recommendation: 'day_trip', status: 'confirmed', notes: 'Short hop — standard day trip, coach booked.',
  },
  // 2) Clear OVERNIGHT — long northern away, late kick-off.
  {
    id: 'trip-riverton-away', clubId: OAKRIDGE_MEN_CLUB_ID, title: 'Riverton Albion (A)',
    opponent: 'Riverton Albion', competition: 'EFL Championship', venue: 'Riverton Park, Carlisle',
    kickoffAt: '2026-05-10T17:30:00.000Z', matchDurationMinutes: 115,
    oneWayDriveMinutes: 252, oneWayDistanceMiles: 210,
    squadHeadcount: SQUAD, staffHeadcount: STAFF, isOvernight: true, nightsCount: 1,
    coachSupplierId: 'sup-coachline', hotelSupplierId: 'sup-northgate-hotel', cateringSupplierId: null,
    recommendation: 'overnight', status: 'planning', notes: 'Long trip north — overnight under review vs same-day saving.',
  },
  // 3) BORDERLINE — short drive but late evening kick-off.
  {
    id: 'trip-barford-away', clubId: OAKRIDGE_MEN_CLUB_ID, title: 'Barford Town (A)',
    opponent: 'Barford Town', competition: 'EFL Cup — R3', venue: 'Barford Road',
    kickoffAt: '2026-04-18T19:45:00.000Z', matchDurationMinutes: 115,
    oneWayDriveMinutes: 95, oneWayDistanceMiles: 88,
    squadHeadcount: SQUAD, staffHeadcount: STAFF, isOvernight: false, nightsCount: 0,
    coachSupplierId: 'sup-coachline', hotelSupplierId: null, cateringSupplierId: 'sup-fuel-catering',
    recommendation: 'none', status: 'planning', notes: 'Evening cup tie — late finish; weighing overnight vs food-stop return.',
  },
]

// ─── Canned drafts (pre-written; no live Anthropic) ───────────────────────
function coachEnquiryBody(trip: Trip): string {
  const date = new Date(trip.kickoffAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return [
    `Hi Coachline Travel team,`,
    ``,
    `We'd like to enquire about coach hire for an Oakridge FC away fixture:`,
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
    `Oakridge FC — Club Operations`,
  ].join('\n')
}

export function getCannedDraft(trip: Trip, type: DraftType, supplierName?: string | null): TripDraft {
  const dateShort = new Date(trip.kickoffAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  switch (type) {
    case 'coach_enquiry':
      return { type, subject: `Coach hire enquiry — Oakridge FC, ${trip.title}, ${dateShort}`, body: coachEnquiryBody(trip), to: 'bookings@coachline-travel.example', supplierName: supplierName ?? 'Coachline Travel', isCanned: true }
    case 'hotel_enquiry':
      return {
        type, subject: `Group accommodation enquiry — Oakridge FC, ${dateShort}`,
        body: `Hi Northgate Park Hotel,\n\nWe'd like to enquire about group accommodation for an ` +
          `Oakridge FC overnight away trip on ${dateShort}. We'd need approx. ` +
          `${Math.ceil((trip.squadHeadcount + trip.staffHeadcount) / 2)} twin rooms for ` +
          `${trip.nightsCount || 1} night, with an early breakfast and secure coach parking.\n\n` +
          `Could you confirm availability and a group rate?\n\nMany thanks,\nOakridge FC — Club Operations`,
        to: 'groups@northgatepark.example', supplierName: supplierName ?? 'Northgate Park Hotel', isCanned: true,
      }
    case 'meal_stop':
      return {
        type, subject: `Squad meal stop — ${trip.title}, ${dateShort}`,
        body: `Pre-order for a squad food stop on the return leg: ${trip.squadHeadcount + trip.staffHeadcount} hot meals, ` +
          `arriving approx. 2 hours after full-time. Sports-nutrition post-match menu (pasta/chicken option + veggie option).`,
        to: 'orders@fuelperformance.example', supplierName: supplierName ?? 'Fuel Performance Catering', isCanned: true,
      }
    case 'itinerary':
      return {
        type, subject: `Matchday itinerary — ${trip.title}`,
        body: `MATCHDAY ITINERARY — ${trip.title} (${trip.competition})\n` +
          `Venue: ${trip.venue}\nKO: ${new Date(trip.kickoffAt).toLocaleString('en-GB')}\n\n` +
          `• Depart Oakridge: TBC (allow ~${trip.oneWayDriveMinutes ? (trip.oneWayDriveMinutes / 60).toFixed(1) : '—'}h travel)\n` +
          `• Arrival / pre-match meal\n• Warm-up\n• Kick-off\n• Full-time / cool-down\n` +
          (trip.isOvernight ? `• Check in to hotel / evening meal\n` : `• Depart for home / food stop\n`),
        to: null, supplierName: null, isCanned: true,
      }
    case 'social_post':
      return {
        type, subject: `Social post — ${trip.title}`,
        body: `🔵 MATCHDAY 🔵\nWe're on the road! Oakridge head to ${trip.opponent} ` +
          `for ${trip.competition}. KO ${new Date(trip.kickoffAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.\n` +
          `Come on you Oaks! #OakridgeFC #UpTheOaks`,
        to: null, supplierName: null, isCanned: true,
      }
    default:
      return { type, subject: `Draft — ${trip.title}`, body: 'Canned demo draft.', to: null, supplierName: null, isCanned: true }
  }
}

// ─── Away-fixture status tracker (the "what's booked" board) ──────────────
export const OAKRIDGE_MEN_AWAY_STATUS: AwayStatusRow[] = [
  { id: 'aw-eastcliff', date: 'Sat 5 Apr',  opponent: 'Eastcliff Town',  venue: 'Eastcliff Stadium',      distanceMiles: 64,  coach: 'done',    hotel: 'na',      meals: 'done',    overall: 'complete',    tripId: 'trip-eastcliff-away' },
  { id: 'aw-barford',   date: 'Sat 18 Apr', opponent: 'Barford Town',    venue: 'Barford Road',           distanceMiles: 88,  coach: 'done',    hotel: 'partial', meals: 'partial', overall: 'in_progress', tripId: 'trip-barford-away' },
  { id: 'aw-kingsport', date: 'Sat 26 Apr', opponent: 'Kingsport FC',    venue: 'Kingsport Arena',        distanceMiles: 168, coach: 'partial', hotel: 'none',    meals: 'none',    overall: 'not_started', tripId: null },
  { id: 'aw-riverton',  date: 'Sun 10 May', opponent: 'Riverton Albion', venue: 'Riverton Park, Carlisle', distanceMiles: 210, coach: 'partial', hotel: 'partial', meals: 'none',    overall: 'in_progress', tripId: 'trip-riverton-away' },
  { id: 'aw-northgate', date: 'Sat 24 May', opponent: 'Northgate City',  venue: 'Northgate Stadium',      distanceMiles: 92,  coach: 'done',    hotel: 'na',      meals: 'done',    overall: 'complete',    tripId: null },
]

// ─── Canned Travel Researcher results (NO live search/AI in demo) ─────────
export const OAKRIDGE_MEN_RESEARCH: ResearchResults = {
  coaches: [
    { id: 'cq-coachline', operator: 'Coachline Travel',     vehicle: '53-seat executive coach', seats: 53, priceReturn: 1180, etaNote: 'Pickup 09:30 · home ~late evening', score: 92, badge: 'Best value', savedSupplierId: 'sup-coachline' },
    { id: 'cq-northgate', operator: 'Northgate Travel',      vehicle: '49-seat coach',           seats: 49, priceReturn: 980,  etaNote: 'Pickup 09:45 · driver hours OK',   score: 88, badge: 'Cheapest',   savedSupplierId: null },
    { id: 'cq-citywide',  operator: 'Citywide Coaches',      vehicle: '57-seat exec + WiFi/WC',  seats: 57, priceReturn: 1320, etaNote: 'Pickup 09:15 · onboard catering', score: 84, badge: 'Best rated', savedSupplierId: null },
    { id: 'cq-midland',   operator: 'Midland Minibus Hire',  vehicle: '2 × 16-seat minibus',     seats: 32, priceReturn: 860,  etaNote: 'Self-drive or with driver',         score: 78, badge: null,         savedSupplierId: 'sup-midland-minibus' },
  ],
  hotels: [
    { id: 'hq-northgate', name: 'Northgate Park Hotel',   stars: 4, area: 'Carlisle',    distanceToVenue: '6 min from ground',  pricePerNight: 78, totalPrice: 1248, rating: 8.5, amenities: ['Twin rooms','Breakfast','Coach parking','Meeting suite'], score: 91, badge: 'Best value', savedSupplierId: 'sup-northgate-hotel' },
    { id: 'hq-premier',   name: 'Riverside Premier Inn',  stars: 3, area: 'City centre',  distanceToVenue: '9 min from ground',  pricePerNight: 69, totalPrice: 1104, rating: 8.2, amenities: ['Breakfast','WiFi','Parking'],            score: 86, badge: 'Cheapest',   savedSupplierId: null },
    { id: 'hq-quayside',  name: 'The Riverside Hotel',    stars: 4, area: 'Riverside',    distanceToVenue: '4 min from ground',  pricePerNight: 98, totalPrice: 1568, rating: 8.7, amenities: ['Restaurant','Gym','Coach parking'],      score: 83, badge: 'Best rated', savedSupplierId: null },
    { id: 'hq-station',   name: 'Station Lodge B&B',      stars: 0, area: 'City centre',  distanceToVenue: '12 min from ground', pricePerNight: 60, totalPrice: 960,  rating: 8.0, amenities: ['Breakfast','Parking'],                   score: 78, badge: null,         savedSupplierId: null },
  ],
  meals: [
    { id: 'mq-fuel',    name: 'Fuel Performance Catering',     kind: 'Food stop (return)',  perHead: 9,  total: 288, note: 'Pre-order sports-nutrition meals ~2h after FT', score: 89, badge: 'Best value', savedSupplierId: 'sup-fuel-catering' },
    { id: 'mq-venue',   name: 'Riverton Park — match caterer', kind: 'Pre-match @ venue',   perHead: 13, total: 416, note: 'Pasta/chicken + veggie, served 3h before KO',  score: 85, badge: null,         savedSupplierId: null },
    { id: 'mq-hotel',   name: 'Northgate Park — team dinner',  kind: 'Hotel dinner',        perHead: 15, total: 480, note: 'Evening meal, overnight stays only',           score: 82, badge: null,         savedSupplierId: null },
    { id: 'mq-halfway', name: 'The Halfway Diner',             kind: 'Food stop (return)',  perHead: 8,  total: 256, note: 'Booth seating, quick turnaround',             score: 80, badge: 'Cheapest',   savedSupplierId: null },
  ],
}

export const OAKRIDGE_MEN_SEASON_STATS: SeasonStat[] = [
  { label: 'Away trips',        value: '14',     sub: 'this season' },
  { label: 'Overnight stays',   value: '5',      sub: '7 nights total' },
  { label: 'Est. travel spend', value: '£42.6k', sub: 'coach · hotel · meals' },
]
