// Holiday and camp balances: when they are due, and the words (pure — no
// database, no browser).
//
// A family books a trip with a deposit. When the coach has set a balance due
// date and the family agreed when paying the deposit, the balance is taken
// from the same card on that date. A week before (by default) they get a
// reminder saying exactly what will be taken and when. Families with no card
// kept — they paid another way, or booked before this — get the reminder with
// a link to pay instead. If a card payment fails, they are sent the link too.

import { addDaysIso } from './uk-date'
import { formatPennies } from './money'
import { owedPennies, type MoneyCamp, type MoneyAttendee } from './camp-money'

export type BalanceCamp = { name: string; balance_due?: string | null; auto_balance?: boolean | null; balance_reminder_days?: number | null; payment_mode?: string | null }

/** How long after the due date the balance is still taken on its own. Later than that is the coach's to chase. */
export const BALANCE_GRACE_DAYS = 14

export const dayWords = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

/** Where today falls for this camp's balance. */
export function balanceStage(c: BalanceCamp, today: string): 'none' | 'early' | 'remind' | 'due' | 'late' {
  if (!c.balance_due || c.payment_mode !== 'deposit') return 'none'
  const remindFrom = addDaysIso(c.balance_due, -Math.max(1, Math.min(30, Number(c.balance_reminder_days) || 7)))
  if (today < remindFrom) return 'early'
  if (today < c.balance_due) return 'remind'
  if (today <= addDaysIso(c.balance_due, BALANCE_GRACE_DAYS)) return 'due'
  return 'late'
}

/**
 * The family agreed to a balance of a set amount being taken from their card.
 * If the place now costs more (a room upgrade since), the card is not used:
 * the reminder carries a link instead. Agreements from before amounts were
 * kept have no amount, and stand as they are.
 */
export function withinAgreed(camp: MoneyCamp, a: MoneyAttendee & { balance_agreed_pennies?: unknown }): boolean {
  if (a.balance_agreed_pennies == null) return true
  return owedPennies(camp, a) <= Number(a.balance_agreed_pennies)
}

/** The words a family agrees to when paying the deposit. */
export function balanceAgreeText(o: { camp: string; academy: string; balance: number; due: string }): string {
  return `I agree that ${o.academy} will take the balance of ${formatPennies(o.balance)} for ${o.camp} from the card I pay the deposit with, on ${dayWords(o.due)}. I will get a reminder a few days before.`
}

const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function mail(o: { hello: string; paras: string[]; button?: { text: string; url: string }; who: string; academy: string }) {
  return `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"><div style="max-width:520px;margin:0 auto;padding:26px 18px"><div style="background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 2px 12px rgba(20,25,40,.07)"><p style="font-size:16px;color:#1a1d29;margin:0 0 10px">${esc(o.hello)}</p>${o.paras.map(p => `<p style="font-size:15.5px;color:#374151;margin:0 0 10px;line-height:1.6">${esc(p)}</p>`).join('')}${o.button ? `<p style="text-align:center;margin:18px 0 6px"><a href="${esc(o.button.url)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 26px;border-radius:12px">${esc(o.button.text)}</a></p>` : ''}<p style="font-size:14px;color:#6b7280;margin:16px 0 0">${esc(o.who)}</p></div><p style="font-size:12px;color:#9aa1ad;text-align:center;margin:14px 0 0">${esc(o.academy)} · sent through Lumio · reply to this email to reach your coach</p></div></body></html>`
}

/** A week before: what will be taken, or a link to pay. */
export function balanceReminder(o: { hello: string; player: string; camp: string; academy: string; who: string; balance: number; due: string; card: string | null; url: string }): { subject: string; html: string; text: string } {
  const subject = `${o.camp}: balance of ${formatPennies(o.balance)} due ${dayWords(o.due)}`
  const paras = o.card
    ? [`Just a reminder that the balance of ${formatPennies(o.balance)} for ${o.player}’s place on ${o.camp} will be taken from your ${o.card} on ${dayWords(o.due)}, as agreed when you paid the deposit.`, 'There is nothing you need to do. If you would rather pay another way, or that card has changed, you can pay now from the link below.']
    : [`The balance of ${formatPennies(o.balance)} for ${o.player}’s place on ${o.camp} is due on ${dayWords(o.due)}.`, 'You can pay it by card from the link below.']
  const button = { text: o.card ? 'Pay a different way' : `Pay ${formatPennies(o.balance)}`, url: o.url }
  return { subject, html: mail({ hello: o.hello, paras, button, who: o.who, academy: o.academy }), text: `${o.hello}\n\n${paras.join('\n\n')}\n\n${o.url}\n\n${o.who}` }
}

/** The balance has been taken. */
export function balanceTaken(o: { hello: string; player: string; camp: string; academy: string; who: string; balance: number; card: string }): { subject: string; html: string } {
  const paras = [`The balance of ${formatPennies(o.balance)} for ${o.player}’s place on ${o.camp} has been taken from your ${o.card}. That’s everything paid. Thank you!`]
  return { subject: `${o.camp}: balance paid`, html: mail({ hello: o.hello, paras, who: o.who, academy: o.academy }) }
}

/** The card payment did not go through: a link to pay. */
export function balanceFailed(o: { hello: string; player: string; camp: string; academy: string; who: string; balance: number; url: string }): { subject: string; html: string } {
  const paras = [`We tried to take the balance of ${formatPennies(o.balance)} for ${o.player}’s place on ${o.camp}, but the card payment did not go through.`, 'Please pay it from the link below. If anything has changed, just reply to this email.']
  return { subject: `${o.camp}: the balance payment did not go through`, html: mail({ hello: o.hello, paras, button: { text: `Pay ${formatPennies(o.balance)}`, url: o.url }, who: o.who, academy: o.academy }) }
}
