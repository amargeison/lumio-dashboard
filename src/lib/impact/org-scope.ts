// Which org the signed-in person is acting in. Every browser write that sets
// hq_id gets it from here, so when coaches and parents can sign in this is the
// one place that changes. Today the HQ login's own id is the org.

import type { SupabaseClient } from '@supabase/supabase-js'

export async function currentHq(db: SupabaseClient): Promise<string> {
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  return user.id
}
