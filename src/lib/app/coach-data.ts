// What the native iPhone app shows a coach, as plain JSON (server only).
//
// Read with the COACH'S OWN session (row level security decides what they may
// see, exactly as it does for the web portal), shaped here once so the app
// stays a thin screen over it. Nothing the web portal would not show them.

import type { SupabaseClient } from '@supabase/supabase-js'
import { ukDate, addDaysIso } from '@/lib/coach/uk-date'

type Db = SupabaseClient
type Row = Record<string, any>   // eslint-disable-line @typescript-eslint/no-explicit-any

export type AppBooking = {
  id: string
  date: string
  time: string | null
  mins: number
  title: string
  type: string | null
  court: string | null
  playerId: string | null
  playerName: string | null
  coach: string | null
  status: 'confirmed' | 'pending' | 'cancelled'
  /** The client pressed "I'll be there". */
  clientConfirmed: { at: string; by: string | null } | null
  cancelledByClient: boolean
  paid: boolean
  headcount: number | null
  notes: string | null
}

export type AppPlayer = {
  id: string; name: string
  email: string | null; phone: string | null
  parentName: string | null; parentEmail: string | null; parentPhone: string | null
  category: string | null; level: string | null; age: number | null
  nextLesson: { date: string; time: string | null } | null
}

export type AppConversation = {
  id: string                 // player:<uuid> | camp:<id> | name:<label>
  title: string
  tag: 'Player' | 'Camp' | 'Contact' | 'Coach' | null
  playerId: string | null
  last: { body: string; at: string; fromThem: boolean } | null
  unread: number
  /** Can the app reply here? Players only for now; the rest opens on the website. */
  canReply: boolean
}

export type AppMessage = { id: string; fromThem: boolean; from: string | null; subject: string | null; body: string; at: string; channels: string | null }

const s = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
const statusOf = (v: unknown): AppBooking['status'] => {
  const t = String(v || '').toLowerCase()
  return t === 'cancelled' ? 'cancelled' : t === 'pending' ? 'pending' : 'confirmed'
}

export async function bookingsBetween(db: Db, service: Db, academyId: string, from: string, to: string): Promise<AppBooking[]> {
  const [{ data: rows }, { data: staff }] = await Promise.all([
    db.from('coach_bookings').select('*').eq('coach_id', academyId).gte('booking_date', from).lte('booking_date', to)
      .order('booking_date', { ascending: true }).order('start_time', { ascending: true }).limit(800),
    db.from('coach_staff').select('id, name').eq('coach_id', academyId).limit(100),
  ])
  const list = (rows || []).filter((b: Row) => b.type !== 'Block')
  const ids = list.map((b: Row) => b.id)
  const paid = new Set<string>()
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await service.from('coach_charges').select('booking_id').eq('coach_id', academyId).in('booking_id', ids.slice(i, i + 100)).in('status', ['paid', 'processing'])
    for (const c of data || []) paid.add(String(c.booking_id))
  }
  const staffName = new Map((staff || []).map((x: Row) => [x.id, x.name]))
  return list.map((b: Row): AppBooking => ({
    id: String(b.id), date: b.booking_date, time: b.start_time ? String(b.start_time).slice(0, 5) : null,
    mins: Number(b.duration_min) || 60,
    title: s(b.player_name) || s(b.title) || 'Booking', type: s(b.type), court: s(b.court),
    playerId: b.player_id || null, playerName: s(b.player_name),
    coach: (b.staff_id && staffName.get(b.staff_id)) || s(b.assigned_coach),
    status: statusOf(b.status),
    clientConfirmed: b.client_confirmed_at && statusOf(b.status) !== 'cancelled' ? { at: b.client_confirmed_at, by: s(b.client_confirmed_by) } : null,
    cancelledByClient: statusOf(b.status) === 'cancelled' && b.cancelled_by === 'client',
    paid: paid.has(String(b.id)),
    headcount: b.headcount == null ? null : Number(b.headcount),
    notes: s(b.notes),
  }))
}

export async function today(db: Db, service: Db, academyId: string) {
  const day = ukDate()
  const weekEnd = addDaysIso(day, 6)
  const all = await bookingsBetween(db, service, academyId, day, weekEnd)
  const todays = all.filter(b => b.date === day && b.status !== 'cancelled')
  return {
    date: day,
    sessions: todays,
    counts: {
      today: todays.length,
      confirmedByClients: todays.filter(b => b.clientConfirmed).length,
      thisWeek: all.filter(b => b.status !== 'cancelled').length,
      pending: all.filter(b => b.status === 'pending').length,
    },
    tomorrow: all.filter(b => b.date === addDaysIso(day, 1) && b.status !== 'cancelled'),
  }
}

export async function players(db: Db, academyId: string): Promise<AppPlayer[]> {
  const day = ukDate()
  const [{ data: rows }, { data: next }] = await Promise.all([
    db.from('coach_players').select('*').eq('coach_id', academyId).order('name', { ascending: true }).limit(1000),
    db.from('coach_bookings').select('player_id, booking_date, start_time, status').eq('coach_id', academyId).gte('booking_date', day)
      .order('booking_date', { ascending: true }).order('start_time', { ascending: true }).limit(1500),
  ])
  const firstNext = new Map<string, { date: string; time: string | null }>()
  for (const b of next || []) {
    if (!b.player_id || String(b.status || '').toLowerCase() === 'cancelled' || firstNext.has(b.player_id)) continue
    firstNext.set(b.player_id, { date: b.booking_date, time: b.start_time ? String(b.start_time).slice(0, 5) : null })
  }
  return (rows || []).filter((p: Row) => String(p.status || '').toLowerCase() !== 'archived').map((p: Row) => playerOf(p, firstNext.get(p.id) || null))
}

