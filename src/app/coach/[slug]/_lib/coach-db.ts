'use client'

// Live data layer for the Lumio Tennis Coach portal.
//
// Every table is owned per-coach and protected by Supabase RLS
// (coach_id = auth.uid()), so the browser client can read/write directly and
// only ever touches the signed-in coach's own rows. No API routes needed.

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

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

let _sb: ReturnType<typeof createBrowserClient> | null = null
export function sb() {
  if (!_sb) {
    _sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _sb
}

let _uid: string | null = null
export async function currentCoachId(): Promise<string | null> {
  if (_uid) return _uid
  const { data } = await sb().auth.getUser()
  _uid = data.user?.id ?? null
  return _uid
}

export async function dbList<T = any>(table: CoachTable): Promise<T[]> {
  const { data, error } = await sb().from(table).select('*').order('created_at', { ascending: false })
  if (error) { console.error('[coach-db] list', table, error.message); return [] }
  return (data ?? []) as T[]
}

export async function dbInsert(table: CoachTable, row: Record<string, any>) {
  const coach_id = await currentCoachId()
  if (!coach_id) throw new Error('Not signed in')
  const { data, error } = await sb().from(table).insert({ ...clean(row), coach_id }).select().single()
  if (error) { console.error('[coach-db] insert', table, error.message); throw new Error(error.message) }
  if (table === 'coach_bookings') syncBookingCalendar(data)
  return data
}

export async function dbUpdate(table: CoachTable, id: string, row: Record<string, any>) {
  const { data, error } = await sb().from(table).update({ ...clean(row), updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) { console.error('[coach-db] update', table, error.message); throw new Error(error.message) }
  if (table === 'coach_bookings') syncBookingCalendar(data)
  return data
}

export async function dbRemove(table: CoachTable, id: string) {
  const { error } = await sb().from(table).delete().eq('id', id)
  if (error) { console.error('[coach-db] remove', table, error.message); throw new Error(error.message) }
  if (table === 'coach_bookings') removeBookingCalendar(id)
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
// When a booking is written, push it to the coach's connected calendars via the
// server route. Best-effort and fire-and-forget: it never blocks or fails the DB
// write, and quietly no-ops if no calendar is connected. A cancelled booking is
// removed from the calendar instead of pushed.
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
    fetch('/api/coach/calendar/event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: row.id,
        title: row.title || row.player_name || 'Lesson',
        start, end,
        location: row.court || undefined,
        description: row.notes || undefined,
      }),
    }).catch(() => {})
  } catch { /* never block the write */ }
}
function removeBookingCalendar(id: string) {
  try { fetch(`/api/coach/calendar/event?bookingId=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {}) } catch { /* ignore */ }
}

// ── React hook: rows + CRUD for one table ──────────────────────────────────
export function useCoachTable<T = any>(table: CoachTable) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try { setRows(await dbList<T>(table)) } finally { setLoading(false) }
  }, [table])

  useEffect(() => { reload() }, [reload])

  const add = useCallback(async (row: Record<string, any>) => {
    try { await dbInsert(table, row); await reload() }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); throw e }
  }, [table, reload])

  const edit = useCallback(async (id: string, row: Record<string, any>) => {
    try { await dbUpdate(table, id, row); await reload() }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); throw e }
  }, [table, reload])

  const remove = useCallback(async (id: string) => {
    try { await dbRemove(table, id); await reload() }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); throw e }
  }, [table, reload])

  return { rows, loading, error, reload, add, edit, remove }
}

// ── Dashboard / rail stats from live data ──────────────────────────────────
export interface CoachStats {
  players: number; lessonsThisWeek: number; staff: number; upcomingBookings: number; loading: boolean
  sessionsToday: number; racketsReady: number; outstandingPayments: number; newPlayers: number
  racketCounts: number[]   // aligned to RACKET_STAGES order
}

const emptyStats: CoachStats = { players: 0, lessonsThisWeek: 0, staff: 0, upcomingBookings: 0, loading: true, sessionsToday: 0, racketsReady: 0, outstandingPayments: 0, newPlayers: 0, racketCounts: [] }
const dayKey = (d?: string | null) => String(d ?? '').slice(0, 10)

export function useCoachStats(enabled = true): CoachStats {
  const [s, setS] = useState<CoachStats>(emptyStats)

  useEffect(() => {
    if (!enabled) { setS(v => ({ ...v, loading: false })); return }
    let cancelled = false
    ;(async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      const today = new Date().toLocaleDateString('en-CA') // local YYYY-MM-DD
      const [players, staff, sessions, bookings, skills, payments] = await Promise.all([
        sb().from('coach_players').select('id, racket_stage, created_at'),
        sb().from('coach_staff').select('id', { count: 'exact', head: true }),
        sb().from('coach_sessions').select('id', { count: 'exact', head: true }).gte('session_date', weekAgo),
        sb().from('coach_bookings').select('booking_date, status'),
        sb().from('coach_player_skills').select('player_id, skill, score'),
        sb().from('coach_payments').select('amount, paid'),
      ])
      if (cancelled) return
      const prows: any[] = players.data ?? []
      const brows: any[] = bookings.data ?? []
      const srows: any[] = skills.data ?? []
      const pays: any[] = payments.data ?? []
      const skillFor = (pid: string) => Object.fromEntries(srows.filter(r => r.player_id === pid).map(r => [r.skill, r.score]))
      const racketsReady = prows.filter(p => {
        const list = SKILLS_BY_STAGE[p.racket_stage] || []
        if (!list.length) return false
        const m: any = skillFor(p.id)
        return list.every(sk => (m[sk] || 0) >= 4)
      }).length
      setS({
        players: prows.length,
        staff: staff.count ?? 0,
        lessonsThisWeek: sessions.count ?? 0,
        upcomingBookings: brows.filter(b => dayKey(b.booking_date) >= today && b.status !== 'cancelled').length,
        sessionsToday: brows.filter(b => dayKey(b.booking_date) === today && b.status !== 'cancelled').length,
        racketsReady,
        outstandingPayments: pays.filter(p => !p.paid && (Number(p.amount) || 0) > 0).reduce((t, p) => t + (Number(p.amount) || 0), 0),
        newPlayers: prows.filter(p => dayKey(p.created_at) >= weekAgo).length,
        racketCounts: RACKET_STAGES.map(st => prows.filter(p => p.racket_stage === st.id).length),
        loading: false,
      })
    })()
    return () => { cancelled = true }
  }, [enabled])

  return s
}

// ── Coach profile / contact config ─────────────────────────────────────────
export interface CoachProfile {
  display_name: string | null
  brand_name: string | null
  contact_email: string | null
  contact_phone: string | null
  calendar_provider: string | null
  dpa_accepted_at: string | null
  loading: boolean
}

export function useCoachProfile(): CoachProfile & { reload: () => void } {
  const [p, setP] = useState<CoachProfile>({ display_name: null, brand_name: null, contact_email: null, contact_phone: null, calendar_provider: null, dpa_accepted_at: null, loading: true })

  const reload = useCallback(async () => {
    const uid = await currentCoachId()
    if (!uid) { setP(v => ({ ...v, loading: false })); return }
    const { data } = await sb().from('sports_profiles')
      .select('display_name, brand_name, contact_email, contact_phone, calendar_provider, dpa_accepted_at')
      .eq('id', uid).maybeSingle()
    setP({
      display_name: (data as any)?.display_name ?? null,
      brand_name: (data as any)?.brand_name ?? null,
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
}

// When a lesson summary is created, the session happened — auto-mark the player
// present that day (no manual tagging). Idempotent: skips if already logged that
// date. Best-effort and silent so it never blocks the summary save.
export async function logSessionAttendance(playerName: string | null | undefined, sessionDate?: string | null) {
  try {
    if (!playerName) return
    const coach_id = await currentCoachId()
    if (!coach_id) return
    const date = sessionDate || new Date().toISOString().slice(0, 10)
    const p = await sb().from('coach_players').select('id').eq('coach_id', coach_id).ilike('name', playerName.trim()).limit(1)
    const pid = (p.data as any)?.[0]?.id
    if (!pid) return
    const ex = await sb().from('coach_attendance').select('id').eq('coach_id', coach_id).eq('player_id', pid).eq('session_date', date).limit(1)
    if ((ex.data as any)?.length) return
    await sb().from('coach_attendance').insert({ coach_id, player_id: pid, session_date: date, present: true })
  } catch (e) { console.warn('[coach-db] logSessionAttendance', e) }
}
