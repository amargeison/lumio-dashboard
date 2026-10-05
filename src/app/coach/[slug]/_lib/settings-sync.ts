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

import { sb, currentIdentity, invalidateCoachTable, tabStillMine } from './coach-db'
import { getFlags, primeFeatures, setFeaturesPersist, NEW_ACCOUNT_TIER } from './feature-flags'
import { getHidden, primeHidden, setMenuPersist } from './menu-visibility'
import { claimCoachStorage } from './storage-scope'
import {
  rawSettings, primeSettingsCache, setSettingsPersist, isDemoPortal, getHeadProfile,
  type CoachSettings,
} from './settings-store'

const TABLE = 'coach_settings'
// The academy whose settings row this browser may WRITE. Only ever set for the
// head coach, and only to their own id — an invited coach reads the academy's
// settings but never writes them (see startSettingsSync).
let coachId: string | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let pending = false
// True while saveSettingsNow is on its way to the server. A load that lands in
// that window would put the server's older copy back over what is being saved.
let saving = false
// Whose settings this browser's cache is known to mirror: set once the server
// copy has been loaded into it (or found not to exist). Until then the cache
// may be nothing but defaults, and must not be sent anywhere.
let hydratedFor: string | null = null

// Debounced so dragging a slider or typing in a text field is one write, not fifty.
const WRITE_DELAY_MS = 800

// ── The head coach is a coach too ───────────────────────────────────────────
// The head coach's details are edited in Settings and on the Coaches page, and
// both keep them in the settings record. Their own row in the coaches table —
// which the Court Planner, the booking form's coach list and every "who is
// coaching" label read — was only ever written by the setup wizard, so a name
// changed in Settings stayed the old one there, and the phone, email and DBS
// never reached it. Whenever the details change they are now copied to that
// row as part of the same save.
//
// `headSaved` is the details as they stood when the settings were loaded (or
// last copied). Loading never writes, and only the details that have CHANGED
// since then are copied — so a phone number that is on the coach row but was
// never in Settings is not wiped by editing something else.
function headRow(): Record<string, unknown> {
  const h = getHeadProfile()
  const text = (v: unknown) => String(v ?? '').trim() || null
  return {
    name: text(h.name), role: text(h.role), qualifications: text(h.accreditation),
    email: text(h.email), phone: text(h.phone),
    dbs_number: text(h.dbsNumber), dbs_issued: text(h.dbsIssued), dbs_expiry: text(h.dbsExpiry),
    safeguarding_trained: !!h.safeguardingTrained, safeguarding_date: text(h.safeguardingDate),
    contracted_hours: h.contractedHours ?? null,
  }
}
let headSaved: Record<string, unknown> | null = null
async function saveHeadRow() {
  if (!coachId || headSaved === null) return
  const was = headSaved
  const row = headRow()
  const changed = Object.fromEntries(Object.entries(row).filter(([k, v]) => v !== was[k]))
  // A name is never blanked: an empty box in Settings keeps the name on file.
  if (!changed.name) delete changed.name
  if (!Object.keys(changed).length) { headSaved = row; return }
  const { data, error } = await sb().from('coach_staff')
    .update({ ...changed, updated_at: new Date().toISOString() }).eq('coach_id', coachId).eq('is_head', true).select('id')
  if (error) { console.error('[settings-sync] head coach record not saved', error.message); return }
  // An academy older than the wizard's own head row: make one, so there is a
  // record to keep in step from now on.
  if (!(data || []).length) {
    if (!row.name) return
    const { error: addErr } = await sb().from('coach_staff').insert({ ...row, coach_id: coachId, is_head: true })
    if (addErr) { console.error('[settings-sync] head coach record not created', addErr.message); return }
  }
  headSaved = row
  invalidateCoachTable('coach_staff')
}

