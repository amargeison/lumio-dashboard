'use client'

// Lumio's default package price list — seeded so a new coach starts with a sensible
// set they can edit/price themselves. Columns match coach_packages.

import { sb, currentCoachId } from './coach-db'

export const LUMIO_PACKAGES: Record<string, any>[] = [
  { name: '10-lesson private pack', kind: 'Private', price: 360, sessions: 10, period: 'per pack', description: 'Ten 1-hour private lessons — best value for committed players.', features: '10 × 60-min private lessons\nRacket progress tracking\nLesson summary after each session\nSaves £20 vs pay-as-you-go', equipment: 'Ball basket (60+)\nCones ×8\nTarget hoops' },
  { name: '5-lesson private pack', kind: 'Private', price: 185, sessions: 5, period: 'per pack', description: 'A five-lesson block to get started or work on a specific goal.', features: '5 × 60-min private lessons\nStarting racket assessment\nLesson summaries\nFlexible scheduling', equipment: 'Ball basket (60+)\nCones ×8' },
  { name: 'Performance monthly', kind: 'Performance', price: 240, sessions: 12, period: 'per month', description: 'Intensive monthly programme for competitive junior players.', features: '12 sessions per month\nMatch-play & tactical work\nFitness & movement block\nTournament planning', equipment: 'Ball basket (60+)\nCones ×12\nAgility ladders' },
  { name: 'Adult 8-lesson block', kind: 'Adult', price: 280, sessions: 8, period: 'per pack', description: 'Eight lessons for adult improvers — technique and match craft.', features: '8 × 60-min lessons\nCardio & rally fitness option\nDoubles tactics\nEvening slots available', equipment: 'Ball basket (60+)\nCones ×8' },
  { name: 'Junior group — term', kind: 'Group', price: 150, sessions: 10, period: 'per term', description: 'Weekly small-group coaching across a 10-week term.', features: '10 weekly group sessions\nMax 6 players per court\nRacket pathway curriculum\nEnd-of-term report', equipment: '2 ball baskets\nCones ×12\nThrow-down lines\nBibs' },
  { name: 'Cardio tennis — 6 pack', kind: 'Cardio', price: 60, sessions: 6, period: 'per pack', description: 'High-energy, music-led tennis fitness — all levels welcome.', features: '6 × 45-min cardio sessions\nAll abilities\nNo booking needed — just turn up\nGreat for fitness', equipment: 'Ball machine or 2 baskets\nCones ×16\nMusic speaker' },
]

export async function seedLumioPackages(): Promise<number> {
  const uid = await currentCoachId()
  if (!uid) return 0
  const existing = await sb().from('coach_packages').select('name').eq('coach_id', uid)
  const have = new Set((existing.data ?? []).map((r: any) => (r.name || '').toLowerCase()))
  const rows = LUMIO_PACKAGES.filter(p => !have.has(p.name.toLowerCase())).map((p, i) => ({ ...p, coach_id: uid, sort_order: i }))
  if (!rows.length) return 0
  const { error } = await sb().from('coach_packages').insert(rows)
  if (error) { console.error('[lumio-packages] seed', error.message); throw new Error(error.message) }
  return rows.length
}
