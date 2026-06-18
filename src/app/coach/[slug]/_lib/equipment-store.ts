// Client-side store for the Equipment & Kit page (demo — localStorage only).
// Holds four concerns, each under its own key but all firing the same change
// event so the view re-renders on any edit:
//   1. Added inventory items  ("Add item")                → lumio_coach_equipment
//   2. Inventory qty/status overrides (inline editing)    → lumio_coach_equip_overrides
//   3. Per-session-kit add/remove (editable checklists)   → lumio_coach_kit_edits
//   4. Ordered items (restock workflow → mark ordered)    → lumio_coach_equip_ordered

import type { KitItem, KitStatus } from './coach-data'

export type AddedKitItem = KitItem & { category: string; id: string }

const EVT = 'lumio-coach-equipment-changed'

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}

// ─── 1. Added inventory items ────────────────────────────────────────────────
const ADDED_KEY = 'lumio_coach_equipment'
export function getAddedEquipment(): AddedKitItem[] { return read<AddedKitItem[]>(ADDED_KEY, []) }
export function addEquipment(item: AddedKitItem) { write(ADDED_KEY, [...getAddedEquipment(), item]) }
export function removeEquipment(id: string) { write(ADDED_KEY, getAddedEquipment().filter(i => i.id !== id)) }

// ─── 2. Inventory qty/status overrides (keyed by item name) ──────────────────
export type InvOverride = { qty?: string; status?: KitStatus }
const OVR_KEY = 'lumio_coach_equip_overrides'
export function getInvOverrides(): Record<string, InvOverride> { return read<Record<string, InvOverride>>(OVR_KEY, {}) }
export function setInvOverride(name: string, patch: InvOverride) {
  const all = getInvOverrides()
  all[name] = { ...all[name], ...patch }
  write(OVR_KEY, all)
}

// ─── 3. Per-session-kit edits ────────────────────────────────────────────────
// `added` = extra items the coach added; `removed` = base/derived items hidden.
export type KitEdit = { added: string[]; removed: string[] }
const KIT_KEY = 'lumio_coach_kit_edits'
export function getKitEdits(): Record<string, KitEdit> { return read<Record<string, KitEdit>>(KIT_KEY, {}) }
function kitFor(type: string): KitEdit {
  const all = getKitEdits()
  return all[type] ?? { added: [], removed: [] }
}
export function addKitItem(type: string, item: string) {
  const t = item.trim(); if (!t) return
  const all = getKitEdits(); const cur = kitFor(type)
  all[type] = { added: cur.added.includes(t) ? cur.added : [...cur.added, t], removed: cur.removed.filter(r => r !== t) }
  write(KIT_KEY, all)
}
// Remove an item: if it's a coach-added one, drop it; otherwise mark the
// base/derived item as removed so it stays hidden across reloads.
export function removeKitItem(type: string, item: string) {
  const all = getKitEdits(); const cur = kitFor(type)
  if (cur.added.includes(item)) {
    all[type] = { ...cur, added: cur.added.filter(a => a !== item) }
  } else {
    all[type] = { ...cur, removed: cur.removed.includes(item) ? cur.removed : [...cur.removed, item] }
  }
  write(KIT_KEY, all)
}

// ─── 4. Ordered items (restock) ──────────────────────────────────────────────
const ORD_KEY = 'lumio_coach_equip_ordered'
export function getOrdered(): string[] { return read<string[]>(ORD_KEY, []) }
export function markOrdered(names: string[]) {
  const set = new Set([...getOrdered(), ...names])
  write(ORD_KEY, Array.from(set))
}
export function clearOrdered(name: string) { write(ORD_KEY, getOrdered().filter(n => n !== name)) }
