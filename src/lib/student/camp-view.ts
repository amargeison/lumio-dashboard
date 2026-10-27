// A family's camp card, worked out once for both places it is drawn: the
// website's CampCard (LiveStudentView) and the iPhone app (campCardForApp).
// Only what the coach actually filled in becomes a tab; see the notes below.

import { asStringList, daysUntil, type StudentCamp } from '@/lib/student/bundle'

export type TripLike = {
  intro?: string
  stay?: Record<string, string | undefined>
  venue?: Record<string, string | undefined>
  travel?: Record<string, string | undefined>
  practical?: Record<string, string | undefined>
  transport?: { name?: string; kind?: string; address?: string; phone?: string; url?: string; note?: string }[]
  eating?: { name?: string; kind?: string; address?: string; phone?: string; url?: string; note?: string }[]
  contacts?: { name?: string; role?: string; phone?: string; note?: string }[]
  bring?: string[]
  sections?: { title?: string; body?: string; items?: string[] }[]
}

/** A day of the camp, however the coach's itinerary happens to be shaped. */
export type CampDayRow = { label: string; date?: string; focus?: string; detail?: string }

export function campDays(v: unknown): CampDayRow[] {
  if (!Array.isArray(v)) return []
  return v.map((x, i) => {
    if (typeof x === 'string') return { label: `Day ${i + 1}`, focus: x }
    if (!x || typeof x !== 'object') return null
    const o = x as Record<string, unknown>
    const str = (k: string) => { const s = String(o[k] ?? '').trim(); return s || undefined }
    const label = str('day') || str('title') || `Day ${i + 1}`
    const focus = str('focus') || str('theme') || str('label') || str('name')
    const detail = [str('did'), str('detail'), str('description'), str('nextAction')].filter(Boolean).join(' ')
    if (!focus && !detail && !str('date')) return null
    return { label: /^\d+$/.test(label) ? `Day ${label}` : label, date: str('date'), focus, detail: detail || undefined }
  }).filter(Boolean) as CampDayRow[]
}

/** This player's own targets for the week, already filtered to them by the API. */
export function campTargets(v: unknown): { goals: string[]; measure?: string; stage?: string } {
  const row = Array.isArray(v) ? (v[0] as Record<string, unknown> | undefined) : undefined
  if (!row) return { goals: [] }
  return {
    goals: asStringList(row.goals),
    measure: String(row.measure ?? '').trim() || undefined,
    stage: String(row.stage ?? '').trim() || undefined,
  }
}

export const mapsUrl = (q?: string) => q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
export const telUrl = (p?: string) => p ? `tel:${p.replace(/[^\d+]/g, '')}` : null
export const webUrl = (u?: string) => !u ? null : /^https?:\/\//i.test(u) ? u : `https://${u}`

/** Fields → visible rows, dropping the empty ones, in the coach's own words. */
export const rowsOf = (o: Record<string, string | undefined> | undefined, map: [string, string][]) =>
  (map.map(([k, label]) => { const v = String(o?.[k] ?? '').trim(); return v ? { label, value: v } : null }).filter(Boolean) as { label: string; value: string }[])

