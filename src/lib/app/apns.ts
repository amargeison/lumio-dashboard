// Apple's push service, called straight from our own server (server only).
//
// No third-party push company: Apple's service is free, and talking to it
// needs only an APNs key from the Apple Developer account. Without the three
// settings below nothing is sent and nothing breaks.
//
//   APNS_KEY_ID        the key's ID (10 characters), from developer.apple.com → Keys
//   APNS_TEAM_ID       the team ID (10 characters), top right of the developer account
//   APNS_PRIVATE_KEY   the .p8 file's contents (newlines as typed, or as \n)
//   APNS_BUNDLE_ID     optional, defaults to com.lumiosports.tenniscoach

import http2 from 'node:http2'
import { createPrivateKey, sign, type KeyObject } from 'node:crypto'

export type ApnsEnv = 'production' | 'sandbox'
export type ApnsResult = { ok: true } | { ok: false; status: number; reason: string }

const HOSTS: Record<ApnsEnv, string> = {
  production: 'https://api.push.apple.com',
  sandbox: 'https://api.sandbox.push.apple.com',
}

export const APP_BUNDLE_ID = process.env.APNS_BUNDLE_ID || 'com.lumiosports.tenniscoach'

export function apnsConfigured(): boolean {
  return !!(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_PRIVATE_KEY)
}

let key: KeyObject | null = null
function signingKey(): KeyObject {
  if (key) return key
  const raw = String(process.env.APNS_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim()
  const pem = raw.includes('BEGIN PRIVATE KEY') ? raw : `-----BEGIN PRIVATE KEY-----\n${raw}\n-----END PRIVATE KEY-----`
  key = createPrivateKey(pem)
  return key
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url')

// Apple wants a fresh token at least every hour and no more than every 20
// minutes; 40 minutes sits between the two.
let jwt: { value: string; at: number } | null = null
export function providerToken(): string {
  const now = Date.now()
  if (jwt && now - jwt.at < 40 * 60_000) return jwt.value
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: process.env.APNS_KEY_ID }))
  const body = b64url(JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat: Math.floor(now / 1000) }))
  const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key: signingKey(), dsaEncoding: 'ieee-p1363' })
  jwt = { value: `${head}.${body}.${b64url(sig)}`, at: now }
  return jwt.value
}

// One connection per service, kept open while it is in use (Apple prefers
// that to a new connection per notification) and closed after a quiet minute.
const sessions = new Map<ApnsEnv, http2.ClientHttp2Session>()
function session(env: ApnsEnv): http2.ClientHttp2Session {
  const open = sessions.get(env)
  if (open && !open.closed && !open.destroyed) return open
  const s = http2.connect(HOSTS[env])
  const drop = () => { if (sessions.get(env) === s) sessions.delete(env) }
  s.on('error', drop); s.on('close', drop); s.on('goaway', drop)
  s.setTimeout(60_000, () => s.close())
  s.unref()
  sessions.set(env, s)
  return s
}

/** Sends one notification to one phone. Never throws. */
export function sendApns(token: string, payload: object, env: ApnsEnv): Promise<ApnsResult> {
  return new Promise(resolve => {
    let done = false
    const finish = (r: ApnsResult) => { if (!done) { done = true; resolve(r) } }
    try {
      const req = session(env).request({
        ':method': 'POST',
        ':path': `/3/device/${token}`,
        authorization: `bearer ${providerToken()}`,
        'apns-topic': APP_BUNDLE_ID,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      })
      let status = 0
      let data = ''
      req.setEncoding('utf8')
      req.on('response', h => { status = Number(h[':status']) || 0 })
      req.on('data', c => { data += c })
      req.on('end', () => {
        if (status === 200) return finish({ ok: true })
        let reason = ''
        try { reason = String(JSON.parse(data || '{}').reason || '') } catch { /* not JSON */ }
        finish({ ok: false, status, reason: reason || `HTTP ${status}` })
      })
      req.on('error', e => finish({ ok: false, status: 0, reason: String(e?.message || e) }))
      req.setTimeout(10_000, () => { req.close(); finish({ ok: false, status: 0, reason: 'timeout' }) })
      req.end(JSON.stringify(payload))
    } catch (e) {
      finish({ ok: false, status: 0, reason: String((e as Error)?.message || e) })
    }
  })
}
