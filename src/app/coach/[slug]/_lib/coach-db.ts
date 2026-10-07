'use client'

// Live data layer for the Lumio Tennis Coach portal.
//
// Every table is owned per-academy and protected by Supabase RLS, so the
// browser client can read/write directly and can only ever reach rows the
// signed-in coach is allowed. RLS is the boundary; it is NOT the scope. A coach
// who belongs to two academies is allowed rows in both, so every read here also
// asks for ONE academy by name — the one in the portal's address — and every
// write is filed under it (see "Whose academy am I working in?" below).

import { useState, useEffect, useCallback } from 'react'
import { isDemoPath, stillOwner, loseTab } from './storage-scope'
import { demoClient } from './demo/client'
import { installDemoFetch } from './demo/fetch'
import { createBrowserClient } from '@supabase/ssr'
import { ukDate, ukWeek } from '@/lib/coach/uk-date'
import { paymentOwedPennies } from '@/lib/coach/money'

export type CoachTable =
  | 'coach_players'
  | 'coach_staff'
  | 'coach_bookings'
  | 'coach_sessions'
  | 'coach_camps'
  | 'coach_camp_attendees'
  | 'coach_payments'
  | 'coach_packages'
  | 'coach_gps_sessions'
  | 'coach_messages'
  | 'coach_session_plans'
  | 'coach_courts'
  | 'coach_venues'
  | 'coach_development'
  | 'coach_equipment'
  | 'coach_kit_items'
  | 'coach_resources'
  | 'coach_attendance'
  | 'coach_player_skills'
  | 'coach_consent_submissions'
  | 'coach_watch_sessions'
  | 'coach_media'
  | 'coach_stripe'
  | 'coach_charges'
  | 'coach_camp_emails'
  | 'coach_player_resources'
  | 'coach_camp_channels'

// The demo portal runs these same components against an in-memory academy.
// Its coach-API calls are answered in the browser from the moment this module
// loads (see demo/fetch.ts); on a real portal the wrapper passes everything
// through untouched.
installDemoFetch()

// ── Which academy is this page showing? ─────────────────────────────────────
// The address after /coach/ — /tennis/coach/<address>. Null on the demo and
// anywhere that is not a coach portal.
export function portalAddress(): string | null {
  if (typeof window === 'undefined') return null
  const parts = window.location.pathname.split('/').filter(Boolean)
  const i = parts.indexOf('coach')
  const slug = i >= 0 ? (parts[i + 1] || '').toLowerCase() : ''
  // Portal addresses are letters, digits and hyphens. Anything else is not an
  // academy, and could not be sent in a header anyway.
  return slug && slug !== 'demo' && /^[a-z0-9-]+$/.test(slug) ? slug : null
}

// Every request the portal makes to the coach API says which academy it is for.
//
// The server routes used to work out "the caller's academy" by themselves: their
// own, else the newest one they joined. For a coach at two academies that is a
// guess, and a wrong one sends a message, takes a payment or imports a
// spreadsheet into the club they were not looking at. Forty components call
// those routes with a plain fetch, so — like the demo stand-in above — the
// address is added in one place rather than at every call. The server checks it
// against the caller's own memberships (lib/coach/membership.ts → coachSeat);
// it only ever chooses between academies they already belong to.
const ACADEMY_HEADER = 'x-lumio-academy'   // the same name membership.ts reads
const ACADEMY_ROUTES = /^\/api\/(coach|portal)\//
let _academyFetch = false
function installAcademyFetch() {
  if (_academyFetch || typeof window === 'undefined') return
  _academyFetch = true
  const inner = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const here = portalAddress()
    if (!here) return inner(input, init)
    let url: URL
    try { url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url, window.location.origin) } catch { return inner(input, init) }
    if (url.origin !== window.location.origin || !ACADEMY_ROUTES.test(url.pathname)) return inner(input, init)
    const headers = new Headers(init?.headers ?? (typeof input === 'object' && 'headers' in input ? input.headers : undefined))
    headers.set(ACADEMY_HEADER, here)
    return inner(input, { ...init, headers })
  }
}
installAcademyFetch()

let _sb: ReturnType<typeof createBrowserClient> | null = null
export function sb() {
  // On the demo there is no database: every read and write goes to the demo
  // store. Checked per call, so one browser tab moving between the demo and a
  // real academy always gets the right one.
  if (isDemoPath()) return demoClient() as unknown as ReturnType<typeof createBrowserClient>
  if (!_sb) {
    _sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    // A different person signing in on this tab must not inherit the last
    // person's academy. The identity is cached for the life of the page, so
    // without this a coach who signed out of one academy and straight into a
    // new account had every write filed under the OLD academy — and refused by
    // row level security ("new row violates row-level security policy").
    let lastUser: string | null | undefined
    _sb.auth.onAuthStateChange((_event: string, session: { user?: { id?: string } } | null) => {
      const uid = session?.user?.id ?? null
      if (lastUser !== undefined && uid !== lastUser) forgetIdentity()
      lastUser = uid
    })
  }
  return _sb
}

// ── Whose academy am I working in? ──────────────────────────────────────────
// NOT the same as "who am I", and the difference is the whole point of the
// coach-identity work. A head coach IS their academy; an assistant coach belongs
// to somebody else's. Every read and write in the portal funnels through here,
// so resolving it correctly once is what lets an assistant use the real portal
// rather than a cut-down copy of it.
//
// Row level security (migration 166) does the actual enforcing. This only picks
// which academy to ask about — a lie here gets you an empty result, not access.
export type CoachIdentity = {
  academyId: string
  staffId: string | null
  isHead: boolean
  role: 'head' | 'coach'
  brandName: string | null
  slug: string | null
  /** Has this coach set up their own kit list, or are they on the academy's? */
  equipmentOwn?: boolean
  /** The signed-in coach's own name/photo, so the shell can greet the right person. */
  displayName?: string | null
  avatarUrl?: string | null
  brandLogoUrl?: string | null
  staffRole?: string | null
  accreditation?: string | null
  /** Every academy this person coaches at — only sent when there is more than one. */
  academies?: { slug: string; name: string | null; isHead: boolean; current: boolean }[]
}

let _me: CoachIdentity | null = null
// The address `_me` was worked out for. The answer belongs to one academy, so
// it is thrown away if this tab moves to another academy's portal.
let _meFor: string | null | undefined
let _mePending: Promise<CoachIdentity | null> | null = null