/** Everything the camp card shows, from the camp row and its trip hub. */
export function campParts(camp: StudentCamp) {
  // camp.equipment is the COACH's kit list — 360 balls, ball baskets, a first
  // aid kit, the stringing machine. It is what the academy packs, not what a
  // family packs, and merging the two produced a "what to bring" telling a
  // parent to bring twelve ball baskets. The family's list is the trip hub's
  // own "What to bring" and nothing else.
  const rhythm = asStringList(camp.daily_rhythm)
  const brief = asStringList(camp.parent_brief)
  const itinerary = campDays(camp.itinerary)
  const objectives = asStringList(camp.objectives)
  const targets = campTargets(camp.player_targets)
  const trip = (camp.trip && typeof camp.trip === 'object' ? camp.trip : {}) as TripLike

  const stay = rowsOf(trip.stay, [['checkIn', 'Check-in'], ['rooms', 'Rooms'], ['meals', 'Meals'], ['wifi', 'Wi-Fi'], ['notes', 'Also']])
  const venue = rowsOf(trip.venue, [['courts', 'Courts'], ['facilities', 'Facilities'], ['notes', 'Also']])
  const travel = rowsOf(trip.travel, [['airport', 'Airport'], ['flights', 'Flights'], ['transfers', 'Transfers'], ['arrival', 'Getting there'], ['departure', 'Coming home'], ['notes', 'Also']])
  const practical = rowsOf(trip.practical, [['weather', 'Weather'], ['currency', 'Currency'], ['timeDifference', 'Time difference'], ['plugs', 'Plugs'], ['health', 'Health'], ['notes', 'Also']])
  const eating = (trip.eating || []).filter(p => String(p?.name || '').trim())
  const transport = (trip.transport || []).filter(p => String(p?.name || '').trim())
  const contacts = (trip.contacts || []).filter(c => String(c?.name || '').trim())
  const bring = asStringList(trip.bring)
  // "Shape of the week" is the same subject as the itinerary and the daily
  // rhythm: how the days run. As its own tab it split one answer across two
  // places and left the main tab reading like a bare timetable — so its copy is
  // folded into The week, where somebody looking for it actually is, and it
  // stops being a tab of its own.
  const allSections = (trip.sections || []).filter(s => String(s?.title || '').trim())
  const isShape = (t: unknown) => /shape of (the )?week|how the (week|days) (run|work)/i.test(String(t || ''))
  const shape = allSections.find(s => isShape(s.title)) || null
  const extras = allSections.filter(s => !isShape(s.title))
  const shapeBody = String(shape?.body || '').trim()
  const shapeItems = asStringList(shape?.items)

  // The rhythm lines and the shape paragraph are usually the SAME sentences —
  // the coach writes "mornings on court, lunch, back out at four" once and both
  // fields end up holding it. Printing both produced three boxes that repeated
  // the paragraph above them, cut mid-sentence. So a line only earns a box if it
  // reads like a timetable entry (it names a time or a part of the day) and is
  // not already sitting in the paragraph.
  const inBody = (x: string) => {
    const a = x.trim().toLowerCase().replace(/[.,;:]+$/, '')
    return a.length > 12 && shapeBody.toLowerCase().includes(a.slice(0, Math.min(40, a.length)))
  }
  const looksLikeTime = (x: string) =>
    /^\s*(\d{1,2}[:.]\d{2}|\d{1,2}\s*(am|pm)|morning|afternoon|evening|night|breakfast|lunch|dinner|day\s*\d)/i.test(x)
  const timetable = [...shapeItems, ...rhythm]
    .map(x => String(x).trim())
    .filter(Boolean)
    .filter(x => looksLikeTime(x) && !inBody(x))
    .filter((x, i, all) => all.findIndex(y => y.toLowerCase() === x.toLowerCase()) === i)
    .slice(0, 12)

  const goalsTab = targets.goals.length > 0 || !!camp.camp_goal || objectives.length > 0
  const weekTab = itinerary.length > 0 || rhythm.length > 0 || !!shapeBody || shapeItems.length > 0
  const stayTab = stay.length > 0 || venue.length > 0 || !!trip.stay?.name || !!trip.venue?.name || !!camp.room
  const travelTab = travel.length > 0 || !!camp.arrival
  const aboutTab = eating.length > 0 || transport.length > 0 || practical.length > 0
  const bringTab = bring.length > 0 || brief.length > 0
  const callTab = contacts.length > 0

  return { rhythm, brief, itinerary, objectives, targets, trip, stay, venue, travel, practical, eating, transport, contacts, bring, extras, shape, shapeBody, shapeItems, timetable, goalsTab, weekTab, stayTab, travelTab, aboutTab, bringTab, callTab }
}

