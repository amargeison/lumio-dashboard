// Client-side store for kit added via "Add item" in Equipment & Kit.
// KitItem has no id and lives under a category, so we store a FLAT list of items
// each carrying their category + a synthetic id (for keying/dedupe). The view
// merges these back into the category grouping. Mirrors roster-store.ts.

import type { KitItem } from './coach-data'

export type AddedKitItem = KitItem & { category: string; id: string }

const KEY = 'lumio_coach_equipment'
const EVT = 'lumio-coach-equipment-changed'

function read(): AddedKitItem[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as AddedKitItem[] : [] } catch { return [] }
}
function write(list: AddedKitItem[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedEquipment(): AddedKitItem[] {
  return read()
}
export function addEquipment(item: AddedKitItem) {
  write([...read(), item])
}
export function removeEquipment(id: string) {
  write(read().filter(i => i.id !== id))
}
export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
