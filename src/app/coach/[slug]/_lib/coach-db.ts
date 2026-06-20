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
  | 'coach_payments'
  | 'coach_gps_sessions'
  | 'coach_messages'
  | 'coach_session_plans'
  | 'coach_courts'
  | 'coach_development'
  | 'coach_equipment'
  | 'coach_resources'
  | 'coach_attendance'
  | 'coach_player_skills'

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
  return data
}

export async function dbUpdate(table: CoachTable, id: string, row: Record<string, any>) {
  const { data, error } = await sb().from(table).update({ ...clean(row), updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) { console.error('[coach-db] update', table, error.message); throw new Error(error.message) }
  return data
}

export async function dbRemove(table: CoachTable, id: string) {
  const { error } = await sb().from(table).delete().eq('id', id)
  if (error) { console.error('[coach-db] remove', table, error.message); throw new Error(error.message) }
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
export interface CoachStats { players: number; lessonsThisWeek: number; staff: number; upcomingBookings: number; loading: boolean }

export function useCoachStats(enabled = true): CoachStats {
  const [s, setS] = useState<CoachStats>({ players: 0, lessonsThisWeek: 0, staff: 0, upcomingBookings: 0, loading: true })

  useEffect(() => {
    if (!enabled) { setS(v => ({ ...v, loading: false })); return }
    let cancelled = false
    ;(async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      const today = new Date().toISOString().slice(0, 10)
      const [players, staff, sessions, bookings] = await Promise.all([
        sb().from('coach_players').select('id', { count: 'exact', head: true }),
        sb().from('coach_staff').select('id', { count: 'exact', head: true }),
        sb().from('coach_sessions').select('id', { count: 'exact', head: true }).gte('session_date', weekAgo),
        sb().from('coach_bookings').select('id', { count: 'exact', head: true }).gte('booking_date', today),
      ])
      if (cancelled) return
      setS({
        players: players.count ?? 0,
        staff: staff.count ?? 0,
        lessonsThisWeek: sessions.count ?? 0,
        upcomingBookings: bookings.count ?? 0,
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
  loading: boolean
}

export function useCoachProfile(): CoachProfile & { reload: () => void } {
  const [p, setP] = useState<CoachProfile>({ display_name: null, brand_name: null, contact_email: null, contact_phone: null, calendar_provider: null, loading: true })

  const reload = useCallback(async () => {
    const uid = await currentCoachId()
    if (!uid) { setP(v => ({ ...v, loading: false })); return }
    const { data } = await sb().from('sports_profiles')
      .select('display_name, brand_name, contact_email, contact_phone, calendar_provider')
      .eq('id', uid).maybeSingle()
    setP({
      display_name: (data as any)?.display_name ?? null,
      brand_name: (data as any)?.brand_name ?? null,
      contact_email: (data as any)?.contact_email ?? null,
      contact_phone: (data as any)?.contact_phone ?? null,
      calendar_provider: (data as any)?.calendar_provider ?? null,
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

// Skills worked at each racket stage (4 per stage). Coaches mark a player's
// mastery 1–4 against these in the player detail Development tab.
export const SKILLS_BY_STAGE: Record<string, string[]> = {
  white:  ['Ready position', 'Forehand contact', 'Backhand contact', 'Rally to 4'],
  yellow: ['First serve', 'Second serve', 'Return depth', 'Baseline rally'],
  orange: ['Forehand volley', 'Backhand volley', 'Backhand slice', 'Net positioning'],
  green:  ['Flat first serve', 'Toss & rhythm', 'Return of serve', 'Serve placement'],
  blue:   ['Topspin forehand', 'Topspin backhand', 'Approach shot', 'Court movement'],
  purple: ['Kick serve', 'Slice serve', 'Drop shot', 'Transition game'],
  brown:  ['Serve +1 pattern', 'Defensive lob', 'Counterpunch', 'Point construction'],
  red:    ['Inside-out forehand', 'Backhand down the line', 'Second-serve attack', 'Pattern play'],
  black:  ['Match tactics', 'Pressure serving', 'Net + baseline blend', 'Opponent reading'],
}

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
