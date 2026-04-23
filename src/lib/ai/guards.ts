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

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip') || 'unknown'
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
