'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { THEMES, DENSITY, FONT, FONT_MONO, getGreeting } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  GRASSROOTS_ORG, GRASSROOTS_FIXTURES, GRASSROOTS_TODAY, GRASSROOTS_INBOX,
  GRASSROOTS_INBOX_BODIES, GRASSROOTS_AI_BRIEF, GRASSROOTS_SQUAD,
  GRASSROOTS_PERF_INTEL, GRASSROOTS_RECENTS, GRASSROOTS_TOP_STATS,
  type GrassrootsAIBriefItem, type GrassrootsInboxChannel, type GrassrootsFixture,
} from '../_lib/grassroots-dashboard-data'

// ─── Theme scoped to grassroots green (#16a34a) ────────────────────────
const GR_THEME: ThemeTokens = THEMES.dark
const GR_ACCENT: AccentTokens = {
  hex:    '#16a34a',
  dim:    'rgba(22,163,74,0.14)',
  border: 'rgba(22,163,74,0.4)',
}
const GR_DENSITY: Density = DENSITY.regular

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// ─── Card + SectionHead ────────────────────────────────────────────────
function Card({ T, density, children, style, hover, onClick }: {
  T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void
}) {
  const [h, setH] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        position: 'relative', background: T.panel,
        border: `1px solid ${h && hover ? T.borderHi : T.border}`,
        borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow,
        transition: 'border-color .12s, transform .12s',
        transform: h && hover ? 'translateY(-1px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>{children}</div>
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

const pad2 = (n: number) => String(n).padStart(2, '0')

// ─── HeroToday ─────────────────────────────────────────────────────────
function HeroToday({
  T, accent, density, greeting, onWhosPlaying, onAsk,
}: Common & { greeting: string; onWhosPlaying?: () => void; onAsk?: () => void }) {
  const f = GRASSROOTS_FIXTURES[0]
  const [counter, setCounter] = useState({ h: 26, m: 14, s: 8 })

  useEffect(() => {
    const id = setInterval(() => setCounter(c => {
      let s = c.s - 1, m = c.m, h = c.h
      if (s < 0) { s = 59; m -= 1 }
      if (m < 0) { m = 59; h -= 1 }
      if (h < 0) { h = 0; m = 0; s = 0 }
      return { h, m, s }
    }), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / span 8', overflow: 'hidden', padding: `${density.pad}px ${density.pad + 4}px` }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: T.isDark ? 0.10 : 0.05, pointerEvents: 'none' }}>
        <defs>
          <pattern id="gr-hero-ptn" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M0 44 L44 0" stroke={T.text} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gr-hero-ptn)" />
      </svg>
      <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO }}>{greeting}</span>
            <span style={{ width: 1, height: 10, background: T.borderHi }} />
            <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_MONO }}>{GRASSROOTS_ORG.league}</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: density.h1 + 4, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {GRASSROOTS_ORG.clubShort} <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> {f.opp}
          </h1>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, color: T.text2, flexWrap: 'wrap' }}>
            <div><span style={{ color: T.text3 }}>Pitch</span> <span style={{ color: T.text, marginLeft: 6 }}>{f.venue}</span></div>
            <div><span style={{ color: T.text3 }}>KO</span> <span className="tnum" style={{ color: T.text, fontFamily: FONT_MONO, marginLeft: 6 }}>{f.ko}</span></div>
            <div><span style={{ color: T.text3 }}>Squad</span> <span style={{ color: T.good, marginLeft: 6, fontWeight: 600 }}>13 of 16 in</span></div>
            <div><span style={{ color: T.text3 }}>Comp</span> <span style={{ color: T.text, marginLeft: 6, fontFamily: FONT_MONO }}>{f.comp}</span></div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.text3, fontStyle: 'italic', maxWidth: 460 }}>
            {GRASSROOTS_ORG.quote} <span style={{ color: T.text2 }}>{GRASSROOTS_ORG.quoteAuthor}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, color: T.text2, fontSize: 12 }}>
          <div className="tnum" style={{ color: T.text, fontSize: 13 }}>{GRASSROOTS_ORG.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cloud" size={13} stroke={1.5} /> 9° · light rain</div>
          <div className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.warn }}>
            <Icon name="cloud" size={13} stroke={1.5} /> 12 mph east
          </div>
          <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 18, color: accent.hex, marginTop: 6 }}>
            {pad2(counter.h)}:{pad2(counter.m)}:{pad2(counter.s)}
          </div>
          <div style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>TO KICK-OFF</div>
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={onWhosPlaying}
          style={{
            appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9,
            background: accent.hex, color: '#fff',
            fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          }}>
          <Icon name="people" size={14} stroke={2} /> Who&apos;s playing?
        </button>
        <button onClick={onAsk}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accent.hex; e.currentTarget.style.color = accent.hex }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;    e.currentTarget.style.color = T.text2 }}
          style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'border-color .12s, color .12s' }}>
          <Icon name="sparkles" size={14} stroke={1.6} /> Ask Lumio
        </button>
      </div>
    </Card>
  )
}

