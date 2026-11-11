'use client'

// Stops locked (not-yet-live) products from making paid AI / TTS calls.
// Mounted once in the root layout. The fetch patch runs at MODULE scope, not in
// an effect, so it is in place before any child component's effect fires.
// On live pages (Tennis Coach, Lumio Impact, admin) and for unpaid routes it
// passes straight through to the real fetch.

import { cannedFor, shouldIntercept } from './demo-canned-routes'

const FAKE_DELAY_MS = 600
const PATCHED = '__lumioDemoFetchGuard'

function requestUrl(input: RequestInfo | URL): URL | null {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    return new URL(raw, window.location.href)
  } catch {
    return null
  }
}

async function requestBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  try {
    let text: string | null = null
    if (typeof init?.body === 'string') text = init.body
    else if (input instanceof Request && !init?.body) text = await input.clone().text()
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function abortError(): Error {
  return new DOMException('The operation was aborted.', 'AbortError')
}

if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>)[PATCHED]) {
  (window as unknown as Record<string, unknown>)[PATCHED] = true
  const realFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = requestUrl(input)
    if (!url || url.origin !== window.location.origin || !shouldIntercept(window.location.pathname, url.pathname)) {
      return realFetch(input, init)
    }

    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined)
    const canned = cannedFor(url.pathname, await requestBody(input, init)) ?? { status: 503, json: { error: 'demo_canned' } }
    console.info('[demo] canned', url.pathname)

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) return reject(abortError())
      const t = setTimeout(resolve, FAKE_DELAY_MS)
      signal?.addEventListener('abort', () => { clearTimeout(t); reject(abortError()) }, { once: true })
    })

    return new Response(JSON.stringify(canned.json), {
      status: canned.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export default function DemoFetchGuard() {
  return null
}
