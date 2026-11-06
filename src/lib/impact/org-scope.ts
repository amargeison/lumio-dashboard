// Which org the signed-in person is acting in. Every browser write that sets
// hq_id gets it from here. An HQ's own id is its org; a coach acts in the org of the
// portal they opened, which the caller passes in.

import type { SupabaseClient } from '@supabase/supabase-js'

export async function currentHq(db: SupabaseClient, portalHq?: string | null): Promise<string> {
  if (portalHq) return portalHq
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  return user.id
}
