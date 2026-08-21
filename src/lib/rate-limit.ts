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

// Behind nginx the socket address is always the proxy, so the client IP is only
// in the forwarded header. Take the FIRST entry: later ones are appended by
// intermediaries and a caller can send their own header, which would let them
// mint a fresh bucket per request if we read from the end.
//
// If there is no header at all we return a single shared key rather than
// skipping the limit — an unattributable caller should share one bucket with
// every other unattributable caller, not get a free pass.
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
