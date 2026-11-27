// Server-side rows in impact_settings_log (migration 240) for changes the database trigger
// can't see: people and access, data exports and erasures. Ids and counts only, never a
// name or an address. A failed write is logged to the console and never blocks the action.

import type { SupabaseClient } from '@supabase/supabase-js'

export type LogSection = 'people' | 'data' | 'integrations'

export async function logSettingsEvent(service: SupabaseClient, hqId: string, actorId: string, section: LogSection, diff: Record<string, unknown>) {
  const { error } = await service.from('impact_settings_log').insert({ hq_id: hqId, actor_id: actorId, section, source: 'server', diff })
  if (error) console.error('[impact/settings-log]', section, error.message)
}

/** From the browser, as the signed-in HQ: a save to a section kept outside impact_orgs.settings. */
export async function logAppChange(db: SupabaseClient, hqId: string, section: 'booklet' | 'venues' | 'people', diff: Record<string, unknown>) {
  const { error } = await db.from('impact_settings_log').insert({ hq_id: hqId, section, diff })
  if (error) console.error('[impact/settings-log]', section, error.message)
}
