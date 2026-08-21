// Rate limiting for public, unauthenticated endpoints.
//
// Two layers, because neither is sufficient alone:
//
//   1. An in-memory fixed window per IP. Cheap and instant, but honest about
//      what it is — it lives in one Node process, so a PM2 restart clears it and
//      a clustered deploy gives each worker its own counters. It stops the
//      obvious case: one machine hammering the endpoint.
//   2. A caller-supplied database check. Slower, but it survives restarts and is
//      shared across workers, so it is the real backstop. See `campVelocityOk`
//      in the sign-up route.
//
// Deliberately not Redis: a pilot with one coach does not need another moving
// part, and a limiter that fails closed when Redis blips would lose real
// sign-ups. If this endpoint ever goes properly public, replace layer 1 with a
// shared store rather than tightening it.

type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()
let lastSweep = 0

// The map only grows while windows are live. Sweeping on write — at most once a
// minute — keeps it bounded without a timer that would hold the process open.
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k)
}

export type RateVerdict = { ok: boolean; retryAfterSeconds: number }

export function rateLimit(key: string, limit: number, windowMs: number): RateVerdict {
  const now = Date.now()
  sweep(now)
  const w = windows.get(key)
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }
  w.count++
  if (w.count > limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((w.resetAt - now) / 1000)) }
  }
  return { ok: true, retryAfterSeconds: 0 }
}

// Behind a proxy the socket address is always the proxy, so the client IP is
// only in a forwarded header. Take the LAST entry, which is correct under both
// nginx idioms:
//
//   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # APPENDS
//     -> "<whatever the client sent>, <real client IP>"
//        the head is attacker-controlled; the tail was written by nginx.
//
//   proxy_set_header X-Forwarded-For $remote_addr;                # REPLACES
//     -> "<real client IP>"  — one entry, so last and first are the same.
//
// An earlier version of this function took the FIRST entry and justified it as
// anti-spoofing. That is exactly inverted: under the appending idiom the first
// entry is whatever the caller chose to send, so a new value on each request
// would mint a fresh bucket every time and this limiter would do nothing.
//
// TRUSTED_PROXY_HOPS is how many proxies write to this header. One nginx is 1.
// Put a CDN in front and it becomes 2, without a code change: we count back
// that many entries from the end to find the last address we actually trust.
export function clientIp(headers: Headers): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS) || 1)
  const fwd = headers.get('x-forwarded-for')
  if (fwd) {
    const parts = fwd.split(',').map(p => p.trim()).filter(Boolean)
    // Never index past the start: a header shorter than the expected hop count
    // means fewer proxies than configured, and the first entry is then the
    // closest thing to the origin we have.
    const pick = parts[Math.max(0, parts.length - hops)]
    if (pick) return pick
  }
  // X-Real-IP is set by nginx as a single value and cannot be appended to, so
  // it is a good fallback — but only a fallback, because if nginx is NOT
  // setting it then whatever the client sent passes straight through.
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real
  // No attribution at all. Share one bucket with every other unattributable
  // caller rather than handing out a free pass.
  return 'unknown'
}
