// Lumio inbound email: Cloudflare Email Routing → this Worker → the app.
//
// For every message to inbound.lumiosports.com (catch-all):
//   • over 10 MB → rejected at the SMTP stage (the sender gets a bounce), logged
//   • otherwise the raw MIME is POSTed to APP_URL (/api/inbound/email), signed with
//     HMAC-SHA256 (INBOUND_EMAIL_SECRET) over
//       <unix seconds>\n<envelope to>\n<envelope from>\n<Authentication-Results>\n<sha256 hex of the raw MIME>
//     with those values in x-lumio-* headers (the app checks the same string:
//     src/lib/inbound/signature.ts)
//   • if the app doesn't answer 2xx (or can't be reached), the message is forwarded to
//     FALLBACK_TO so nothing is lost, and that is logged.
// The app decides what the message is for (Impact org reply, Coach reply, or neither).

const MAX_BYTES = 10 * 1024 * 1024
const enc = s => new TextEncoder().encode(s)
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
// Header-safe: one line, printable ASCII. The app verifies exactly what it receives.
const headerSafe = v => String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/[^\x20-\x7e]/g, '?').trim().slice(0, 4000)
const domainOf = a => String(a ?? '').split('@')[1] ?? ''

export default {
  async email(message, env) {
    if (message.rawSize > MAX_BYTES) {
      console.log(JSON.stringify({ event: 'rejected', reason: 'too large', bytes: message.rawSize, toDomain: domainOf(message.to) }))
      message.setReject('Message too large: 10 MB at most.')
      return
    }
    const raw = new Uint8Array(await new Response(message.raw).arrayBuffer())
    const to = headerSafe(message.to), from = headerSafe(message.from)
    const auth = headerSafe(message.headers.get('authentication-results') || message.headers.get('arc-authentication-results') || '')
    const ts = String(Math.floor(Date.now() / 1000))
    const bodyHash = hex(await crypto.subtle.digest('SHA-256', raw))
    const key = await crypto.subtle.importKey('raw', enc(env.INBOUND_EMAIL_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = hex(await crypto.subtle.sign('HMAC', key, enc([ts, to, from, auth, bodyHash].join('\n'))))

    let status = 0, error = null
    try {
      const res = await fetch(env.APP_URL, {
        method: 'POST',
        headers: {
          'content-type': 'message/rfc822',
          'x-lumio-timestamp': ts, 'x-lumio-signature': sig,
          'x-lumio-envelope-to': to, 'x-lumio-envelope-from': from, 'x-lumio-auth-results': auth,
        },
        body: raw,
      })
      status = res.status
      if (res.ok) { console.log(JSON.stringify({ event: 'delivered', status, toDomain: domainOf(to) })); return }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
    console.log(JSON.stringify({ event: 'fallback', status, error, toDomain: domainOf(to) }))
    await message.forward(env.FALLBACK_TO)
  },
}
