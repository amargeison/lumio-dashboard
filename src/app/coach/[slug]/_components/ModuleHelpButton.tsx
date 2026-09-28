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

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { helpFor } from '../_lib/module-help'

// Which mounted instance owns the page's one ⓘ (see the effect below).
let ownerSeq = 0
let owner = 0

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
  // Beside the page's NAME — that is where somebody looks when they want to know
  // what a page is.
  //
  // It used to float over the page, absolutely positioned, re-measured every
  // time the page changed and moved to the end of the heading. On live pages,
  // which fill in as their data arrives, it moved a dozen times in the first
  // second, and some browsers (Safari in particular, under the portal's zoom)
  // left a painted copy behind at every stop: a row of ghost ⓘs across the
  // title. Now it is placed INSIDE the heading, as a small inline element after
  // the text, so it flows with the words and never has to be moved at all.
  //
  // Seventeen modules render their own heading, so rather than editing them all
  // this finds the first h1/h2 in the content column and appends a slot to it.
  // If the page re-renders the heading away, the observer finds the new one.
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const anchor = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (!help) return
    const host = anchor.current?.parentElement
    if (!host) return
    // Only ever one button. The newest instance owns the slot; an older one that
    // has not unmounted yet simply stands down rather than fighting over it.
    //
    // (An earlier version cleared every slot in the document before adding its
    // own. Two instances alive at the same moment then deleted each other's slot
    // on every DOM change, forever — which froze the whole page.)
    const me = ++ownerSeq
    owner = me
    let current: HTMLElement | null = null
    let placements = 0
    let frame = 0
    const place = () => {
      frame = 0
      if (owner !== me) { if (current) { current.remove(); current = null; setSlot(null) } return }
      if (current && current.isConnected) return
      const heading = host.querySelector('h1, h2') as HTMLElement | null
      if (!heading) { if (current) { current = null; setSlot(null) } return }
      // A hard stop, so no page can ever turn this into a loop: a heading that
      // keeps being re-created simply loses its ⓘ after a while.
      if (++placements > 25) { mo?.disconnect(); return }
      const el = document.createElement('span')
      el.setAttribute('data-module-help-slot', '')
      el.style.cssText = 'display:inline-flex;vertical-align:middle;margin-left:10px;position:relative;top:-2px;line-height:0'
      heading.appendChild(el)
      current = el
      setSlot(el)
    }
    // Batched to one check per frame, however many DOM changes arrive.
    const schedule = () => { if (!frame) frame = requestAnimationFrame(place) }
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : null
    place()
    mo?.observe(host, { childList: true, subtree: true })
    return () => {
      mo?.disconnect()
      if (frame) cancelAnimationFrame(frame)
      current?.remove(); current = null
      if (owner === me) owner = 0
    }
  }, [moduleId, help])

  // Escape closes it, because a panel you have to aim at to dismiss is a panel
  // people stop opening.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!help) return null

  const button = (
    <button onClick={() => setOpen(true)} title={`How ${label} works`} aria-label={`How ${label} works`}
      style={{
        appearance: 'none', width: 26, height: 26, borderRadius: '50%', padding: 0,
        border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex,
        fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, lineHeight: 1,
        display: 'grid', placeItems: 'center', flexShrink: 0, letterSpacing: 0, textTransform: 'none',
      }}>
      i
    </button>
  )

  return (
    // An invisible marker in the content column — only there so the effect
    // above knows which column's heading to attach to.
    <span ref={anchor} style={{ display: 'none' }}>
      {slot && createPortal(button, slot)}
      {open && createPortal(
        // Rendered on the page body, not inside the heading the button sits in —
        // a panel inside an h1 would inherit its type and its stacking.
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
        </div>,
        document.body,
      )}
    </span>
  )
}