async function flush() {
  timer = null
  if (!coachId || !pending) return
  pending = false
  // Somebody else has signed in on this browser since the tab was opened:
  // what is in the cache may be theirs, and so is the session. Save nothing.
  if (!(await tabStillMine())) return
  // rawSettings(), not the value handed to the hook — the hook fires for resets
  // too, where the cache has just been cleared and the correct thing to store is
  // an empty blob rather than the defaults object passed in.
  // The feature flags ride along in the same blob. They are what tells the
  // family's app whether a module is live — see feature-flags.ts. NEW_ACCOUNT_TIER
  // is the fallback the LIVE portal itself uses when nothing is stored, so the
  // mirror always matches what the coach is actually looking at.
  // The hidden-menu list rides along too, so it follows the account to the
  // coach's other devices and to the coaches they invite.
  const data = { ...rawSettings(), features: getFlags(NEW_ACCOUNT_TIER), menuHidden: getHidden() }
  const { error } = await sb().from(TABLE).upsert(
    { coach_id: coachId, data, updated_at: new Date().toISOString() },
    { onConflict: 'coach_id' },
  )
  if (error) console.error('[settings-sync] save failed', error.message)
  else await saveHeadRow()
}

function schedule() {
  pending = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(flush, WRITE_DELAY_MS)
}

// Pull the server copy into the local cache. Returns false if there was nothing
// to pull, which the caller uses to decide whether to seed the server instead.
//
// Returns null when the load itself FAILED. That is not the same as "nothing
// stored": treating a failed read as an empty account would send this browser's
// cache up over settings we simply could not see.
type Stored = Partial<CoachSettings> & { features?: Record<string, boolean>; menuHidden?: unknown }

function prime(stored: Stored) {
  // primeSettingsCache, not setSettings — writing through setSettings would treat
  // the freshly-loaded server values as a local edit and push them straight back.
  primeSettingsCache(stored)
  primeFeatures(stored.features)
  if ('menuHidden' in stored) primeHidden(stored.menuHidden)
}

async function hydrate(): Promise<boolean | null> {
  if (!coachId) return false
  // A change made here that has not been saved yet is newer than the server's
  // copy. Loading over it would undo what the coach just did.
  if (pending || saving) return true
  const { data, error } = await sb().from(TABLE).select('data').eq('coach_id', coachId).maybeSingle()
  if (error) { console.error('[settings-sync] load failed', error.message); return null }
  const stored = (data as { data?: Stored } | null)?.data
  if (!stored || Object.keys(stored).length === 0) return false
  prime(stored)
  // What was just loaded is what is on file — nothing to copy to the coach row.
  headSaved = headRow()
  return true
}

// An invited coach works inside the head coach's academy, so the modules that
// are switched on, the theme, the colour and the tidied menu are the ACADEMY's
// choices. They cannot read the academy's settings row themselves (it is the
// head coach's, and holds their DBS record), so the server hands over the part
// that is theirs to see. Read-only: nothing here ever writes.
async function hydrateFromAcademy(academyId: string) {
  try {
    const r = await fetch(`/api/coach/academy-settings?academy=${encodeURIComponent(academyId)}`)
    if (!r.ok) return
    const j = await r.json()
    if (j && j.settings && typeof j.settings === 'object') prime({ menuHidden: [], ...j.settings })
  } catch { /* offline — keep what is cached */ }
}

// Save the whole settings blob NOW rather than on the usual short delay. For
// the moments just before the page reloads (finishing the setup wizard), where
// a delayed write would never run and the answers would stay in this browser.
// Laid over the server's copy, so nothing already saved there is dropped if
// this browser has not finished loading it.
//
// `patch` is laid on last, so the one thing the caller came to record is saved
// whatever else was going on in the cache at the time.
export async function saveSettingsNow(patch: Partial<CoachSettings> = {}): Promise<void> {
  if (typeof window === 'undefined' || isDemoPortal()) return
  saving = true
  try { await saveNow(patch) } finally { saving = false }
}

async function saveNow(patch: Partial<CoachSettings>): Promise<void> {
  if (!(await tabStillMine())) return
  const { data: auth } = await sb().auth.getUser()
  const uid = auth.user?.id
  const me = await currentIdentity()
  // The head coach, saving their own academy. Anybody else has no row to write.
  if (!uid || !me?.isHead || me.academyId !== uid) return
  if (!claimCoachStorage(uid)) return
  if (timer) { clearTimeout(timer); timer = null }
  pending = false
  const { data: cur, error: readErr } = await sb().from(TABLE).select('data').eq('coach_id', uid).maybeSingle()
  if (readErr) { console.error('[settings-sync] save failed', readErr.message); return }
  const server = (cur?.data as Record<string, unknown>) || {}
  // The cache goes up only when it is known to hold this account's settings.
  // On a device that has not loaded them yet it is just the defaults, and
  // sending those would blank what the coach saved elsewhere — so there, only
  // the patch is added to what the server already has.
  const data = hydratedFor === uid
    ? { ...server, ...rawSettings(), ...patch, features: getFlags(NEW_ACCOUNT_TIER), menuHidden: getHidden() }
    : { ...server, ...patch }
  const { error } = await sb().from(TABLE).upsert(
    { coach_id: uid, data, updated_at: new Date().toISOString() },
    { onConflict: 'coach_id' },
  )
  if (error) console.error('[settings-sync] save failed', error.message)
}

