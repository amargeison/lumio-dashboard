// Rooms and upgrades on a camp or trip (pure — no database, no browser).
//
// The coach lists the rooms a family can choose, each with a supplement on top
// of the price of the place: "Twin room, shared" (included), "Single room"
// (+£225), "Sea-view upgrade" (+£90). The family picks one when they sign up,
// or on the player information form for trips abroad. The supplement is added
// to what that place costs, so the Finance tab, the balance reminder and the
// pay link all include it.

import { formatPennies } from './money'
import { paidPennies, type MoneyCamp, type MoneyAttendee } from './camp-money'

export type RoomOption = { label: string; pennies: number }

export const MAX_ROOMS = 8
/** £10,000: well above any real supplement, and the database's limit too. */
export const MAX_SUPPLEMENT = 1_000_000

/** Whatever was saved on the camp, made safe: named rooms, whole pennies, no repeats. */
export function tidyRooms(raw: unknown): RoomOption[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: RoomOption[] = []
  for (const r of raw) {
    const label = String((r as { label?: unknown })?.label ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
    if (!label || seen.has(label.toLowerCase())) continue
    const p = Math.round(Number((r as { pennies?: unknown })?.pennies) || 0)
    seen.add(label.toLowerCase())
    out.push({ label, pennies: Math.min(MAX_SUPPLEMENT, Math.max(0, p)) })
    if (out.length >= MAX_ROOMS) break
  }
  return out
}

/** How a room reads where a family picks it: "Single room (+£225)", or just the name when included. */
export const roomChoice = (o: RoomOption) => (o.pennies > 0 ? `${o.label} (+${formatPennies(o.pennies)})` : o.label)

/** The room a family picked, from what the page or the form sent. */
export function findRoom(rooms: RoomOption[], answer: unknown): RoomOption | null {
  const a = String(answer ?? '').replace(/\s+/g, ' ').trim()
  if (!a) return null
  return rooms.find(o => roomChoice(o) === a) || rooms.find(o => o.label === a) || null
}

/** The room this place is in now, if it is one on the list. */
export function currentRoom(rooms: RoomOption[], a: { extra_label?: unknown; [k: string]: unknown }): RoomOption | null {
  return a.extra_label ? rooms.find(o => o.label === a.extra_label) || null : null
}

/** A balance being taken right now: the room cannot change under it. */
export const roomLocked = (a: { balance_status?: unknown; [k: string]: unknown }) => a.balance_status === 'charging'

/**
 * What to save on the place to put it in this room. The supplement changes
 * what the place costs, so the "paid in full" tick is worked out again from
 * what has actually been received:
 *   - paid in full, then upgraded: no longer paid in full; the upgrade is owed.
 *   - paid in full, then moved to a cheaper room: still paid, and the Finance
 *     tab shows the difference to refund.
 * A balance already taken from the card used up the family's agreement, so an
 * upgrade after that is paid from a link, after a reminder.
 */
export function roomPatch(camp: MoneyCamp, a: MoneyAttendee & { balance_status?: unknown; extra_label?: unknown }, room: RoomOption | null): Record<string, unknown> {
  const price = Math.max(0, Math.round((Number(camp.price) || 0) * 100))
  const extra = room ? room.pennies : 0
  const due = price + extra
  const typed = a.paid_pennies != null && !Number.isNaN(Number(a.paid_pennies)) ? Math.max(0, Math.round(Number(a.paid_pennies))) : null
  // What has come in for this place. The tick means the whole of the old price.
  const received = a.paid ? Math.max(typed ?? 0, paidPennies(camp, a)) : typed ?? paidPennies(camp, a)
  const patch: Record<string, unknown> = { extra_pennies: extra, extra_label: room ? room.label : null }
  if (a.paid || typed != null) patch.paid_pennies = received
  patch.paid = due > 0 ? received >= due : !!a.paid
  if (a.balance_status === 'paid' && received < due) {
    patch.balance_status = null
    patch.balance_agreed_at = null
    patch.balance_agreed_pennies = null
    patch.balance_reminded_at = null
  }
  return patch
}

/** Money received beyond what the place now costs: the coach owes it back. */
export function overpaidPennies(camp: MoneyCamp, a: MoneyAttendee): number {
  const due = Math.max(0, Math.round((Number(camp.price) || 0) * 100)) + Math.max(0, Math.round(Number(a.extra_pennies) || 0))
  const typed = a.paid_pennies != null ? Math.round(Number(a.paid_pennies) || 0) : 0
  return due > 0 && typed > due ? typed - due : 0
}
