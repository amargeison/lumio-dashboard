'use client'

// The Lumio starter resource library lives in src/lib/coach/lumio-resources-data.ts
// (plain data, readable by server routes too). This file seeds it for a coach.

import { sb } from './coach-db'
import { LUMIO_RESOURCES } from '@/lib/coach/lumio-resources-data'

export { LUMIO_RESOURCES, isLumioResource } from '@/lib/coach/lumio-resources-data'

// Insert the library for the academy (skips titles they already have).
//
// ownerId is the ACADEMY's id, and the caller passes it when it already knows —
// onboarding does, because it is creating that academy in the same breath.
// Otherwise it falls back to the signed-in user, who owns the academy whenever
// this can be reached: only a head coach loads the starter library, since for a
// coach the resources are the club's and read-only.
//
// NOT currentCoachId(), which answers "which academy am I working in" and can
// name a DIFFERENT academy for anyone holding a coach membership. During
// onboarding it could also resolve before the profile row existed, and the
// insert then failed row level security — silently, because the wizard fires
// this and forgets. That is why "Preload Lumio resources" produced an empty
// Resource Centre: 90 rows refused, no error anybody could see.
export async function seedLumioResources(ownerId?: string): Promise<number> {
  const uid = ownerId || (await sb().auth.getUser()).data.user?.id
  if (!uid) return 0
  const existing = await sb().from('coach_resources').select('title').eq('coach_id', uid)
  const have = new Set((existing.data ?? []).map((r: any) => (r.title || '').toLowerCase()))
  const rows = LUMIO_RESOURCES.filter(r => !have.has(String(r.title).toLowerCase())).map(r => ({ ...r, coach_id: uid }))
  if (!rows.length) return 0
  const { error } = await sb().from('coach_resources').insert(rows)
  if (error) { console.error('[lumio-resources] seed', error.message); throw new Error(error.message) }
  return rows.length
}
