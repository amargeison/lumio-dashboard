// Client-side store for the Payments & Packages page:
//  • offers   — the coach's price list (defaults + any they add), persisted
//  • progress — per-package session completion (tick boxes), persisted
// Notifies subscribers via a CustomEvent so views re-read on change.

import { PACKAGE_OFFERS, PACKAGES, type PackageOffer } from './coach-data'

const OFFERS_KEY = 'lumio_coach_pkg_offers'    // added offers
const HIDDEN_KEY = 'lumio_coach_pkg_hidden'    // removed default/added ids
const PROG_KEY = 'lumio_coach_pkg_progress'    // { [pkgId]: boolean[] }
const NOTES_KEY = 'lumio_coach_pkg_notes'      // { [pkgId]: string[] }
const EVT = 'lumio-coach-packages-changed'

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
function writeJSON(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

// ── Offers ──
export function getOffers(): PackageOffer[] {
  const added = readJSON<PackageOffer[]>(OFFERS_KEY, [])
  const hidden = readJSON<string[]>(HIDDEN_KEY, [])
  return [...added, ...PACKAGE_OFFERS].filter(o => !hidden.includes(o.id))
}
export function addOffer(o: PackageOffer) {
  writeJSON(OFFERS_KEY, [o, ...readJSON<PackageOffer[]>(OFFERS_KEY, [])])
}
export function removeOffer(id: string) {
  const added = readJSON<PackageOffer[]>(OFFERS_KEY, [])
  if (added.some(o => o.id === id)) { writeJSON(OFFERS_KEY, added.filter(o => o.id !== id)); return }
  const hidden = readJSON<string[]>(HIDDEN_KEY, [])
  if (!hidden.includes(id)) writeJSON(HIDDEN_KEY, [...hidden, id])
}

// ── Per-package session progress ──
export function getProgress(id: string): boolean[] | null {
  const all = readJSON<Record<string, boolean[]>>(PROG_KEY, {})
  return all[id] ?? null
}
export function setProgress(id: string, arr: boolean[]) {
  const all = readJSON<Record<string, boolean[]>>(PROG_KEY, {})
  all[id] = arr
  writeJSON(PROG_KEY, all)
}
// Used count from stored progress, or null if the package hasn't been opened yet.
export function usedFromProgress(id: string): number | null {
  const arr = getProgress(id)
  return arr ? arr.filter(Boolean).length : null
}

export function getNotes(id: string): string[] | null {
  const all = readJSON<Record<string, string[]>>(NOTES_KEY, {})
  return all[id] ?? null
}
export function setNotes(id: string, arr: string[]) {
  const all = readJSON<Record<string, string[]>>(NOTES_KEY, {})
  all[id] = arr
  writeJSON(NOTES_KEY, all)
}

// Record one delivered session against a player's active package: ticks the next
// open slot and stores an optional note (the session focus). Returns the package
// id + slot, or null if the player has no open package. Called when a session is
// marked complete in the Session Planner so packages stay in sync without the
// coach having to tick boxes by hand.
export function recordSessionForPlayer(playerName: string, note?: string): { pkgId: string; slot: number } | null {
  if (!playerName) return null
  const name = playerName.trim().toLowerCase()
  for (const pk of PACKAGES.filter(p => p.player.trim().toLowerCase() === name)) {
    const arr = (getProgress(pk.id) ?? Array.from({ length: pk.total }, (_, i) => i < pk.used)).slice()
    const slot = arr.findIndex(v => !v)
    if (slot === -1) continue   // this package is full — try the next one
    arr[slot] = true
    setProgress(pk.id, arr)
    if (note && note.trim()) {
      const notes = (getNotes(pk.id) ?? Array.from({ length: pk.total }, () => '')).slice()
      notes[slot] = note.trim()
      setNotes(pk.id, notes)
    }
    return { pkgId: pk.id, slot }
  }
  return null
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
