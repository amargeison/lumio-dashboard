// Server-only calendar sync engine for the Tennis Coach portal.
// Pushes Lumio bookings into the coach's connected Google / Microsoft / Apple
// iCloud calendars and keeps the event ids in coach_calendar_links so updates +
// deletes propagate. Google/Microsoft use OAuth tokens; iCloud uses CalDAV with
// the coach's app-specific password (see ./caldav).

import { getFreshAccessToken, getConnection, upsertConnection, serviceClient, type Provider } from './oauth'
import { icloudPutEvent, icloudDeleteEvent, icloudBusy, icloudDiscoverCalendar } from './caldav'

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
// Every adapter reports why a write failed so the caller can surface it rather
// than silently reporting success (see UpsertResult / syncBooking).
type UpsertResult =
  | { ok: true; externalId: string }
  | { ok: false; detail: string }

async function googleUpsert(token: string, e: CalEvent, externalId?: string): Promise<UpsertResult> {
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
  if (res.ok && json.id) return { ok: true, externalId: json.id as string }
  return { ok: false, detail: `HTTP ${res.status}${json?.error?.message ? ` — ${json.error.message}` : ''}` }
}
async function googleDelete(token: string, externalId: string) {
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${externalId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  })
}

async function microsoftUpsert(token: string, e: CalEvent, externalId?: string): Promise<UpsertResult> {
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
  if (res.ok && json.id) return { ok: true, externalId: json.id as string }
  return { ok: false, detail: `HTTP ${res.status}${json?.error?.message ? ` — ${json.error.message}` : ''}` }
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
export type SyncFailure = { provider: Provider; reason: string }
export type SyncResult = {
  synced: Provider[]        // providers the event was actually written to
  failed: SyncFailure[]     // connected providers whose write did NOT happen
  connected: number         // how many calendar providers are connected at all
}

// Push a booking to the coach's iCloud calendar, re-resolving the stored calendar
// URL once if the write is rejected. Connections made before the discovery fix
// hold the calendar-home container rather than a calendar, so the first PUT 403s;
// re-running discovery repairs the row in place instead of failing forever.
async function icloudSync(
  coachId: string, e: CalEvent, existingHref?: string,
): Promise<{ ok: true; href: string } | { ok: false; reason: string }> {
  const conn = await getConnection(coachId, 'icloud')
  if (!conn?.app_password || !conn.email_address) return { ok: false, reason: 'iCloud credentials missing — reconnect iCloud.' }

  const event = { uid: `lumio-${e.bookingId}`, title: e.title, start: e.start, end: e.end, location: e.location, description: e.description }

  if (conn.caldav_url) {
    const first = await icloudPutEvent(conn.caldav_url, conn.email_address, conn.app_password, event, existingHref)
    if (first.ok) return { ok: true, href: first.href }
    console.error('[calendar] iCloud PUT failed', { coachId, bookingId: e.bookingId, status: first.status, url: conn.caldav_url, detail: first.detail })
  }

  // Re-resolve and retry once (never reuse a stored URL that just failed).
  const rediscovered = await icloudDiscoverCalendar(conn.email_address, conn.app_password)
  if (!rediscovered) return { ok: false, reason: 'No writable iCloud calendar found — check the Apple ID and app-specific password.' }
  await upsertConnection(coachId, { provider: 'icloud', caldav_url: rediscovered.url })

  // Drop any href built against the old (wrong) calendar — let it create fresh.
  const retry = await icloudPutEvent(rediscovered.url, conn.email_address, conn.app_password, event)
  if (retry.ok) return { ok: true, href: retry.href }
  console.error('[calendar] iCloud PUT failed after re-discovery', { coachId, bookingId: e.bookingId, status: retry.status, url: rediscovered.url, detail: retry.detail })
  return { ok: false, reason: `iCloud rejected the event (HTTP ${retry.status}).` }
}

// Create or update a booking's event in every connected calendar. Idempotent: uses
// the stored external id to PATCH if it already exists, else creates and records it.
// A provider that is connected but whose write fails is reported in `failed` — it
// must never be counted as synced.
export async function syncBooking(coachId: string, e: CalEvent): Promise<SyncResult> {
  const existing = Object.fromEntries((await getLinks(coachId, e.bookingId)).map(l => [l.provider, l.external_event_id]))
  const synced: Provider[] = []
  const failed: SyncFailure[] = []
  let connected = 0

  for (const provider of SYNC_PROVIDERS) {
    const conn = await getConnection(coachId, provider)
    if (!conn) continue                 // not connected — nothing to do, not a failure
    connected++

    if (provider === 'icloud') {
      const r = await icloudSync(coachId, e, existing['icloud'])
      if (r.ok) { await saveLink(coachId, e.bookingId, 'icloud', r.href); synced.push('icloud') }
      else failed.push({ provider, reason: r.reason })
      continue
    }

    const token = await getFreshAccessToken(coachId, provider)
    if (!token) { failed.push({ provider, reason: `${provider} sign-in has expired — reconnect the account.` }); continue }
    const res = provider === 'google'
      ? await googleUpsert(token, e, existing[provider])
      : await microsoftUpsert(token, e, existing[provider])
    if (res.ok) { await saveLink(coachId, e.bookingId, provider, res.externalId); synced.push(provider) }
    else {
      console.error('[calendar] upsert failed', { coachId, provider, bookingId: e.bookingId, detail: res.detail })
      failed.push({ provider, reason: `${provider} rejected the event (${res.detail}).` })
    }
  }
  return { synced, failed, connected }
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
