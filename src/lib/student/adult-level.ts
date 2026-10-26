// The adult level a player is on, as the family's page shows it: the level,
// its video, and the checklist with what they have passed (pure — the two
// routes that build the family's page read the rows and call this).
//
// Only what the page shows leaves the server: names, words and the video
// player address — never row ids from other players or the coach's notes.

import { ordered, tidyChecklist, videoEmbed } from '@/lib/coach/adult-levels'

export type StudentAdultLevel = {
  name: string; summary: string | null
  number: number; of: number; next: string | null
  video: { embed: string; watch: string; provider: 'youtube' | 'vimeo' } | null
  checklist: { text: string; passed: boolean }[]
  done: number; total: number
}

type LevelRow = { id: string; position: number; name: string; summary?: string | null; video_url?: string | null; checklist?: unknown }
type PassRow = { level_id: string; item_id: string }

export function studentAdultLevel(levelId: string | null | undefined, levels: LevelRow[], passes: PassRow[]): StudentAdultLevel | null {
  if (!levelId) return null
  const all = ordered(levels.map(l => ({ ...l, position: Number(l.position) || 0, name: String(l.name || '') })))
  const i = all.findIndex(l => l.id === levelId)
  if (i < 0) return null
  const l = all[i]
  const items = tidyChecklist(l.checklist)
  const passed = new Set(passes.filter(p => p.level_id === l.id).map(p => p.item_id))
  const checklist = items.map(it => ({ text: it.text, passed: passed.has(it.id) }))
  return {
    name: l.name, summary: l.summary ? String(l.summary) : null,
    number: i + 1, of: all.length, next: all[i + 1]?.name || null,
    video: videoEmbed(l.video_url),
    checklist, done: checklist.filter(c => c.passed).length, total: checklist.length,
  }
}

/** Read and build it for one player. Never throws: a database without migration 219 simply has no adult level. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadStudentAdultLevel(db: any, academyId: string, playerId: string): Promise<StudentAdultLevel | null> {
  try {
    const { data: p, error } = await db.from('coach_players').select('adult_level_id').eq('id', playerId).eq('coach_id', academyId).maybeSingle()
    if (error || !p?.adult_level_id) return null
    const [{ data: levels }, { data: passes }] = await Promise.all([
      db.from('coach_adult_levels').select('id, position, name, summary, video_url, checklist').eq('coach_id', academyId),
      db.from('coach_adult_passes').select('level_id, item_id').eq('coach_id', academyId).eq('player_id', playerId).eq('level_id', p.adult_level_id),
    ])
    return studentAdultLevel(p.adult_level_id, levels || [], passes || [])
  } catch { return null }
}
