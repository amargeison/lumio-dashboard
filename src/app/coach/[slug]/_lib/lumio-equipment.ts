'use client'

// Lumio's default Equipment & Kit — the demo's session-kit checklists and a
// categorised inventory, seeded so a new coach starts with a sensible kit list
// they can edit/remove. Sourced from the demo data so the live portal matches.

import { sb, currentCoachId } from './coach-db'
import { SESSION_KITS, EQUIPMENT_INVENTORY } from './coach-data'

// What a coach can choose from in the setup wizard. Selection happens at the
// group level deliberately — 5 kit lists and 8 inventory categories is a decision
// a coach can make in twenty seconds, whereas 67 individual tick boxes is a chore
// they would abandon (and abandoning it means landing on an empty module).
export type EquipmentChoice = { kitTypes?: string[]; categories?: string[] }

export const EQUIPMENT_KIT_CHOICES = SESSION_KITS.map(k => ({ id: k.type, label: k.type, count: k.items.length }))
export const EQUIPMENT_CATEGORY_CHOICES = EQUIPMENT_INVENTORY.map(c => ({ id: c.category, label: c.category, count: c.items.length }))

// ── What state is an item in? ───────────────────────────────────────────────
// The status used to be whatever the coach last picked, with no link to the
// count beside it — so an item with 0 left sat under a green "In stock" and the
// dashboard said "All stocked up". The count now decides wherever it can:
//
//   0 left                          → out of stock
//   at or below the item's "low at" → running low
//   otherwise                       → what the coach chose
//
// "To order" and "Repair" are things the coach has said, not things a number
// can know, so they always stand. An item with no count keeps the status it was
// given (a ball machine nobody counts); one with no count AND no status has
// never been looked at — the starter list arrives like that — and says so
// rather than claiming to be in stock. The Equipment page and the dashboard both
// read this one function, so they cannot disagree.
export type StockState = 'in_stock' | 'low' | 'order' | 'repair' | 'out' | 'uncounted'
export type StockItem = { quantity?: number | null; status?: string | null; low_at?: number | null }

export function stockState(i: StockItem): StockState {
  if (i.status === 'order' || i.status === 'repair') return i.status
  const q = i.quantity
  if (q == null) return i.status === 'low' ? 'low' : i.status ? 'in_stock' : 'uncounted'
  if (q <= 0) return 'out'
  if (i.low_at != null && q <= i.low_at) return 'low'
  return i.status === 'low' ? 'low' : 'in_stock'
}
export const STOCK_LABEL: Record<StockState, string> = { in_stock: 'In stock', low: 'Running low', order: 'To order', repair: 'Repair', out: 'Out of stock', uncounted: 'Not counted' }
/** Out, low, to order or in for repair. Not "not counted": that is a list nobody has filled in, not a shortage. */
export const stockNeedsAttention = (i: StockItem) => { const s = stockState(i); return s !== 'in_stock' && s !== 'uncounted' }

// The largest count the form and the stepper accept. The column is a whole
// number; anything past this is a slip of the finger, not a stock level.
export const MAX_STOCK = 99999

// `sel` omitted means everything — keeps the original all-in behaviour for the
// onboarding path and any existing caller.
export async function seedLumioEquipment(sel?: EquipmentChoice): Promise<{ kits: number; items: number }> {
  const uid = await currentCoachId()
  if (!uid) return { kits: 0, items: 0 }
  const wantKit = (t: string) => !sel?.kitTypes || sel.kitTypes.includes(t)
  const wantCat = (c: string) => !sel?.categories || sel.categories.includes(c)

  // — Session kit checklists (coach_kit_items) —
  // "Already have" means on the ACADEMY's list. A coach's own list sits in the
  // same tables (migration 168) and must not stop the academy getting an item.
  const exKits = await sb().from('coach_kit_items').select('session_type,label').eq('coach_id', uid).is('staff_id', null)
  const haveKit = new Set((exKits.data ?? []).map((r: any) => `${(r.session_type || '').toLowerCase()}|${(r.label || '').toLowerCase()}`))
  const kitRows: any[] = []
  for (const sk of SESSION_KITS) { if (!wantKit(sk.type)) continue; for (const label of sk.items) {
    if (!haveKit.has(`${sk.type.toLowerCase()}|${label.toLowerCase()}`)) kitRows.push({ coach_id: uid, session_type: sk.type, label })
  } }
  if (kitRows.length) { const { error } = await sb().from('coach_kit_items').insert(kitRows); if (error) { console.error('[lumio-equipment] kits', error.message); throw new Error(error.message) } }

  // — Inventory (coach_equipment) —
  const exItems = await sb().from('coach_equipment').select('item').eq('coach_id', uid).is('staff_id', null)
  const haveItem = new Set((exItems.data ?? []).map((r: any) => (r.item || '').toLowerCase()))
  const itemRows: any[] = []
  for (const cat of EQUIPMENT_INVENTORY) { if (!wantCat(cat.category)) continue; for (const it of cat.items) {
    if (haveItem.has(it.name.toLowerCase())) continue
    // Where it is kept, and nothing else. `it.note` is the demo academy's own
    // stock diary ("Down to last 2 tubes — reorder"), which is not true of
    // anybody else's kit bag.
    const notes = it.location || null
    // Seed the item LIST (names/categories/where it lives) with no count and no
    // status — a brand-new coach hasn't counted stock yet, so demo numbers (and
    // demo low/order/repair flags) shouldn't leak in, and neither should a claim
    // that everything is in stock. Each item reads "Not counted" until they
    // count it in, which they do inline.
    itemRows.push({ coach_id: uid, item: it.name, category: cat.category, quantity: null, status: null, notes })
  } }
  if (itemRows.length) { const { error } = await sb().from('coach_equipment').insert(itemRows); if (error) { console.error('[lumio-equipment] items', error.message); throw new Error(error.message) } }

  return { kits: kitRows.length, items: itemRows.length }
}