// ─── TodaySchedule ─────────────────────────────────────────────────────
function TodaySchedule({ T, accent, density }: Common) {
  return (
    <Card T={T} density={density} hover style={{ gridColumn: '9 / span 4' }}>
      <SectionHead T={T} title="Sunday" right={<span className="tnum" style={{ fontFamily: FONT_MONO }}>27 Apr</span>} />
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 49, top: 6, bottom: 6, width: 1, background: T.border }} />
        {GRASSROOTS_TODAY.map((it, i) => (
          <div key={i} style={{ position: 'relative', display: 'flex', gap: 14, padding: '6px 0' }}>
            <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 11, color: it.highlight ? accent.hex : T.text3, width: 44, paddingTop: 2 }}>{it.t}</div>
            <div style={{ position: 'absolute', left: 46, top: 9, width: 7, height: 7, borderRadius: '50%', background: it.highlight ? accent.hex : T.panel, border: `1.5px solid ${it.highlight ? accent.hex : T.borderHi}` }} />
            <div style={{ flex: 1, paddingLeft: 14 }}>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: it.highlight ? 600 : 500 }}>{it.what}</div>
              <div style={{ fontSize: 10.5, color: T.text3 }}>{it.where}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── StatTiles ─────────────────────────────────────────────────────────
function StatTiles({ T, accent, density }: Common) {
  const dotFor = (tone: typeof GRASSROOTS_TOP_STATS[number]['tone']) =>
    tone === 'warn' ? T.warn : tone === 'accent' ? accent.hex : T.good
  return (
    <div style={{ display: 'flex', gap: density.gap }}>
      {GRASSROOTS_TOP_STATS.map((s, i) => (
        <Card key={i} T={T} density={density} hover style={{ flex: 1, padding: density.pad - 2 }}>
          <div style={{ position: 'absolute', top: density.pad - 2, right: density.pad, width: 6, height: 6, borderRadius: '50%', background: dotFor(s.tone) }} />
          <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <div className="tnum" style={{ fontSize: 26, fontWeight: 500, color: T.text, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.text2 }}>{s.sub}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── AIBrief ───────────────────────────────────────────────────────────
function timeAwareSummaryLabel(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning brief'
  if (h < 18) return 'Afternoon brief'
  return 'Evening brief'
}

function AIBrief({ T, accent, density, onAsk, gridColumn }: Common & { onAsk?: () => void; gridColumn?: string }) {
  const [items, setItems] = useState<(GrassrootsAIBriefItem & { dismissed?: boolean })[]>(GRASSROOTS_AI_BRIEF.map(x => ({ ...x })))
  const visible = items.filter(x => !x.dismissed)
  const label = timeAwareSummaryLabel()
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '1 / span 5' }}>
      <SectionHead T={T}
        title={<><Icon name="sparkles" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2, display: 'inline-block' }} />{label}</>}
        right={<>
          <span style={{ fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: T.hover, color: T.text3, fontSize: 10 }}>26 Apr</span>
          {onAsk && <button onClick={onAsk} style={{ marginLeft: 8, appearance: 'none', border: 0, background: 'transparent', color: accent.hex, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>Ask →</button>}
        </>} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visible.map((it, i) => (
          <div key={it.txt} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none', animation: 'cricketV2FadeUp .25s' }}>
            <div style={{
              fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4,
              background: it.pri === 'high' ? 'rgba(199,90,90,0.10)' : T.hover,
              color: it.pri === 'high' ? T.bad : T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1,
            }}>{it.tag}</div>
            <div style={{ flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>{it.txt}</div>
            <button onClick={() => setItems(arr => arr.map(x => x.txt === it.txt ? { ...x, dismissed: true } : x))}
              style={{ background: 'transparent', border: 0, color: T.text3, cursor: 'pointer', padding: 2, borderRadius: 3 }} title="Dismiss">
              <Icon name="check" size={12} stroke={1.8} />
            </button>
          </div>
        ))}
        {visible.length === 0 && <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>Sorted. See you Sunday.</div>}
      </div>
    </Card>
  )
}

// ─── Inbox (interactive) ───────────────────────────────────────────────
type InboxState = {
  expanded: string | null
  composing: 'reply' | 'forward' | null
  replied: Set<string>
  forwarded: Set<string>
  dismissed: Set<string>
}

function ReplyArea({ T, accent, onSent }: { T: ThemeTokens; accent: AccentTokens; onSent: () => void }) {
  const [text, setText] = useState('')
  return (
    <div style={{ marginTop: 10, padding: 10, background: T.hover, borderRadius: 7, border: `1px solid ${T.border}` }}>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type a reply…" rows={3}
        style={{ width: '100%', resize: 'vertical', minHeight: 60, background: T.panel, color: T.text, border: `1px solid ${T.border}`, borderRadius: 5, padding: '8px 10px', fontSize: 12, fontFamily: FONT, outline: 'none' }}
        onFocus={e => { e.currentTarget.style.borderColor = accent.hex }}
        onBlur={e => { e.currentTarget.style.borderColor = T.border }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
        <button disabled={!text.trim()} onClick={() => onSent()}
          style={{ appearance: 'none', border: 0, padding: '6px 12px', borderRadius: 5, background: text.trim() ? accent.hex : T.hover, color: text.trim() ? '#fff' : T.text3, fontSize: 11, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT }}>
          Send
        </button>
      </div>
    </div>
  )
}

function ForwardArea({ T, accent, onForwarded }: { T: ThemeTokens; accent: AccentTokens; onForwarded: () => void }) {
  const [to, setTo] = useState('Squad chat')
  const recipients = ['Squad chat', 'Steve (kit)', 'League secretary', 'Treasurer', 'Pitch booker']
  return (
    <div style={{ marginTop: 10, padding: 10, background: T.hover, borderRadius: 7, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: FONT_MONO }}>Forward to</div>
      <select value={to} onChange={e => setTo(e.target.value)}
        style={{ width: '100%', background: T.panel, color: T.text, border: `1px solid ${T.border}`, borderRadius: 5, padding: '7px 10px', fontSize: 12, fontFamily: FONT, outline: 'none' }}>
        {recipients.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
        <button onClick={() => onForwarded()}
          style={{ appearance: 'none', border: 0, padding: '6px 12px', borderRadius: 5, background: accent.hex, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
          Forward
        </button>
      </div>
    </div>
  )
}

function InboxRow({
  T, accent, c, first, state, onToggle, onCompose, onSent, onForwarded, onDismiss,
}: {
  T: ThemeTokens; accent: AccentTokens; c: GrassrootsInboxChannel; first: boolean
  state: InboxState
  onToggle: (ch: string) => void
  onCompose: (mode: 'reply' | 'forward') => void
  onSent: (ch: string) => void
  onForwarded: (ch: string) => void
  onDismiss: (ch: string) => void
}) {
  const [h, setH] = useState(false)
  const isOpen = state.expanded === c.ch
  const detail = GRASSROOTS_INBOX_BODIES[c.ch]
  const wasReplied = state.replied.has(c.ch)
  const wasForwarded = state.forwarded.has(c.ch)
  return (
    <div style={{ borderTop: first ? 'none' : `1px solid ${T.border}` }}>
      <button onClick={() => onToggle(c.ch)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ appearance: 'none', border: 0, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', margin: '0 -4px', borderRadius: 6, background: (h || isOpen) ? T.hover : 'transparent', cursor: 'pointer', color: 'inherit', fontFamily: FONT }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.urgent ? T.bad : T.text4 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            {c.ch}
            {wasReplied && <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(111,168,138,0.16)', color: T.good, fontWeight: 600 }}>Sent ✓</span>}
            {wasForwarded && <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(22,163,74,0.16)', color: accent.hex, fontWeight: 600 }}>Forwarded ✓</span>}
          </div>
          <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
        </div>
        <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{c.time}</div>
        <div className="tnum" style={{ minWidth: 22, height: 18, padding: '0 6px', borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, background: c.urgent ? 'rgba(199,90,90,0.12)' : T.hover, color: c.urgent ? T.bad : T.text2 }}>{c.count}</div>
      </button>

      {isOpen && (
        <div style={{ padding: '4px 6px 14px', animation: 'cricketV2FadeUp .18s' }}>
          {detail ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{detail.sender}</div>
                <div className="tnum" style={{ marginLeft: 'auto', fontFamily: FONT_MONO, fontSize: 10.5, color: T.text3 }}>{c.time}</div>
              </div>
              <div style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.55, padding: 12, background: T.hover, borderRadius: 7, border: `1px solid ${T.border}` }}>
                {detail.body}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '8px 0' }}>{c.last}</div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => onCompose('reply')}
              style={{ appearance: 'none', border: `1px solid ${T.border}`, background: state.composing === 'reply' ? T.hover : 'transparent', color: T.text2, padding: '5px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="note" size={11} stroke={1.6} /> Reply
            </button>
            <button onClick={() => onCompose('forward')}
              style={{ appearance: 'none', border: `1px solid ${T.border}`, background: state.composing === 'forward' ? T.hover : 'transparent', color: T.text2, padding: '5px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="arrow-up-right" size={11} stroke={1.6} /> Forward
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => onDismiss(c.ch)}
              style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, padding: '5px 10px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: FONT }}>
              Dismiss
            </button>
          </div>

          {state.composing === 'reply' && <ReplyArea T={T} accent={accent} onSent={() => onSent(c.ch)} />}
          {state.composing === 'forward' && <ForwardArea T={T} accent={accent} onForwarded={() => onForwarded(c.ch)} />}
        </div>
      )}
    </div>
  )
}

function Inbox({ T, accent, density, gridColumn }: Common & { gridColumn?: string }) {
  const [state, setState] = useState<InboxState>({ expanded: null, composing: null, replied: new Set(), forwarded: new Set(), dismissed: new Set() })
  const items = GRASSROOTS_INBOX.filter(c => !state.dismissed.has(c.ch))

  const toggleExpand = (ch: string) => setState(s => ({ ...s, expanded: s.expanded === ch ? null : ch, composing: null }))
  const compose = (mode: 'reply' | 'forward') => setState(s => ({ ...s, composing: s.composing === mode ? null : mode }))
  const markSent = (ch: string) => setState(s => { const next = new Set(s.replied); next.add(ch); return { ...s, replied: next, composing: null } })
  const markForwarded = (ch: string) => setState(s => { const next = new Set(s.forwarded); next.add(ch); return { ...s, forwarded: next, composing: null } })
  const dismiss = (ch: string) => setState(s => { const next = new Set(s.dismissed); next.add(ch); return { ...s, dismissed: next, expanded: s.expanded === ch ? null : s.expanded, composing: null } })

  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '6 / span 4' }}>
      <SectionHead T={T} title="Inbox" right={<span style={{ fontFamily: FONT_MONO }}>{items.length} threads</span>} />
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 320, overflow: 'auto' }}>
        {items.map((c, i) => (
          <InboxRow key={c.ch} T={T} accent={accent} c={c} first={i === 0}
            state={state} onToggle={toggleExpand} onCompose={compose} onSent={markSent} onForwarded={markForwarded} onDismiss={dismiss} />
        ))}
        {items.length === 0 && <div style={{ padding: '20px 0', fontSize: 12, color: T.text3, textAlign: 'center', fontStyle: 'italic' }}>Inbox clear · all sorted.</div>}
      </div>
    </Card>
  )
}

// ─── Squad availability grid ───────────────────────────────────────────
function Squad({ T, accent, density, gridColumn }: Common & { gridColumn?: string }) {
  const inCount = GRASSROOTS_SQUAD.filter(s => s.status === 'in').length
  const maybeCount = GRASSROOTS_SQUAD.filter(s => s.status === 'maybe').length
  const outCount = GRASSROOTS_SQUAD.filter(s => s.status === 'out').length
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '10 / span 3' }}>
      <SectionHead T={T} title="Who's playing?" />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span className="tnum" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', color: T.text }}>{inCount}</span>
        <span style={{ fontSize: 11, color: T.text2 }}>/ 16 confirmed</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.warn }}>{maybeCount} maybe · {outCount} out</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, marginBottom: 12 }}>
        {GRASSROOTS_SQUAD.map((p, i) => {
          const c = p.status === 'in' ? T.good : p.status === 'maybe' ? T.warn : T.bad
          const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div key={i} title={`${p.name} · ${p.status}${p.note ? ` · ${p.note}` : ''}`}
              style={{
                aspectRatio: '1', borderRadius: 4, display: 'grid', placeItems: 'center',
                fontSize: 9, fontWeight: 600, fontFamily: FONT_MONO,
                color: p.status === 'in' ? T.text : '#0E1014',
                background: p.status === 'in' ? `${c}22` : c,
                border: `1px solid ${p.status === 'in' ? `${c}55` : 'transparent'}`,
                cursor: 'pointer',
              }}>{initials}</div>
          )
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10.5 }}>
        {GRASSROOTS_SQUAD.filter(p => p.status !== 'in' || p.note).slice(0, 4).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.status === 'in' ? T.good : p.status === 'maybe' ? T.warn : T.bad, flexShrink: 0, transform: 'translateY(-1px)' }} />
            <span style={{ color: T.text, fontWeight: 500 }}>{p.name.split(' ')[0]}</span>
            <span style={{ color: T.text3, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.note ?? ''}</span>
            <span style={{ color: accent.hex, fontFamily: FONT_MONO, fontSize: 9.5, textTransform: 'uppercase' }}>{p.status}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Fixtures (simple list — no cards) ─────────────────────────────────
function Fixtures({ T, accent, density, gridColumn }: Common & { gridColumn?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '1 / span 7' }}>
      <SectionHead T={T} title="Fixtures" right={<>see all <Icon name="chevron-right" size={11} /></>} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {GRASSROOTS_FIXTURES.map((f, i) => {
          const hot = f.state === 'today'
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0',
              borderTop: i ? `1px solid ${T.border}` : 'none',
              background: hot ? accent.dim : 'transparent',
              margin: hot ? '0 -8px' : 0, paddingLeft: hot ? 8 : 0, paddingRight: hot ? 8 : 0,
              borderRadius: hot ? 6 : 0,
            }}>
              <span className="tnum" style={{ fontSize: 11, fontFamily: FONT_MONO, color: hot ? accent.hex : T.text3, minWidth: 60 }}>
                {f.day} {f.date}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>vs {f.opp}</div>
                <div style={{ fontSize: 10.5, color: T.text3 }}>{f.venue} · {f.comp} · KO {f.ko}</div>
              </div>
              <span className="tnum" style={{ fontSize: 10.5, color: hot ? accent.hex : T.text3, fontFamily: FONT_MONO, textAlign: 'right' }}>{f.status}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Performance (4 simple signals) ────────────────────────────────────
function Perf({ T, accent, density, gridColumn }: Common & { gridColumn?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '8 / span 5' }}>
      <SectionHead T={T} title="Form & form notes" right={<span style={{ fontFamily: FONT_MONO }}>L8</span>} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {GRASSROOTS_PERF_INTEL.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
            <span className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, minWidth: 18, textAlign: 'center', background: accent.dim, color: accent.hex }}>{i + 1}</span>
            <div style={{ flex: 1, fontSize: 12, color: T.text, lineHeight: 1.4 }}>{p.txt}</div>
            {p.delta && <div className="tnum" style={{ fontSize: 11, fontFamily: FONT_MONO, color: T.text2 }}>{p.delta}</div>}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Recents ──────────────────────────────────────────────────────────
const resTint = (T: ThemeTokens, r: 'W' | 'L' | 'D') => {
  if (r === 'W') return { bg: 'rgba(58,171,133,0.14)', fg: T.good }
  if (r === 'L') return { bg: 'rgba(199,90,90,0.12)',  fg: T.bad }
  return { bg: T.hover, fg: T.text2 }
}

function Recents({ T, density, gridColumn }: Common & { gridColumn?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '1 / span 12' }}>
      <SectionHead T={T} title="Recent results" right={
        <div style={{ display: 'flex', gap: 4 }}>
          {GRASSROOTS_RECENTS.map((m, i) => {
            const t = resTint(T, m.res)
            return <span key={i} style={{ width: 18, height: 18, borderRadius: 4, fontSize: 9.5, fontWeight: 700, display: 'grid', placeItems: 'center', background: t.bg, color: t.fg }}>{m.res}</span>
          })}
        </div>
      } />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {GRASSROOTS_RECENTS.map((m, i) => {
          const t = resTint(T, m.res)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, fontSize: 9.5, fontWeight: 700, display: 'grid', placeItems: 'center', background: t.bg, color: t.fg, flexShrink: 0 }}>{m.res}</span>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, minWidth: 160 }}>vs {m.vs}</div>
              <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.text2, flex: 1 }}>{m.score} · {m.venue}</div>
              <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{m.date}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Top-level dashboard view ──────────────────────────────────────────
