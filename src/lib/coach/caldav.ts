// Server-only minimal CalDAV client for Apple iCloud calendar sync.
//
// iCloud has no OAuth: we authenticate with the coach's Apple ID + an
// app-specific password (Basic auth) and speak CalDAV directly. Flow:
//   discover current-user-principal → calendar-home-set → a writable VEVENT
//   calendar collection, then PUT/DELETE iCalendar VEVENTs and run a free-busy
//   REPORT for availability.
//
// IMPORTANT: iCloud redirects caldav.icloud.com → a per-user pod
// (pNN-caldav.icloud.com). The Fetch API strips the Authorization header on
// cross-origin redirects, so we follow redirects MANUALLY and re-attach auth on
// each hop (see davFetch).

const ICLOUD_ROOT = 'https://caldav.icloud.com'

export type Interval = { start: string; end: string }
export type IcalEvent = {
  uid: string
  title: string
  start: string   // ISO 8601
  end: string     // ISO 8601
  location?: string
  description?: string
}

function authHeader(appleId: string, appPassword: string): string {
  return 'Basic ' + Buffer.from(`${appleId}:${appPassword}`).toString('base64')
}

// fetch that follows CalDAV redirects without downgrading the method or dropping
// the Authorization header (both of which the default fetch redirect does).
async function davFetch(
  url: string,
  init: RequestInit & { method: string; headers?: Record<string, string> },
  auth: string,
  depth = 0,
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: auth, ...(init.headers || {}) },
    redirect: 'manual',
  })
  if ([301, 302, 307, 308].includes(res.status) && depth < 5) {
    const loc = res.headers.get('location')
    if (loc) return davFetch(new URL(loc, url).toString(), init, auth, depth + 1)
  }
  return res
}

