// Client-side store for the coach inbox. Mirrors roster-store.ts: persists to
// localStorage and notifies subscribers via a CustomEvent so every view that
// reads the inbox updates immediately.
//
// IMPORTANT — seed-merge, not duplication. The message CONTENT (from/role/last/
// body/thread) lives in coach-data (COACH_MESSAGES + COACH_MESSAGE_THREADS).
// This store only persists per-message STATE deltas — read flag, the coach's
// replies, reactions, and soft-delete — keyed by message id, and merges them
// over the seed at read time. So new seed content shows up without a migration,
// and localStorage never holds a stale copy of the message bodies.

import { COACH_MESSAGES, COACH_MESSAGE_THREADS, type CoachThreadEntry } from './coach-data'

const KEY = 'lumio_coach_messages'
const EVT = 'lumio-coach-messages-changed'

// A reply the coach has sent (Phase B writes these; Phase A only reads).
export type CoachReply = { from: 'coach'; text: string; time: string }

// The persisted per-message state delta. Everything optional — absent means
// "untouched", so an empty map is the clean seed state.
export type CoachMessageState = {
  read?: boolean
  replies?: CoachReply[]
  reactions?: string[]
  deleted?: boolean
}

type StateMap = Record<string, CoachMessageState>

// A fully-resolved inbox message: seed content + merged state, ready to render.
export type CoachInboxMessage = {
  id: string
  from: string
  role: string
  last: string
  time: string
  urgent: boolean
  body: string
  unread: number               // effective: 0 once read
  read: boolean
  reactions: string[]
  replies: CoachReply[]
  thread: CoachThreadEntry[]   // seed thread with the coach's replies appended
}

function read(): StateMap {
  if (typeof window === 'undefined') return {}
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as StateMap : {} } catch { return {} }
}
function write(map: StateMap) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(map)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Seed content merged with stored state, soft-deleted messages filtered out.
export function getMessages(): CoachInboxMessage[] {
  const state = read()
  return COACH_MESSAGES
    .filter(m => !state[m.id]?.deleted)
    .map(m => {
      const st = state[m.id] ?? {}
      const replies = st.replies ?? []
      const seedThread = COACH_MESSAGE_THREADS[m.id] ?? []
      return {
        id: m.id, from: m.from, role: m.role, last: m.last, time: m.time, urgent: m.urgent, body: m.body,
        read: !!st.read,
        unread: st.read ? 0 : m.unread,
        reactions: st.reactions ?? [],
        replies,
        thread: [...seedThread, ...replies.map(r => ({ from: 'coach' as const, text: r.text, time: r.time }))],
      }
    })
}

// ─── Mutators (wired up in Phase B) ─────────────────────────────────────────
export function markRead(id: string) {
  const map = read()
  map[id] = { ...map[id], read: true }
  write(map)
}

export function addReply(id: string, text: string) {
  const map = read()
  const cur = map[id] ?? {}
  map[id] = { ...cur, read: true, replies: [...(cur.replies ?? []), { from: 'coach', text, time: nowTime() }] }
  write(map)
}

export function toggleReaction(id: string, emoji: string) {
  const map = read()
  const cur = map[id] ?? {}
  const set = cur.reactions ?? []
  map[id] = { ...cur, reactions: set.includes(emoji) ? set.filter(e => e !== emoji) : [...set, emoji] }
  write(map)
}

export function softDelete(id: string) {
  const map = read()
  map[id] = { ...map[id], deleted: true }
  write(map)
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
