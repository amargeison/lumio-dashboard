// Client-side store for the recordings library. Persists tag changes
// (recording → session) to localStorage and notifies subscribers, mirroring
// sessions-store. The seed recordings are static (recordings-data); only the
// per-recording sessionId tag is mutable, so we persist a small id→sessionId
// override map and apply it over the seed. Demo only.

import { RECORDINGS_SEED, type Recording } from './recordings-data'

const KEY = 'lumio_coach_recordings'   // { [recordingId]: sessionId }  ('' = untagged)
const EVT = 'lumio-coach-recordings-changed'

function readTags(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { const raw = localStorage.getItem(KEY); const v = raw ? JSON.parse(raw) : {}; return v && typeof v === 'object' ? v as Record<string, string> : {} } catch { return {} }
}
function writeTags(map: Record<string, string>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(map)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

// Seed merged with persisted tag overrides (empty string clears a tag).
export function getRecordings(): Recording[] {
  const tags = readTags()
  return RECORDINGS_SEED.map(r =>
    Object.prototype.hasOwnProperty.call(tags, r.id)
      ? { ...r, sessionId: tags[r.id] || undefined }
      : r,
  )
}

export function tagRecording(id: string, sessionId: string) {
  const tags = readTags()
  tags[id] = sessionId
  writeTags(tags)
}

export function untagRecording(id: string) {
  const tags = readTags()
  tags[id] = ''
  writeTags(tags)
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
