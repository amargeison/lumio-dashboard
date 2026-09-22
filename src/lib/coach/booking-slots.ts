// When is this coach actually free?
//
// The coach portal already answers this in the browser, inside the Add-booking
// form: Lumio's own diary plus the connected calendar, on the hour and half
// hour, within coaching hours. This is the same answer computed on the SERVER,
// because the person who needs it most is the one who cannot sign in — a player
// following a booking link.
//
// Three rules, all of which exist because of a specific way this goes wrong:
//
//   1. Busy means busy ANYWHERE. A lesson already booked in Lumio, a dentist
//      appointment in the coach's Google calendar and a week in Spain are the
//      same fact to somebody choosing a Tuesday. Offering a slot the coach
//      cannot make is worse than offering none.
//   2. Nothing about the session is taken from the browser. Duration and type
//      come from the link row; hours come from the coach's settings. A public
//      endpoint that accepted a duration would accept a nine-hour one.
//   3. Everything is computed in Europe/London, not in the server's timezone.
//      A server on UTC in August is an hour out, which is the difference between
//      a free slot and a double booking.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getBusyTimes } from './calendar'
import { campSpans, campsOn, type CampRow } from './camp-dates'

const TZ = 'Europe/London'
const STEP = 30                 // slots start on the hour and half hour
const DEFAULT_DAY = { start: 8 * 60, end: 20 * 60 }

export type DaySlots = { date: string; label: string; slots: string[] }

export type SlotOptions = {
  durationMin: number
  /** How many days ahead to offer. */
  days?: number
  /** Earliest a slot may start, in hours from now. */
  noticeHours?: number
}

const pad = (n: number) => String(n).padStart(2, '0')
export const hhmm = (mins: number) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`

/** 'YYYY-MM-DD' and minutes-past-midnight for an instant, as London sees it. */
function londonParts(d: Date): { date: string; mins: number } {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  const p = Object.fromEntries(f.formatToParts(d).map(x => [x.type, x.value])) as Record<string, string>
  const hour = p.hour === '24' ? '00' : p.hour
  return { date: `${p.year}-${p.month}-${p.day}`, mins: Number(hour) * 60 + Number(p.minute) }
}

/** Today in London — not the server's today, which after midnight UTC in winter
    is the same day but in summer is emphatically not. */
export function londonToday(): string { return londonParts(new Date()).date }

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`)   // midday, so a DST shift cannot move the date
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** "08:00 – 20:00", "8am-8pm", "07:30 to 21:00" → minutes. Falls back rather
    than refusing: a coach who typed something odd should still get a diary. */
export function parseHours(v: unknown): { start: number; end: number } {
  const s = String(v ?? '')
  const nums = [...s.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi)]
  if (nums.length < 2) return DEFAULT_DAY
  const at = (m: RegExpMatchArray) => {
    let h = Number(m[1]) % 24
    const mm = Number(m[2] || 0)
    const ap = (m[3] || '').toLowerCase()
    if (ap === 'pm' && h < 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return h * 60 + Math.min(59, mm)
  }
  const start = at(nums[0]), end = at(nums[nums.length - 1])
  return end > start ? { start, end } : DEFAULT_DAY
}

const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE
const toMins = (t?: string | null) => {
  const m = String(t ?? '').match(/(\d{1,2}):(\d{2})/)
  return m ? Math.min(23, +m[1]) * 60 + Math.min(59, +m[2]) : null
}

const LABEL = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ })

/**
 * The coach's bookable slots, day by day. Empty days are dropped — a page of
 * "no times" for six days running is noise, not information.
 */
export async function freeSlots(
  db: SupabaseClient, coachId: string, opts: SlotOptions,
): Promise<DaySlots[]> {
  const duration = Math.max(15, Math.min(240, Math.round(opts.durationMin || 60)))
  const horizon = Math.max(1, Math.min(60, opts.days ?? 21))
  const notice = Math.max(0, opts.noticeHours ?? 12)

  const from = londonToday()
  const to = addDays(from, horizon)

  // Coaching hours and the gap the coach wants between lessons.
  let hours = DEFAULT_DAY
  let buffer = 0
  try {
    const { data } = await db.from('coach_settings').select('data').eq('coach_id', coachId).maybeSingle()
    const d = (data?.data || {}) as Record<string, any>
    if (d.bookableHours) hours = parseHours(d.bookableHours)
    buffer = Math.max(0, Math.min(60, Number(d?.booking?.buffer) || 0))
  } catch { /* defaults are a working diary, not a broken one */ }

  const [{ data: bookings }, { data: camps }] = await Promise.all([
    db.from('coach_bookings').select('booking_date, start_time, duration_min, status')
      .eq('coach_id', coachId).gte('booking_date', from).lte('booking_date', to),
    db.from('coach_camps').select('id, name, start_date, end_date, location, region, confirmed')
      .eq('coach_id', coachId),
  ])

  // The connected calendar. Never fatal: a coach with no mailbox connected still
  // gets their Lumio diary honoured, which is the clash we can always see.
  let external: { date: string; start: number; end: number }[] = []
  try {
    const busy = await getBusyTimes(coachId, new Date(`${from}T00:00:00Z`).toISOString(), new Date(`${to}T23:59:59Z`).toISOString())
    external = busy.flatMap(iv => {
      const s = londonParts(new Date(iv.start))
      const e = londonParts(new Date(iv.end))
      if (s.date === e.date) return [{ date: s.date, start: s.mins, end: e.mins }]
      // Spans midnight (or several days): block the tail of the first day, the
      // head of the last, and everything between.
      const out: { date: string; start: number; end: number }[] = [{ date: s.date, start: s.mins, end: 24 * 60 }]
      for (let day = addDays(s.date, 1); day < e.date; day = addDays(day, 1)) out.push({ date: day, start: 0, end: 24 * 60 })
      out.push({ date: e.date, start: 0, end: e.mins })
      return out
    }).filter(x => x.end > x.start)
  } catch { /* nothing connected, or the provider is down */ }

  const spans = campSpans((camps || []) as CampRow[])
  const now = londonParts(new Date())
  const earliestDate = now.date
  const earliestMins = now.mins + notice * 60

  const out: DaySlots[] = []
  for (let i = 0; i < horizon; i++) {
    const date = addDays(from, i)

    // A camp is the whole day gone — the coach is in Spain, not between lessons.
    if (campsOn(spans, date).length) continue

    const busy: { start: number; end: number }[] = []
    for (const b of (bookings || []) as any[]) {
      if (String(b.booking_date || '').slice(0, 10) !== date) continue
      if (String(b.status || '').toLowerCase() === 'cancelled') continue
      const s = toMins(b.start_time)
      if (s == null) continue
      busy.push({ start: s - buffer, end: s + (Number(b.duration_min) || 60) + buffer })
    }
    for (const x of external) if (x.date === date) busy.push({ start: x.start, end: x.end })

    const slots: string[] = []
    for (let t = hours.start; t + duration <= hours.end; t += STEP) {
      if (date === earliestDate && t < earliestMins) continue
      if (date < earliestDate) continue
      if (busy.some(b => overlaps(t, t + duration, b.start, b.end))) continue
      slots.push(hhmm(t))
    }
    if (slots.length) out.push({ date, label: LABEL(date), slots })
  }
  return out
}
