// ───────────────────────────────────────────────────────────────────────────
// Shared guards for all /api/ai/* routes.
//
// Everything here lives on globalThis so that every route that imports this
// module participates in the SAME rate-limit window and the SAME daily spend
// cap. Do not create per-route copies of this state — that's exactly what
// this module replaces.
//
// Storage: in-memory. Resets on PM2 bounce or UTC midnight. Move to Redis
// when we have more than one node handling traffic.
// ───────────────────────────────────────────────────────────────────────────

import { clientIp, rateLimit } from '@/lib/rate-limit'

export const DAILY_CAP_USD = 5.0
export const IP_LIMIT = 10
export const WINDOW_MS = 10 * 60 * 1000 // 10 minutes

// Claude Sonnet 4 rate card (USD / 1M tokens). Keep in sync with the model
// string the sport routes forward, and with whatever admin tooling reads this.
export const MODEL_RATES = { input: 3, output: 15 } as const

// ─── Rate limit — per-IP rolling window ────────────────────────────────────

type RLStore = Map<string, number[]>
const g = globalThis as unknown as {
  __lumioAIRateLimit?: RLStore
  __lumioAISpend?: SpendState
  __lumioAIBySport?: BySportState
}
const rateStore: RLStore = g.__lumioAIRateLimit ?? new Map()
g.__lumioAIRateLimit = rateStore

// Delegates to the shared helper. This used to take the FIRST entry of
// X-Forwarded-For, which under nginx's appending idiom is whatever the caller
// sent — so anyone could mint a fresh rate-limit bucket per request just by
// varying a header, and the per-IP window did nothing at all.
export function getClientIp(req: Request): string {
  return clientIp(req.headers)
}

export function checkRateLimit(ip: string): { ok: true } | { ok: false; retryInSec: number } {
  const now = Date.now()
  const entries = rateStore.get(ip) ?? []
  const fresh = entries.filter(t => now - t < WINDOW_MS)
  if (fresh.length >= IP_LIMIT) {
    const oldest = fresh[0]
    return { ok: false, retryInSec: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) }
  }
  fresh.push(now)
  rateStore.set(ip, fresh)
  return { ok: true }
}

// ─── Daily spend circuit breaker ───────────────────────────────────────────

export type SpendState = { date: string; spendUsd: number; calls: number; lastCallAt: number }
type BySportState = Record<string, { spendUsd: number; calls: number }>

function today(): string { return new Date().toISOString().slice(0, 10) }

const defaultSpend = (): SpendState => ({ date: today(), spendUsd: 0, calls: 0, lastCallAt: 0 })
const spendState: SpendState = g.__lumioAISpend ?? defaultSpend()
g.__lumioAISpend = spendState
const bySport: BySportState = g.__lumioAIBySport ?? {}
g.__lumioAIBySport = bySport

function rollIfNewDay() {
  const t = today()
  if (spendState.date !== t) {
    spendState.date = t
    spendState.spendUsd = 0
    spendState.calls = 0
    spendState.lastCallAt = 0
    for (const k of Object.keys(bySport)) delete bySport[k]
  }
}

export function getSpendState() {
  rollIfNewDay()
  return {
    date: spendState.date,
    spendUsd: spendState.spendUsd,
    calls: spendState.calls,
    lastCallAt: spendState.lastCallAt,
    utilisation: spendState.spendUsd / DAILY_CAP_USD,
    bySport: { ...bySport },
  }
}

export function checkDailyCap(): { ok: true; spent: number } | { ok: false; spent: number } {
  rollIfNewDay()
  if (spendState.spendUsd >= DAILY_CAP_USD) {
    return { ok: false, spent: spendState.spendUsd }
  }
  return { ok: true, spent: spendState.spendUsd }
}

function rateForModel(model: string | undefined): { input: number; output: number } {
  // Only Sonnet 4 is in play for sport AI today. If/when we introduce Haiku
  // or Opus, branch on the model string here.
  if (model && /haiku/i.test(model))  return { input: 0.8, output: 4 }
  if (model && /opus/i.test(model))   return { input: 15, output: 75 }
  return MODEL_RATES
}

