// Client-side store for lesson summaries created via "New summary". Persists
// to localStorage and notifies subscribers so the Lesson Summaries list updates.

import type { Lesson } from './coach-data'

const KEY = 'lumio_coach_lessons'
const EVT = 'lumio-coach-lessons-changed'

function read(): Lesson[] {
  if (typeof window === 'undefined') return []
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Lesson[] : [] } catch { return [] }
}
function write(list: Lesson[]) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore quota */ }
  window.dispatchEvent(new CustomEvent(EVT))
}

export function getAddedLessons(): Lesson[] {
  return read()
}

export function addLesson(l: Lesson) {
  write([l, ...read()]) // newest first
}

export function removeLesson(id: string) {
  write(read().filter(l => l.id !== id))
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb) }
}
