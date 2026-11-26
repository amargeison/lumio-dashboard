// Settings → Messaging, as Communications reads them: quiet hours and the brand voice.
// Stored in impact_orgs.settings.messaging (no migration); everything has a default, so
// an org that never opens the screen still gets 8pm–8am quiet hours and a plain voice.
//
// Times are UK wall-clock ("20:00"), compared in Europe/London so the clocks changing
// doesn't move them.

export interface BrandVoice {
  /** e.g. "warm and encouraging" */
  tone: string
  /** e.g. "The Ten Project team" */
  signOff: string
  use: string[]
  avoid: string[]
  /** The reading age to write for, 7–16. */
  readingAge: number
}

export interface MessagingSettings {
  quietStart?: string
  quietEnd?: string
  voice?: Partial<BrandVoice>
}

export const DEFAULT_QUIET = { start: '20:00', end: '08:00' }
export const DEFAULT_VOICE: BrandVoice = { tone: 'warm, friendly and encouraging', signOff: '', use: [], avoid: [], readingAge: 9 }

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const words = (v: unknown, max: number) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[\n,]/) : [])
  .map(x => String(x ?? '').trim().slice(0, 60)).filter(Boolean).slice(0, max)

export function quietHours(m: MessagingSettings | undefined): { start: string; end: string } {
  const start = m?.quietStart && HHMM.test(m.quietStart) ? m.quietStart : DEFAULT_QUIET.start
  const end = m?.quietEnd && HHMM.test(m.quietEnd) ? m.quietEnd : DEFAULT_QUIET.end
  return { start, end }
}

export function brandVoice(m: MessagingSettings | undefined, fallbackSignOff = ''): BrandVoice {
  const v = m?.voice ?? {}
  const age = Math.round(Number(v.readingAge))
  return {
    tone: String(v.tone ?? '').trim().slice(0, 120) || DEFAULT_VOICE.tone,
    signOff: String(v.signOff ?? '').trim().slice(0, 120) || fallbackSignOff,
    use: words(v.use, 12),
    avoid: words(v.avoid, 12),
    readingAge: age >= 7 && age <= 16 ? age : DEFAULT_VOICE.readingAge,
  }
}

/** The UK wall-clock time and date of an instant: { date: 'YYYY-MM-DD', time: 'HH:MM', weekday: 1–7 (Mon=1) }. */
export function ukClock(at: Date): { date: string; time: string; weekday: number } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' })
    .formatToParts(at).map(p => [p.type, p.value]))
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday) + 1
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, weekday }
}

/** Is this instant inside quiet hours? A window that crosses midnight (20:00–08:00) works both sides. */
export function inQuietHours(at: Date, q: { start: string; end: string }): boolean {
  const t = ukClock(at).time
  if (q.start === q.end) return false
  return q.start < q.end ? t >= q.start && t < q.end : t >= q.start || t < q.end
}

/** UK date plus n days, as YYYY-MM-DD. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Whole days from a to b (YYYY-MM-DD). */
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000)