// Why the last whoami produced no identity. The difference matters:
//
//   'anon'    — nobody is signed in. The demo shell. Old single-user behaviour
//               is correct here.
//   'denied'  — somebody IS signed in and we could not work out their access.
//               Assuming "head coach" here is how an assistant ended up looking
//               at a full admin nav over an academy that was not theirs.
//   'error'   — the call itself failed. Also not a reason to grant anything.
export type IdentityProblem = 'anon' | 'denied' | 'error' | null
let _problem: IdentityProblem = null
let _problemMessage: string | null = null

export function identityProblem(): IdentityProblem { return _problem }
export function identityMessage(): string | null { return _problemMessage }

export async function currentIdentity(): Promise<CoachIdentity | null> {
  const here = portalAddress()
  const moved = _meFor !== undefined && here !== _meFor
  _meFor = here
  if (moved) {
    // A different academy's address: nothing remembered or cached for the last
    // one may be shown here.
    _me = null; _mePending = null; _problem = null; _problemMessage = null
    invalidateCoachTable()
  }
  if (_me) return _me
  // De-duped: the portal mounts a dozen data hooks at once and they all ask.
  if (!_mePending) {
    let mine: Promise<CoachIdentity | null> | null = null
    mine = (async () => {
      try {
        // Asked about THIS address: the academy is the one in the URL, not
        // whichever the coach joined most recently.
        const r = await fetch(here ? `/api/coach/whoami?slug=${encodeURIComponent(here)}` : '/api/coach/whoami')
        if (!r.ok) {
          _problem = r.status === 401 ? 'anon' : 'denied'
          if (_problem === 'denied') {
            const d = await r.json().catch(() => ({}))
            _problemMessage = typeof d?.error === 'string' ? d.error : null
          }
          return null
        }
        const d = await r.json()
        // The tab moved to another academy while this was on its way.
        if (portalAddress() !== here) return null
        _problem = null; _problemMessage = null
        _me = d as CoachIdentity
        return _me
      } catch { _problem = 'error'; return null }
      finally { if (!mine || _mePending === mine) _mePending = null }
    })()
    _mePending = mine
  }
  return _mePending
}

// ── Is this tab still signed in as the person it was opened for? ────────────
// The sign-in belongs to the browser, so somebody else signing in in another
// tab changes who THIS tab is, mid-page. Everything typed here was then saved
// into the new person's account. Asked before every write (and whenever the
// tab is looked at again): the first signed-in person this tab sees is its
// owner, and a different one means the tab stops and asks for a reload.
// stillOwner() covers the other half — the browser cache changing hands.
let _tabUser: string | null = null
export const TAB_LOST_MESSAGE = 'You\u2019ve been signed out in this tab. Reload to continue.'
export async function tabStillMine(): Promise<boolean> {
  if (typeof window === 'undefined' || isDemoPath()) return true
  if (!stillOwner()) return false
  try {
    const { data } = await sb().auth.getSession()
    const uid: string | null = data.session?.user?.id ?? null
    if (uid && _tabUser && uid !== _tabUser) { loseTab(); return false }
    if (uid && !_tabUser) _tabUser = uid
  } catch { /* could not tell — row level security still checks every write */ }
  return true
}

/** The academy id every coach_* row is filed under. */
export async function currentCoachId(): Promise<string | null> {
  // Nobody to read or write as, once the tab is somebody else's.
  if (!(await tabStillMine())) return null
  const me = await currentIdentity()
  if (me?.academyId) return me.academyId
  // Fallback for anything running before/without the whoami route — the old
  // behaviour, which is correct for a head coach and harmless otherwise.
  const { data } = await sb().auth.getUser()
  return data.user?.id ?? null
}

/** Clear the cached identity — call on sign-out. */
export const IDENTITY_CHANGED = 'lumio-identity-changed'

export function forgetIdentity() {
  _me = null; _mePending = null; _problem = null; _problemMessage = null
  // The portal shell holds the identity (name, photo) in React state, so
  // clearing the cache alone repaints nothing until the next full load — which
  // is why a coach's new photo appeared on the settings page and nowhere else
  // until they reloaded.
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(IDENTITY_CHANGED))
}

// Tables where "which coach is this for" is a real question (migration 165).
// Anything an assistant coach creates is theirs; the head coach creates rows for
// the academy, which is what a null staff_id means.
const ASSIGNABLE = new Set<CoachTable>([
  'coach_players', 'coach_bookings', 'coach_sessions', 'coach_session_plans',
  'coach_camps', 'coach_development', 'coach_attendance',
  // Equipment joined this list with migration 168, which gave a coach their own
  // kit. Their rows are only visible — and only writable — when they carry their
  // staff_id, so without the stamp every "Add item" was refused by row level
  // security and vanished without a word.
  'coach_equipment', 'coach_kit_items',
])

// ── "View as coach" preview scope ───────────────────────────────────────────
// When the HEAD COACH looks through a coach's eyes, the portal must show what
// that coach would actually see. It is presentation only — the head coach's row
// level security genuinely permits every row, so this is a filter, not a
// boundary, and it is the reason a preview is not a substitute for signing in as
// the coach to verify access.
//
// For a REAL coach nothing here is load-bearing: migration 166 means the rows
// never leave the database in the first place.
let _previewStaffId: string | null = null
export function setPreviewStaff(id: string | null) {
  if (_previewStaffId === id) return
  _previewStaffId = id
  invalidateCoachTable()   // cached rows were fetched under the previous scope
}
export function getPreviewStaff() { return _previewStaffId }

// ── One kit list per view ───────────────────────────────────────────────────
// Equipment is either the academy's list (staff_id null) or one coach's own
// (migration 168) — never both at once. Row level security lets the head coach
// read every coach's list, and lets a coach read the academy's beside their own,
// so without this the two were shown merged: every item twice, every count
// doubled, on the Equipment page and on the dashboard.
//
// Returns the staff id whose list this view shows, null for the academy's, or
// undefined when nobody is identified (the demo) and nothing should be narrowed.
const KIT_TABLES = new Set<CoachTable>(['coach_equipment', 'coach_kit_items'])
async function kitListOwner(): Promise<string | null | undefined> {
  const me = await currentIdentity()
  if (!me) return undefined
  if (!me.isHead) return me.equipmentOwn && me.staffId ? me.staffId : null
  if (!_previewStaffId) return null
  // "View as coach": that coach's own list if they have set one up, else the
  // academy's — which is what they see themselves.
  const { data } = await sb().from('coach_staff').select('equipment_own').eq('id', _previewStaffId).maybeSingle()
  return (data as { equipment_own?: boolean } | null)?.equipment_own ? _previewStaffId : null
}

