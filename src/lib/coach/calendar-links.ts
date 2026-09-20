// "Add to calendar" — the two links that actually work everywhere.
//
// A confirmation email that tells a parent a time and leaves them to type it
// into their phone is a confirmation email that ends up missed. Two links fix
// it for practically everyone: a Google Calendar template URL (Android, Gmail,
// anyone on Google), and an .ics file (Apple Calendar, Outlook, everything
// else). No integration, no OAuth, no per-provider code — both are just links.
//
// Deliberately NOT the coach's own calendar sync, which is a different thing:
// that writes the coach's diary. This is for the family.

export type CalendarEvent = {
  title: string
  /** 'YYYY-MM-DD' */
  date: string
  /** 'HH:MM', 24h. Omitted = an all-day event. */
  time?: string | null
  durationMin?: number | null
  location?: string | null
  description?: string | null
  /** Stable id so re-sending updates the entry rather than duplicating it. */
  uid?: string | null
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Local wall-clock stamps. A lesson at 4pm is at 4pm wherever the phone is. */
function stamps(e: CalendarEvent): { start: string; end: string; allDay: boolean } {
  const d = String(e.date).slice(0, 10).replace(/-/g, '')
  if (!e.time) {
    // All-day events are [start, end) — end is the following day.
    const nd = new Date(`${String(e.date).slice(0, 10)}T00:00:00`)
    nd.setDate(nd.getDate() + 1)
    return { start: d, end: `${nd.getFullYear()}${pad(nd.getMonth() + 1)}${pad(nd.getDate())}`, allDay: true }
  }
  const [h, m] = String(e.time).split(':').map(Number)
  const mins = (Number.isFinite(h) ? h : 9) * 60 + (Number.isFinite(m) ? m : 0)
  const dur = Number(e.durationMin) || 60
  const s = `${d}T${pad(Math.floor(mins / 60) % 24)}${pad(mins % 60)}00`
  const endM = mins + dur
  const eD = new Date(`${String(e.date).slice(0, 10)}T00:00:00`)
  if (endM >= 1440) eD.setDate(eD.getDate() + 1)
  const eDate = `${eD.getFullYear()}${pad(eD.getMonth() + 1)}${pad(eD.getDate())}`
  return { start: s, end: `${eDate}T${pad(Math.floor(endM / 60) % 24)}${pad(endM % 60)}00`, allDay: false }
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const { start, end } = stamps(e)
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${start}/${end}`,
  })
  if (e.location) q.set('location', e.location)
  if (e.description) q.set('details', e.description)
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}

/** An .ics document. Lines are CRLF-joined and folded, as the spec requires. */
export function icsFor(e: CalendarEvent, organiser?: { name?: string | null; email?: string | null }): string {
  const { start, end, allDay } = stamps(e)
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const uid = `${e.uid || Math.random().toString(36).slice(2)}@lumiosports.com`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lumio//Tennis Coach//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${esc(e.title)}`,
    e.location ? `LOCATION:${esc(e.location)}` : '',
    e.description ? `DESCRIPTION:${esc(e.description)}` : '',
    organiser?.email ? `ORGANIZER;CN=${esc(organiser.name || organiser.email)}:mailto:${organiser.email}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  // Fold at 75 octets, continuation lines starting with a space.
  const folded = lines.map(l => {
    if (l.length <= 75) return l
    const out: string[] = [l.slice(0, 75)]
    for (let i = 75; i < l.length; i += 74) out.push(` ${l.slice(i, i + 74)}`)
    return out.join('\r\n')
  })
  return `${folded.join('\r\n')}\r\n`
}

/** The public link that serves the .ics for a booking or a camp place. */
export function icsUrl(origin: string, kind: 'booking' | 'camp', id: string): string {
  return `${origin.replace(/\/$/, '')}/api/ics/${kind}/${id}`
}

/** The two buttons, as email-safe HTML. */
export function calendarButtonsHtml(e: CalendarEvent, origin: string, kind: 'booking' | 'camp', id: string, accent = '#3A8EE0'): string {
  const g = googleCalendarUrl(e)
  const i = icsUrl(origin, kind, id)
  const btn = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 18px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;${primary
      ? `background:${accent};color:#ffffff`
      : `background:#ffffff;color:#374151;border:1px solid #d7dbe3`}">${label}</a>`
  return `${btn(g, 'Add to Google Calendar', true)}${btn(i, 'Add to Apple / Outlook', false)}`
}
