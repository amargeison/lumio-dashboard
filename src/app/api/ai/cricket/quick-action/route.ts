import { NextRequest, NextResponse } from 'next/server'
import {
  getClientIp,
  checkRateLimit,
  checkDailyCap,
  recordSpend,
  scrubContext,
  rateLimitedResponse,
  capReachedResponse,
} from '@/lib/ai/guards'

// ──────────────────────────────────────────────────────────────────────────
// Cricket Quick Action — live LLM dispatcher
//
// 7 action types, each with its own system prompt + user-message template.
// All go through this one route so we can share rate-limiting + auditing
// with the rest of /api/ai/* via src/lib/ai/guards.ts.
//
// Server-side only. ANTHROPIC_API_KEY never leaves the process.
// ──────────────────────────────────────────────────────────────────────────

type ActionType =
  | 'team-selection'
  | 'toss-advisor'
  | 'sponsor-post'
  | 'press-statement'
  | 'agent-brief'
  | 'match-prep'
  | 'innings-brief'

interface QuickActionRequest {
  type: ActionType
  context?: Record<string, unknown>
}

// ─── Prompt catalogue ────────────────────────────────────────────────────
// Each entry is a short system prompt + a user-message builder that folds
// in the caller-supplied context. Keep outputs < 250 tokens — these are
// quick-action bursts, not essays.
const PROMPTS: Record<ActionType, { system: string; user: (ctx: Record<string, unknown>) => string; maxTokens: number }> = {
  'team-selection': {
    system: 'You are an experienced county cricket Director of Cricket advising on squad selection for a specific match. Be decisive. Recommend an XI by role with a 2-3 sentence rationale. Cite one specific data point (e.g., "Pennington averages 48 at this ground"). Keep it under 150 words.',
    user: (ctx) => `Match: Oakridge CC vs ${ctx.opposition ?? 'Lancashire'}, ${ctx.format ?? 'County Championship'}, ${ctx.venue ?? 'Oakridge Park (home)'}, ${ctx.date ?? 'Friday'}. Fit squad available: ${JSON.stringify(ctx.fitSquad ?? 'top-order solid, Harrison RTP phase 3, Dawson workload capped')}. Workload flags: ${ctx.workloadFlags ?? 'Dawson A:C 1.62 — red'}. Opposition notes: ${ctx.oppNotes ?? 'LH-heavy top order, seam-friendly surface expected'}. Give me an XI with a short rationale.`,
    maxTokens: 400,
  },
  'toss-advisor': {
    system: 'You are an experienced cricket analyst advising a county captain on the toss. Given match conditions, pitch report, squad form, and opposition, recommend BAT or BOWL with a 60-word justification. Be decisive. Cite one specific data point (e.g., "our top-order averages 44.2 batting first on this ground"). Start the response with BAT FIRST or BOWL FIRST on its own line.',
    user: (ctx) => `Ground: ${ctx.ground ?? 'Oakridge Park'}. Weather: ${ctx.weather ?? 'Overcast'}. Pitch look: ${ctx.pitch ?? 'Green and grassy'}. Opposition batting: ${ctx.oppBatting ?? 'Strong top order'}. Squad form: ${ctx.squadForm ?? 'Top order averaging 42.1 last 5 matches'}. Format: ${ctx.format ?? 'County Championship'}. What should we do at the toss?`,
    maxTokens: 250,
  },
  'sponsor-post': {
    system: 'You write social media copy for a county cricket club\'s sponsor obligations. Output a single short Instagram post (max 90 words, max 3 hashtags) that meets the brief without sounding like a press release. Warm and club-voice. Include one specific match or player detail.',
    user: (ctx) => `Sponsor: ${ctx.sponsor ?? 'Crownmark Cricket'} (${ctx.sponsorTier ?? 'Official kit partner'}). Obligation: ${ctx.obligation ?? 'Matchday bat photo post'}. Match: ${ctx.match ?? 'vs Lancashire, Friday, Oakridge Park'}. Player: ${ctx.player ?? 'Harry Fairweather'}. Tone: ${ctx.tone ?? 'confident, match-day energy'}. Write the post.`,
    maxTokens: 300,
  },
  'press-statement': {
    system: 'You are a cricket club media officer drafting a short, on-the-record press statement from the director. 120 words max. Lead with the news. No hedging. One supporting quote attributed to the director or head coach.',
    user: (ctx) => `Topic: ${ctx.topic ?? 'Contract renewal — Harry Fairweather'}. Key facts: ${ctx.facts ?? '3-year extension, central + county combined, through 2029'}. Tone: ${ctx.tone ?? 'measured confidence'}. Audience: ${ctx.audience ?? 'national cricket press'}. Draft the statement.`,
    maxTokens: 400,
  },
  'agent-brief': {
    system: 'You write concise, negotiation-ready briefs for a county cricket club to send to a player\'s agent. Under 150 words. Cover: offer, commercial context, timeline, and one sweetener. Be specific, not performative.',
    user: (ctx) => `Player: ${ctx.player ?? 'Target player'}. Agent: ${ctx.agent ?? 'Oakridge Sports'}. Purpose: ${ctx.purpose ?? 'Open extension talks'}. Offer context: ${ctx.offer ?? '£135k/yr, 2 years, county + Hundred release window'}. Timeline: ${ctx.timeline ?? 'Respond before 30 Apr'}. Draft the brief.`,
    maxTokens: 400,
  },
  'match-prep': {
    system: 'You are a county cricket analyst preparing a tactical brief for the head coach before a match. 4-6 bullet points. Each bullet must be actionable — specific bowler, batter, over range, or field setting. No generic platitudes.',
    user: (ctx) => `Match: Oakridge CC vs ${ctx.opposition ?? 'Lancashire'}, ${ctx.format ?? 'County Championship'}, ${ctx.venue ?? 'Oakridge Park (home)'}, ${ctx.date ?? 'Friday 10:30'}. Opposition top order: ${ctx.oppTopOrder ?? 'Sinclair, Kellett, Ravenhill'}. Their strengths: ${ctx.oppStrengths ?? 'Strong against pace, LH-heavy middle order'}. Their weaknesses: ${ctx.oppWeaknesses ?? 'Sinclair avg 17 vs nip-backer, Kellett struggles vs LAS'}. Our attack: ${ctx.ourAttack ?? 'Ridley, Fenwick (seam), Kent (LAS), Merriman (OS)'}. Pitch: ${ctx.pitch ?? 'seam-friendly first two sessions, softens after tea'}. Prepare the brief.`,
    maxTokens: 500,
  },
  'innings-brief': {
    system: 'You are a cricket analyst delivering a mid-match tactical brief between innings or at a drinks break. 4-5 bullet points. Each bullet must reference the live match situation — actual score, partnerships, overs, conditions. Recommend specific bowler/batter actions for the next session.',
    user: (ctx) => `Match situation: ${ctx.score ?? '247/8 after 65 overs'}, batting first, day ${ctx.day ?? 1}. Recent partnerships: ${ctx.partnerships ?? 'Webb-Shaw 83 in 20 overs, Cole-Hill 51 in 12'}. Pitch: ${ctx.pitch ?? 'softening, seam movement reducing after tea'}. Opposition bowlers who\'ve leaked runs: ${ctx.leakyBowlers ?? 'Singh (leg-spin) 58 off 12'}. Projected total: ${ctx.projected ?? '342 @ current rate'}. Give me the brief for the next session.`,
    maxTokens: 500,
  },
}