export async function dbList<T = any>(table: CoachTable): Promise<T[]> {
  // THIS academy's rows, asked for by name. Row level security alone is not
  // enough: a coach who belongs to two academies is allowed rows in both, and
  // without this the roster, bookings and payments of both clubs were merged on
  // one screen.
  const academy = await currentCoachId()
  if (!academy) {
    // Nobody to ask as. If that is because the check itself failed (offline),
    // it is a failed load, not an empty academy.
    markLoad(table, identityProblem() !== 'error')
    return []
  }
  let q = sb().from(table).select('*').eq('coach_id', academy)
  if (KIT_TABLES.has(table)) {
    const owner = await kitListOwner()
    if (owner !== undefined) q = owner ? q.eq('staff_id', owner) : q.is('staff_id', null)
  }
  // Only the tables that carry an assignment. Venues and resources are
  // academy-wide by design, so filtering them would show the coach less than
  // they really get.
  else if (_previewStaffId && ASSIGNABLE.has(table)) q = q.eq('staff_id', _previewStaffId)
  // Payments have no coach of their own — they belong to a player. Previewing a
  // coach shows only what their players owe, which is exactly what that coach
  // can read when signed in (migration 188). Messages are the same: that coach
  // reads the conversations of their own players and no others (migration 196),
  // so the preview must not list the head coach's whole inbox.
  if (_previewStaffId && (table === 'coach_payments' || table === 'coach_messages')) {
    const { data: mine } = await sb().from('coach_players').select('id').eq('coach_id', academy).eq('staff_id', _previewStaffId)
    const ids = (mine ?? []).map((r: { id: string }) => r.id)
    if (!ids.length) return []
    q = q.in('player_id', ids)
  }
  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) { console.error('[coach-db] list', table, error.message); markLoad(table, false); return [] }
  // "Nothing here" is only believed when we know whose academy was asked for.
  // If that check could not be made, the id above was a fallback (the person's
  // own), which finds nothing for a coach in somebody else's academy.
  if (!data?.length && identityProblem() === 'error') { markLoad(table, false); return [] }
  markLoad(table, true)
  return (data ?? []) as T[]
}

// ── Reads that FAILED ───────────────────────────────────────────────────────
// A read that fails still returns [] above, so no caller has to change — but
// "could not load" is not "nothing there". With no signal the roster showed
// "No players yet" to a coach with forty players. The portal shell listens for
// this and says the data could not be loaded, with a way to try again.
export const LOAD_FAILED = 'lumio-coach-load-failed'
const _failed = new Set<CoachTable>()
export function failedTables(): CoachTable[] { return Array.from(_failed) }
function markLoad(table: CoachTable, ok: boolean) {
  const was = _failed.has(table)
  if (ok) _failed.delete(table); else _failed.add(table)
  const failing = !ok
  if (was !== failing && typeof window !== 'undefined') window.dispatchEvent(new Event(LOAD_FAILED))
}

// What to say when a save could not reach the server. The raw text was
// "TypeError: Failed to fetch".
function saveError(message: string): string {
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message)
    ? 'That was not saved — you appear to be offline. Check your connection and try again.'
    : message
}

export async function dbInsert(table: CoachTable, row: Record<string, any>) {
  const me = await currentIdentity()
  const coach_id = me?.academyId ?? await currentCoachId()
  if (!coach_id) throw new Error('Not signed in')
  // Without this an assistant would create rows they cannot then read back:
  // the RLS policy needs staff_id to match their membership.
  const stamp = (!me?.isHead && me?.staffId && ASSIGNABLE.has(table) && row.staff_id === undefined)
    ? { staff_id: me.staffId } : {}
  const { data, error } = await sb().from(table).insert({ ...clean(row), ...stamp, coach_id }).select().single()
  if (error) { console.error('[coach-db] insert', table, error.message); throw new Error(saveError(error.message)) }
  rowsChanged(table)
  // The server decides what the family is told — see sendBookingConfirmation.
  if (table === 'coach_bookings') { syncBookingCalendar(data); sendBookingConfirmation(data) }
  if (table === 'coach_camps') syncCampCalendar(data)
  return data
}

export async function dbUpdate(table: CoachTable, id: string, row: Record<string, any>) {
  // Only ever a row of the academy on screen — the same scope the reads use.
  const coach_id = await currentCoachId()
  if (!coach_id) throw new Error('Not signed in')
  const patch = clean(row)

  // `updated_at` is stamped on every write, but not every table has the column —
  // and PostgREST rejects the WHOLE statement when one field is unknown, so a
  // missing audit column silently killed real edits. The Finance tab's "tick
  // when paid" checkbox did nothing for exactly this reason: coach_camp_attendees
  // had no updated_at, the update threw, and the controlled checkbox snapped
  // back looking like a dead button.
  //
  // Migration 162 adds the column where it was missing. This retry is the
  // belt: the next table created without it degrades to "saved, not stamped"
  // instead of "the button does nothing".
  let { data, error } = await sb().from(table)
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).eq('coach_id', coach_id).select().single()

  if (error && /updated_at/i.test(error.message)) {
    console.warn('[coach-db] %s has no updated_at column — saving without it', table)
    ;({ data, error } = await sb().from(table).update(patch).eq('id', id).eq('coach_id', coach_id).select().single())
  }

  if (error) { console.error('[coach-db] update', table, error.message); throw new Error(saveError(error.message)) }
  rowsChanged(table)
  if (table === 'coach_bookings') {
    syncBookingCalendar(data)
    // A moved or cancelled booking has to reach the family too. The server
    // compares the booking with what they were last told and sends "moved",
    // "cancelled", a first confirmation — or nothing, for an edit that changes
    // none of those.
    sendBookingConfirmation(data)
    // Moving a booking moves its session plan — the database does that (migration
    // 179), so the copy in this tab is now out of date. Drop it rather than let
    // the planner keep showing the old date and look like it lost the plan.
    rowsChanged('coach_session_plans')
  }
  // Moving a camp's dates has to move the event, not leave last month's block
  // sitting on the coach's phone.
  if (table === 'coach_camps') syncCampCalendar(data)
  return data
}

