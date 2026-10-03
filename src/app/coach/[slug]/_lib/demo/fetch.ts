// The demo's stand-in for the server.
//
// Live components call /api/coach/* directly with fetch — to draft a session
// with Lumio Coach, to send an email, to sync a calendar. On the demo none of
// that may reach the server: a demo visitor is signed in (with a throwaway demo
// account), so those routes would run for real, spending money on AI and
// sending real messages.
//
// Rather than guard forty call sites, the demo wraps fetch once. Any request to
// the coach API made while the address bar is on the demo is answered here, in
// the browser, from the demo store. It is fail-closed: an endpoint nobody has
// written a demo answer for gets a harmless { ok: true }, never the real route.
// Everything else — and every request on a real academy's portal — passes
// straight through untouched.

import { isDemoPath } from '../storage-scope'
import { ensureDemo } from './store'

// The coach API and the portal invites, plus the one sports-auth call the coach
// screens make (it emails the Lumio team).
const HANDLED = /^\/api\/(coach|portal)\/|^\/api\/sports-auth\/notify-setup/

let installed = false
export function installDemoFetch() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const real = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!isDemoPath()) return real(input, init)
    let url: URL
    try { url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url, window.location.origin) } catch { return real(input, init) }
    if (url.origin !== window.location.origin || !HANDLED.test(url.pathname)) return real(input, init)

    const method = (init?.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET') || 'GET').toUpperCase()
    let body: unknown = undefined
    const raw = init?.body
    if (typeof raw === 'string') { try { body = JSON.parse(raw) } catch { body = raw } }
    else if (raw instanceof FormData) body = raw
    try {
      // Loaded on demand: the canned answers are big, and a real coach's portal
      // (where this wrapper passes everything through) must never download them.
      const [{ demoApi }] = await Promise.all([import('./api'), ensureDemo()])
      const res = await demoApi(url.pathname, method, body, url)
      if (res) return res
    } catch (e) {
      console.warn('[demo] api stand-in failed for', url.pathname, e)
    }
    return new Response(JSON.stringify({ ok: true, demo: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
}
