// The per-org daily AI allowance for Lumio Impact (brief 4). Every call to the model made
// for an org — newsletter drafts, message drafts, social captions, imports — is logged in
// impact_ai_usage with its tokens and cost, and refused once that org's spend for the UK
// day reaches its cap. Pure parts here; the reads and writes are in ai-usage.ts.
//
// Cost is worked out from the model's published token prices in US dollars, converted at
// a fixed rate, so "£2 a day" is a cap on tokens, not on the invoice to the penny.

export const USD_TO_GBP = 0.8
/** US dollars per million tokens. */
const RATES: Record<string, { input: number; output: number }> = {
  haiku: { input: 0.8, output: 4 }, sonnet: { input: 3, output: 15 }, opus: { input: 15, output: 75 },
}
const rate = (model: string) => (/haiku/i.test(model) ? RATES.haiku : /opus/i.test(model) ? RATES.opus : RATES.sonnet)

/** What a call cost, in pence (4 decimal places, as stored). */
export function costPence(model: string, inputTokens: number, outputTokens: number): number {
  const r = rate(model)
  const usd = (Math.max(0, inputTokens) / 1e6) * r.input + (Math.max(0, outputTokens) / 1e6) * r.output
  return Math.round(usd * USD_TO_GBP * 100 * 10_000) / 10_000
}

export const DEFAULT_DAILY_PENCE = 200

/** The org's cap for today, in pence. IMPACT_AI_DAILY_PENCE_LUMIO_TEST overrides it for Lumio Test only. */
export function dailyCapPence(slug: string, env: Record<string, string | undefined> = process.env): number {
  const raw = slug === 'lumio-test' ? env.IMPACT_AI_DAILY_PENCE_LUMIO_TEST : undefined
  const n = Number(raw)
  return raw && Number.isFinite(n) && n >= 0 ? n : DEFAULT_DAILY_PENCE
}

export const CAP_MESSAGE = 'You’ve used today’s AI allowance for your organisation. It resets at midnight — you can still write and send everything yourself.'

/** The start of today in the UK, as an ISO instant (midnight Europe/London). */
export function ukDayStart(at: Date = new Date()): string {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(at)
  // London is UTC+0 or UTC+1; try both and keep the one that is that date's midnight there.
  for (const offset of [0, 1]) {
    const guess = new Date(`${date}T00:00:00Z`)
    guess.setUTCHours(guess.getUTCHours() - offset)
    const back = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hourCycle: 'h23' }).format(guess)
    if (back === '00') return guess.toISOString()
  }
  return new Date(`${date}T00:00:00Z`).toISOString()
}

export const AI_FEATURES = ['newsletter', 'message', 'social', 'import', 'other'] as const
export type AiFeature = typeof AI_FEATURES[number]
export const featureOf = (v: unknown): AiFeature => (AI_FEATURES as readonly string[]).includes(String(v)) ? (v as AiFeature) : 'other'