export async function dbRemove(table: CoachTable, id: string) {
  const coach_id = await currentCoachId()
  if (!coach_id) throw new Error('Not signed in')
  // Deleting a booking the family has been told about is, to them, a
  // cancellation — and once the row is gone the server has nothing left to say
  // who to tell. So it is asked FIRST, and waited for. If that fails the delete
  // still goes ahead: the coach asked for it, and a note that could not be sent
  // must not leave a booking they cannot remove.
  if (table === 'coach_bookings') {
    try {
      await fetch('/api/coach/bookings/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id, removing: true }),
      })
    } catch { /* delete anyway */ }
  }
  const { error } = await sb().from(table).delete().eq('id', id).eq('coach_id', coach_id)
  if (error) { console.error('[coach-db] remove', table, error.message); throw new Error(saveError(error.message)) }
  rowsChanged(table)
  if (table === 'coach_bookings') removeBookingCalendar(id)
  if (table === 'coach_camps') {
    fetch(`/api/coach/camps/sync?campId=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => { /* the camp is gone either way */ })
  }
}

// Drop empty strings → null and strip internal fields before writing.
function clean(row: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(row)) {
    if (k === 'id' || k === 'coach_id' || k === 'created_at' || k === 'updated_at') continue
    out[k] = v === '' ? null : v
  }
  return out
}

// ── Calendar sync (Phase 2) ─────────────────────────────────────────────────
// ONE-WAY push: Lumio booking → the coach's connected calendars, via the server
// route. Importing calendar events back into Lumio is not built.
//
// The push stays fire-and-forget so it never blocks or fails the DB write — but
// the outcome is no longer thrown away. It's published on the little store below
// so the booking calendar can show "Synced" only when a write actually landed,
// and "Sync failed" when it didn't.

export type CalSyncState =
  | { status: 'idle' }
  | { status: 'syncing' }
  | { status: 'synced'; providers: string[]; at: number }
  | { status: 'failed'; reason: string; at: number }

let calSyncState: CalSyncState = { status: 'idle' }
const calSyncSubs = new Set<(s: CalSyncState) => void>()

export function getCalendarSyncState(): CalSyncState { return calSyncState }
export function subscribeCalendarSync(fn: (s: CalSyncState) => void): () => void {
  calSyncSubs.add(fn)
  fn(calSyncState)
  return () => { calSyncSubs.delete(fn) }
}
function setCalSync(s: CalSyncState) {
  calSyncState = s
  calSyncSubs.forEach(fn => { try { fn(s) } catch { /* a bad subscriber must not break sync */ } })
}

// Booking confirmation email — to the player or (for an under-16) their parent,
// plus a copy to the coach so a new booking never goes unseen.
//
// Fire-and-forget like the calendar push, so a mail failure can never block or
// fail the booking write itself. The SERVER decides the recipient and builds the
// content; the client only ever sends a booking id, so nothing about who gets
// emailed is decided in the browser.
function sendBookingConfirmation(row: any) {
  try {
    if (!row?.id) return
    // No checks here on purpose. Whether the academy has booking emails switched
    // on, and whether this booking is pending, cancelled, moved or unchanged, is
    // decided by the server from the database — a check made in this browser was
    // only ever true for this browser.
    fetch('/api/coach/bookings/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: row.id }),
    }).catch(() => { /* silent — the booking itself already saved */ })
  } catch { /* ignore */ }
}

// Camps go to the coach's calendar too.
//
// They never used to, which is why a coach who connected iCloud watched every
// one-hour lesson land on their phone while a week in Spain did not. A camp has
// no start time and runs for days, so the server pushes it as one block across
// the trip — see /api/coach/camps/sync.
//
// Fire-and-forget, exactly like the booking push: a calendar that is down must
// never stop a coach saving a camp.
function syncCampCalendar(row: any) {
  try {
    if (!row?.id || !row.start_date) return
    fetch('/api/coach/camps/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campId: row.id }),
    }).catch(() => { /* silent — the camp itself already saved */ })
  } catch { /* ignore */ }
}

function syncBookingCalendar(row: any) {
  try {
    if (!row?.id) return
    if (row.status === 'cancelled') { removeBookingCalendar(row.id); return }
    if (!row.booking_date || !row.start_time) return
    const [h, m] = String(row.start_time).split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return
    const dur = Number(row.duration_min) || 60
    const total = h * 60 + m + dur
    const pad = (n: number) => String(n).padStart(2, '0')
    const start = `${row.booking_date}T${pad(h)}:${pad(m)}:00`
    const end = `${row.booking_date}T${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}:00`
    setCalSync({ status: 'syncing' })
    fetch('/api/coach/calendar/event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: row.id,
        title: row.title || row.player_name || 'Lesson',
        start, end,
        location: row.court || undefined,
        description: row.notes || undefined,
      }),
    })
      .then(async res => {
        const j = await res.json().catch(() => ({} as any))
        if (res.ok && j?.ok) {
          // No calendar connected at all — nothing to report either way.
          if (!j.connected) { setCalSync({ status: 'idle' }); return }
          setCalSync({ status: 'synced', providers: j.synced ?? [], at: Date.now() })
          return
        }
        const reason = j?.failed?.[0]?.reason || j?.error || `Calendar sync failed (HTTP ${res.status}).`
        console.error('[coach-db] calendar sync failed', j)
        setCalSync({ status: 'failed', reason, at: Date.now() })
      })
      .catch(err => {
        console.error('[coach-db] calendar sync error', err)
        setCalSync({ status: 'failed', reason: "Couldn't reach the calendar sync service.", at: Date.now() })
      })
  } catch { /* never block the write */ }
}
function removeBookingCalendar(id: string) {
  try { fetch(`/api/coach/calendar/event?bookingId=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {}) } catch { /* ignore */ }
}

// ── Per-table cache (stale-while-revalidate) ────────────────────────────────
// Navigating between modules used to re-query Supabase from scratch on every
// mount. We now cache each table's rows in memory: a re-visit shows cached rows
// INSTANTLY and refreshes in the background. Concurrent reads for the same table
// are de-duped into a single request.
const _tableCache = new Map<CoachTable, any[]>()
const _inflight = new Map<CoachTable, Promise<any[]>>()
// The newest read started for each table. A read asked for after a save can
// overtake one that set off before it; the older answer must not be the one
// that is kept.
const _newest = new Map<CoachTable, Promise<any[]>>()

