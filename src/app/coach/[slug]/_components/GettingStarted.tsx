'use client'

// Getting started — a checklist, not a tour.
//
// The obvious thing to build was ten slides on first login. People click
// through those without reading them and learn nothing: a tour explains a
// product to somebody who has not used it yet, which is the worst possible
// moment to explain anything.
//
// So this is the same six things, except each one is TRUE or NOT YET, read from
// the coach's own data. It ticks itself off as they work, it cannot lie, and it
// disappears the moment it is finished. It is also the only honest answer to
// "how are the founding coaches getting on" — a coach stuck on step two is a
// coach who needs a phone call, and nothing else in the product would have told
// you that.
//
// Each step is one click away from doing it. A checklist that says "add your
// players" without taking you there is a to-do list, and nobody needs another.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { setSettings } from '../_lib/settings-store'

export type StartStep = {
  id: string
  label: string
  /** Why it is worth doing — one line, in their terms, not ours. */
  why: string
  done: boolean
  /** Where the button goes. */
  nav?: string
  action?: () => void
  cta: string
}

export function GettingStarted({ T, accent, steps, onNavigate }: {
  T: ThemeTokens; accent: AccentTokens
  steps: StartStep[]
  onNavigate: (id: string) => void
}) {
  const [open, setOpen] = useState<string | null>(null)
  const done = steps.filter(s => s.done).length
  const total = steps.length
  const pct = total ? Math.round((done / total) * 100) : 0

  // Finished is finished. It does not linger with a tick on it.
  if (!total || done === total) return null

  const next = steps.find(s => !s.done)

  return (
    <div style={{ background: T.panel, border: `1px solid ${accent.border}`, borderLeft: `3px solid ${accent.hex}`, borderRadius: 14, padding: 16, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: T.text }}>Getting started</span>
        <span style={{ fontSize: 11.5, color: T.text3 }}>{done} of {total} done</span>
        <button
          onClick={() => setSettings({ gettingStarted: false })}
          title="Hide this — you can bring it back in Settings"
          style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT }}>
          Hide
        </button>
      </div>

      <div style={{ height: 5, borderRadius: 3, background: T.hover, overflow: 'hidden', margin: '10px 0 12px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: accent.hex, transition: 'width .4s ease' }} />
      </div>

      {!!next && (
        <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.55, marginBottom: 12 }}>
          <strong style={{ color: T.text }}>Next:</strong> {next.why}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map(s => {
          const isOpen = open === s.id
          return (
            <div key={s.id} style={{ background: s.done ? 'transparent' : T.panel2, border: `1px solid ${s.done ? 'transparent' : T.border}`, borderRadius: 9, padding: s.done ? '4px 6px' : '9px 11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, background: s.done ? T.good : 'transparent', border: `1px solid ${s.done ? T.good : T.border}`, color: T.btnText }}>
                  {s.done ? '✓' : ''}
                </span>
                <button onClick={() => setOpen(isOpen ? null : s.id)}
                  style={{ flex: 1, minWidth: 0, textAlign: 'left', appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: s.done ? 400 : 600, color: s.done ? T.text3 : T.text, textDecoration: s.done ? 'line-through' : 'none' }}>
                  {s.label}
                </button>
                {!s.done && (
                  <button onClick={() => { if (s.action) s.action(); else if (s.nav) onNavigate(s.nav) }}
                    style={{ appearance: 'none', border: 0, borderRadius: 8, padding: '5px 11px', background: accent.hex, color: T.btnText, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
                    {s.cta}
                  </button>
                )}
              </div>
              {isOpen && !s.done && (
                <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, margin: '7px 0 0 27px' }}>{s.why}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
