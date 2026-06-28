'use client'

// Lumio's default Equipment & Kit — the demo's session-kit checklists and a
// categorised inventory, seeded so a new coach starts with a sensible kit list
// they can edit/remove. Sourced from the demo data so the live portal matches.

import { sb, currentCoachId } from './coach-db'
import { SESSION_KITS, EQUIPMENT_INVENTORY } from './coach-data'

const STATUS_MAP: Record<string, string> = { good: 'in_stock', low: 'low', order: 'order', repair: 'repair' }
// Parse a leading quantity from the demo's display strings ("24 dozen", "×40", "×2 pairs").
const qtyNum = (s: string): number | null => { const m = (s || '').match(/(\d+)/); return m ? Number(m[1]) : null }

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
    itemRows.push({ coach_id: uid, item: it.name, category: cat.category, quantity: qtyNum(it.qty), status: STATUS_MAP[it.status] || 'in_stock', notes })
  }
  if (itemRows.length) { const { error } = await sb().from('coach_equipment').insert(itemRows); if (error) { console.error('[lumio-equipment] items', error.message); throw new Error(error.message) } }

  return { kits: kitRows.length, items: itemRows.length }
}
