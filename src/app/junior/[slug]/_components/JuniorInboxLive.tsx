'use client'

// JuniorInboxLive — interactive inbox for the Junior dashboard. Port of
// InteractiveWomensInbox from src/app/womens/[slug]/page.tsx lines
// 5988–6058 (which lives inline inside the Women's page, not a module
// file). Adapted for the new Junior inbox data shape with channel-typed
// messages + threads + per-message demo reply.
//
// Behaviour:
//   - Click a row → expand → render the full thread as chat-style bubbles
//   - Reply → textarea + Send → appends to the local thread, shows
//     "Sent ✓"
//   - Forward → role dropdown + Forward → shows "Forwarded to X ✓"
//   - Dismiss → row removed from the rendered list
//
// All state is component-local React state — refreshing the page
// resets every row. This is the (c.ii) spec — simulated thread state,
// not persisted.
//
// State is keyed by item.id (not channel) — JUNIOR_INBOX has multiple
// entries on the same channel (e.g. two WhatsApp threads) so the
// channel name is not unique.

import { useState, type ReactNode, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import {
  JUNIOR_INBOX,
  type JuniorInboxThreadEntry,
} from '../_lib/junior-dashboard-data'

// ─── Local primitives + button style helpers ───────────────────────────

function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'relative',
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: density.radius,
        padding: density.pad,
        boxShadow: T.cardShadow,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div>
      <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 4 }}>{right}</div>
    </div>
  )
}

function ghostBtn(T: ThemeTokens): CSSProperties {
  return {
    appearance: 'none',
    border: `1px solid ${T.border}`,
    background: 'transparent',
    color: T.text2,
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11.5,
    fontFamily: FONT,
  }
}

function primaryBtn(accentHex: string): CSSProperties {
  return {
    appearance: 'none',
    border: 0,
    background: accentHex,
    color: '#fff',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 11.5,
    fontWeight: 600,
    fontFamily: FONT,
  }
}

// ─── Component ─────────────────────────────────────────────────────────

const FORWARD_TARGETS = ['Lead Coach', 'Team Manager', 'Welfare Officer', 'Chair', 'Treasurer'] as const

type RowState = {
  expanded: boolean
  mode: 'idle' | 'replying' | 'forwarding'
  reply: string
  forwardTo: string
  sentLabel: string | null
  dismissed: boolean
  /** Locally-typed replies, appended to the rendered thread when Send fires.
   *  Vanishes on refresh — JUNIOR_INBOX itself is never mutated. */
  threadAppend: Array<{ from: 'us'; text: string; time: string }>
}

const initState = (): Record<string, RowState> =>
  Object.fromEntries(
    JUNIOR_INBOX.map(item => [
      item.id,
      { expanded: false, mode: 'idle' as const, reply: '', forwardTo: FORWARD_TARGETS[0], sentLabel: null, dismissed: false, threadAppend: [] },
    ]),
  )

interface Props {
  T: ThemeTokens
  accent: AccentTokens
  density: Density
}