// ─── The iPhone app ─────────────────────────────────────────────────────────
// The same card as plain blocks the app draws without knowing the camp's jsonb
// shapes — each tab a list of headed facts, lists and places.

export type CampBlock =
  | { kind: 'highlight'; label: string; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'timetable'; title: string; rows: { when: string; what: string }[] }
  | { kind: 'days'; title: string; days: { label: string; date?: string; focus?: string; detail?: string }[] }
  | { kind: 'list'; title: string; icon: string; style: 'number' | 'tick' | 'bullet'; items: string[]; note?: string; measure?: string }
  | { kind: 'facts'; title: string; icon: string; address?: string; rows: { label: string; value: string }[]; map?: string | null; web?: string | null }
  | { kind: 'places'; title: string; icon: string; places: { name: string; kind?: string; address?: string; phone?: string; note?: string; map?: string | null; web?: string | null }[] }
  | { kind: 'contacts'; people: { name: string; role?: string; phone?: string; note?: string }[] }
  | { kind: 'link'; label: string; url: string }

export type CampCardView = {
  id: string; name: string; place: string
  startDate: string | null; endDate: string | null
  /** Days until it starts; 0 or less once it has. */
  daysUntil: number | null
  /** "Day 2 of 5" while it is on. */
  dayOf: string | null
  intro: string[]
  /** Set when the family still owes the balance. */
  balanceLink: string | null
  tabs: { id: string; label: string; icon: string; blocks: CampBlock[] }[]
}

const TIME_SPLIT = /^\s*([0-9]{1,2}[:.][0-9]{2}\s*(?:–|-|to)?\s*(?:[0-9]{1,2}[:.][0-9]{2})?|morning|afternoon|evening|night)\b[\s—–:-]*(.*)$/i

