'use client'

// Lumio's default Equipment & Kit — the demo's session-kit checklists and a
// categorised inventory, seeded so a new coach starts with a sensible kit list
// they can edit/remove. Sourced from the demo data so the live portal matches.

import { sb, currentCoachId } from './coach-db'
import { SESSION_KITS, EQUIPMENT_INVENTORY } from './coach-data'

export async function seedLumioEquipment(): Promise<{ kits: number; items: number }> {
  const uid = await currentCoachId()
  if (!uid) return { kits: 0, items: 0 }

  // — Session kit checklists (coach_kit_items) —
  const exKits = await sb().from('coach_kit_items').select('session_type,label').eq('coach_id', uid)
  const haveKit = new Set((exKits.data ?? []).map((r: any) => `${(r.session_type || '').toLowerCase()}|${(r.label || '').toLowerCase()}`))
  const kitRows: any[] = []
  for (const sk of SESSION_KITS) for (const label of sk.items) {
    if (!haveKit.has(`${sk.type.toLowerCase()}|${label.toLowerCase()}`)) kitRows.push({ coach_id: uid, session_type: sk.type, label })
  }
  if (kitRows.length) { const { error } = await sb().from('coach_kit_items').insert(kitRows); if (error) { console.error('[lumio-equipment] kits', error.message); throw new Error(error.message) } }

  // — Inventory (coach_equipment) —
  const exItems = await sb().from('coach_equipment').select('item').eq('coach_id', uid)
  const haveItem = new Set((exItems.data ?? []).map((r: any) => (r.item || '').toLowerCase()))
  const itemRows: any[] = []
  for (const cat of EQUIPMENT_INVENTORY) for (const it of cat.items) {
    if (haveItem.has(it.name.toLowerCase())) continue
    const notes = [it.location, it.note].filter(Boolean).join(' · ') || null
    // Seed the item LIST (names/categories/notes) but start every quantity at 0 and
    // status in-stock — a brand-new coach hasn't counted stock yet, so demo numbers
    // (and demo low/order/repair flags) shouldn't leak in. They edit quantities inline.
    itemRows.push({ coach_id: uid, item: it.name, category: cat.category, quantity: 0, status: 'in_stock', notes })
  }
  if (itemRows.length) { const { error } = await sb().from('coach_equipment').insert(itemRows); if (error) { console.error('[lumio-equipment] items', error.message); throw new Error(error.message) } }

  return { kits: kitRows.length, items: itemRows.length }
}
