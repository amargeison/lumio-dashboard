// Which org the signed-in person is acting in. An HQ's own id is its org, but an admin
// has several, so nothing may assume the user's id. The portal sets the acting org when
// it has decided access; every browser write and API call takes it from here.
// This only says which org is meant. The database decides whether it's allowed.

import type { SupabaseClient } from '@supabase/supabase-js'

export const ORG_HEADER = 'x-impact-hq'

let acting: string | null = null
export const setActingHq = (hqId: string | null) => { acting = hqId }

export async function currentHq(db: SupabaseClient, portalHq?: string | null): Promise<string> {
  const hq = portalHq ?? acting
  if (hq) return hq
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  return user.id
}

/** fetch, naming the org being acted in. */
export function impactFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (acting) headers.set(ORG_HEADER, acting)
  return fetch(path, { ...init, headers })
}
