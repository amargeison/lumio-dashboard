// Weekly groups: the dates, the rules and the words (pure — no database, no browser).
//
// A group meets on the same day every week ("Thursday Adults, 7pm, up to 8,
// £15 each"). Some days before each session (six, by default) everyone in the
// group is sent their own link: are you coming this week? Saying yes takes a
// place and pays for it. Cancelling is free until the coach's cancellation
// window closes (24 hours before, by default); after that the place stands.

import { ukDate, addDaysIso } from './uk-date'
import { ukLocalToMs } from './cancel-policy'
import { niceTime } from './reminders'
import { formatPennies } from './money'

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export type GroupLike = { weekday: number; start_time: string; ask_days?: number | null }

/** 0 Monday … 6 Sunday, for a 'YYYY-MM-DD' date. */
export const weekdayOf = (iso: string) => (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7

/** The next session: the soonest date on the group's day whose start time has not passed. */
export function upcomingDate(g: GroupLike, now = Date.now()): string {
  const today = ukDate(new Date(now))
  for (let i = 0; i < 8; i++) {
    const d = addDaysIso(today, i)
    if (weekdayOf(d) === g.weekday && ukLocalToMs(d, g.start_time) > now) return d
  }
  return addDaysIso(today, 7)
}

/** The day the question goes out for a session. */
export const askOn = (date: string, askDays?: number | null) => addDaysIso(date, -Math.max(1, Math.min(14, Number(askDays) || 6)))

/** Is it time to ask about this session? (From its ask day until it starts.) */
export function dueToAsk(g: GroupLike, date: string, now = Date.now()): boolean {
  return ukDate(new Date(now)) >= askOn(date, g.ask_days) && ukLocalToMs(date, g.start_time) > now
}

/** "Thursdays at 7pm" */
export const everyWords = (g: GroupLike) => `${WEEKDAYS[g.weekday] || 'Weekly'}s at ${niceTime(g.start_time)}`

/** "Thursday 30 October" */
export function dayWords(date: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

/** "Wednesday at 7pm": when free cancellation ends, in words. */
export function untilWords(ms: number): string {
  const d = new Date(ms)
  const day = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Europe/London' })
  const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/London' })
  return `${day} at ${niceTime(t)}`
}

/** Where a session stands for cancelling: free until when, and whether it has started. */
export function cancelState(date: string, time: string, policyHours: number, now = Date.now()) {
  const starts = ukLocalToMs(date, time)
  const freeUntil = starts - Math.max(0, policyHours) * 3_600_000
  return { starts, freeUntil, free: now < freeUntil, started: now >= starts }
}

/** How a yes will be paid for, from what the coach and the client have set up. */
export type PayWay = 'card' | 'link' | 'day'
export function payWayFor(chargesEnabled: boolean, hasSaved: boolean): PayWay {
  if (!chargesEnabled) return 'day'
  return hasSaved ? 'card' : 'link'
}

export function payWords(way: PayWay, price: number, who: string, methodLabel?: string | null): string {
  const p = formatPennies(price)
  if (price <= 0) return 'There is nothing to pay.'
  if (way === 'card') return `Saying yes pays ${p} from your saved ${methodLabel || 'card'}.`
  if (way === 'link') return `It is ${p}, paid by card when you say yes.`
  return `It is ${p}, paid to ${who} on the day.`
}

const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function shell(o: { logoUrl?: string | null; hello: string; paras: string[]; buttons: { text: string; url: string; primary?: boolean }[]; who: string; footer: string }) {
  return `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:26px 18px">
    ${o.logoUrl ? `<div style="text-align:center;margin-bottom:16px"><img src="${esc(o.logoUrl)}" alt="" style="height:46px;max-width:150px;object-fit:contain"></div>` : ''}
    <div style="background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 2px 12px rgba(20,25,40,.07)">
      <p style="font-size:16px;color:#1a1d29;margin:0 0 10px">${esc(o.hello)}</p>
      ${o.paras.map(p => `<p style="font-size:15.5px;color:#374151;margin:0 0 10px;line-height:1.6">${esc(p)}</p>`).join('\n      ')}
      <p style="text-align:center;margin:18px 0 6px">${o.buttons.map(b => `<a href="${esc(b.url)}" style="display:inline-block;margin:4px;${b.primary ? 'background:#3A8EE0;color:#fff;' : 'background:#fff;color:#374151;border:1px solid #dfe3ec;'}text-decoration:none;font-weight:700;font-size:16px;padding:13px 22px;border-radius:12px">${esc(b.text)}</a>`).join('')}</p>
      <p style="font-size:14px;color:#6b7280;margin:16px 0 0">${esc(o.who)}</p>
    </div>
    <p style="font-size:12px;color:#9aa1ad;text-align:center;margin:14px 0 0;line-height:1.5">${esc(o.footer)}</p>
  </div></body></html>`
}

/** "Are you coming this week?" */
export function askMessage(o: {
  hello: string; childFirst: string | null; coachName: string | null; academy: string; logoUrl?: string | null
  group: string; date: string; time: string; durMin: number; venue: string | null; court: string | null
  price: number; way: PayWay; methodLabel?: string | null; freeUntil: number | null; url: string
}): { subject: string; text: string; html: string } {
  const who = o.coachName || o.academy
  const when = `${dayWords(o.date)} at ${niceTime(o.time)}`
  const where = o.venue ? ` at ${o.venue}${o.court ? ` (${o.court})` : ''}` : ''
  const line = `${o.childFirst ? `Is ${o.childFirst} coming` : 'Are you coming'} to ${o.group} on ${when}${where}?`
  const pay = payWords(o.way, o.price, who, o.methodLabel)
  const cancel = o.freeUntil ? `You can cancel free of charge until ${untilWords(o.freeUntil)}. After that your place stands.` : ''
  const subject = `${o.group}: coming on ${dayWords(o.date)}?`
  const text = `${o.hello}\n\n${line}\n\n${pay}${cancel ? ` ${cancel}` : ''}\n\nAnswer here: ${o.url}\n\n${who}`
  const html = shell({
    logoUrl: o.logoUrl, hello: o.hello, paras: [line, [pay, cancel].filter(Boolean).join(' ')], who,
    buttons: [{ text: 'Yes, I’m coming', url: `${o.url}?a=yes`, primary: true }, { text: 'Can’t make it', url: `${o.url}?a=no` }],
    footer: `${o.academy} · sent through Lumio because you are in ${o.group}. Places go to the first to say yes.`,
  })
  return { subject, text, html }
}

/** The confirmation once they are in. */
export function yesMessage(o: {
  hello: string; childFirst: string | null; coachName: string | null; academy: string; logoUrl?: string | null
  group: string; date: string; time: string; venue: string | null; court: string | null
  paid: string | null; freeUntil: number | null; url: string
}): { subject: string; text: string; html: string } {
  const who = o.coachName || o.academy
  const when = `${dayWords(o.date)} at ${niceTime(o.time)}`
  const line = `${o.childFirst ? `${o.childFirst} is` : 'You’re'} in for ${o.group} on ${when}${o.venue ? ` at ${o.venue}${o.court ? ` (${o.court})` : ''}` : ''}.`
  const cancel = o.freeUntil && o.freeUntil > Date.now() ? `Can’t come after all? Cancel free of charge until ${untilWords(o.freeUntil)} from the same link.` : ''
  const subject = `You’re in: ${o.group}, ${dayWords(o.date)}`
  const text = `${o.hello}\n\n${line}${o.paid ? ` ${o.paid}` : ''}\n\n${cancel}\n${o.url}\n\n${who}`
  const html = shell({ logoUrl: o.logoUrl, hello: o.hello, paras: [line, o.paid || '', cancel].filter(Boolean), who, buttons: [{ text: 'See my place', url: o.url }], footer: `${o.academy} · sent through Lumio.` })
  return { subject, text, html }
}
