'use client'

// The ⓘ on every page.
//
// A coach who cannot work out what a page is for does not ring support — they
// stop opening it, and you never find out. So the explanation sits on the page
// itself: one small button, three short tabs, written in the same voice as the
// rest of the portal. No tour, no tooltips chasing the cursor, nothing to
// dismiss before you can work.
//
// It is switched off in Settings once a coach is fluent, and the button
// remembers nothing else — help that tracks whether you have read it is help
// that argues with you.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { helpFor } from '../_lib/module-help'

const TABS = [
  { id: 'what', label: 'What it’s for' },
  { id: 'how', label: 'How to use it' },
  { id: 'worth', label: 'Worth knowing' },
] as const

export function ModuleHelpButton({ T, accent, moduleId, label }: {
  T: ThemeTokens; accent: AccentTokens
  moduleId: string
  /** The page's own name, so the panel says "Session Planner" not "planner". */
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('how')
  const help = helpFor(moduleId)

  // ── Where the button sits ─────────────────────────────────────────────────
  // It belongs beside the page's NAME — that is where somebody looks when they
  // want to know what a page is. Parking it in the top corner of the content
  // area put it behind "Add booking" on half the pages and made it invisible on
  // the rest.
  //
  // Seventeen modules render their own heading, so rather than editing all of
  // them (and every page added later), this measures the first heading in the
  // content column and places itself just after the last word of it. A Range
  // over the heading's text is what gives the TEXT width — the element is a
  // block and its right edge is the far side of the column, which is exactly
  // the wrong answer.
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  // Nothing is drawn until we know where it goes. The button used to appear at
  // its fallback spot and then jump across the page the moment the heading was
  // measured, which looks broken even though it is only a frame or two.
  const [ready, setReady] = useState(false)
  const holder = useRef<HTMLDivElement | null>(null)

  // One measurement, used by all three triggers, so they cannot drift apart.
  const measure = useCallback(() => {
    const host = holder.current?.parentElement
    if (!host) return
    const heading = host.querySelector('h1, h2') as HTMLElement | null
    if (!heading) { setReady(true); return }   // fall back, but still show
    try {
      const r = document.createRange()
      r.selectNodeContents(heading)
      const text = r.getBoundingClientRect()
      const box = host.getBoundingClientRect()
      if (!text.width) { setReady(true); return }
      setPos({
        left: text.right - box.left + host.scrollLeft + 12,
        top: text.top - box.top + host.scrollTop + (text.height - 30) / 2,
      })
    } catch { /* leave it wherever it is */ }
    setReady(true)
  }, [])

  useLayoutEffect(() => {
    if (!help) return
    // No reset needed: the shell mounts this fresh for each page (key={active}),
    // so state never carries over from the last module.
    //
    // Measuring in a layout effect and setting state from it is the point — the
    // position has to be known BEFORE the browser paints, or the button appears
    // in one place and jumps to another. The lint rule guards against cascading
    // renders in general; this one runs once per page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    measure()
    // Again once fonts, data and any banner above the title have settled.
    const t = setTimeout(measure, 350)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [moduleId, help, measure])

  // The heading moves down the page when content above it loads, so follow it.
  useEffect(() => {
    const host = holder.current?.parentElement
    if (!host || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(host)
    return () => ro.disconnect()
  }, [moduleId, measure])

  // Escape closes it, because a panel you have to aim at to dismiss is a panel
  // people stop opening.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!help) return null

  return (
    // zIndex, because the page's own cards are painted after this and were
    // swallowing the click; pointerEvents none so the rest of the overlay never
    // steals one.
    <div ref={holder} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
      <button onClick={() => setOpen(true)} title={`How ${label} works`} aria-label={`How ${label} works`}
        style={{
          position: 'absolute',
          // No heading found on the page? Sit at the top-left of the content,
          // which is still beside where a title would be and never under a button.
          left: pos ? pos.left : 24, top: pos ? pos.top : 26,
          opacity: ready ? 1 : 0, transition: 'opacity .15s ease',
          pointerEvents: ready ? 'auto' : 'none',
          appearance: 'none', width: 30, height: 30, borderRadius: '50%',
          border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex,
          fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, lineHeight: 1,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
        i
      </button>

      {open && (
        // pointerEvents has to be turned back ON here: this panel lives inside
        // the positioning overlay above, which is pointer-transparent so it
        // never eats a click meant for the page. Without this the tabs and the
        // close button were visible and completely dead.
        <div onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, pointerEvents: 'auto', background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 16px', overflowY: 'auto', fontFamily: FONT }}>
          <div style={{ width: '100%', maxWidth: 520, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{label}</div>
              <button onClick={() => setOpen(false)}
                style={{ marginLeft: 'auto', appearance: 'none', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 28, height: 28, fontSize: 16 }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.6, margin: '8px 0 14px' }}>{help.what}</p>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {TABS.map(t => {
                const on = tab === t.id
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: on ? 700 : 500, padding: '6px 12px', borderRadius: 999, border: `1px solid ${on ? accent.hex : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text2 }}>
                    {t.label}
                  </button>
                )
              })}
            </div>

            {tab === 'what' && (
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{help.what}</div>
            )}

            {tab === 'how' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {help.how.map((x, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 800, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>{x}</span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'worth' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {help.worth.map((x, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, fontSize: 12, marginTop: 1 }}>💡</span>
                    <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.6 }}>{x}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 10.5, color: T.text3, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.border}`, lineHeight: 1.5 }}>
              Done with these? Settings → Help &amp; guidance turns the ⓘ buttons off everywhere.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
