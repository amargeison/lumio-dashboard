'use client'

import { useEffect, useRef, useState } from 'react'
import type { ThemeTokens, AccentTokens } from '../_lib/theme'
import { FONT, FONT_MONO } from '../_lib/theme'
import type { Fixture } from '../_lib/data'
import { Icon } from './Icon'

// ─── Keyboard helper ──────────────────────────────────────────────────

export function useKey(combo: 'cmdk' | 'esc', handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const meta = e.metaKey || e.ctrlKey
      if (combo === 'cmdk' && meta && k === 'k') { e.preventDefault(); handler(e) }
      if (combo === 'esc' && k === 'escape') handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [combo, handler])
}

// ─── Command palette ──────────────────────────────────────────────────

type PaletteItem = { kind: 'page' | 'action' | 'jump'; icon: string; label: string; hint: string; onPick?: () => void }

export function CommandPalette({
  T, accent, open, onClose, onAskLumio,
}: { T: ThemeTokens; accent: AccentTokens; open: boolean; onClose: () => void; onAskLumio: () => void }) {
  const [q, setQ]     = useState('')
  const [sel, setSel] = useState(0)
  const inputRef      = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 30); setQ(''); setSel(0) }
  }, [open])

  const ALL: PaletteItem[] = [
    { kind: 'page',   icon: 'home',      label: 'Dashboard',                        hint: 'Go to' },
    { kind: 'page',   icon: 'flag',      label: 'Match Centre',                     hint: 'Go to' },
    { kind: 'page',   icon: 'people',    label: 'Squad Manager',                    hint: 'Go to' },
    { kind: 'page',   icon: 'medical',   label: 'Medical Hub',                      hint: 'Go to' },
    { kind: 'page',   icon: 'play',      label: 'Video Analysis',                   hint: 'Go to' },
    { kind: 'page',   icon: 'lightning', label: 'D/L Calculator',                   hint: 'Go to' },
    { kind: 'page',   icon: 'note',      label: 'Declaration Planner',              hint: 'Go to' },
    { kind: 'page',   icon: 'briefcase', label: 'Contract Hub',                     hint: 'Go to' },
    { kind: 'page',   icon: 'trophy',    label: 'County Championship',              hint: 'Go to' },
    { kind: 'action', icon: 'sparkles',  label: 'Ask Lumio…',                       hint: 'AI', onPick: onAskLumio },
    { kind: 'action', icon: 'plus',      label: 'New training session',             hint: 'Create' },
    { kind: 'action', icon: 'note',      label: 'Draft match report',               hint: 'Create' },
    { kind: 'action', icon: 'check',     label: 'Confirm starting XI for Sat',      hint: 'Approve' },
    { kind: 'action', icon: 'mic',       label: 'Schedule press scrum',             hint: 'Schedule' },
    { kind: 'jump',   icon: 'search',    label: 'Find player: D. Hartley',          hint: 'Player' },
    { kind: 'jump',   icon: 'search',    label: 'Find player: A. Patel',            hint: 'Player' },
    { kind: 'jump',   icon: 'search',    label: 'Fixture: vs Loxwood (Sat)',        hint: 'Fixture' },
  ]

  const items = q.trim() ? ALL.filter(it => it.label.toLowerCase().includes(q.toLowerCase())) : ALL.slice(0, 8)

  useEffect(() => { setSel(0) }, [q])

  const pick = (it: PaletteItem) => { it.onPick?.(); onClose() }

  useKey('esc', () => { if (open) onClose() })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(items.length - 1, s + 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
      if (e.key === 'Enter')     { e.preventDefault(); items[sel] && pick(items[sel]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, sel])

  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'start center', paddingTop: 90, zIndex: 100, animation: 'cricketV2FadeUp .15s' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
          <Icon name="search" size={14} stroke={1.6} style={{ color: T.text3 }} />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search players, fixtures, pages, or ask Lumio…"
            style={{ flex: 1, appearance: 'none', border: 0, outline: 'none', background: 'transparent', color: T.text, fontSize: 14, fontFamily: FONT }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, padding: '2px 6px', borderRadius: 4, border: `1px solid ${T.border}`, color: T.text3 }}>esc</span>
        </div>
        <div style={{ maxHeight: 360, overflow: 'auto', padding: 6 }}>
          {items.length === 0 && <div style={{ padding: '20px 14px', color: T.text3, fontSize: 12.5 }}>No results · try a different keyword.</div>}
          {items.map((it, i) => (
            <div key={i} onMouseEnter={() => setSel(i)} onClick={() => pick(it)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: sel === i ? accent.dim : 'transparent', color: sel === i ? T.text : T.text2 }}>
              <Icon name={it.icon} size={13} stroke={1.6} style={{ color: sel === i ? accent.hex : T.text3 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{it.label}</span>
              <span style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{it.hint}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '8px 14px', borderTop: `1px solid ${T.border}`, fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO }}>
          <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
          <span style={{ marginLeft: 'auto', color: accent.hex }}>⌘K</span>
        </div>
      </div>
    </div>
  )
}

