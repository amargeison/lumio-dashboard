// Tiny client-side store for the coach's saved "next session" plans.
// Persists to localStorage and notifies subscribers via a window event so the
// Session Planner view updates the moment a plan is added from a lesson brief.

export type PlanPhase = { phase: string; detail: string; mins: number }
export type PlannedSession = {
  id: string
  player: string
  focus: string
  source: string          // e.g. "from lesson 10 Jun"
  createdAt: number
  workOn: string[]
  plan: PlanPhase[]
  drills: string[]
  done?: boolean
}

const KEY = 'lumio_coach_session_plans'
const EVT = 'lumio-coach-plans-changed'

function read(): PlannedSession[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as PlannedSession[] : [] } catch { return [] }
}
function write(list: PlannedSession[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getPlans(): PlannedSession[] {
  return read().sort((a, b) => b.createdAt - a.createdAt)
}

export function hasPlan(id: string): boolean {
  return read().some(p => p.id === id)
}

// Upsert by id so re-adding the same lesson updates rather than duplicates.
export function addPlan(p: PlannedSession) {
  const list = read().filter(x => x.id !== p.id)
  write([{ ...p }, ...list])
}

export function removePlan(id: string) {
  write(read().filter(p => p.id !== id))
}

export function toggleDone(id: string) {
  write(read().map(p => p.id === id ? { ...p, done: !p.done } : p))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
