// Day-before reminders and when summaries go out: the settings, and the words.
//
// Pure — no database, no browser. The timer (api/cron/reminders) decides WHO
// gets a reminder; this decides what it says and when the coach wants it sent.

import { weatherSentence, type LessonWeather, DEFAULT_LIMITS } from './weather'

export type ReminderSettings = {
  /** Email the family the day before each lesson. */
  dayBefore: boolean
  /** UK time to send them, "HH:MM". */
  at: string
  /** Put the forecast in the reminder, and warn the coach about bad weather. */
  weather: boolean
  /** Warn when the chance of rain reaches this (%), or the wind this (mph). */
  rainPct: number
  windMph: number
}
export type SummarySettings = {
  /** manual: the coach shares it themselves. now: Lumio sends it the moment the coach approves it. time: Lumio sends approved summaries at `at`. */
  send: 'manual' | 'now' | 'time'
  at: string
}

export const DEFAULT_REMINDERS: ReminderSettings = { dayBefore: false, at: '18:00', weather: true, rainPct: DEFAULT_LIMITS.rainPct, windMph: DEFAULT_LIMITS.windMph }
export const DEFAULT_SUMMARIES: SummarySettings = { send: 'manual', at: '22:00' }

const hhmm = (v: unknown, d: string) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : d)
const clamp = (v: unknown, lo: number, hi: number, d: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d }

export function readReminders(raw: unknown): ReminderSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<ReminderSettings>
  return {
    dayBefore: !!r.dayBefore,
    at: hhmm(r.at, DEFAULT_REMINDERS.at),
    weather: r.weather !== false,
    rainPct: clamp(r.rainPct, 10, 100, DEFAULT_REMINDERS.rainPct),
    windMph: clamp(r.windMph, 5, 60, DEFAULT_REMINDERS.windMph),
  }
}
export function readSummaries(raw: unknown): SummarySettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<SummarySettings>
  return { send: r.send === 'now' || r.send === 'time' ? r.send : 'manual', at: hhmm(r.at, DEFAULT_SUMMARIES.at) }
}