// Are these the same rows as before? Compared by id and last-changed time,
// which every table carries; rows without them are compared whole.
function sameRows(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false
  const key = (r: unknown) => {
    const o = r as { id?: unknown; updated_at?: unknown; created_at?: unknown } | null
    return o && o.id != null ? `${o.id}|${o.updated_at ?? o.created_at ?? ''}` : JSON.stringify(r)
  }
  for (let i = 0; i < a.length; i++) if (key(a[i]) !== key(b[i])) return false
  return true
}

function _fetchList<T>(table: CoachTable, force = false): Promise<T[]> {
  if (!force && _inflight.has(table)) return _inflight.get(table) as Promise<T[]>
  const gen = _cacheGen
  const p = dbList<T>(table)
    .then(rows => {
      if (_inflight.get(table) === (p as Promise<any[]>)) _inflight.delete(table)
      // A newer read of this table has started since (something was saved in
      // between): these rows are from before it, so hand back the newer ones.
      const newer = _newest.get(table)
      if (gen === _cacheGen && newer && newer !== (p as Promise<any[]>)) return newer as Promise<T[]>
      // Everything was cleared while this read was on its way — the head coach
      // switched whose view this is, so these rows were read for the previous
      // view. Read again rather than hand back (and cache) the wrong coach's rows.
      if (gen !== _cacheGen) return _fetchList<T>(table)
      // A failed read must not replace rows that loaded earlier with nothing,
      // and must not be remembered as "this table is empty".
      if (_failed.has(table)) return (_tableCache.get(table) as T[] | undefined) ?? rows
      const before = _tableCache.get(table)
      _tableCache.set(table, rows)
      // Rows can change without this browser doing it: a family signs up on the
      // public camp page, another coach adds a booking. Opening a screen reads
      // its table again, and that screen showed the new rows — but anything
      // else built from the same table (the right-hand panel's player count)
      // kept the old ones until the page was reloaded. So when a read comes
      // back different from what was held, everything showing the table is
      // told. Listeners take the rows just stored; none of them reads again,
      // so this cannot loop.
      if (before !== undefined && !sameRows(before, rows)) tellChanged(table)
      return rows
    })
    .catch(err => { if (_inflight.get(table) === (p as Promise<any[]>)) _inflight.delete(table); throw err })
  _inflight.set(table, p as Promise<any[]>)
  _newest.set(table, p as Promise<any[]>)
  return p
}

// ── "These rows have changed" ───────────────────────────────────────────────
// Each screen used to refresh only its own copy after a save, so anything else
// built from the same rows — the right-hand rail, the dashboard tiles, a second
// list of the same table — kept its old numbers until the whole page was
// reloaded: 16 players on the roster, 15 in the rail beside it.
//
// Every save, edit and delete that goes through this file now says which table
// it touched. One fresh read is started for it, and everything showing that
// table (useCoachTable, useCoachStats, the dashboard) takes its rows from that
// same read. A screen that changes rows some other way — a server route that
// deletes or merges players — calls rowsChanged() itself with the tables the
// route touched.
type ChangeListener = (table: CoachTable | null) => void
const _changeSubs = new Set<ChangeListener>()

/** Be told when a table's rows change (null: every table). Returns the unsubscribe. */
export function onRowsChanged(fn: ChangeListener): () => void {
  _changeSubs.add(fn)
  return () => { _changeSubs.delete(fn) }
}
function tellChanged(table: CoachTable | null) {
  _changeSubs.forEach(fn => { try { fn(table) } catch { /* one bad listener must not stop the rest */ } })
}

/** Rows of these tables were just changed on the server: read them again and tell every screen. */
export function rowsChanged(...tables: CoachTable[]) {
  for (const table of new Set(tables)) {
    // Started here, so every listener shares the one read. What is on screen
    // stays until the fresh rows arrive — nothing blinks empty.
    _fetchList(table, true).catch(() => { /* a failed refresh keeps the rows already shown */ })
    tellChanged(table)
  }
}

// Everything that hangs off a player. Deleting or merging players is done by a
// server route and changes all of these at once.
export const PLAYER_TABLES: CoachTable[] = ['coach_players', 'coach_player_skills', 'coach_attendance', 'coach_bookings', 'coach_sessions', 'coach_payments', 'coach_messages', 'coach_camp_attendees', 'coach_media', 'coach_development']

// The freshest rows without asking twice: the read that is already on its way
// if there is one, else what is cached, else a first read.
export function latestRows<T = unknown>(table: CoachTable): Promise<T[]> {
  const going = _inflight.get(table)
  if (going) return going as Promise<T[]>
  const have = _tableCache.get(table)
  return have !== undefined ? Promise.resolve(have as T[]) : _fetchList<T>(table)
}

// What the cache already holds for a table, without touching the network.
export function cachedRows<T = unknown>(table: CoachTable): T[] | undefined {
  return _tableCache.get(table) as T[] | undefined
}

// Read a table through the shared cache (de-duped with any read already in
// flight). `force` skips a request that is already running and asks again.
export function loadRows<T = unknown>(table: CoachTable, force = false): Promise<T[]> {
  return _fetchList<T>(table, force)
}

// Warm the cache for a set of tables in parallel. The portal calls this once it
// knows who is signed in, so opening a page afterwards is instant instead of a
// fresh round trip per module — and a page never renders its "nothing here yet"
// state just because its rows had not arrived.
export function prefetchCoachTables(tables: CoachTable[]): Promise<void> {
  return Promise.all(tables.map(t => _tableCache.has(t) ? null : _fetchList(t).catch(() => null))).then(() => undefined)
}

// Clear cached rows (e.g. after sign-out or a bulk import) so the next read is fresh.
let _cacheGen = 0   // counts full clears, so a read already in flight can tell it is out of date
export function invalidateCoachTable(table?: CoachTable) {
  if (table) { _tableCache.delete(table); _inflight.delete(table); _newest.delete(table) }
  else { _tableCache.clear(); _inflight.clear(); _newest.clear(); _cacheGen++ }
  // Whatever is on screen was built from the rows just dropped (a bulk import,
  // a "delete everything", a switch of view), so it reads them again.
  tellChanged(table ?? null)
}