// ─── Ask Lumio side sheet ─────────────────────────────────────────────

type ChatMsg = { role: 'user' | 'lumio'; text: string; refs?: string[] }

function generateReply(q: string): { text: string; refs: string[] } {
  const Q = q.toLowerCase()
  if (Q.includes('xi') || Q.includes('lineup') || Q.includes('hartley') || Q.includes('loxwood')) {
    return {
      text: 'Recommended XI: Patel (c), Reed, Bishop, Whitman, Khan, Cope, Singh, Davies (wk), Trent, Kapoor, Foster (12th: Lawson).\n\nReasoning: Hartley’s 6/10 hamstring score and 11.4 km load yesterday flag him for rest. Patel opens — Loxwood’s top-3 strike at 8.4 vs LA-seam (S/R). Two spinners after lunch as Oakridge dries.',
      refs: ['Medical Hub · Hartley', 'Opposition Scout · Loxwood', 'GPS · 24 Apr'],
    }
  }
  if (Q.includes('workload') || Q.includes('bowl')) {
    return {
      text: 'Workload risks this week:\n• Reed — 38 overs across 4 days. Cap at 12 today, rest Sun.\n• Foster — back-to-back T20s; manage 8-over ceiling.\n• Trent — green; cleared for full spell.',
      refs: ['Bowling Workload', 'GPS Tracking'],
    }
  }
  if (Q.includes('glamorgan') || Q.includes('lose') || Q.includes('lost')) {
    return {
      text: 'Glamorgan loss attribution:\n1. Death overs — 11.8 RPO in 46-50 (season avg 8.1).\n2. Middle-order collapse 3/14 (28-32 ov) vs LA-spin.\n3. 2 dropped catches inside circle.\n\nDrill scheduled Tuesday: yorker repeats + LA-spin sweep clinic.',
      refs: ['Match Report 16 Apr', 'Practice Log', 'Catches'],
    }
  }
  if (Q.includes('contract') || Q.includes('expir')) {
    return {
      text: '4 contracts expire by 31 Aug:\n• A. Patel · 31 Jul · KEY — agent talks open.\n• M. Trescott · 15 Aug · monitor (injury).\n• L. Cope · 31 Aug · likely renew, +12%.\n• T. Lawson · 31 Aug · academy → senior offer.',
      refs: ['Contract Hub'],
    }
  }
  if (Q.includes('weather') || Q.includes('forecast') || Q.includes('rain')) {
    return {
      text: 'Day 1 forecast: 9° at toss, peaks 13° by 14:00, 34% chance of rain after 16:00.\n\nStrategy implication: bowl first if you win the toss — moisture under cloud cover until 13:00. Prioritise top-order wickets pre-lunch; you may not get a full day.',
      refs: ['Weather · Met', 'Pitch report'],
    }
  }
  return {
    text: 'I can pull from the squad, opposition, performance, medical, ops, and contracts data. Try one of the suggestions on the left, or ask something more specific — e.g. "show me bowlers in form on green pitches".',
    refs: [],
  }
}

