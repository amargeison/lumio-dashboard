// ─────────────────────────────────────────────────────────────────────────────
// Import engine — AI cost & abuse guard. PRODUCT-AGNOSTIC.
//
// A single bulk import legitimately makes tens of model calls in a burst (a map
// call per batch of tabs, then up to 40 chunk reads per file, six at a time), so
// the chat routes' guard (10 calls / 10 min per IP, one shared $5/day) would
// break ordinary imports — and leave the importer uncapped if skipped, which is
// what it was. This guard is sized for imports and keyed by the ACCOUNT the
// import writes to (academy / org), not the IP:
//   • per-account rolling window of model calls
//   • per-account daily spend cap
//   • a global daily import spend cap across every account and product
// Kept separate from the chat routes' $5/day breaker (src/lib/ai/guards) on
// purpose: a big import must not switch off every portal's AI chat, and chat
// traffic must not block an import. In-memory like that tracker (resets on
// restart / UTC midnight); getImportSpend() exposes it. Limits are env-tunable.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'

const num = (v: string | undefined, d: number) => (v && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d)
export const IMPORT_CALLS_PER_WINDOW = num(process.env.IMPORT_AI_CALLS_PER_10MIN, 200)
export const IMPORT_WINDOW_MS = 10 * 60 * 1000
export const IMPORT_ACCOUNT_DAILY_USD = num(process.env.IMPORT_AI_ACCOUNT_DAILY_USD, 5)
export const IMPORT_GLOBAL_DAILY_USD = num(process.env.IMPORT_AI_GLOBAL_DAILY_USD, 40)

type State = { date: string; calls: Map<string, number[]>; spend: Map<string, number>; total: number }
const g = globalThis as unknown as { __lumioImportGuard?: State }
const today = () => new Date().toISOString().slice(0, 10)
function state(): State {
  const s = g.__lumioImportGuard ?? (g.__lumioImportGuard = { date: today(), calls: new Map(), spend: new Map(), total: 0 })
  if (s.date !== today()) { s.date = today(); s.spend.clear(); s.total = 0 }
  return s
}

const RATES: Record<string, { input: number; output: number }> = {
  haiku: { input: 0.8, output: 4 }, sonnet: { input: 3, output: 15 }, opus: { input: 15, output: 75 },
}
const rate = (model: string) => (/haiku/i.test(model) ? RATES.haiku : /opus/i.test(model) ? RATES.opus : RATES.sonnet)

/** Call before each model call. Returns a ready-made 429 response when over a limit. */
export function importGate(accountId: string): NextResponse | null {
  const s = state()
  if (s.total >= IMPORT_GLOBAL_DAILY_USD) {
    return NextResponse.json({ error: 'Imports are paused for today — please try again tomorrow.' }, { status: 429 })
  }
  if ((s.spend.get(accountId) ?? 0) >= IMPORT_ACCOUNT_DAILY_USD) {
    return NextResponse.json({ error: 'You’ve reached today’s import allowance — please try again tomorrow, or contact Lumio.' }, { status: 429 })
  }
  const now = Date.now()
  const recent = (s.calls.get(accountId) ?? []).filter(t => now - t < IMPORT_WINDOW_MS)
  if (recent.length >= IMPORT_CALLS_PER_WINDOW) {
    const retry = Math.ceil((IMPORT_WINDOW_MS - (now - recent[0])) / 1000)
    return NextResponse.json({ error: `That’s a lot of importing in a short time — please wait ${Math.ceil(retry / 60)} min and try again.` }, { status: 429, headers: { 'Retry-After': String(retry) } })
  }
  recent.push(now)
  s.calls.set(accountId, recent)
  return null
}

/** Call after each model call with its usage. `product` labels the shared tracker. */
export function recordImportSpend(accountId: string, usage: { input_tokens?: number; output_tokens?: number } | undefined, model: string, product: string) {
  void product // reserved for per-product reporting
  if (!usage || usage.input_tokens == null || usage.output_tokens == null) return
  const r = rate(model)
  const usd = (usage.input_tokens / 1e6) * r.input + (usage.output_tokens / 1e6) * r.output
  const s = state()
  s.spend.set(accountId, (s.spend.get(accountId) ?? 0) + usd)
  s.total += usd
}

/** Today's import spend, for admin tooling. */
export function getImportSpend() {
  const s = state()
  return { date: s.date, totalUsd: s.total, accounts: s.spend.size, globalCapUsd: IMPORT_GLOBAL_DAILY_USD, accountCapUsd: IMPORT_ACCOUNT_DAILY_USD }
}