// ── React hook: rows + CRUD for one table ──────────────────────────────────
export function useCoachTable<T = any>(table: CoachTable) {
  const cached = _tableCache.get(table) as T[] | undefined
  const [rows, setRows] = useState<T[]>(cached ?? [])
  const [loading, setLoading] = useState(cached === undefined)
  const [error, setError] = useState<string | null>(null)

  // Force-fresh reload (an explicit refresh, e.g. after a server route changed
  // rows). Everything else showing this table is told too.
  const reload = useCallback(async () => {
    if (_tableCache.get(table) === undefined) setLoading(true)
    try { rowsChanged(table); setRows(await latestRows<T>(table)) } finally { setLoading(false) }
  }, [table])
  // After a save made through this file: the fresh read has already been
  // started (see rowsChanged), so wait for that one rather than asking again.
  const settle = useCallback(async () => {
    try { setRows(await latestRows<T>(table)) } finally { setLoading(false) }
  }, [table])

  // On mount: show cache instantly, then revalidate in the background (de-duped).
  useEffect(() => {
    let alive = true
    const c = _tableCache.get(table) as T[] | undefined
    if (c !== undefined) { setRows(c); setLoading(false) }
    _fetchList<T>(table, false)
      .then(d => { if (alive) { setRows(d); setLoading(false) } })
      .catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [table])

  // Rows of this table changed somewhere else — another screen's save, a server
  // route, a bulk import. Show the same fresh rows everything else is showing.
  useEffect(() => {
    let alive = true
    const off = onRowsChanged(t => {
      if (t !== null && t !== table) return
      latestRows<T>(table).then(d => { if (alive) { setRows(d); setLoading(false) } }).catch(() => { /* keep what is shown */ })
    })
    return () => { alive = false; off() }
  }, [table])

  const add = useCallback(async (row: Record<string, any>) => {
    try { await dbInsert(table, row); await settle() }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); throw e }
  }, [table, settle])

  const edit = useCallback(async (id: string, row: Record<string, any>) => {
    try { await dbUpdate(table, id, row); await settle() }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); throw e }
  }, [table, settle])

  const remove = useCallback(async (id: string) => {
    try { await dbRemove(table, id); await settle() }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); throw e }
  }, [table, settle])

  return { rows, loading, error, reload, add, edit, remove }
}

// ── Dashboard / rail stats from live data ──────────────────────────────────
export interface CoachStats {
  players: number; lessonsThisWeek: number; staff: number; upcomingBookings: number; loading: boolean
  sessionsToday: number; racketsReady: number; outstandingPayments: number; newPlayers: number
  /** Bookings that have been and gone with no lesson summary written. The one
      number that is actionable every day, and the one that feeds the parent
      app — so it stands in for "rackets ready" when the ladder is switched off. */
  summariesDue: number
  racketCounts: number[]   // aligned to RACKET_STAGES order
}

const emptyStats: CoachStats = { players: 0, lessonsThisWeek: 0, staff: 0, upcomingBookings: 0, loading: true, sessionsToday: 0, racketsReady: 0, outstandingPayments: 0, newPlayers: 0, summariesDue: 0, racketCounts: [] }
const dayKey = (d?: string | null) => String(d ?? '').slice(0, 10)

/**
 * `scope` is whose portal is on screen (the coach being previewed, or null).
 * The numbers are re-read when it changes — they used to be read once, so
 * switching to "View as coach" left the academy's totals in the rail.
 *
 * They are also worked out again whenever one of the tables they are built
 * from changes (see rowsChanged). They used not to be: add a player and the
 * roster said 16 while the rail beside it said 15 until the page was reloaded.
 */
const STATS_TABLES: CoachTable[] = ['coach_players', 'coach_staff', 'coach_sessions', 'coach_bookings', 'coach_player_skills', 'coach_payments']

export function useCoachStats(enabled = true, scope: string | null = null): CoachStats {
  const [s, setS] = useState<CoachStats>(emptyStats)

  useEffect(() => {
    if (!enabled) { setS(v => ({ ...v, loading: false })); return }
    let cancelled = false
    // Several tables can change at once (a deleted player takes bookings and
    // payments with them): only the last run to start may set the numbers.
    let run = 0
    const work = async () => {
      const mine = ++run
      // "Today" is the UK date and "this week" is Monday to Sunday — the same
      // definitions the dashboard tile and the calendar use (lib/coach/uk-date).
      const today = ukDate()
      const week = ukWeek(today)
      const inWeek = (d?: string | null) => { const k = d ? (String(d).length > 10 ? ukDate(d) : dayKey(d)) : ''; return k >= week.start && k <= week.end }
      // Read via the shared per-table cache (plain GETs, de-duped with the rest of
      // the portal). We deliberately do NOT use `{ count:'exact', head:true }` HEAD
      // requests here — under the dashboard's load those were returning 503 and
      // breaking the Staff and Lessons-this-week tiles. Counts are derived from the
      // arrays instead.
      // latestRows: the read already on its way after a save, else the cached
      // rows — so a change to one table does not re-read the other five.
      const [prows, staff, sessions, brows, srows, pays] = await Promise.all(STATS_TABLES.map(t => latestRows<any>(t)))
      if (cancelled || mine !== run) return
      const skillFor = (pid: string) => Object.fromEntries(srows.filter((r: any) => r.player_id === pid).map((r: any) => [r.skill, r.score]))
      // 4 = Consistent on every skill: the rule the Racket Progression page uses
      // for "100%" and its award button, so this count and that page agree.
      const awardThreshold = 4
      const racketsReady = prows.filter((p: any) => {
        const list = SKILLS_BY_STAGE[p.racket_stage] || []
        if (!list.length) return false
        const m: any = skillFor(p.id)
        return list.every(sk => (m[sk] || 0) >= awardThreshold)
      }).length
      // A lesson that has happened and has no summary. Matched on player + date
      // against coach_sessions, so a summary written for that day counts however
      // it was created. Only the last fortnight — a booking from March with no
      // summary is history, not a to-do list.
      const fortnight = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
      const summaryKey = (name: unknown, date: unknown) => `${String(name || '').trim().toLowerCase()}|${dayKey(date as string | null | undefined)}`
      const written = new Set(sessions.map((r: any) => summaryKey(r.player_name, r.session_date)))
      const summariesDue = brows.filter((b: any) => {
        const d = dayKey(b.booking_date)
        if (!d || d >= today || d < fortnight) return false
        if ((b.status || '') === 'cancelled') return false
        const who = b.player_name || b.title
        return !!who && !written.has(summaryKey(who, b.booking_date))
      }).length

      setS({
        players: prows.length,
        staff: staff.length,
        lessonsThisWeek: sessions.filter((r: any) => inWeek(r.session_date)).length,
        upcomingBookings: brows.filter((b: any) => dayKey(b.booking_date) >= today && b.status !== 'cancelled').length,
        sessionsToday: brows.filter((b: any) => dayKey(b.booking_date) === today && b.status !== 'cancelled').length,
        racketsReady,
        // Added up in pennies, so the total is exact; held in pounds as before.
        // The same rule as the Payments page: a refunded or cancelled line is not owed.
        outstandingPayments: pays.reduce((t: number, p: any) => t + paymentOwedPennies(p), 0) / 100,
        newPlayers: prows.filter((p: any) => inWeek(p.created_at)).length,
        summariesDue,
        racketCounts: RACKET_STAGES.map(st => prows.filter((p: any) => p.racket_stage === st.id).length),
        loading: false,
      })
    }
    // A read that fails outright leaves the numbers as they were.
    const again = () => { work().catch(() => { /* keep what is shown */ }) }
    again()
    const off = onRowsChanged(t => { if (t === null || STATS_TABLES.includes(t)) again() })
    return () => { cancelled = true; off() }
  }, [enabled, scope])

  return s
}