function Dot({ delay }: { delay: number }) {
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: `cricketV2PulseDim 1.1s ${delay}ms infinite` }} />
}

export function AskLumio({ T, accent, open, onClose }: { T: ThemeTokens; accent: AccentTokens; open: boolean; onClose: () => void }) {
  const [q, setQ]               = useState('')
  const [thread, setThread]     = useState<ChatMsg[]>([])
  const [thinking, setThinking] = useState(false)
  const sheetRef                = useRef<HTMLDivElement>(null)

  useKey('esc', () => { if (open) onClose() })

  const SUGGESTED = [
    'Best XI vs Loxwood given Hartley’s fitness?',
    'Bowling workload risks this week',
    'Why did we lose to Glamorgan?',
    'Players nearing contract expiry',
    'Forecast effect on day 1 strategy',
  ]

  const ask = (text?: string) => {
    const Q = (text ?? q).trim()
    if (!Q) return
    setThread(t => [...t, { role: 'user', text: Q }])
    setQ('')
    setThinking(true)
    setTimeout(() => {
      const reply = generateReply(Q)
      setThread(t => [...t, { role: 'lumio', text: reply.text, refs: reply.refs }])
      setThinking(false)
    }, 1100)
  }

  useEffect(() => {
    if (sheetRef.current) sheetRef.current.scrollTop = sheetRef.current.scrollHeight
  }, [thread, thinking])

  if (!open) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 110, animation: 'cricketV2FadeUp .15s' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 460, height: '100%', background: T.panel, borderLeft: `1px solid ${T.borderHi}`, display: 'flex', flexDirection: 'column', animation: 'cricketV2SlideLeft .22s ease-out' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: accent.dim, display: 'grid', placeItems: 'center', color: accent.hex }}>
            <Icon name="sparkles" size={14} stroke={1.8} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Ask Lumio</span>
            <span style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO }}>contextual · season + squad</span>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', padding: 6, borderRadius: 6 }} title="Close (esc)">✕</button>
        </div>

        <div ref={sheetRef} style={{ flex: 1, overflow: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {thread.length === 0 && (
            <>
              <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>
                Ask anything about today&apos;s match, the squad, the season, or operations. Lumio reads your data and cites where each answer came from.
              </div>
              <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Try</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} onClick={() => ask(s)}
                    style={{ appearance: 'none', textAlign: 'left', border: `1px solid ${T.border}`, background: T.panel2, color: T.text, padding: '10px 12px', borderRadius: 9, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT, transition: 'border-color .12s, background .12s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border }}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
          {thread.map((m, i) => (
            <div key={i} style={{ animation: 'cricketV2FadeUp .25s' }}>
              {m.role === 'user' ? (
                <div style={{ marginLeft: 36, padding: '10px 12px', borderRadius: 10, background: accent.dim, color: T.text, fontSize: 12.5, lineHeight: 1.45 }}>{m.text}</div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: accent.dim, display: 'grid', placeItems: 'center', color: accent.hex, flexShrink: 0 }}>
                    <Icon name="sparkles" size={11} stroke={1.8} />
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.55 }}>
                    {m.text.split('\n').map((ln, j) => <p key={j} style={{ margin: '0 0 8px' }}>{ln}</p>)}
                    {m.refs && m.refs.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {m.refs.map((r, k) => (
                          <span key={k} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, border: `1px solid ${T.border}`, color: T.text3, fontFamily: FONT_MONO }}>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {thinking && (
            <div style={{ display: 'flex', gap: 10, color: T.text3, fontSize: 12, alignItems: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: accent.dim, display: 'grid', placeItems: 'center', color: accent.hex, flexShrink: 0 }}>
                <Icon name="sparkles" size={11} stroke={1.8} />
              </div>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Ask Lumio…"
            style={{ flex: 1, appearance: 'none', border: `1px solid ${T.border}`, background: T.panel2, color: T.text, padding: '9px 12px', borderRadius: 8, outline: 'none', fontSize: 13, fontFamily: FONT }} />
          <button onClick={() => ask()} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, padding: '9px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Send</button>
        </div>
      </div>
    </div>
  )
}

// ─── Fixture drawer ───────────────────────────────────────────────────

function DrawerRow({ T, label, value }: { T: ThemeTokens; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', width: 110, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: T.text }}>{value}</div>
    </div>
  )
}

export function FixtureDrawer({ T, accent, fixture, onClose }: { T: ThemeTokens; accent: AccentTokens; fixture: Fixture | null; onClose: () => void }) {
  useKey('esc', () => { if (fixture) onClose() })
  if (!fixture) return null
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end', zIndex: 105, animation: 'cricketV2FadeUp .12s' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, height: '100%', background: T.panel, borderLeft: `1px solid ${T.borderHi}`, display: 'flex', flexDirection: 'column', animation: 'cricketV2SlideLeft .2s ease-out', overflow: 'auto' }}>
        <div style={{ position: 'relative', padding: '20px 22px 22px', borderBottom: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 14, padding: 6 }} title="Close">✕</button>
          <div style={{ fontSize: 10.5, color: accent.hex, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{fixture.comp}</div>
          <h2 style={{ margin: '6px 0 0', fontFamily: FONT, fontSize: 30, fontWeight: 400, color: T.text, letterSpacing: '-0.01em', lineHeight: 1.1 }}>vs {fixture.opp}</h2>
          <div style={{ fontSize: 12.5, color: T.text2, marginTop: 6 }}>{fixture.day} {fixture.date} · {fixture.time} · {fixture.venue}</div>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <DrawerRow T={T} label="Side" value={fixture.side} />
          <DrawerRow T={T} label="Toss" value={fixture.toss || '—'} />
          <DrawerRow T={T} label="Forecast" value={fixture.forecast || '☁ mixed'} />
          <DrawerRow T={T} label="Last meeting" value="Loxwood W (17 Aug 2025) · 248/9 chased" />
          <DrawerRow T={T} label="Head-to-head (3y)" value="W 4 · D 1 · L 3" />

          <div>
            <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Threat XI</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Cooper (c)','Briggs','Holt','Mansoor','Ali','Pickett','Devine','Khan†','Slater','Yeo','Toller'].map((p, i) => (
                <span key={i} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 99, background: T.panel2, border: `1px solid ${T.border}`, color: T.text2 }}>{p}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Pitch report</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ k: 'Pace', v: 0.7 }, { k: 'Bounce', v: 0.55 }, { k: 'Spin', v: 0.4 }, { k: 'Carry', v: 0.65 }].map((m, i) => (
                <div key={i} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: T.panel2, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 10.5, color: T.text3 }}>{m.k}</div>
                  <div style={{ height: 4, marginTop: 6, background: T.hover, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${m.v * 100}%`, height: '100%', background: accent.hex }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ flex: 1, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, padding: '10px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Open match brief</button>
            <button style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text, padding: '10px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer' }}>Add to plan</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────

export function useToast(): [string | null, (msg: string) => void] {
  const [toast, setToast] = useState<string | null>(null)
  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2400) }
  return [toast, show]
}

export function Toast({ T, accent, msg }: { T: ThemeTokens; accent: AccentTokens; msg: string | null }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)',
      padding: '10px 16px', background: T.panel, color: T.text, border: `1px solid ${T.borderHi}`,
      borderRadius: 10, fontSize: 12.5, boxShadow: '0 16px 40px -10px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', gap: 8, zIndex: 200, animation: 'cricketV2SlideUp .2s',
    }}>
      <Icon name="check" size={13} stroke={2} style={{ color: accent.hex }} />
      {msg}
    </div>
  )
}
