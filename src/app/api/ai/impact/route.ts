// Lumio Impact AI, live portals only (/impact/demo uses canned copy and never calls this).
//
// Who: the org's HQ (or an admin acting for it), checked by impactHq — the org comes from
// the x-impact-hq header. What it costs: every call is logged in impact_ai_usage with
// org, feature, model and tokens, and refused once the org's spend for the UK day reaches
// its cap (£2 by default; IMPACT_AI_DAILY_PENCE_LUMIO_TEST for Lumio Test). Lumio's
// shared breakers (product switch, per-IP window, global daily cap) still apply on top.
//
// Two kinds of request:
//   { feature: 'newsletter', angle, target?, focusDate? }
//       The server loads the org's real facts and brand voice and writes the prompt
//       (lib/impact/ai-prompt.ts) — the browser sends no prompt text at all. Returns
//       { draft, usage }.
//   { feature: 'message' | 'social' | 'other', messages: [...], max_tokens }
//       A short free-form draft, bounded by body-guard (pinned model, token ceiling, no
//       system prompt). Returns the model's reply.
// Nothing is ever sent from here: a human presses Send.

import { NextRequest, NextResponse } from 'next/server'
import { trackSportsEvent } from '@/lib/sports-events'
import { getClientIp, checkRateLimit, checkDailyCap, recordSpend, rateLimitedResponse, capReachedResponse, groupDisabledResponse } from '@/lib/ai/guards'
import { sanitizeAiBody, AiBodyError, ALLOWED_MODELS } from '@/lib/ai/body-guard'
import { impactHq } from '@/lib/impact/import-auth'
import { serviceDb } from '@/lib/impact/invite-send'
import { aiGate, logAiUsage, spentTodayPence } from '@/lib/impact/ai-usage'
import { dailyCapPence, featureOf } from '@/lib/impact/ai-cost'
import { ANGLES, buildNewsletterPrompt, parseDraft, type AngleId, type DraftTarget } from '@/lib/impact/ai-prompt'
import { brandVoice } from '@/lib/impact/comms-settings'
import { newsletterFacts } from '@/lib/impact/comms-server'
import { brandFor, type ImpactOrgSettings } from '@/lib/impact/org'
import { cleanSections } from '@/lib/impact/newsletter'

export const runtime = 'nodejs'
const MODEL = [...ALLOWED_MODELS][0]

async function callModel(body: Record<string, unknown>) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

/** Today's usage for Settings: { spentPence, capPence }. */
export async function GET() {
  const auth = await impactHq('see AI usage')
  if (auth instanceof NextResponse) return auth
  const service = serviceDb()
  const { data: org } = await service.from('impact_orgs').select('slug').eq('hq_id', auth.hqId).maybeSingle()
  if (!org) return NextResponse.json({ error: 'This login isn’t linked to an organisation yet.' }, { status: 403 })
  try {
    return NextResponse.json({ spentPence: await spentTodayPence(service, auth.hqId), capPence: dailyCapPence(org.slug as string) })
  } catch { return NextResponse.json({ error: 'Usage couldn’t be read just now.' }, { status: 503 }) }
}

export async function POST(req: NextRequest) {
  const disabled = groupDisabledResponse('impact')
  if (disabled) return disabled
  const auth = await impactHq('use AI drafting')
  if (auth instanceof NextResponse) return auth
  const { user, hqId } = auth
  try {
    const rl = checkRateLimit(getClientIp(req))
    if (!rl.ok) return rateLimitedResponse(rl.retryInSec)
    const cap = checkDailyCap()
    if (!cap.ok) return capReachedResponse(cap.spent)
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'AI drafting isn’t set up on this server.' }, { status: 503 })

    const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const feature = featureOf(raw.feature)
    const service = serviceDb()
    const { data: org } = await service.from('impact_orgs').select('slug, settings').eq('hq_id', hqId).maybeSingle()
    if (!org) return NextResponse.json({ error: 'This login isn’t linked to an organisation yet.' }, { status: 403 })
    const settings = (org.settings ?? {}) as ImpactOrgSettings
    const gate = await aiGate(service, { hqId, slug: org.slug as string }, user.id, feature)
    if (!gate.ok) return NextResponse.json({ error: gate.error, capped: gate.status === 429 }, { status: gate.status })

    if (feature === 'newsletter') {
      const angle = (ANGLES.some(a => a.id === raw.angle) ? raw.angle : 'this_week') as AngleId
      const t = (raw.target ?? {}) as Record<string, unknown>
      let target: DraftTarget = { kind: 'all' }
      if (t.kind === 'section') {
        const [current] = cleanSections([t.current])
        target = { kind: 'section', index: Math.max(0, Math.min(7, Math.round(Number(t.index) || 0))), current: current ?? { headline: '', body: '' }, others: (Array.isArray(t.others) ? t.others : []).map(x => String(x ?? '').slice(0, 120)).slice(0, 7) }
      }
      const focusDate = typeof raw.focusDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.focusDate) ? raw.focusDate : null
      const brand = brandFor(org.slug as string, settings)
      const facts = await newsletterFacts(service, hqId, brand.org)
      const prompt = buildNewsletterPrompt(facts, brandVoice(settings.messaging, brand.tagline ?? ''), angle, target, focusDate)
      const { ok, data } = await callModel({ model: MODEL, max_tokens: target.kind === 'all' ? 900 : 400, system: prompt.system, messages: [{ role: 'user', content: prompt.user }] })
      await logAiUsage(service, hqId, user.id, feature, MODEL, data?.usage)
      if (data?.usage) recordSpend(data.usage.input_tokens, data.usage.output_tokens, MODEL, 'impact')
      if (!ok) return NextResponse.json({ error: 'The AI couldn’t write a draft just now. Please try again.' }, { status: 502 })
      const text = Array.isArray(data?.content) ? data.content.map((c: { text?: string }) => c.text ?? '').join('') : ''
      const draft = parseDraft(text)
      if (!draft) return NextResponse.json({ error: 'The AI’s draft couldn’t be read. Please try again.' }, { status: 502 })
      return NextResponse.json({ draft })
    }

    // The browser does not get to choose what the model is — see body-guard.
    const body = sanitizeAiBody(raw, { allowWebSearch: false })
    const { data } = await callModel(body as unknown as Record<string, unknown>)
    await logAiUsage(service, hqId, user.id, feature, body.model, data?.usage)
    if (data?.usage?.input_tokens != null && data?.usage?.output_tokens != null) recordSpend(data.usage.input_tokens, data.usage.output_tokens, data.model || body.model, 'impact')
    trackSportsEvent(null, 'impact', 'ai_call', feature, { model: body.model, tokens: data?.usage?.output_tokens }).catch(() => {})
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AiBodyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Failed to call AI' }, { status: 500 })
  }
}
