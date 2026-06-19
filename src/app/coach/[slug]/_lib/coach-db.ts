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

// Racket progression stages (ordered). Mirrors the demo BELTS palette.
export const RACKET_STAGES: { id: string; name: string; colour: string }[] = [
  { id: 'white',  name: 'White',  colour: '#E5E7EB' },
  { id: 'red',    name: 'Red',    colour: '#EF4444' },
  { id: 'orange', name: 'Orange', colour: '#F97316' },
  { id: 'yellow', name: 'Yellow', colour: '#EAB308' },
  { id: 'green',  name: 'Green',  colour: '#22C55E' },
  { id: 'blue',   name: 'Blue',   colour: '#3B82F6' },
  { id: 'purple', name: 'Purple', colour: '#A855F7' },
  { id: 'brown',  name: 'Brown',  colour: '#92400E' },
  { id: 'black',  name: 'Black',  colour: '#111827' },
]