export function campCardForApp(camp: StudentCamp, first: string, today = new Date()): CampCardView {
  const p = campParts(camp)
  const adult = (camp.audience || '').toLowerCase() === 'adult'
  const days = daysUntil(camp.start_date, today)
  const length = camp.start_date && camp.end_date ? (daysUntil(camp.end_date, new Date(`${camp.start_date.slice(0, 10)}T00:00:00`)) ?? 0) + 1 : null
  const dayOf = days !== null && days <= 0 && length ? `Day ${Math.min(1 - days, length)} of ${length}` : null
  const tabs: CampCardView['tabs'] = []
  const push = (id: string, label: string, icon: string, on: boolean, blocks: CampBlock[]) => {
    const kept = blocks.filter(Boolean)
    if (on && kept.length) tabs.push({ id, label, icon, blocks: kept })
  }

  const week: CampBlock[] = []
  if (p.shapeBody) week.push({ kind: 'text', text: p.shapeBody })
  if (p.timetable.length) week.push({ kind: 'timetable', title: 'How the days run', rows: p.timetable.map(x => {
    const m = String(x).match(TIME_SPLIT)
    return { when: m?.[1] ? m[1].trim() : '', what: m?.[2]?.trim() || String(x).trim() }
  }) })
  if (p.itinerary.length) week.push({ kind: 'days', title: 'Day by day', days: p.itinerary })
  push('week', 'The week', 'calendar', p.weekTab, week)

  const goals: CampBlock[] = []
  if (camp.camp_goal) goals.push({ kind: 'highlight', label: adult ? 'Your week, in one line' : `${first}’s week, in one line`, text: camp.camp_goal })
  if (p.targets.goals.length) goals.push({ kind: 'list', title: adult ? 'What you’re working on' : `What ${first} is working on`, icon: '🎯', style: 'number', items: p.targets.goals, measure: p.targets.measure })
  if (p.objectives.length) goals.push({ kind: 'list', title: 'What everyone leaves with', icon: '🏅', style: 'tick', items: p.objectives })
  push('goals', adult ? 'Your goals' : 'Goals', 'flag', p.goalsTab, goals)

  const bring: CampBlock[] = []
  if (p.bring.length) bring.push({ kind: 'list', title: 'In the bag', icon: '🎒', style: 'tick', items: p.bring, note: 'Your coach’s own kit — balls, first aid, everything for the courts — is packed separately. This is just yours.' })
  if (p.brief.length) bring.push({ kind: 'list', title: adult ? 'Before you come' : 'For parents', icon: '📋', style: 'bullet', items: p.brief })
  push('bring', 'What to bring', 'bag', p.bringTab, bring)

  const travel: CampBlock[] = []
  if (camp.arrival) travel.push({ kind: 'highlight', label: 'Your arrival', text: camp.arrival })
  if (p.travel.length) travel.push({ kind: 'facts', title: 'Flights & transfers', icon: '✈️', rows: p.travel })
  if (p.trip.travel?.airport) travel.push({ kind: 'link', label: `Directions from ${p.trip.travel.airport}`,
    url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(p.trip.travel.airport)}&destination=${encodeURIComponent(p.trip.stay?.address || p.trip.stay?.name || [camp.location, camp.region].filter(Boolean).join(', '))}` })
  push('travel', 'Getting there', 'airplane', p.travelTab, travel)

  const stay: CampBlock[] = []
  if (camp.room) stay.push({ kind: 'highlight', label: 'Your room', text: camp.room })
  if (p.trip.stay?.name || p.stay.length) stay.push({ kind: 'facts', title: p.trip.stay?.name || 'Where you’re staying', icon: '🏨', address: p.trip.stay?.address, rows: p.stay, map: mapsUrl(p.trip.stay?.address || p.trip.stay?.name), web: webUrl(p.trip.stay?.url) })
  if (p.trip.venue?.name || p.venue.length) stay.push({ kind: 'facts', title: p.trip.venue?.name || 'Where you play', icon: '🎾', address: p.trip.venue?.address, rows: p.venue, map: mapsUrl(p.trip.venue?.address || p.trip.venue?.name), web: webUrl(p.trip.venue?.url) })
  push('stay', 'Where you stay', 'bed.double', p.stayTab, stay)

  const place = (x: { name?: string; kind?: string; address?: string; phone?: string; url?: string; note?: string }) => ({
    name: String(x.name || '').trim(), kind: x.kind, address: x.address, phone: x.phone, note: x.note,
    map: mapsUrl(x.address || x.name), web: webUrl(x.url),
  })
  const about: CampBlock[] = []
  if (p.eating.length) about.push({ kind: 'places', title: 'Where we eat', icon: '🍽️', places: p.eating.map(place) })
  if (p.transport.length) about.push({ kind: 'places', title: 'Taxis & getting about', icon: '🚕', places: p.transport.map(place) })
  if (p.practical.length) about.push({ kind: 'facts', title: 'Good to know', icon: '💡', rows: p.practical })
  push('about', 'Out & about', 'globe', p.aboutTab, about)

  push('call', 'Who to ring', 'phone', p.callTab, [{ kind: 'contacts', people: p.contacts.map(c => ({ name: String(c.name || '').trim(), role: c.role, phone: c.phone, note: c.note })) }])

  p.extras.forEach((x, i) => {
    const blocks: CampBlock[] = []
    if (x.body) blocks.push({ kind: 'text', text: String(x.body) })
    const items = asStringList(x.items)
    if (items.length) blocks.push({ kind: 'list', title: String(x.title), icon: '📌', style: 'bullet', items })
    push(`x${i}`, String(x.title).slice(0, 22), 'note.text', true, blocks)
  })

  return {
    id: String(camp.id), name: camp.name,
    place: [camp.location, camp.region].filter(Boolean).join(' · ') || (camp.overseas ? 'Overseas camp' : 'Camp'),
    startDate: camp.start_date, endDate: camp.end_date, daysUntil: days, dayOf,
    intro: [camp.intent || camp.description || '', p.trip.intro || ''].map(x => String(x).trim()).filter(Boolean),
    balanceLink: camp.status === 'pending' && camp.balance_link ? camp.balance_link : null,
    tabs,
  }
}
