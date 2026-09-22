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

import { useState } from 'react'
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
  if (!help) return null

  return (
    <>
      <button onClick={() => setOpen(true)} title={`How ${label} works`} aria-label={`How ${label} works`}
        style={{ appearance: 'none', width: 26, height: 26, borderRadius: '50%', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, lineHeight: 1, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        i
      </button>

      {open && (
        <div onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8vh 16px', overflowY: 'auto', fontFamily: FONT }}>
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
    </>
  )
}
