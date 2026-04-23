'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Cookieless page-view beacon. Fires on every route change (pathname).
// Respects Do Not Track and a localStorage opt-out. Query-string-only
// changes intentionally do not refire.
export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined' || !pathname) return

    // Do Not Track (browser global or legacy window.doNotTrack)
    const nav = navigator as Navigator & { doNotTrack?: string; msDoNotTrack?: string }
    const dnt = nav.doNotTrack || (window as unknown as { doNotTrack?: string }).doNotTrack || nav.msDoNotTrack
    if (dnt === '1' || dnt === 'yes') return

    // Opt-out flag (set via /privacy?optout=1 or similar)
    try {
      if (localStorage.getItem('lumio_analytics_optout') === '1') return
    } catch { /* localStorage blocked — proceed */ }

    const body = JSON.stringify({
      path: pathname,
      fullUrl: window.location.href,
      referrer: document.referrer || '',
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    })

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon('/api/analytics/pageview', blob)
        return
      }
    } catch { /* fall through to fetch */ }

    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* swallow */ })
  }, [pathname])

  return null
}

export default PageViewTracker
