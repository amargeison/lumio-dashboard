// ─────────────────────────────────────────────────────────────────────────────
// Money, the same way everywhere in the coach portal.
//
// One formatter and one way of adding up, because the Payments page rounded
// everything to whole pounds (£12.50 read "£13") while the dashboard beside it
// printed "£2,042.5" — two different wrong answers for one database figure.
//
// Amounts are stored in pounds (a numeric column). They are ADDED in pennies,
// as whole numbers, so 0.1 + 0.2 can never become 0.30000000000000004.
// ─────────────────────────────────────────────────────────────────────────────

/** Pounds (number or numeric string from the database) → whole pennies. */
export function toPennies(pounds: unknown): number {
  const n = Number(pounds)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

/** Add amounts held in pounds; the answer is in pennies. */
export function sumPennies(amounts: unknown[]): number {
  return amounts.reduce<number>((t, a) => t + toPennies(a), 0)
}

// What is still owed on one payment line — the one definition the Payments
// page, the dashboard and the briefing all add up. Each used to have its own,
// and they disagreed about a refunded invoice that had been un-ticked: one
// screen said nothing was owed while the other asked for the full amount.
//
// Refunded, cancelled, void or written off (the import keeps the word in the
// notes) is never owed, ticked or not.
type OwedLine = { paid?: boolean | null; amount?: unknown; notes?: string | null; status?: string | null }
export const isVoidPayment = (p: OwedLine): boolean =>
  /status:\s*(refund|cancel|void|written off)/i.test(p.notes || '') || /^(refund|cancel|void)/i.test(p.status || '')
export const paymentOwedPennies = (p: OwedLine): number =>
  !p.paid && !isVoidPayment(p) ? Math.max(0, toPennies(p.amount)) : 0

/** Pennies → "£40", "£12.50", "£2,042.50". Pence appear only when there are some. */
export function formatPennies(pennies: number): string {
  const p = Number.isFinite(pennies) ? Math.round(pennies) : 0
  const abs = Math.abs(p)
  const text = (abs / 100).toLocaleString('en-GB', abs % 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 })
  return `${p < 0 ? '-' : ''}£${text}`
}

/** Pounds → the same text. */
export const formatPounds = (pounds: unknown): string => formatPennies(toPennies(pounds))

// The most one invoice or package can be. Anything larger is a slipped key, and
// it used to be saved and then overflow the tile it was shown in.
export const MAX_AMOUNT_POUNDS = 100000

export type ParsedAmount = { ok: true; pounds: number; pennies: number } | { ok: false; error: string }

/**
 * Read an amount a person typed. "12.50", "12,50" (a comma used as the decimal
 * point), "£40" and "1,250.00" are all understood. Blank, words, negatives,
 * a space inside the number ("12 50"), fractions of a penny and absurd sizes are refused, each with a message that
 * says what to type instead.
 */
export function parseAmount(input: unknown, opts: { allowZero?: boolean; max?: number } = {}): ParsedAmount {
  const max = opts.max ?? MAX_AMOUNT_POUNDS
  let s = String(input ?? '').trim().replace(/^£\s*/, '')
  if (!s) return { ok: false, error: 'Enter an amount, for example 12.50.' }
  // A gap inside the number is not joined up: "12 50" may be £12.50 or £1,250
  // and guessing saved the larger one. The coach is asked to type it again.
  if (/\s/.test(s)) return { ok: false, error: 'Type the amount without spaces, for example 12.50 or 1250.' }
  if (/^-/.test(s)) return { ok: false, error: 'An amount cannot be negative. Enter it as a positive number.' }
  // A comma followed by exactly one or two digits at the end is a decimal comma
  // ("12,50"). Commas between groups of three are thousands separators.
  if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.')
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '')
  if (!/^\d+(\.\d+)?$/.test(s)) return { ok: false, error: 'Enter the amount in numbers only, for example 12.50.' }
  if (/\.\d{3,}$/.test(s)) return { ok: false, error: 'Use pounds and pence only, for example 12.50.' }
  const pounds = Number(s)
  const pennies = Math.round(pounds * 100)
  if (!Number.isFinite(pounds)) return { ok: false, error: 'Enter the amount in numbers only, for example 12.50.' }
  if (pennies === 0 && !opts.allowZero) return { ok: false, error: 'Enter an amount above £0.' }
  if (pounds > max) return { ok: false, error: `That is more than ${formatPounds(max)}. Check the amount and try again.` }
  return { ok: true, pounds: pennies / 100, pennies }
}
