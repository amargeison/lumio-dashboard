'use client'

// Shared "get started" wizard for modules that used to preload Lumio's defaults
// automatically (Equipment & Kit, Payments & Packages).
//
// WHY this exists: both modules silently inserted the full Lumio set on first
// visit — 39 inventory items, 28 kit lines, 6 packages — so a new coach's first
// experience was somebody else's kit list and somebody else's prices, and their
// only route to their own was deleting things one at a time. Choosing is faster
// than deleting, and a coach who has ticked their own boxes owns the result.
//
// Deliberately NOT shown in the demo portal, which stays fully populated so every
// screen looks complete when it is being shown to someone.
//
// The "load everything" option is kept because it is genuinely the right choice
// for some coaches — it is just no longer the silent default.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'

export type WizardOption = { id: string; label: string; sub?: string; count?: number }
export type WizardGroup = { key: string; title: string; hint?: string; options: WizardOption[] }

export function SetupWizard({
  T, accent, title, blurb, groups, onApply, onLoadAll, onSkip,
}: {
  T: ThemeTokens; accent: AccentTokens
  title: string
  blurb: string
  groups: WizardGroup[]
  onApply: (selected: Record<string, string[]>) => Promise<void>
  onLoadAll: () => Promise<void>
  onSkip: () => void
}) {
  // Everything starts ticked. A coach who wants the lot presses one button; a
  // coach who wants a subset unticks a few. Starting empty would make the common
  // case the slowest one.
  const [sel, setSel] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(groups.map(g => [g.key, g.options.map(o => o.id)])))
  const [busy, setBusy] = useState<'apply' | 'all' | null>(null)
  const [err, setErr] = useState('')

  const toggle = (gk: string, id: string) => setSel(s => {
    const cur = s[gk] || []
    return { ...s, [gk]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] }
  })
  const setGroup = (gk: string, all: boolean) => setSel(s => ({
    ...s, [gk]: all ? (groups.find(g => g.key === gk)?.options.map(o => o.id) ?? []) : [],
  }))

  const total = Object.values(sel).reduce((n, a) => n + a.length, 0)

  const run = async (which: 'apply' | 'all') => {
    if (busy) return
    setBusy(which); setErr('')
    try { which === 'all' ? await onLoadAll() : await onApply(sel) }
    catch (e: any) { setErr(e?.message || 'Could not save that — try again.'); setBusy(null) }
  }

  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }
  const btn = (bg: string, fg: string): CSSProperties => ({ appearance: 'none', border: 0, padding: '10px 16px', borderRadius: 10, background: bg, color: fg, fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: busy ? 0.6 : 1 })

  return (
    <div style={{ ...card, fontFamily: FONT }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{title}</div>
      <p style={{ fontSize: 12.5, color: T.text2, margin: '6px 0 0', lineHeight: 1.6, maxWidth: 640 }}>{blurb}</p>

      {groups.map(g => {
        const on = sel[g.key] || []
        const allOn = on.length === g.options.length
        return (
          <div key={g.key} style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3 }}>{g.title}</div>
              {g.hint && <div style={{ fontSize: 11, color: T.text3 }}>{g.hint}</div>}
              <button onClick={() => setGroup(g.key, !allOn)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                {allOn ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {g.options.map(o => {
                const isOn = on.includes(o.id)
                return (
                  <button key={o.id} onClick={() => toggle(g.key, o.id)}
                    style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, minWidth: 200, flex: '1 1 200px', maxWidth: 320,
                      border: `1px solid ${isOn ? accent.hex : T.border}`, background: isOn ? accent.dim : 'transparent',
                      borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 16, height: 16, flexShrink: 0, borderRadius: 5, border: `1px solid ${isOn ? accent.hex : T.border}`, background: isOn ? accent.hex : 'transparent', color: T.btnText, fontSize: 11, lineHeight: '15px', textAlign: 'center', fontWeight: 700 }}>{isOn ? '✓' : ''}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: T.text }}>{o.label}</span>
                      {(o.sub || o.count != null) && <span style={{ display: 'block', fontSize: 11, color: T.text3, marginTop: 1 }}>{o.sub || `${o.count} item${o.count === 1 ? '' : 's'}`}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {err && <div style={{ fontSize: 11.5, color: T.bad, marginTop: 12 }}>{err}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button onClick={() => run('apply')} disabled={!!busy || total === 0} style={{ ...btn(accent.hex, T.btnText), opacity: busy || total === 0 ? 0.5 : 1, cursor: busy || total === 0 ? 'not-allowed' : 'pointer' }}>
          {busy === 'apply' ? 'Adding…' : total === 0 ? 'Nothing selected' : `Add ${total} selected`}
        </button>
        {/* Kept because it is genuinely right for some coaches — just no longer
            the silent default it used to be. */}
        <button onClick={() => run('all')} disabled={!!busy} style={{ ...btn('transparent', T.text2), border: `1px solid ${T.border}` }}>
          {busy === 'all' ? 'Loading…' : 'Load everything'}
        </button>
        <button onClick={onSkip} disabled={!!busy} style={{ ...btn('transparent', T.text3), marginLeft: 'auto', fontWeight: 500 }}>
          Start empty — I&apos;ll add my own
        </button>
      </div>
    </div>
  )
}
