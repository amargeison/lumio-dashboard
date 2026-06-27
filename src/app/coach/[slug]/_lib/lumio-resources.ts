'use client'

// The Lumio starter resource library — the curated drills, technique videos,
// plans and worksheets, tagged to the racket system. Seeded into coach_resources
// when a coach chooses "load Lumio resources" (onboarding or Settings). Columns
// match coach_resources: title, category(kind), format, level, duration, racket,
// tags, url, notes(description).

import { sb, currentCoachId } from './coach-db'

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`

export const LUMIO_RESOURCES: Record<string, any>[] = [
  { title: 'Split-step & first-move reaction', category: 'Drill', level: 'Beginner', format: 'Video', duration: '4 min', racket: 'white', tags: 'movement, warm-up', notes: 'Reaction-cue split-step ladder for foundation movers.', url: yt('J1UhPl1UrYs') },
  { title: 'Low-to-high topspin forehand', category: 'Technique', level: 'Intermediate', format: 'Video', duration: '7 min', racket: 'blue', tags: 'forehand, spin', notes: 'Frame-by-frame swing path for heavy topspin.', url: yt('KV9DTSNkLAg') },
  { title: 'Kick serve in 5 steps', category: 'Technique', level: 'Advanced', format: 'Video', duration: '9 min', racket: 'brown', tags: 'serve, spin', notes: 'Build a reliable kick serve from toss to pronation.', url: null },
  { title: '8-week Green-racket block', category: 'Training plan', level: 'Intermediate', format: 'Plan', duration: '8 weeks', racket: 'green', tags: 'serve, periodisation', notes: 'Periodised plan to earn the Green racket serve criteria.', url: null },
  { title: 'Cross-court rally targets', category: 'Drill', level: 'All levels', format: 'PDF', duration: null, racket: 'yellow', tags: 'consistency, rally', notes: 'Printable court targets for rally depth & direction.', url: null },
  { title: 'Net play & volley progression', category: 'Drill', level: 'Intermediate', format: 'Video', duration: '6 min', racket: 'orange', tags: 'volley, net', notes: 'Feed sequence from block volley to closing the net.', url: null },
  { title: 'Footwork agility ladder set', category: 'Fitness', level: 'All levels', format: 'PDF', duration: '15 min', racket: null, tags: 'movement, warm-up', notes: 'Off-court ladder routine for split-step speed.', url: null },
  { title: 'Compete: reset routine card', category: 'Mental', level: 'Advanced', format: 'Worksheet', duration: null, racket: 'black', tags: 'mental, routines', notes: 'Between-points reset & breathing routine worksheet.', url: null },
  { title: 'Serve+1 forehand patterns', category: 'Drill', level: 'Advanced', format: 'Video', duration: '8 min', racket: 'red', tags: 'patterns, tactics', notes: 'Three go-to serve+1 patterns and how to drill them.', url: null },
  { title: 'Parent guide: ball stages', category: 'Training plan', level: 'Beginner', format: 'PDF', duration: null, racket: null, tags: 'parents, red-orange-green', notes: 'Explains the red/orange/green/yellow ball pathway for parents.', url: null },
  { title: 'Drop shot & touch session', category: 'Technique', level: 'Intermediate', format: 'Video', duration: '5 min', racket: 'purple', tags: 'touch, specialty', notes: 'Disguised drop shot mechanics and feel drills.', url: null },
  { title: 'Match-play tactics worksheet', category: 'Mental', level: 'Advanced', format: 'Worksheet', duration: null, racket: 'red', tags: 'tactics, scouting', notes: 'Pre-match plan and opponent-read worksheet.', url: null },
]

// Insert the library for the current coach (skips if they already have these titles).
export async function seedLumioResources(): Promise<number> {
  const uid = await currentCoachId()
  if (!uid) return 0
  const existing = await sb().from('coach_resources').select('title').eq('coach_id', uid)
  const have = new Set((existing.data ?? []).map((r: any) => (r.title || '').toLowerCase()))
  const rows = LUMIO_RESOURCES.filter(r => !have.has(r.title.toLowerCase())).map(r => ({ ...r, coach_id: uid }))
  if (!rows.length) return 0
  const { error } = await sb().from('coach_resources').insert(rows)
  if (error) { console.error('[lumio-resources] seed', error.message); throw new Error(error.message) }
  return rows.length
}