// ── Coach profile / contact config ─────────────────────────────────────────
export interface CoachProfile {
  display_name: string | null
  brand_name: string | null
  // Uploaded during onboarding and written to sports_profiles.brand_logo_url.
  // It was stored but never selected back, so the coach's own logo existed in the
  // database and nothing could read it — the printed welcome pack came out unbranded.
  brand_logo_url: string | null
  // The head coach's own photo. Written by onboarding and by the Coaches page;
  // selected back because the head's face lives HERE, not in coach_staff — so a
  // form reading only the local settings copy showed initials for a coach who
  // plainly had a photo on every other screen.
  avatar_url: string | null
  contact_email: string | null
  contact_phone: string | null
  calendar_provider: string | null
  dpa_accepted_at: string | null
  loading: boolean
}

export function useCoachProfile(): CoachProfile & { reload: () => void } {
  const [p, setP] = useState<CoachProfile>({ display_name: null, brand_name: null, brand_logo_url: null, avatar_url: null, contact_email: null, contact_phone: null, calendar_provider: null, dpa_accepted_at: null, loading: true })

  const reload = useCallback(async () => {
    const uid = await currentCoachId()
    if (!uid) { setP(v => ({ ...v, loading: false })); return }
    const { data } = await sb().from('sports_profiles')
      .select('display_name, brand_name, brand_logo_url, avatar_url, contact_email, contact_phone, calendar_provider, dpa_accepted_at')
      .eq('id', uid).maybeSingle()
    setP({
      display_name: (data as any)?.display_name ?? null,
      brand_name: (data as any)?.brand_name ?? null,
      brand_logo_url: (data as any)?.brand_logo_url ?? null,
      avatar_url: (data as any)?.avatar_url ?? null,
      contact_email: (data as any)?.contact_email ?? null,
      contact_phone: (data as any)?.contact_phone ?? null,
      calendar_provider: (data as any)?.calendar_provider ?? null,
      dpa_accepted_at: (data as any)?.dpa_accepted_at ?? null,
      loading: false,
    })
  }, [])

  useEffect(() => { reload() }, [reload])
  return { ...p, reload }
}

export async function saveCoachProfile(updates: Record<string, any>) {
  // Never into the account of whoever signed in after this tab was opened.
  if (!(await tabStillMine())) throw new Error(TAB_LOST_MESSAGE)
  const uid = await currentCoachId()
  if (!uid) throw new Error('Not signed in')
  const { error } = await sb().from('sports_profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', uid)
  if (error) throw new Error(error.message)
}

// Racket progression stages (ordered). Mirrors the demo BELTS palette.
export const RACKET_STAGES: { id: string; name: string; colour: string }[] = [
  { id: 'white',  name: 'White',  colour: '#E5E7EB' },
  { id: 'yellow', name: 'Yellow', colour: '#EAB308' },
  { id: 'orange', name: 'Orange', colour: '#F97316' },
  { id: 'green',  name: 'Green',  colour: '#22C55E' },
  { id: 'blue',   name: 'Blue',   colour: '#3B82F6' },
  { id: 'purple', name: 'Purple', colour: '#A855F7' },
  { id: 'brown',  name: 'Brown',  colour: '#92400E' },
  { id: 'red',    name: 'Red',    colour: '#EF4444' },
  { id: 'black',  name: 'Black',  colour: '#111827' },
]

