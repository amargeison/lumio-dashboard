// Client-side store for the coach inbox. Mirrors roster-store.ts: persists to
// localStorage and notifies subscribers via a CustomEvent so every view that
// reads the inbox (the Messages page AND the dashboard Inbox card) updates
// immediately and stays in sync.
//
// IMPORTANT — seed-merge, not duplication. The seed message CONTENT (from/role/
// last/body/thread) lives in coach-data (COACH_MESSAGES + COACH_MESSAGE_THREADS).
// This store persists:
//   • per-message STATE deltas (read / replies / forwards / reactions / deleted),
//     keyed by message id and merged over the seed at read time, and
//   • composed (outbound) messages the coach sends via the Send Message wizard,
//     which are net-new and stored in full.
// So new seed content appears without a migration, and localStorage never holds
// a stale copy of the seed bodies.

import { COACH_MESSAGES, COACH_MESSAGE_THREADS, type CoachThreadEntry } from './coach-data'

const KEY = 'lumio_coach_messages'
const EVT = 'lumio-coach-messages-changed'

// A reply the coach has sent.
export type CoachReply = { from: 'coach'; text: string; time: string }
// A forward record (who the coach forwarded a message to).
export type CoachForward = { to: string; time: string }

// The persisted per-message state delta. Everything optional — absent means
// "untouched", so an empty map is the clean seed state.
export type CoachMessageState = {
  read?: boolean
  replies?: CoachReply[]
  forwards?: CoachForward[]
  reactions?: string[]
  deleted?: boolean
}

type StateMap = Record<string, CoachMessageState>

// A composed (outbound) message the coach sent from the Send Message wizard.
export type CoachComposedMessage = {
  id: string         // 'sent-…'
  to: string         // recipient display name
  role: string       // recipient role label
  channel: string    // 'In-app' / 'Email' / combined label
  text: string
  time: string       // short HH:MM stamp for display
  ts: number         // sort key (newest first)
}

type Persisted = { states: StateMap; composed: CoachComposedMessage[] }

// A fully-resolved inbox message: seed (or composed) content + merged state.
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
  forwards: CoachForward[]
  thread: CoachThreadEntry[]   // seed thread with the coach's replies appended
  outbound: boolean            // true for messages the coach sent
  channel?: string             // the channel an outbound message went out on
}

function readAll(): Persisted {
  if (typeof window === 'undefined') return { states: {}, composed: [] }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { states: {}, composed: [] }
    const parsed = JSON.parse(raw)
    // Backward-compat: Phase A persisted a bare StateMap (no states/composed keys).
    if (parsed && typeof parsed === 'object' && !('states' in parsed) && !('composed' in parsed)) {
      return { states: parsed as StateMap, composed: [] }
    }
    return { states: parsed.states ?? {}, composed: parsed.composed ?? [] }
  } catch { return { states: {}, composed: [] } }
}
function writeAll(data: Persisted) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Merge a base message (seed or composed) with its stored state delta.
function merge(
  base: { id: string; from: string; role: string; last: string; time: string; urgent: boolean; body: string; seedThread: CoachThreadEntry[]; outbound: boolean; channel?: string },
  st: CoachMessageState,
): CoachInboxMessage {
  const replies = st.replies ?? []
  return {
    id: base.id, from: base.from, role: base.role, last: base.last, time: base.time,
    urgent: base.urgent, body: base.body,
    read: !!st.read || base.outbound,
    unread: st.read || base.outbound ? 0 : 1,
    reactions: st.reactions ?? [],
    replies,
    forwards: st.forwards ?? [],
    thread: [...base.seedThread, ...replies.map(r => ({ from: 'coach' as const, text: r.text, time: r.time }))],
    outbound: base.outbound,
    channel: base.channel,
  }
}

// Seed + composed content merged with stored state, soft-deleted filtered out.
// Composed (outbound) messages are newest, so they sort to the top by recency.
export function getMessages(): CoachInboxMessage[] {
  const { states, composed } = readAll()
  const seedUnread = (m: typeof COACH_MESSAGES[number]) => m.unread // preserve seed unread count below

  const sent = composed
    .filter(c => !states[c.id]?.deleted)
    .sort((a, b) => b.ts - a.ts)
    .map(c => merge(
      { id: c.id, from: c.to, role: c.role, last: c.text, time: c.time, urgent: false, body: c.text, seedThread: [{ from: 'coach', text: c.text, time: c.time }], outbound: true, channel: c.channel },
      states[c.id] ?? {},
    ))

  const seed = COACH_MESSAGES
    .filter(m => !states[m.id]?.deleted)
    .map(m => {
      const st = states[m.id] ?? {}
      const merged = merge(
        { id: m.id, from: m.from, role: m.role, last: m.last, time: m.time, urgent: m.urgent, body: m.body, seedThread: COACH_MESSAGE_THREADS[m.id] ?? [], outbound: false },
        st,
      )
      // Seed messages carry a real unread count; preserve it when still unread.
      merged.unread = st.read ? 0 : seedUnread(m)
      return merged
    })

  return [...sent, ...seed]
}

// ─── Mutators ───────────────────────────────────────────────────────────────
function patchState(id: string, fn: (cur: CoachMessageState) => CoachMessageState) {
  const data = readAll()
  data.states[id] = fn(data.states[id] ?? {})
  writeAll(data)
}

export function markRead(id: string) {
  patchState(id, cur => ({ ...cur, read: true }))
}

export function addReply(id: string, text: string) {
  patchState(id, cur => ({ ...cur, read: true, replies: [...(cur.replies ?? []), { from: 'coach', text, time: nowTime() }] }))
}

export function addForward(id: string, to: string) {
  patchState(id, cur => ({ ...cur, read: true, forwards: [...(cur.forwards ?? []), { to, time: nowTime() }] }))
}

// Single-select reaction, mirroring Junior's add / toggle-off / switch handler:
// clicking the active emoji clears it; clicking another replaces it.
export function toggleReaction(id: string, emoji: string) {
  patchState(id, cur => ({ ...cur, reactions: (cur.reactions ?? []).includes(emoji) ? [] : [emoji] }))
}

export function softDelete(id: string) {
  patchState(id, cur => ({ ...cur, deleted: true }))
}

// Append a composed (outbound) message — used by the Send Message wizard for
// the live channels (in-app + email log). Appears at the top of the inbox.
export function sendMessage(msg: { to: string; role: string; channel: string; text: string }) {
  const data = readAll()
  const ts = Date.now()
  data.composed.push({
    id: `sent-${ts}-${Math.round(Math.random() * 1e6)}`,
    to: msg.to, role: msg.role, channel: msg.channel, text: msg.text, time: nowTime(), ts,
  })
  writeAll(data)
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}

// ─── Cross-surface open signal ────────────────────────────────────────────────
// In-memory (not persisted): the dashboard Inbox card calls requestOpen(id) then
// navigates to the Messages page, which consumes it to auto-open that thread.
let _pendingOpen: string | null = null
export function requestOpen(id: string) { _pendingOpen = id }
export function consumePendingOpen(): string | null { const v = _pendingOpen; _pendingOpen = null; return v }
