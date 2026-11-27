// Community actions from the HQ portal (browser). Every write goes through the
// signed-in HQ's session, so RLS (impact_hqs_for('hq')) checks it, and every query
// also matches hq_id. Check-in and the day's numbers are functions (migration 237)
// that also let a coach of the venue use them.

import type { SupabaseClient } from '@supabase/supabase-js'
import { impactFetch } from './org-scope'

type Done = { ok: true } | { ok: false; error: string }
const fail = (e: { message: string } | null, what: string): Done => (e ? { ok: false, error: `${what}: ${e.message}` } : { ok: true })

export async function markLapsed(db: SupabaseClient, hqId: string, familyIds: string[]): Promise<Done> {
  if (!familyIds.length) return { ok: true }
  const { error } = await db.from('tp_families').update({ lapsed_at: new Date().toISOString() }).eq('hq_id', hqId).in('id', familyIds).is('lapsed_at', null)
  return fail(error, 'Couldn’t mark them lapsed')
}

export async function moveVenue(db: SupabaseClient, hqId: string, familyId: string, venueId: string | null): Promise<Done> {
  const { error } = await db.from('tp_families').update({ community_venue_id: venueId, waitlisted_at: null }).eq('hq_id', hqId).eq('id', familyId)
  return fail(error, 'Couldn’t move the family')
}

/** A school family who'll come to weekend sessions too (tp_families.weekend_too, migration 239). */
export async function setWeekendToo(db: SupabaseClient, hqId: string, familyId: string, on: boolean): Promise<Done> {
  const { error } = await db.from('tp_families').update({ weekend_too: on }).eq('hq_id', hqId).eq('id', familyId)
  return fail(error, 'Couldn’t save that')
}

export async function setCapacity(db: SupabaseClient, hqId: string, venueId: string, capacity: number | null): Promise<Done> {
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) return { ok: false, error: 'Capacity is a whole number of families, 1 or more — or blank for no limit.' }
  const { error } = await db.from('tp_venues').update({ capacity }).eq('hq_id', hqId).eq('id', venueId)
  return fail(error, 'Couldn’t save the capacity')
}

/** Message the family that a place is free, then take them off the waiting list — only if the message went. */
export async function offerPlace(db: SupabaseClient, hqId: string, familyId: string, body: string): Promise<Done> {
  const res = await impactFetch('/api/impact/message/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipients: [{ familyId }], channels: ['email', 'app'], body }) })
  const data = await res.json().catch(() => ({})) as { error?: string; results?: { outcome: string; detail?: string }[] }
  if (!res.ok) return { ok: false, error: data.error ?? `The message couldn’t be sent (error ${res.status}).` }
  if (!(data.results ?? []).some(r => r.outcome === 'sent' || r.outcome === 'filed')) return { ok: false, error: `The message couldn’t be sent: ${(data.results ?? []).map(r => r.detail).filter(Boolean).join('; ') || 'no channel reached them'}. They’re still on the list.` }
  const { error } = await db.from('tp_families').update({ waitlisted_at: null }).eq('hq_id', hqId).eq('id', familyId)
  return fail(error, 'The message went, but they couldn’t be taken off the list')
}

export type Checkin = { family: string; children: string[]; already: string[]; session_id: string }
export async function checkIn(db: SupabaseClient, hqId: string, venueId: string, code: string): Promise<{ ok: true; value: Checkin } | { ok: false; error: string }> {
  const { data, error } = await db.rpc('impact_family_checkin', { p_hq: hqId, p_venue: venueId, p_code: code })
  return error ? { ok: false, error: error.message } : { ok: true, value: data as Checkin }
}

export type WeekendDay = { checked_in_children: number; checked_in_families: number; expected_families: number; expected_children: number; not_coming_families: number }
export async function weekendDay(db: SupabaseClient, hqId: string, venueId: string, date: string): Promise<WeekendDay | null> {
  const { data, error } = await db.rpc('impact_weekend_day', { p_hq: hqId, p_venue: venueId, p_date: date })
  return error ? null : data as WeekendDay
}

/** The QR code text a family's card or a venue poster carries. */
export const joinUrl = (origin: string, slug: string, venueId: string) => `${origin}/impact/${slug}/join?venue=${encodeURIComponent(venueId)}&src=qr`

/** "Saturday" → the next date (today included) that falls on it, as YYYY-MM-DD; null if the day isn't a weekday name. */
export function nextDateFor(day: string | null | undefined, today: string): string | null {
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const want = names.findIndex(n => (day ?? '').toLowerCase().startsWith(n.slice(0, 3)))
  if (want < 0) return null
  const d = new Date(`${today}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + ((want - d.getUTCDay() + 7) % 7))
  return d.toISOString().slice(0, 10)
}