export function recordSpend(inputTokens: number, outputTokens: number, model?: string, sport?: string): number {
  rollIfNewDay()
  const rates = rateForModel(model)
  const usd = (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output
  spendState.spendUsd += usd
  spendState.calls += 1
  spendState.lastCallAt = Date.now()
  if (sport) {
    const entry = bySport[sport] ?? { spendUsd: 0, calls: 0 }
    entry.spendUsd += usd
    entry.calls += 1
    bySport[sport] = entry
  }
  return usd
}

// ─── Input hygiene ─────────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /disregard (all )?previous/i,
  /system\s*:/i,
  /you are now/i,
  /\bDAN\b|\bdeveloper mode\b/i,
]

export function scrubPromptInjection(input: string): string {
  let s = input.slice(0, 2000)
  for (const re of INJECTION_PATTERNS) s = s.replace(re, '[blocked]')
  return s
}

export function scrubContext(ctx: unknown): Record<string, unknown> {
  if (!ctx || typeof ctx !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(ctx as Record<string, unknown>)) {
    if (typeof v !== 'string') { out[k] = v; continue }
    let s = v.slice(0, 500)
    for (const re of INJECTION_PATTERNS) s = s.replace(re, '[blocked]')
    out[k] = s
  }
  return out
}

// ─── Standard response helpers ─────────────────────────────────────────────

export function rateLimitedResponse(retryInSec: number): Response {
  return new Response(
    JSON.stringify({ error: 'rate_limited', retryInSec }),
    { status: 429, headers: { 'Content-Type': 'application/json' } },
  )
}