export function playerOf(p: Row, nextLesson: AppPlayer['nextLesson']): AppPlayer {
  return {
    id: String(p.id), name: s(p.name) || 'Player',
    email: s(p.email) || s(p.contact_email), phone: s(p.phone),
    parentName: s(p.parent_name), parentEmail: s(p.parent_email), parentPhone: s(p.parent_phone),
    category: s(p.category), level: s(p.level), age: p.age == null || p.age === '' ? null : Number(p.age) || null,
    nextLesson,
  }
}

// ── Messages ───────────────────────────────────────────────────────────────
// Grouped the way the web inbox groups them (LiveMessages.tsx): a player is one
// conversation found by id; a camp is one by its thread key; an older row with
// only a name joins a player only when exactly one player has that name.

export function conversationKey(m: Row, byName: Map<string, string[]>): string {
  const lc = (v?: string | null) => (v || '').trim().toLowerCase()
  const r = String(m.recipients || '').trim()
  const tk = String(m.thread_key || '').trim()
  const legacy = tk && !/^(camp|contact|staff|attendee):/.test(tk) ? tk : r
  const namesakes = byName.get(lc(legacy)) || []
  if (tk.startsWith('camp:')) return tk
  if (m.player_id) return `player:${m.player_id}`
  if (legacy === tk || !tk) return namesakes.length === 1 ? `player:${namesakes[0]}` : `name:${r || 'Unknown'}`
  return `name:${r || 'Unknown'}`
}

async function messageRows(db: Db, academyId: string) {
  const [{ data: msgs }, { data: plist }] = await Promise.all([
    db.from('coach_messages').select('id, player_id, recipients, thread_key, direction, from_name, subject, body, created_at, read, channels, camp_id')
      .eq('coach_id', academyId).order('created_at', { ascending: false }).limit(600),
    db.from('coach_players').select('id, name').eq('coach_id', academyId).limit(1000),
  ])
  const byName = new Map<string, string[]>()
  for (const p of plist || []) { const k = String(p.name || '').trim().toLowerCase(); if (k) byName.set(k, [...(byName.get(k) || []), p.id]) }
  const nameOf = new Map((plist || []).map((p: Row) => [p.id, String(p.name || '').trim()]))
  return { msgs: (msgs || []) as Row[], byName, nameOf }
}

export async function conversations(db: Db, academyId: string): Promise<AppConversation[]> {
  const { msgs, byName, nameOf } = await messageRows(db, academyId)
  const groups = new Map<string, Row[]>()
  for (const m of msgs) { const k = conversationKey(m, byName); groups.set(k, [...(groups.get(k) || []), m]) }
  return Array.from(groups.entries()).map(([id, rows]): AppConversation => {
    const newest = rows[0]
    const playerId = id.startsWith('player:') ? id.slice(7) : null
    const campLabel = rows.map(r => String(r.recipients || '')).find(r => r.startsWith('Camp ·'))
    const title = (playerId && nameOf.get(playerId)) || campLabel || (id.startsWith('camp:') ? 'Camp' : id.startsWith('name:') ? id.slice(5) : String(newest?.recipients || 'Unknown'))
    const tag = playerId ? 'Player' : id.startsWith('camp:') ? 'Camp'
      : rows.some(r => String(r.thread_key || '').startsWith('staff:')) ? 'Coach'
      : rows.some(r => String(r.thread_key || '').startsWith('contact:')) ? 'Contact' : null
    return {
      id, title, tag, playerId,
      last: newest ? { body: String(newest.body || newest.subject || '').slice(0, 200), at: newest.created_at, fromThem: newest.direction === 'in' } : null,
      unread: rows.filter(r => r.direction === 'in' && !r.read).length,
      canReply: !!playerId && nameOf.has(playerId),
    }
  }).sort((a, b) => String(b.last?.at || '').localeCompare(String(a.last?.at || '')))
}

/** One conversation, oldest first, and the ids of its unread incoming messages. */
export async function thread(db: Db, academyId: string, id: string): Promise<{ messages: AppMessage[]; unreadIds: string[] }> {
  const { msgs, byName } = await messageRows(db, academyId)
  const rows = msgs.filter(m => conversationKey(m, byName) === id).slice(0, 200).reverse()
  return {
    messages: rows.map(m => ({
      id: String(m.id), fromThem: m.direction === 'in', from: s(m.from_name), subject: s(m.subject),
      body: String(m.body || ''), at: m.created_at, channels: s(m.channels),
    })),
    unreadIds: rows.filter(m => m.direction === 'in' && !m.read).map(m => String(m.id)),
  }
}

/** A range the app may ask for: at most nine weeks, valid dates. */
export function range(fromRaw: string | null, toRaw: string | null): { from: string; to: string } {
  const ok = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`))
  const from = ok(fromRaw) ? fromRaw! : ukDate()
  let to = ok(toRaw) ? toRaw! : addDaysIso(from, 6)
  if (to < from) to = from
  if (to > addDaysIso(from, 62)) to = addDaysIso(from, 62)
  return { from, to }
}