// ─── tiny XML/ICS helpers (iCloud responses are stable; regex is sufficient) ──
function innerTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<[^>]*\\b${tag}\\b[^>]*>([\\s\\S]*?)</[^>]*\\b${tag}\\b>`, 'i'))
  return m ? m[1] : null
}
function firstHref(block: string): string | null {
  const m = block.match(/<[^>]*\bhref\b[^>]*>\s*([\s\S]*?)\s*<\/[^>]*\bhref\b>/i)
  return m ? m[1].trim() : null
}

async function propfind(url: string, auth: string, body: string, depth: '0' | '1'): Promise<string> {
  const res = await davFetch(url, {
    method: 'PROPFIND',
    headers: { Depth: depth, 'Content-Type': 'application/xml; charset=utf-8' },
    body,
  }, auth)
  return (res.ok || res.status === 207) ? await res.text() : ''
}

// A resolved calendar collection: where we PUT booking events.
export type DiscoveredCalendar = { url: string; name: string | null }

// Is this PROPFIND response block a real calendar collection we can write events to?
//
// NOTE (the bug this replaces): iCloud's calendar-home container
// (…/<id>/calendars/) advertises <supported-calendar-component-set> containing
// VEVENT even though it is NOT a calendar — its resourcetype is a bare
// <collection/>. Testing "does the text VEVENT appear" therefore matched the
// container, which is the FIRST entry in the Depth:1 listing, so discovery
// returned it and every event PUT was rejected. Only <calendar/> inside
// <resourcetype> is authoritative (RFC 4791 §4.2).
//
// Both patterns are anchored on the tag name so the substring "calendar" inside
// calendar-home-set / supported-calendar-component-set cannot false-positive.
const CALENDAR_RESOURCETYPE = /<(?:[a-z0-9]+:)?calendar[\s/>]/i
const SUPPORTS_VEVENT = /<(?:[a-z0-9]+:)?comp\b[^>]*\bname=["']VEVENT["']/i

function isWritableEventCalendar(block: string): boolean {
  const resourcetype = innerTag(block, 'resourcetype')
  if (!resourcetype || !CALENDAR_RESOURCETYPE.test(resourcetype)) return false
  // Must accept VEVENTs — excludes the VTODO-only Reminders collection.
  const comps = innerTag(block, 'supported-calendar-component-set')
  return !!comps && SUPPORTS_VEVENT.test(comps)
}

function samePath(a: string, b: string): boolean {
  const norm = (u: string) => { try { return new URL(u).pathname.replace(/\/+$/, '') } catch { return u.replace(/\/+$/, '') } }
  return norm(a) === norm(b)
}

// Resolve the calendar collection that Lumio bookings should be written to.
// Returns null when the credentials are wrong or no event calendar is found.
export async function icloudDiscoverCalendar(appleId: string, appPassword: string): Promise<DiscoveredCalendar | null> {
  const auth = authHeader(appleId, appPassword)

  // 1. current-user-principal (at the service root)
  const p1 = await propfind(ICLOUD_ROOT + '/', auth,
    '<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>', '0')
  const cup = innerTag(p1, 'current-user-principal')
  const principalHref = cup && firstHref(cup)
  if (!principalHref) return null
  const principalUrl = new URL(principalHref, ICLOUD_ROOT).toString()

  // 2. calendar-home-set + the account's default calendar (RFC 6638). The default
  //    is the calendar Apple's own Calendar app creates new events in — i.e. the
  //    one the coach is actually looking at — so we prefer it when it's writable.
  const p2 = await propfind(principalUrl, auth,
    '<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><c:calendar-home-set/><c:schedule-default-calendar-URL/></d:prop></d:propfind>', '0')
  const homeBlock = innerTag(p2, 'calendar-home-set')
  const homeHref = homeBlock && firstHref(homeBlock)
  if (!homeHref) return null
  const homeUrl = new URL(homeHref, principalUrl).toString()
  const defaultBlock = innerTag(p2, 'schedule-default-calendar-URL')
  const defaultHref = defaultBlock && firstHref(defaultBlock)

  // 3. list collections in the home and keep every real, writable VEVENT calendar.
  const p3 = await propfind(homeUrl, auth,
    '<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:resourcetype/><d:displayname/><c:supported-calendar-component-set/></d:prop></d:propfind>', '1')
  const candidates: DiscoveredCalendar[] = []
  for (const block of p3.split(/<[^>]*\bresponse\b[^>]*>/i).slice(1)) {
    const href = firstHref(block)
    if (!href) continue
    if (/\/(inbox|outbox|notification)\/?$/i.test(href)) continue   // scheduling collections
    if (!isWritableEventCalendar(block)) continue                   // container / Reminders / non-calendars
    candidates.push({ url: new URL(href, homeUrl).toString(), name: (innerTag(block, 'displayname') || '').trim() || null })
  }
  if (!candidates.length) return null

  // Prefer the account default; otherwise fall back to the first real calendar.
  if (defaultHref) {
    const defaultUrl = new URL(defaultHref, principalUrl).toString()
    const match = candidates.find(c => samePath(c.url, defaultUrl))
    if (match) return match
  }
  return candidates[0]
}

// ─── iCalendar (RFC 5545) build + parse ──────────────────────────────────────
function icalUtc(iso: string): string {
  // 2026-06-20T15:00:00.000Z → 20260620T150000Z
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
}
function icalEsc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}
function buildIcs(e: IcalEvent): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lumio//Coach//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${e.uid}`,
    `DTSTAMP:${icalUtc(new Date().toISOString())}`,
    `DTSTART:${icalUtc(e.start)}`,
    `DTEND:${icalUtc(e.end)}`,
    `SUMMARY:${icalEsc(e.title)}`,
    e.location ? `LOCATION:${icalEsc(e.location)}` : '',
    e.description ? `DESCRIPTION:${icalEsc(e.description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}
function utcIcalToIso(s?: string | null): string | null {
  if (!s) return null
  const m = s.trim().match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null
}

// The .ics resource URL for a booking (deterministic → idempotent PUTs).
function eventHref(calendarUrl: string, uid: string): string {
  const base = calendarUrl.endsWith('/') ? calendarUrl : calendarUrl + '/'
  return new URL(`${encodeURIComponent(uid)}.ics`, base).toString()
}

// Result of an event write. The failure case carries the CalDAV status so the
// caller can log it and show the coach something better than a silent no-op.
export type PutResult =
  | { ok: true; href: string }
  | { ok: false; status: number; detail: string }

// Create or update an event at a deterministic href (idempotent PUT).
export async function icloudPutEvent(
  calendarUrl: string, appleId: string, appPassword: string, e: IcalEvent, existingHref?: string,
): Promise<PutResult> {
  const auth = authHeader(appleId, appPassword)
  const href = existingHref || eventHref(calendarUrl, e.uid)
  const res = await davFetch(href, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
    body: buildIcs(e),
  }, auth)
  if (res.status === 200 || res.status === 201 || res.status === 204) return { ok: true, href }
  const detail = (await res.text().catch(() => '')).replace(/\s+/g, ' ').trim().slice(0, 300)
  return { ok: false, status: res.status, detail }
}

export async function icloudDeleteEvent(href: string, appleId: string, appPassword: string): Promise<void> {
  await davFetch(href, { method: 'DELETE' }, authHeader(appleId, appPassword))
}

// Busy intervals via a CalDAV free-busy REPORT (returns a VFREEBUSY in UTC — no
// per-event timezone parsing needed).
export async function icloudBusy(
  calendarUrl: string, appleId: string, appPassword: string, fromISO: string, toISO: string,
): Promise<Interval[]> {
  const auth = authHeader(appleId, appPassword)
  const body = `<?xml version="1.0" encoding="utf-8"?><c:free-busy-query xmlns:c="urn:ietf:params:xml:ns:caldav"><c:time-range start="${icalUtc(fromISO)}" end="${icalUtc(toISO)}"/></c:free-busy-query>`
  const res = await davFetch(calendarUrl, {
    method: 'REPORT',
    headers: { Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' },
    body,
  }, auth)
  if (!(res.ok || res.status === 207)) return []
  const text = await res.text()
  const out: Interval[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!/^FREEBUSY/i.test(line)) continue
    const periods = line.slice(line.indexOf(':') + 1)
    for (const period of periods.split(',')) {
      const [s, e] = period.split('/')
      const start = utcIcalToIso(s), end = utcIcalToIso(e)
      if (start && end) out.push({ start, end })
    }
  }
  return out
}