export function GrassrootsDashboardView({
  onAskLumio, onWhosPlaying,
}: {
  onAskLumio?: () => void
  onWhosPlaying?: () => void
}) {
  const T = GR_THEME
  const accent = GR_ACCENT
  const density = GR_DENSITY
  const greeting = getGreeting('matchday')

  return (
    <>
      <style jsx global>{`
        .tnum { font-variant-numeric: tabular-nums; }
        @keyframes cricketV2FadeUp     { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes cricketV2SlideLeft  { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: none } }
      `}</style>
      <div style={{ background: T.bg, color: T.text, fontFamily: FONT, padding: density.gap, borderRadius: 12, marginBottom: density.gap }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
          <HeroToday T={T} accent={accent} density={density} greeting={greeting}
            onAsk={onAskLumio} onWhosPlaying={onWhosPlaying} />
          <TodaySchedule T={T} accent={accent} density={density} />
        </div>
      </div>

      <div style={{ background: T.bg, color: T.text, fontFamily: FONT, padding: density.gap, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: density.gap }}>
        <StatTiles T={T} accent={accent} density={density} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
          <AIBrief T={T} accent={accent} density={density} onAsk={onAskLumio} />
          <Inbox T={T} accent={accent} density={density} />
          <Squad T={T} accent={accent} density={density} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
          <Fixtures T={T} accent={accent} density={density} />
          <Perf T={T} accent={accent} density={density} />
        </div>

        <Recents T={T} accent={accent} density={density} />
      </div>
    </>
  )
}

// Re-export for the shell + page.tsx
export { GR_ACCENT, GR_THEME, GR_DENSITY }
