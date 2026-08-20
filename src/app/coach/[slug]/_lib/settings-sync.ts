'use client'

// Cross-device settings sync for the LIVE coach portal.
//
// Settings used to live only in localStorage, so a coach who set their academy up
// on an iMac saw none of it on the iPhone they actually carry onto court. This
// makes coach_settings the source of truth and leaves localStorage as a
// synchronous cache, so getSettings() stays sync and no call site changes.
//
// Deliberately NOT real-time. A single coach on two devices does not need
// subscriptions or CRDTs; they need their phone to be right when they pick it up.
// So: hydrate on mount and whenever the tab regains focus, write through on change.
//
// Conflict model is last-write-wins on the whole blob. Hydrating on focus keeps
// the window for a clobber small (you would have to edit settings on two devices
// without the second ever regaining focus in between). If that ever bites, the
// fix is per-key timestamps — not worth the complexity today.

import { sb, currentCoachId } from './coach-db'
import {
  rawSettings, primeSettingsCache, setSettingsPersist, isDemoPortal,
  type CoachSettings,
} from './settings-store'

const TABLE = 'coach_settings'
let coachId: string | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let pending = false

// Debounced so dragging a slider or typing in a text field is one write, not fifty.
const WRITE_DELAY_MS = 800

async function flush() {
  timer = null
  if (!coachId || !pending) return
  pending = false
  // rawSettings(), not the value handed to the hook — the hook fires for resets
  // too, where the cache has just been cleared and the correct thing to store is
  // an empty blob rather than the defaults object passed in.
  const data = rawSettings()
  const { error } = await sb().from(TABLE).upsert(
    { coach_id: coachId, data, updated_at: new Date().toISOString() },
    { onConflict: 'coach_id' },
  )
  if (error) console.error('[settings-sync] save failed', error.message)
}

function schedule() {
  pending = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(flush, WRITE_DELAY_MS)
}

// Pull the server copy into the local cache. Returns false if there was nothing
// to pull, which the caller uses to decide whether to seed the server instead.
async function hydrate(): Promise<boolean> {
  if (!coachId) return false
  const { data, error } = await sb().from(TABLE).select('data').eq('coach_id', coachId).maybeSingle()
  if (error) { console.error('[settings-sync] load failed', error.message); return false }
  const stored = (data as { data?: Partial<CoachSettings> } | null)?.data
  if (!stored || Object.keys(stored).length === 0) return false
  // primeSettingsCache, not setSettings — writing through setSettings would treat
  // the freshly-loaded server values as a local edit and push them straight back.
  primeSettingsCache(stored)
  return true
}

let started = false

// Call once when the live portal mounts. No-op on the demo portal, which is
// canned by design and must never write a coach's settings anywhere.
export async function startSettingsSync(): Promise<() => void> {
  if (typeof window === 'undefined' || isDemoPortal() || started) return () => {}
  started = true

  coachId = await currentCoachId()
  if (!coachId) { started = false; return () => {} }   // signed out — stay local-only

  const hadServerCopy = await hydrate()
  // First run on a device that already has local settings (e.g. the founder's own
  // browser, set up before this table existed): seed the server from the cache
  // rather than silently discarding what is already there.
  if (!hadServerCopy && Object.keys(rawSettings()).length > 0) schedule()

  setSettingsPersist(schedule)

  // Re-hydrate when the coach comes back to the tab — this is what makes "changed
  // it on the phone, now look at the iMac" work without a refresh.
  const onFocus = () => { if (document.visibilityState === 'visible') hydrate() }
  document.addEventListener('visibilitychange', onFocus)
  window.addEventListener('focus', onFocus)

  // Don't lose a debounced write if the tab is closed mid-timer.
  const onHide = () => { if (pending) flush() }
  window.addEventListener('pagehide', onHide)

  return () => {
    document.removeEventListener('visibilitychange', onFocus)
    window.removeEventListener('focus', onFocus)
    window.removeEventListener('pagehide', onHide)
    setSettingsPersist(null)
    started = false
  }
}
