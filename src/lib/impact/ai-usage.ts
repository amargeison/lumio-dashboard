// Server side of the per-org AI allowance (see ai-cost.ts): today's spend, the gate, and
// the log. Uses the service role, because impact_ai_usage is written by the server only.

import type { SupabaseClient } from '@supabase/supabase-js'
import { CAP_MESSAGE, costPence, dailyCapPence, ukDayStart, type AiFeature } from './ai-cost'

export async function spentTodayPence(service: SupabaseClient, hqId: string): Promise<number> {
  const { data, error } = await service.from('impact_ai_usage').select('cost_pence').eq('hq_id', hqId).gte('created_at', ukDayStart()).limit(5000)
  if (error) throw new Error(`impact_ai_usage: ${error.message}`)
  return (data ?? []).reduce((n, r) => n + Number(r.cost_pence ?? 0), 0)
}

export type AiGate = { ok: true; capPence: number; spentPence: number } | { ok: false; status: number; error: string }

/** Before a model call. Over the cap → the refusal is logged and a friendly message returned. Fails closed. */
export async function aiGate(service: SupabaseClient, org: { hqId: string; slug: string }, userId: string | null, feature: AiFeature): Promise<AiGate> {
  const capPence = dailyCapPence(org.slug)
  let spentPence: number
  try { spentPence = await spentTodayPence(service, org.hqId) } catch (e) {
    console.error('[impact-ai] usage read failed', e instanceof Error ? e.message : e)
    return { ok: false, status: 503, error: 'AI drafting is unavailable just now. Please try again in a minute.' }
  }
  if (spentPence >= capPence) {
    await service.from('impact_ai_usage').insert({ hq_id: org.hqId, user_id: userId, feature, model: '-', refused: true })
    return { ok: false, status: 429, error: CAP_MESSAGE }
  }
  return { ok: true, capPence, spentPence }
}

/** After a model call: one row with org, feature, model and tokens. */
export async function logAiUsage(service: SupabaseClient, hqId: string, userId: string | null, feature: AiFeature, model: string, usage: { input_tokens?: number; output_tokens?: number } | undefined) {
  const input = Math.max(0, Math.round(usage?.input_tokens ?? 0)), output = Math.max(0, Math.round(usage?.output_tokens ?? 0))
  const { error } = await service.from('impact_ai_usage').insert({ hq_id: hqId, user_id: userId, feature, model: model.slice(0, 80), input_tokens: input, output_tokens: output, cost_pence: costPence(model, input, output) })
  if (error) console.error('[impact-ai] usage log failed', error.message)
}
