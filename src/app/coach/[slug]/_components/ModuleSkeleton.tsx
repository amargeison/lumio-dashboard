'use client'

// What a page shows while its rows are on the way.
//
// Pages used to render straight away with no rows, so for a second or two a
// coach with forty players saw "No players yet" — which reads as "my data has
// gone", not "loading". A skeleton in the shape of the page says the second
// thing, and ModuleGate below holds the real page back until its data is in.

import { useEffect, useState, type ReactNode } from 'react'
import type { ThemeTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { cachedRows, prefetchCoachTables, type CoachTable } from '../_lib/coach-db'

const CSS = `@keyframes lumioPulse { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .lumio-skel { animation: none !important } }`

export function ModuleSkeleton({ T, variant = 'page' }: { T: ThemeTokens; variant?: 'page' | 'dashboard' }) {
  const block = (h: number, w: string | number = '100%', r = 12) => (
    <div className="lumio-skel" style={{ height: h, width: w, borderRadius: r, background: T.panel, border: `1px solid ${T.border}`, animation: 'lumioPulse 1.4s ease-in-out infinite' }} />
  )
  return (
    <div aria-busy="true" aria-label="Loading" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{CSS}</style>
      {variant === 'dashboard' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>{block(190)}{block(190)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>{block(84)}{block(84)}{block(84)}{block(84)}{block(84)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 14 }}>{block(280)}{block(280)}{block(280)}</div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{block(26, 220, 8)}{block(14, 360, 6)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>{block(78)}{block(78)}{block(78)}{block(78)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>{block(150)}{block(150)}{block(150)}{block(150)}{block(150)}{block(150)}</div>
        </>
      )}
    </div>
  )
}

// Render `children` only once every table they read is in the shared cache.
// The page's own hooks then start from those rows on their very first render,
// so there is no empty flash — and once the portal has warmed the cache this
// renders the page immediately.
export function ModuleGate({ T, tables, children }: { T: ThemeTokens; tables: CoachTable[]; children: ReactNode }) {
  const key = tables.join(',')
  const allCached = () => tables.every(t => cachedRows(t) !== undefined)
  const [ready, setReady] = useState(allCached)
  useEffect(() => {
    if (allCached()) { setReady(true); return }
    setReady(false)
    let alive = true
    // Never hold a page back for ever: if the data is slow, show the page after
    // a few seconds and let it fill in as rows arrive.
    const t = setTimeout(() => { if (alive) setReady(true) }, 6000)
    prefetchCoachTables(tables).finally(() => { if (alive) { clearTimeout(t); setReady(true) } })
    return () => { alive = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return ready ? <>{children}</> : <ModuleSkeleton T={T} />
}