export default function JuniorInboxLive({ T, accent, density }: Props) {
  const [state, setState] = useState<Record<string, RowState>>(initState)
  const update = (id: string, patch: Partial<RowState>) =>
    setState(s => ({ ...s, [id]: { ...s[id], ...patch } }))

  const items = JUNIOR_INBOX.filter(c => !state[c.id]?.dismissed)

  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / span 4', maxHeight: 420, overflow: 'auto' }}>
      <SectionHead
        T={T}
        title="Inbox"
        right={<span style={{ fontFamily: FONT_MONO }}>{items.length} · click to expand</span>}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((c, i) => {
          const s = state[c.id] ?? { expanded: false, mode: 'idle' as const, reply: '', forwardTo: FORWARD_TARGETS[0], sentLabel: null, dismissed: false, threadAppend: [] }
          const fullThread: JuniorInboxThreadEntry[] = [...c.thread, ...s.threadAppend]
          return (
            <div key={c.id} style={{ borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              {/* Row header — click to toggle expanded */}
              <div
                onClick={() => update(c.id, { expanded: !s.expanded, mode: 'idle' })}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer' }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.urgent ? T.bad : T.text4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: c.unread ? 600 : 500 }}>{c.subject}</div>
                  <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.preview}</div>
                </div>
                <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{c.timestamp}</div>
                {c.unread && (
                  <div
                    className="tnum"
                    style={{
                      minWidth: 22, height: 18, padding: '0 6px',
                      borderRadius: 9, display: 'grid', placeItems: 'center',
                      fontSize: 10.5, fontWeight: 600,
                      background: c.urgent ? 'rgba(199,90,90,0.12)' : T.hover,
                      color: c.urgent ? T.bad : T.text2,
                    }}
                  >
                    1
                  </div>
                )}
              </div>

              {/* Expanded — thread + action bar */}
              {s.expanded && (
                <div style={{ padding: '6px 6px 12px 22px' }}>
                  {/* Sender line above the thread */}
                  <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, marginBottom: 8, letterSpacing: '0.04em' }}>
                    {c.sender}
                  </div>

                  {/* Thread bubbles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                    {fullThread.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: m.from === 'us' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '80%',
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: m.from === 'us' ? accent.dim : T.panel2,
                            border: `1px solid ${m.from === 'us' ? accent.border : T.border}`,
                            color: T.text,
                            fontSize: 12,
                            lineHeight: 1.5,
                          }}
                        >
                          {m.text}
                        </div>
                        <div style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO, marginTop: 3 }}>
                          {m.time}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sent / Forwarded label persists after action */}
                  {s.sentLabel && (
                    <div style={{ fontSize: 11, color: T.good, fontFamily: FONT_MONO, marginBottom: 8 }}>
                      {s.sentLabel}
                    </div>
                  )}

                  {/* Action bar — three modes */}
                  {s.mode === 'idle' && !s.sentLabel && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => update(c.id, { mode: 'replying' })} style={ghostBtn(T)}>Reply</button>
                      <button onClick={() => update(c.id, { mode: 'forwarding' })} style={ghostBtn(T)}>Forward</button>
                      <button onClick={() => update(c.id, { dismissed: true })} style={ghostBtn(T)}>Dismiss</button>
                    </div>
                  )}

                  {s.mode === 'replying' && (
                    <div>
                      <textarea
                        value={s.reply}
                        onChange={e => update(c.id, { reply: e.target.value })}
                        placeholder="Type your reply…"
                        rows={3}
                        style={{
                          width: '100%', background: T.panel2, color: T.text,
                          border: `1px solid ${T.border}`, borderRadius: 6, padding: 8,
                          fontSize: 12, fontFamily: FONT, resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button
                          onClick={() => {
                            const text = s.reply.trim()
                            if (!text) return
                            update(c.id, {
                              mode: 'idle',
                              reply: '',
                              sentLabel: 'Sent ✓',
                              threadAppend: [...s.threadAppend, { from: 'us', text, time: 'just now' }],
                            })
                          }}
                          style={primaryBtn(accent.hex)}
                        >
                          Send
                        </button>
                        <button onClick={() => update(c.id, { mode: 'idle', reply: '' })} style={ghostBtn(T)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {s.mode === 'forwarding' && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: T.text3 }}>Forward to:</span>
                      <select
                        value={s.forwardTo}
                        onChange={e => update(c.id, { forwardTo: e.target.value })}
                        style={{
                          background: T.panel2, color: T.text,
                          border: `1px solid ${T.border}`, borderRadius: 6,
                          padding: '4px 8px', fontSize: 11.5, fontFamily: FONT,
                        }}
                      >
                        {FORWARD_TARGETS.map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => update(c.id, { mode: 'idle', sentLabel: `Forwarded to ${s.forwardTo} ✓` })}
                        style={primaryBtn(accent.hex)}
                      >
                        Forward
                      </button>
                      <button onClick={() => update(c.id, { mode: 'idle' })} style={ghostBtn(T)}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>
            Inbox cleared.
          </div>
        )}
      </div>
    </Card>
  )
}
