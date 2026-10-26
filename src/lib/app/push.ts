// Push notifications to the iPhone app (server only).
//
// A push is a nudge that goes WITH something we already send — the email to a
// family, the message in the coach's inbox — never instead of it. So every
// function here is best effort: it never throws, never holds a request up for
// long, and does nothing at all until the APNs key is set on the server.

import type { SupabaseClient } from '@supabase/supabase-js'
import { apnsConfigured, sendApns, type ApnsEnv } from './apns'

export type PushMessage = { title?: string; body: string; url?: string; thread?: string }

type Device = { id: string; token: string; apns_env: ApnsEnv | null }

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

/** The payload Apple delivers. `url` is where tapping it opens, a path on our own site. */
export function payloadFor(m: PushMessage): object {
  const url = m.url && /^https?:\/\//i.test(m.url) ? (() => { try { const u = new URL(m.url!); return `${u.pathname}${u.search}` } catch { return '/app' } })() : (m.url || '/app')
  return {
    aps: {
      alert: { ...(m.title ? { title: clip(m.title, 60) } : {}), body: clip(m.body.replace(/\s+/g, ' ').trim(), 180) },
      sound: 'default',
      ...(m.thread ? { 'thread-id': clip(m.thread, 60) } : {}),
    },
    url: url.startsWith('/') && !url.startsWith('//') ? url : '/app',
  }
}

async function deliver(db: SupabaseClient, devices: Device[], m: PushMessage): Promise<number> {
  const payload = payloadFor(m)
  let sent = 0
  for (const d of devices.slice(0, 20)) {
    // A token from an Xcode build only works on Apple's sandbox, one from
    // TestFlight or the App Store only on production. Until we know which,
    // try production first.
    const tries: ApnsEnv[] = d.apns_env ? [d.apns_env] : ['production', 'sandbox']
    let worked: ApnsEnv | null = null
    let dead = false
    for (const env of tries) {
      const r = await sendApns(d.token, payload, env)
      if (r.ok) { worked = env; break }
      if (r.status === 410 || r.reason === 'Unregistered') { dead = true; break }
      // Wrong service or a bad token: try the other service; only when the
      // last one says so too is the token given up on.
      if (r.reason === 'BadDeviceToken') { dead = env === tries[tries.length - 1]; continue }
      dead = false; break                        // a hiccup: leave the token alone
    }
    if (worked) {
      sent++
      if (d.apns_env !== worked) await db.from('lumio_push_devices').update({ apns_env: worked }).eq('id', d.id)
    }
    if (dead) await db.from('lumio_push_devices').update({ disabled_at: new Date().toISOString() }).eq('id', d.id)
  }
  return sent
}

function quickly<T>(p: Promise<T>, fallback: T, ms = 5000): Promise<T> {
  return Promise.race([p.catch(() => fallback), new Promise<T>(r => setTimeout(() => r(fallback), ms))])
}

/** Everyone signed in to these accounts (a coach, on each of their phones). */
export async function pushToUsers(db: SupabaseClient, userIds: string[], m: PushMessage): Promise<number> {
  const ids = Array.from(new Set(userIds.filter(Boolean)))
  if (!ids.length || !apnsConfigured()) return 0
  return quickly((async () => {
    const { data } = await db.from('lumio_push_devices').select('id, token, apns_env').in('user_id', ids).is('disabled_at', null).limit(40)
    return deliver(db, (data || []) as Device[], m)
  })(), 0)
}

/** Whoever is signed in to the app with this email: the family a coach is emailing. */
export async function pushToEmail(db: SupabaseClient, email: string, m: PushMessage): Promise<number> {
  const e = String(email || '').trim().toLowerCase()
  if (!e || !apnsConfigured()) return 0
  return quickly((async () => {
    const { data } = await db.from('lumio_push_devices').select('id, token, apns_env').eq('email', e).is('disabled_at', null).limit(20)
    return deliver(db, (data || []) as Device[], m)
  })(), 0)
}

/** The academy's name, for the title of a family's notification. */
export async function academyTitle(db: SupabaseClient, academyId: string): Promise<string> {
  try {
    const { data } = await db.from('sports_profiles').select('brand_name, display_name').eq('id', academyId).maybeSingle()
    return String(data?.brand_name || data?.display_name || 'Your coach')
  } catch { return 'Your coach' }
}

/** The head coach, on their phone: something came in that they will want to know about now. */
export function nudgeCoach(db: SupabaseClient, academyId: string, m: { title: string; body: string }): Promise<number> {
  return pushToUsers(db, [academyId], { title: m.title, body: m.body, url: '/app', thread: 'coach' })
}
