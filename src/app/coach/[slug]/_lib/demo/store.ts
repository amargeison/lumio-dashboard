// The demo academy's data, held in memory.
//
// The demo portal (/tennis/coach/demo) runs the SAME components as a real
// academy's portal. What differs is where the data comes from: a real portal
// talks to Supabase and to /api/coach/*; the demo talks to this store, through
// a stand-in database client (client.ts) and a stand-in for the API (api.ts).
// Nothing the demo does leaves the browser — no row is written, no email is
// sent, no AI call is paid for — and nothing a visitor changes outlives a
// reload, so every visitor starts from the same showcase.
//
// That is the whole point of the arrangement: a feature built for the live
// portal appears in the demo the day it ships, because there is no second copy
// of the portal to keep in step.


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>

/** The demo academy's id — what coach_id is on every demo row, and who "the signed-in coach" is. */
export const DEMO_COACH_ID = 'd3300000-0000-4000-8000-000000000001'
export const DEMO_EMAIL = 'vincent@lumiotennisclub.example'

let tables: Record<string, Row[]> | null = null
let loading: Promise<void> | null = null

/**
 * Load the demo academy. The data set is large, so it is fetched as its own
 * chunk the first time the demo asks for anything — a real coach's portal
 * never downloads it. Everything that reads the store awaits this first (the
 * stand-in database client and the stand-in API both do).
 */
export function ensureDemo(): Promise<void> {
  if (tables) return Promise.resolve()
  if (!loading) {
    loading = import('./seed').then(m => { tables = m.buildDemoSeed(new Date()) }).finally(() => { loading = null })
  }
  return loading
}

/** Every table. Call ensureDemo() first; before that it is an empty academy. */
export function demoTables(): Record<string, Row[]> {
  return tables || (tables = {})
}

/** One table's rows (the live array — mutate it to change the demo's data). */
export function demoTable(name: string): Row[] {
  const t = demoTables()
  return t[name] || (t[name] = [])
}

/** Back to the showcase as shipped. */
export function resetDemo() { tables = null }

export function demoId(): string {
  try { return crypto.randomUUID() } catch { return `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}` }
}