// ─── Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const started = Date.now()
  try {
    const ip = getClientIp(req)

    const rl = checkRateLimit(ip)
    if (!rl.ok) return rateLimitedResponse(rl.retryInSec)

    const cap = checkDailyCap()
    if (!cap.ok) return capReachedResponse(cap.spent)

    const body = (await req.json()) as QuickActionRequest
    const type = body?.type
    if (!type || !(type in PROMPTS)) {
      return NextResponse.json({ error: `Unknown action type: ${type}` }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on the server.' }, { status: 500 })
    }

    const spec = PROMPTS[type]
    const ctx  = scrubContext(body?.context)

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: spec.maxTokens,
        system: spec.system,
        messages: [{ role: 'user', content: spec.user(ctx) }],
      }),
    })

    if (!upstream.ok) {
      const txt = await upstream.text().catch(() => '')
      return NextResponse.json(
        { error: `Upstream error (${upstream.status}). Please try again.`, detail: txt.slice(0, 200) },
        { status: 502 },
      )
    }

    const data = await upstream.json() as {
      content?: Array<{ type:string; text:string }>
      usage?: { input_tokens:number; output_tokens:number }
      model?: string
    }
    const response = data?.content?.[0]?.text ?? ''
    const latencyMs = Date.now() - started
    const tokens = data?.usage
      ? { input: data.usage.input_tokens, output: data.usage.output_tokens }
      : undefined

    if (tokens) {
      const estUsd = recordSpend(tokens.input, tokens.output, data?.model, 'cricket')
      // eslint-disable-next-line no-console
      console.log(`[cricket/quick-action] ${type} ip=${ip} in=${tokens.input} out=${tokens.output} cost=$${estUsd.toFixed(4)} latency=${latencyMs}ms`)
    }

    return NextResponse.json({
      response,
      modelUsed: data?.model ?? 'claude-sonnet-4-20250514',
      latencyMs,
      tokens,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to call AI. Please try again.', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
