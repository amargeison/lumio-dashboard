// Tiny client-side store for completed demo "AI Session Reviews", one per
// session id. Mirrors session-plan.ts's pub/sub pattern so the Session Planner
// can show a "Reviewed" badge the moment a review is saved, and persist it
// across reloads. Demo only — nothing leaves the browser.

import type { DemoReview } from './session-review-data'

export type SessionReview = {
  id: string
  sessionId: string
  player: string
  createdAt: number
  review: DemoReview
}

const KEY = 'lumio_coach_session_reviews'
const EVT = 'lumio-coach-reviews-changed'

function read(): SessionReview[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as SessionReview[] : [] } catch { return [] }
}
function write(list: SessionReview[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getReviews(): SessionReview[] {
  return read().sort((a, b) => b.createdAt - a.createdAt)
}

export function getReview(sessionId: string): SessionReview | undefined {
  return read().find(r => r.sessionId === sessionId)
}

export function hasReview(sessionId: string): boolean {
  return read().some(r => r.sessionId === sessionId)
}

// Upsert by sessionId so re-reviewing a session updates rather than duplicates.
export function saveReview(r: SessionReview) {
  const list = read().filter(x => x.sessionId !== r.sessionId)
  write([{ ...r }, ...list])
}

export function removeReview(sessionId: string) {
  write(read().filter(r => r.sessionId !== sessionId))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
