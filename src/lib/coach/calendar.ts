// Server-only calendar sync engine for the Tennis Coach portal.
// Pushes Lumio bookings into the coach's connected Google / Microsoft / Apple
// iCloud calendars and keeps the event ids in coach_calendar_links so updates +
// deletes propagate. Google/Microsoft use OAuth tokens; iCloud uses CalDAV with
// the coach's app-specific password (see ./caldav).

import { getFreshAccessToken, getConnection, serviceClient, type Provider } from './oauth'
import { icloudPutEvent, icloudDeleteEvent, icloudBusy } from './caldav'

const SYNC_PROVIDERS: Provider[] = ['google', 'microsoft', 'icloud']
// Lumio's founding coaches are UK-based; event times are interpreted in this zone.
// (Make this per-coach when we go beyond the UK.)
const TZ = 'Europe/London'

export type CalEvent = {
  bookingId: string
  title: string
  start: string   // ISO 8601
  end: string     // ISO 8601
  location?: string
  description?: string
}

// ─── Provider adapters ───────────────────────────────────────────────────────
async function googleUpsert(token: string, e: CalEvent, externalId?: string): Promise<string | null> {
  const payload = {
    summary: e.title,
    location: e.location || undefined,
    description: e.description || undefined,
    start: { dateTime: e.start, timeZone: TZ },
    end: { dateTime: e.end, timeZone: TZ },
  }
  const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
  const res = await fetch(externalId ? `${base}/${externalId}` : base, {
    method: externalId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  return res.ok ? (json.id as string) : null
}
async function googleDelete(token: string, externalId: string) {
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${externalId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  })
}

async function microsoftUpsert(token: string, e: CalEvent, externalId?: string): Promise<string | null> {
  const payload = {
    subject: e.title,
    location: { displayName: e.location || '' },
    body: { contentType: 'text', content: e.description || '' },
    start: { dateTime: e.start, timeZone: TZ },
    end: { dateTime: e.end, timeZone: TZ },
  }
  const base = 'https://graph.microsoft.com/v1.0/me/events'
  const res = await fetch(externalId ? `${base}/${externalId}` : base, {
    method: externalId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  return res.ok ? (json.id as string) : null
}
async function microsoftDelete(token: string, externalId: string) {
  await fetch(`https://graph.microsoft.com/v1.0/me/events/${externalId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  })
}

// ─── Link persistence ────────────────────────────────────────────────────────
async function getLinks(coachId: string, bookingId: string): Promise<{ provider: Provider; external_event_id: string }[]> {
  const { data } = await serviceClient()
    .from('coach_calendar_links').select('provider, external_event_id')
    .eq('coach_id', coachId).eq('booking_id', bookingId)
  return (data ?? []) as { provider: Provider; external_event_id: string }[]
}
async function saveLink(coachId: string, bookingId: string, provider: Provider, externalId: string) {
  await serviceClient().from('coach_calendar_links').upsert(
    { coach_id: coachId, booking_id: bookingId, provider, external_event_id: externalId },
    { onConflict: 'coach_id,booking_id,provider' },
  )
}
async function clearLinks(coachId: string, bookingId: string) {
  await serviceClient().from('coach_calendar_links').delete().eq('coach_id', coachId).eq('booking_id', bookingId)
}

// ─── Public API ──────────────────────────────────────────────────────────────
// Create or update a booking's event in every connected calendar. Idempotent: uses
// the stored external id to PATCH if it already exists, else creates and records it.
export async function syncBooking(coachId: string, e: CalEvent): Promise<{ synced: Provider[] }> {
  const existing = Object.fromEntries((await getLinks(coachId, e.bookingId)).map(l => [l.provider, l.external_event_id]))
  const synced: Provider[] = []
  for (const provider of SYNC_PROVIDERS) {
    if (provider === 'icloud') {
      const conn = await getConnection(coachId, 'icloud')
      if (!conn?.app_password || !conn.caldav_url || !conn.email_address) continue
      const href = await icloudPutEvent(conn.caldav_url, conn.email_address, conn.app_password,
        { uid: `lumio-${e.bookingId}`, title: e.title, start: e.start, end: e.end, location: e.location, description: e.description },
        existing['icloud'])
      if (href) { await saveLink(coachId, e.bookingId, 'icloud', href); synced.push('icloud') }
      continue
    }
    const token = await getFreshAccessToken(coachId, provider)
    if (!token) continue
    const extId = provider === 'google'
      ? await googleUpsert(token, e, existing[provider])
      : await microsoftUpsert(token, e, existing[provider])
    if (extId) { await saveLink(coachId, e.bookingId, provider, extId); synced.push(provider) }
  }
  return { synced }
}

// ─── Availability (busy times) ───────────────────────────────────────────────
export type Interval = { start: string; end: string }

function normaliseMsTime(s: string): string {
  // Graph returns e.g. "2026-06-20T15:00:00.0000000" (UTC, no zone) → ISO with Z.
  if (s.endsWith('Z') || /[+-]\d\d:\d\d$/.test(s)) return s
  return s.replace(/\.\d+$/, '') + 'Z'
}
function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = list.filter(i => i.start && i.end).sort((a, b) => a.start.localeCompare(b.start))
  const out: Interval[] = []
  for (const iv of sorted) {
    const last = out[out.length - 1]
    if (last && iv.start <= last.end) { if (iv.end > last.end) last.end = iv.end }
    else out.push({ ...iv })
  }
  return out
}

// Merged busy intervals across the coach's connected Google + Microsoft calendars,
// within [fromISO, toISO]. Used to show true free/busy on the booking calendar.
export async function getBusyTimes(coachId: string, fromISO: string, toISO: string): Promise<Interval[]> {
  const all: Interval[] = []

  const gToken = await getFreshAccessToken(coachId, 'google')
  if (gToken) {
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
        method: 'POST',
        headers: { Authorization: `Bearer ${gToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeMin: fromISO, timeMax: toISO, items: [{ id: 'primary' }] }),
      })
      const json = await res.json().catch(() => ({}))
      for (const b of json?.calendars?.primary?.busy ?? []) if (b.start && b.end) all.push({ start: b.start, end: b.end })
    } catch { /* skip on error */ }
  }

  const mToken = await getFreshAccessToken(coachId, 'microsoft')
  if (mToken) {
    try {
      const url = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(fromISO)}&endDateTime=${encodeURIComponent(toISO)}&$select=start,end,showAs&$top=100`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${mToken}`, Prefer: 'outlook.timezone="UTC"' } })
      const json = await res.json().catch(() => ({}))
      for (const ev of json?.value ?? []) {
        if (['busy', 'tentative', 'oof', 'workingElsewhere'].includes(ev.showAs) && ev.start?.dateTime && ev.end?.dateTime) {
          all.push({ start: normaliseMsTime(ev.start.dateTime), end: normaliseMsTime(ev.end.dateTime) })
        }
      }
    } catch { /* skip on error */ }
  }

  const iConn = await getConnection(coachId, 'icloud')
  if (iConn?.app_password && iConn.caldav_url && iConn.email_address) {
    try {
      const busy = await icloudBusy(iConn.caldav_url, iConn.email_address, iConn.app_password, fromISO, toISO)
      for (const b of busy) all.push(b)
    } catch { /* skip on error */ }
  }

  return mergeIntervals(all)
}

// Remove a booking's event from every calendar it was synced to.
export async function unsyncBooking(coachId: string, bookingId: string): Promise<void> {
  const links = await getLinks(coachId, bookingId)
  for (const l of links) {
    if (l.provider === 'icloud') {
      const conn = await getConnection(coachId, 'icloud')
      if (conn?.app_password && conn.email_address) await icloudDeleteEvent(l.external_event_id, conn.email_address, conn.app_password)
      continue
    }
    const token = await getFreshAccessToken(coachId, l.provider)
    if (!token) continue
    if (l.provider === 'google') await googleDelete(token, l.external_event_id)
    else if (l.provider === 'microsoft') await microsoftDelete(token, l.external_event_id)
  }
  await clearLinks(coachId, bookingId)
}