/** Record a choice against the account straight away (e.g. "Skip for now"). */
export async function rememberOnAccount(patch: Partial<CoachSettings>): Promise<void> {
  // Into the cache as it stands (not through setSettings, which would fill an
  // unloaded cache with defaults), then onto the account.
  primeSettingsCache({ ...rawSettings(), ...patch })
  await saveSettingsNow(patch)
}

let started = false
let running: Promise<() => void> | null = null
let holders = 0

// Call when the live portal mounts; call what it returns when it unmounts.
// No-op on the demo portal, which is canned by design and must never write a
// coach's settings anywhere.
//
// One sync however many times this is called. A second caller arriving while
// the first was still starting used to be handed a do-nothing stop, and when
// the first then stopped the sync went with it — leaving a mounted portal that
// saved nothing. (React mounts, unmounts and re-mounts in development, which is
// exactly that sequence.) Each caller now holds the same sync, and it stops
// when the last of them lets go.
export function startSettingsSync(): Promise<() => void> {
  holders++
  if (!running) running = begin()
  const mine = running
  let released = false
  return mine.then(stop => () => {
    if (released) return
    released = true
    holders--
    if (holders === 0) { stop(); if (running === mine) running = null }
  })
}

async function begin(): Promise<() => void> {
  if (typeof window === 'undefined' || isDemoPortal() || started) return () => {}
  started = true

  const me = await currentIdentity()
  if (!me) { started = false; return () => {} }   // signed out, or no access here — stay local-only

  // An invited coach: take the academy's settings, and write nothing. They have
  // no settings row of their own, and the academy's is not theirs to change —
  // trying to save it was refused by the database on every page load.
  if (!me.isHead) {
    const academyId = me.academyId
    await hydrateFromAcademy(academyId)
    const onFocusCoach = () => { if (document.visibilityState === 'visible') hydrateFromAcademy(academyId) }
    document.addEventListener('visibilitychange', onFocusCoach)
    window.addEventListener('focus', onFocusCoach)
    return () => {
      document.removeEventListener('visibilitychange', onFocusCoach)
      window.removeEventListener('focus', onFocusCoach)
      started = false
    }
  }

  // The head coach's id is the academy's id. The cache must be THEIRS before
  // any of it can be sent to the server: the portal claims it at sign-in, and
  // this asks again so that nothing here depends on that having happened. If it
  // was somebody else's it has just been emptied, and there is nothing to send.
  claimCoachStorage(me.academyId)
  coachId = me.academyId

  // Let a save that is already on its way land first, so the load below is a
  // real one (hydrate stands aside while a save is in flight).
  while (saving) await new Promise(r => setTimeout(r, 50))
  const hadServerCopy = await hydrate()
  // Could not read the server copy at all: change nothing, in either direction.
  if (hadServerCopy === null) { coachId = null; started = false; return () => {} }
  hydratedFor = coachId
  if (headSaved === null) headSaved = headRow()
  // First run on a device that already has this coach's local settings: seed the
  // server from the cache rather than silently discarding what is already there.
  if (!hadServerCopy && Object.keys(rawSettings()).length > 0) schedule()

  setSettingsPersist(schedule)
  setFeaturesPersist(schedule)
  setMenuPersist(schedule)
  // Nothing stored yet, or a blob written before flags travelled: seed it now so
  // the family's app stops guessing from this coach's very next page load.
  if (!hadServerCopy) schedule()

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
    setFeaturesPersist(null)
    setMenuPersist(null)
    coachId = null
    hydratedFor = null
    headSaved = null
    started = false
  }
}