// Skills worked at each racket stage (4 per stage), with a one-line coaching note.
// Coaches mark a player's mastery 1–4 against these in Player Development. This is
// the canonical Lumio racket-skill framework (mirrors the academy demo); it's
// fixed/Lumio-managed — coaches grade against it but don't edit the skills.
export const RACKET_SKILLS: Record<string, { name: string; note: string }[]> = {
  white: [
    { name: 'Ready position & split-step', note: 'Athletic base, balanced, on toes before each ball' },
    { name: 'Forehand groundstroke', note: 'Low-to-high swing, contact out front' },
    { name: 'Grips — eastern & continental', note: 'Find and change grip without looking' },
    { name: 'Cooperative rally', note: 'Keep 3–5 balls going with a partner' },
  ],
  yellow: [
    { name: 'Two-handed backhand', note: 'Shoulder turn, two clean hands, follow through' },
    { name: 'Footwork & recovery', note: 'Small adjusting steps, recover to centre' },
    { name: 'Sustained rally (10+)', note: 'Rally 10+ balls cross-court with control' },
    { name: 'Ball tracking & timing', note: 'Read bounce early, meet the ball cleanly' },
  ],
  orange: [
    { name: 'Forehand volley', note: 'Punch, firm wrist, short backswing at the net' },
    { name: 'Backhand volley', note: 'Continental grip, block forward through contact' },
    { name: 'Backhand slice', note: 'High-to-low, stable face, ball stays low' },
    { name: 'Net positioning', note: 'Close the net, cut angles, ready hands' },
  ],
  green: [
    { name: 'Flat first serve', note: 'Trophy pose, toss, pronate, land inside' },
    { name: 'Toss & rhythm', note: 'Consistent toss, smooth service motion' },
    { name: 'Return of serve', note: 'Split on contact, short take-back, block deep' },
    { name: 'Serve placement', note: 'Hit wide / body / T targets on demand' },
  ],
  blue: [
    { name: 'Topspin forehand', note: 'Brush up the back, heavy net clearance' },
    { name: 'Topspin backhand', note: 'Drive through with spin, depth and shape' },
    { name: 'Second serve (kick)', note: 'Spin-first, high margin, reliable under pressure' },
    { name: 'Depth & heavy ball', note: 'Land balls in the back third consistently' },
  ],
  purple: [
    { name: 'Overhead smash', note: 'Turn, point, finish high balls with authority' },
    { name: 'Drop shot', note: 'Disguised touch, soft hands, dies short' },
    { name: 'Offensive & defensive lob', note: 'Clear the net player, reset from defence' },
    { name: 'Half-volley', note: 'Short hop pick-up in transition, stable face' },
  ],
  brown: [
    { name: 'Kick serve', note: 'Heavy topspin serve that jumps off the court' },
    { name: 'Slice serve', note: 'Curve the ball wide to open the court' },
    { name: 'Inside-out forehand', note: 'Run around the backhand, attack with the FH' },
    { name: 'Approach & transition', note: 'Approach off short balls, close behind it' },
  ],
  red: [
    { name: 'Point construction', note: 'Build the point, open space, finish the right ball' },
    { name: 'Pattern play', note: 'Serve+1 and return+1 go-to patterns' },
    { name: 'Disguise & variation', note: 'Change spin, pace and height to disrupt' },
    { name: 'Reading opponents', note: 'Spot and exploit weaknesses live' },
  ],
  black: [
    { name: 'Match management', note: 'Manage score, momentum and game state' },
    { name: 'Pressure & mental game', note: 'Routines, resets, compete on big points' },
    { name: 'In-match adaptation', note: 'Change a losing plan, adjust on the fly' },
    { name: 'Closing out matches', note: 'Serve out sets, convert when ahead' },
  ],
}

// Names only — kept for callers that just need the skill list (grading keys).
export const SKILLS_BY_STAGE: Record<string, string[]> = Object.fromEntries(
  Object.entries(RACKET_SKILLS).map(([k, v]) => [k, v.map(s => s.name)]),
)

export const SKILL_LEVELS = ['—', 'Learning', 'Developing', 'Consolidating', 'Consistent']
export function skillLevelColour(score: number): string {
  if (score >= 4) return '#22C55E'
  if (score === 3) return '#3A8EE0'
  if (score >= 1) return '#F59E0B'
  return '#6B7280'
}

// Upsert a single player's skill score (1–4). Requires the unique (player_id,skill).
export async function setSkillScore(playerId: string, skill: string, score: number) {
  const coach_id = await currentCoachId()
  if (!coach_id) throw new Error('Not signed in')
  const { error } = await sb().from('coach_player_skills')
    .upsert({ coach_id, player_id: playerId, skill, score, updated_at: new Date().toISOString() }, { onConflict: 'player_id,skill' })
  if (error) { console.error('[coach-db] setSkillScore', error.message); throw new Error(error.message) }
  rowsChanged('coach_player_skills')   // "Rackets ready" in the rail is built from these
}

// When a lesson summary is created, the session happened — auto-mark the player
// present that day (no manual tagging). Idempotent: skips if already logged that
// date. Best-effort and silent so it never blocks the summary save.
// ── One player, one row ─────────────────────────────────────────────────────
// Four screens could each quietly create a player: type a name into a booking,
// into a lesson summary, into a recording, or let an AI summary tag one. Each
// checked the roster it happened to be holding — a props array that can still be
// loading, matched without trimming — so "Sven", "Sven " and a recording made
// three seconds after the page opened produced three different Svens. The coach
// then had four profiles for one man, with his camp on one, his XP on another
// and his lessons on a third, and no way to tell them apart in a dropdown.
//
// So nobody creates a player from a typed name any more except through here:
// the check is against the DATABASE, on a trimmed case-insensitive match, and
// the id comes back so the caller can attach the booking or the session to the
// person rather than to their name.
export async function ensureRosterPlayer(
  name: string | null | undefined, extra: Record<string, any> = {},
): Promise<string | null> {
  const clean = String(name ?? '').trim()
  if (!clean) return null
  try {
    const coach_id = await currentCoachId()
    if (!coach_id) return null
    const { data } = await sb().from('coach_players')
      .select('id').eq('coach_id', coach_id).ilike('name', clean).limit(2)
    // Two players already share this name: a typed name cannot say which one is
    // meant, so the row is attached to neither rather than to a guess.
    if (((data as any[]) || []).length > 1) return null
    const existing = (data as any)?.[0]?.id as string | undefined
    if (existing) return existing
    const created = await dbInsert('coach_players', { name: clean, ...extra })   // tells every screen (rowsChanged)
    return (created as any)?.id ?? null
  } catch (e) {
    console.error('[coach-db] ensureRosterPlayer', e)
    return null
  }
}

// By the player's ID. It used to look the player up by name, so a lesson written
// for one of two players called the same marked the OTHER one present. A lesson
// with no player attached marks nobody.
export async function logSessionAttendance(playerId: string | null | undefined, sessionDate?: string | null) {
  try {
    if (!playerId) return
    const coach_id = await currentCoachId()
    if (!coach_id) return
    const date = sessionDate || ukDate()   // the UK date — the UTC one is still yesterday at 00:30 in summer
    const p = await sb().from('coach_players').select('id').eq('coach_id', coach_id).eq('id', playerId).limit(1)
    const pid = (p.data as any)?.[0]?.id
    if (!pid) return
    const ex = await sb().from('coach_attendance').select('id').eq('coach_id', coach_id).eq('player_id', pid).eq('session_date', date).limit(1)
    if ((ex.data as any)?.length) return
    // An invited coach's mark carries their coach record, as dbInsert stamps
    // it — without it the database refuses the row and the lesson they just
    // wrote up left no attendance behind.
    const me = await currentIdentity()
    const stamp = !me?.isHead && me?.staffId ? { staff_id: me.staffId } : {}
    const { error } = await sb().from('coach_attendance').insert({ coach_id, ...stamp, player_id: pid, session_date: date, present: true })
    if (!error) rowsChanged('coach_attendance')
  } catch (e) { console.warn('[coach-db] logSessionAttendance', e) }
}