/** "10:00" / "10:30" → "10am" / "10.30am", the way the UK writes times in a message. */
export function niceTime(t: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '')
  if (!m) return t
  const h = Number(m[1]), mi = m[2]
  const ap = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${mi === '00' ? '' : `.${mi}`}${ap}`
}

export type ReminderInput = {
  hello: string
  /** The player's first name, when the email goes to their parent. */
  childFirst: string | null
  academy: string
  coachName: string | null
  time: string               // "10:00"
  durMin: number
  type: string | null
  venue: string | null
  court: string | null
  paid: boolean
  weather: LessonWeather | null
  /** e.g. "tomorrow" or "on Saturday" */
  when?: string
  /** "I'll be there" / "I can't make it" — the lesson's own link (/lesson/<token>). */
  links?: { yes: string; no: string } | null
}

const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The reminder: information, not a request. */
export function reminderMessage(i: ReminderInput): { subject: string; text: string; html: string } {
  const when = i.when || 'tomorrow'
  const at = niceTime(i.time)
  const where = [i.venue, i.court].filter(Boolean).join(', ')
  const who = i.childFirst ? `${i.childFirst}’s` : 'your'
  const lesson = (i.type && !/^private$/i.test(i.type) ? `${i.type.toLowerCase()} session` : 'lesson')
  const lines = [
    i.childFirst
      ? `Just a reminder that ${who} ${lesson} is at ${at} ${when}${where ? ` at ${where}` : ''}.`
      : `See you at ${at} ${when}${where ? ` at ${where}` : ''}.`,
  ]
  const wx = weatherSentence(i.weather)
  if (wx) lines.push(`${wx.charAt(0).toUpperCase()}${wx.slice(1)}.`)
  lines.push(i.paid ? `${i.childFirst ? 'It' : `Your ${lesson}`} is confirmed and paid.` : `${i.childFirst ? 'It' : `Your ${lesson}`} is confirmed.`)
  const sign = i.coachName || i.academy
  const subject = `${i.childFirst ? `${i.childFirst}’s ${lesson}` : `Your ${lesson}`} ${when} at ${at}`
  const text = `${i.hello}\n\n${lines.join(' ')}${i.links ? `\n\nI’ll be there: ${i.links.yes}\nI can’t make it: ${i.links.no}` : ''}\n\n${sign}`
  const buttons = i.links
    ? `<p style="margin:18px 0 0"><a href="${esc(i.links.yes)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:11px;margin:0 8px 8px 0">I’ll be there</a><a href="${esc(i.links.no)}" style="display:inline-block;background:#fff;color:#1a1d29;text-decoration:none;font-weight:700;font-size:15px;padding:11px 19px;border-radius:11px;border:1px solid #d1d5db;margin:0 0 8px">I can’t make it</a></p>`
    : ''
  const html = `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:26px 18px">
    <div style="background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 2px 12px rgba(20,25,40,.07)">
      <p style="font-size:16px;color:#1a1d29;margin:0 0 10px">${esc(i.hello)}</p>
      <p style="font-size:15.5px;color:#374151;margin:0;line-height:1.6">${lines.map(esc).join(' ')}</p>${buttons}
      <p style="font-size:14px;color:#6b7280;margin:16px 0 0">${esc(sign)}</p>
    </div>
    <p style="font-size:12px;color:#9aa1ad;text-align:center;margin:14px 0 0">${esc(i.academy)} · sent through Lumio · reply to this email to reach your coach${i.weather ? ' · forecast powered by Met Office data' : ''}</p>
  </div></body></html>`
  return { subject, text, html }
}

/** The message when the coach calls a lesson off. */
export function rainOffMessage(i: { hello: string; childFirst: string | null; academy: string; coachName: string | null; time: string; when: string; venue: string | null; reason: 'weather' | 'coach'; refunded: number | null; credited?: number | null; onPack?: boolean; note?: string | null }): { subject: string; text: string; html: string } {
  const at = niceTime(i.time)
  const whose = i.childFirst ? `${i.childFirst}’s lesson` : 'your lesson'
  const why = i.reason === 'weather' ? 'because of the weather' : 'as I am unable to coach'
  const pounds = (p: number) => `£${(p / 100).toFixed(p % 100 ? 2 : 0)}`
  const money = i.refunded && i.refunded > 0 ? ` You have been refunded ${pounds(i.refunded)} to the card or account you paid with.`
    : i.credited && i.credited > 0 ? ` The ${pounds(i.credited)} you paid is kept as a credit, so your next lesson is already paid for.`
    : i.onPack ? ' It does not come off your lesson pack.'
    : ' You will not be charged for it.'
  const lines = [`I’m sorry, ${whose} at ${at} ${i.when}${i.venue ? ` at ${i.venue}` : ''} is off ${why}.${money}`]
  if (i.note?.trim()) lines.push(i.note.trim())
  lines.push('I will be in touch to rearrange.')
  const sign = i.coachName || i.academy
  const subject = `${i.childFirst ? `${i.childFirst}’s lesson` : 'Your lesson'} ${i.when} is cancelled`
  const text = `${i.hello}\n\n${lines.join('\n\n')}\n\n${sign}`
  const html = `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:26px 18px">
    <div style="background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 2px 12px rgba(20,25,40,.07)">
      <p style="font-size:16px;color:#1a1d29;margin:0 0 10px">${esc(i.hello)}</p>
      ${lines.map(l => `<p style="font-size:15.5px;color:#374151;margin:0 0 10px;line-height:1.6">${esc(l)}</p>`).join('')}
      <p style="font-size:14px;color:#6b7280;margin:6px 0 0">${esc(sign)}</p>
    </div>
    <p style="font-size:12px;color:#9aa1ad;text-align:center;margin:14px 0 0">${esc(i.academy)} · sent through Lumio · reply to this email to reach your coach</p>
  </div></body></html>`
  return { subject, text, html }
}

/** Has the coach's chosen send time been reached today (UK)? `nowHHMM` is the UK wall clock. */
export const reached = (at: string, nowHHMM: string) => nowHHMM >= at