export function capReachedResponse(spent: number): Response {
  return new Response(
    JSON.stringify({
      error: 'daily_quota_reached',
      resetsAt: '00:00 UTC',
      spendUsd: Number(spent.toFixed(4)),
      capUsd: DAILY_CAP_USD,
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  )
}

// ─── Gate for every other route that spends on our keys ────────────────────
//
// The sport routes above check the cap, call the model, then record what it
// cost. That leaves a gap: a burst of requests all pass the check before any
// of them has recorded a penny. The routes below are the ones that had no
// protection at all (CMS, schools, CRM, football tools, text-to-speech), and
// several can be reached without signing in, so they get the stricter form:
//
//   · the cost of a call is RESERVED before the call is made, at the most it
//     could cost (every output token used). The cap therefore trips early,
//     never late, and a burst cannot overshoot it.
//   · the reservation lands in the SAME daily total as the sport routes, so
//     the figure on the admin AI-spend page is one total for everything public
//     and that total cannot pass DAILY_CAP_USD.
//
// It reads headers only, so it can be the first line of a handler — before the
// body is parsed and before anything is looked up.

export const OPEN_IP_LIMIT = 20            // calls per IP per window, across all of these routes
const WEB_SEARCH_USD = 0.06                // one search: the $0.01 fee plus the results it feeds back in

export type GateOpts = {
  label: string            // shown on the admin AI-spend page, e.g. 'cms:overview'
  maxTokens: number        // the route's max_tokens
  calls?: number           // model calls one request can make (retries count)
  model?: string
  searches?: number        // web searches one request can trigger
  inputTokens?: number     // prompt the SERVER adds (templates, database rows)
  limit?: number           // per-IP calls per window, if not the default
}

export function estimateUsd(req: Request, o: GateOpts): number {
  const rates = rateForModel(o.model)
  const raw = req.headers.get('content-length')
  const len = raw == null ? NaN : Number(raw)
  // ~3 bytes a token is deliberately pessimistic. No length on a request that
  // has a body means we cannot see how big it is, so assume a large one.
  const bodyTokens = Number.isFinite(len) && len >= 0
    ? Math.ceil(len / 3)
    : (req.method === 'GET' ? 0 : 20_000)
  const input = (o.inputTokens ?? 3000) + bodyTokens
  const one = (input / 1_000_000) * rates.input + (o.maxTokens / 1_000_000) * rates.output
  return one * Math.max(1, o.calls ?? 1) + (o.searches ?? 0) * WEB_SEARCH_USD
}

function reserve(usd: number, label: string) {
  spendState.spendUsd += usd
  spendState.calls += 1
  spendState.lastCallAt = Date.now()
  const entry = bySport[label] ?? { spendUsd: 0, calls: 0 }
  entry.spendUsd += usd
  entry.calls += 1
  bySport[label] = entry
}

function gate(req: Request, label: string, usd: number, limit: number, bucket = 'ai-open'): Response | null {
  const rl = rateLimit(`${bucket}:${getClientIp(req)}`, limit, WINDOW_MS)
  if (!rl.ok) return rateLimitedResponse(rl.retryAfterSeconds)
  rollIfNewDay()
  if (spendState.spendUsd + usd > DAILY_CAP_USD) return capReachedResponse(spendState.spendUsd)
  reserve(usd, label)
  return null
}

// Returns a Response to send back when the caller is over the limit or the
// day's money is spent; null when the call may go ahead (and is now paid for).
export function spendGate(req: Request, o: GateOpts): Response | null {
  return gate(req, o.label, estimateUsd(req, o), o.limit ?? OPEN_IP_LIMIT)
}

// Text-to-speech is billed per character, not per token.
const TTS_USD_PER_CHAR = 0.00015
export function ttsGate(req: Request, chars: number, limit = 30): Response | null {
  return gate(req, 'tts', Math.max(0, chars) * TTS_USD_PER_CHAR, limit, 'ai-tts')
}

// A limit with no charge, for a route that calls a paid service's free
// endpoint. It still should not be hammered.
export function rateGate(req: Request, limit = OPEN_IP_LIMIT): Response | null {
  const rl = rateLimit(`ai-open:${getClientIp(req)}`, limit, WINDOW_MS)
  return rl.ok ? null : rateLimitedResponse(rl.retryAfterSeconds)
}

// ─── Bounding a body the BROWSER wrote ─────────────────────────────────────
//
// Two routes forward the browser's JSON straight to the model. Left as they
// were, the caller chose the model, the output length, the tools and the
// system prompt — a free general-purpose assistant on our key. This keeps what
// the real pages send (one user message, a length up to the route's ceiling,
// and the two mailbox/calendar connectors) and drops everything else.

const PASSTHROUGH_MODEL = 'claude-sonnet-4-6'
const PASSTHROUGH_MAX_CHARS = 16_000
const MCP_ALLOWED = new Set(['https://gmail.mcp.claude.com/mcp', 'https://gcal.mcp.claude.com/mcp'])

export class OpenBodyError extends Error {
  status: number
  constructor(message: string, status = 400) { super(message); this.status = status }
}

export function boundOpenBody(raw: unknown, ceiling: number): Record<string, unknown> {
  const b = (raw ?? {}) as Record<string, unknown>
  if (!Array.isArray(b.messages) || b.messages.length !== 1) {
    throw new OpenBodyError('This endpoint takes a single message.')
  }
  const m = b.messages[0] as Record<string, unknown>
  const content = typeof m?.content === 'string' ? m.content : ''
  if (!content.trim()) throw new OpenBodyError('messages[0].content is required.')
  if (content.length > PASSTHROUGH_MAX_CHARS) throw new OpenBodyError('That request is too long.', 413)

  const asked = Math.round(Number(b.max_tokens) || 1000)
  const out: Record<string, unknown> = {
    model: PASSTHROUGH_MODEL,
    max_tokens: Math.min(ceiling, Math.max(1, asked)),
    messages: [{ role: 'user', content }],
  }
  if (Array.isArray(b.mcp_servers)) {
    const servers = (b.mcp_servers as Record<string, unknown>[])
      .filter(s => typeof s?.url === 'string' && MCP_ALLOWED.has(s.url as string))
      .slice(0, 2)
      .map(s => ({ type: 'url', url: s.url, name: String(s.name || '').slice(0, 20) }))
    if (servers.length) out.mcp_servers = servers
  }
  return out
}
