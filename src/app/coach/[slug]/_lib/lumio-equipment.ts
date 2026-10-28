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
// Stock rules live in lib/coach/stock.ts (the server reads them too).
export { stockState, STOCK_LABEL, stockNeedsAttention, type StockState, type StockItem } from '@/lib/coach/stock'

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
