'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { THEMES, ACCENTS, DENSITY, FONT, FONT_MONO, getGreeting } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  GOLF_ORG, GOLF_FIXTURES, GOLF_TODAY, GOLF_INBOX, GOLF_INBOX_BODIES,
  GOLF_AI_BRIEF, GOLF_MY_TEAM, GOLF_PERF_INTEL, GOLF_RECENTS, GOLF_TOP_STATS,
  type GolfAIBriefItem, type GolfInboxChannel, type GolfFixture,
} from '../_lib/golf-dashboard-data'

// ─── Theme scoped to golf accent (#16a34a green) ───────────────────────
const GOLF_THEME: ThemeTokens = THEMES.dark
const GOLF_ACCENT: AccentTokens = {
  hex:    '#16a34a',
  dim:    'rgba(22,163,74,0.14)',
  border: 'rgba(22,163,74,0.4)',
}
const GOLF_DENSITY: Density = DENSITY.regular

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// ─── Card + SectionHead ────────────────────────────────────────────────
function Card({
  T, density, children, style, hover, onClick,
}: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
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
  T, accent, density, greeting, onCourseStrategy, onAsk,
}: Common & { greeting: string; onCourseStrategy?: () => void; onAsk?: () => void }) {
  const f = GOLF_FIXTURES[0]
  const [counter, setCounter] = useState({ h: 1, m: 47, s: 22 })

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
          <pattern id="golf-hero-ptn" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M0 44 L44 0" stroke={T.text} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#golf-hero-ptn)" />
      </svg>
      <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO }}>{greeting}</span>
            <span style={{ width: 1, height: 10, background: T.borderHi }} />
            <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_MONO }}>{f.event} · R2</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: density.h1 + 4, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {GOLF_ORG.player} <span style={{ color: T.text3, fontWeight: 400 }}>· tee 09:24</span>
          </h1>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, color: T.text2, flexWrap: 'wrap' }}>
            <div><span style={{ color: T.text3 }}>Group</span> <span style={{ color: T.text, marginLeft: 6 }}>T. Hartwell · J. Donovan</span></div>
            <div><span style={{ color: T.text3 }}>Course</span> <span style={{ color: T.text, marginLeft: 6 }}>{f.course}</span></div>
            <div><span style={{ color: T.text3 }}>Cut</span> <span style={{ color: T.warn, marginLeft: 6, fontWeight: 600 }}>{f.cut}</span></div>
            <div><span style={{ color: T.text3 }}>R1</span> <span style={{ color: T.text, marginLeft: 6, fontFamily: FONT_MONO }}>E par</span></div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.text3, fontStyle: 'italic', maxWidth: 420 }}>
            {GOLF_ORG.quote} <span style={{ color: T.text2 }}>{GOLF_ORG.quoteAuthor}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, color: T.text2, fontSize: 12 }}>
          <div className="tnum" style={{ color: T.text, fontSize: 13 }}>{GOLF_ORG.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cloud" size={13} stroke={1.5} /> 12° · partly cloudy</div>
          <div className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.warn }}>
            <Icon name="cloud" size={13} stroke={1.5} /> 8 mph NW
          </div>
          <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 18, color: accent.hex, marginTop: 6 }}>
            {pad2(counter.h)}:{pad2(counter.m)}:{pad2(counter.s)}
          </div>
          <div style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>TO TEE</div>
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={onCourseStrategy}
          style={{
            appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9,
            background: accent.hex, color: T.btnText,
            fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          }}>
          <Icon name="crosshair" size={14} stroke={2} /> Course strategy
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
      <SectionHead T={T} title="Today" right={<span className="tnum" style={{ fontFamily: FONT_MONO }}>Sat 26 Apr</span>} />
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 49, top: 6, bottom: 6, width: 1, background: T.border }} />
        {GOLF_TODAY.map((it, i) => (
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
  const dotFor = (tone: typeof GOLF_TOP_STATS[number]['tone']) =>
    tone === 'warn' ? T.warn : tone === 'accent' ? accent.hex : T.good
  return (
    <div style={{ display: 'flex', gap: density.gap }}>
      {GOLF_TOP_STATS.map((s, i) => (
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
  if (h < 12) return 'AI Morning Summary'
  if (h < 18) return 'AI Afternoon Summary'
  return 'AI Evening Summary'
}

function AIBrief({ T, accent, density, onAsk, gridColumn }: Common & { onAsk?: () => void; gridColumn?: string }) {
  const [items, setItems] = useState<(GolfAIBriefItem & { dismissed?: boolean })[]>(GOLF_AI_BRIEF.map(x => ({ ...x })))
  const visible = items.filter(x => !x.dismissed)
  const label = timeAwareSummaryLabel()
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '1 / span 5' }}>
      <SectionHead T={T}
        title={<><Icon name="sparkles" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2, display: 'inline-block' }} />{label}</>}
        right={<>
          <span style={{ fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: T.hover, color: T.text3, fontSize: 10 }}>26 Apr 2026</span>
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
        {visible.length === 0 && <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>All clear · briefing for tomorrow at 06:00.</div>}
      </div>
    </Card>
  )
}

// ─── Inbox (interactive — click-expand with reply/forward/dismiss) ────
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
  const [to, setTo] = useState('Caddie')
  const recipients = ['Caddie', 'Coach', 'Agent', 'Physio', 'Fitness Coach', 'Equipment', 'Nutritionist']
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
  T: ThemeTokens; accent: AccentTokens; c: GolfInboxChannel; first: boolean
  state: InboxState
  onToggle: (ch: string) => void
  onCompose: (mode: 'reply' | 'forward') => void
  onSent: (ch: string) => void
  onForwarded: (ch: string) => void
  onDismiss: (ch: string) => void
}) {
  const [h, setH] = useState(false)
  const isOpen = state.expanded === c.ch
  const detail = GOLF_INBOX_BODIES[c.ch]
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
                <div style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: T.hover, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{c.ch.split(' ')[0]}</div>
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
  const [filter, setFilter] = useState<'all' | 'urgent'>('all')
  const [state, setState] = useState<InboxState>({ expanded: null, composing: null, replied: new Set(), forwarded: new Set(), dismissed: new Set() })
  const items = (filter === 'urgent' ? GOLF_INBOX.filter(c => c.urgent) : GOLF_INBOX).filter(c => !state.dismissed.has(c.ch))
  const totalCount = GOLF_INBOX.filter(c => !state.dismissed.has(c.ch)).length
  const urgentCount = GOLF_INBOX.filter(c => c.urgent && !state.dismissed.has(c.ch)).length
  const tabs: [typeof filter, string, number][] = [['all', 'All', totalCount], ['urgent', 'Urgent', urgentCount]]

  const toggleExpand = (ch: string) => setState(s => ({ ...s, expanded: s.expanded === ch ? null : ch, composing: null }))
  const compose = (mode: 'reply' | 'forward') => setState(s => ({ ...s, composing: s.composing === mode ? null : mode }))
  const markSent = (ch: string) => setState(s => { const next = new Set(s.replied); next.add(ch); return { ...s, replied: next, composing: null } })
  const markForwarded = (ch: string) => setState(s => { const next = new Set(s.forwarded); next.add(ch); return { ...s, forwarded: next, composing: null } })
  const dismiss = (ch: string) => setState(s => { const next = new Set(s.dismissed); next.add(ch); return { ...s, dismissed: next, expanded: s.expanded === ch ? null : s.expanded, composing: null } })

  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '6 / span 4' }}>
      <SectionHead T={T} title="Inbox" right={
        <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 7 }}>
          {tabs.map(([id, lbl, n]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              appearance: 'none', border: 0, padding: '3px 8px', borderRadius: 5, fontSize: 10.5, cursor: 'pointer',
              background: filter === id ? T.panel : 'transparent', color: filter === id ? T.text : T.text2,
              fontWeight: filter === id ? 600 : 400, boxShadow: filter === id ? `0 0 0 1px ${T.border}` : 'none',
            }}>{lbl} <span style={{ color: T.text3 }}>{n}</span></button>
          ))}
        </div>
      } />
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflow: 'auto' }}>
        {items.slice(0, 8).map((c, i) => (
          <InboxRow key={c.ch} T={T} accent={accent} c={c} first={i === 0}
            state={state} onToggle={toggleExpand} onCompose={compose} onSent={markSent} onForwarded={markForwarded} onDismiss={dismiss} />
        ))}
        {items.length === 0 && <div style={{ padding: '20px 0', fontSize: 12, color: T.text3, textAlign: 'center', fontStyle: 'italic' }}>Inbox clear · {filter === 'urgent' ? 'no urgent items' : 'all messages handled'}</div>}
      </div>
    </Card>
  )
}

// ─── My Team ───────────────────────────────────────────────────────────
function MyTeam({ T, density, gridColumn }: Common & { gridColumn?: string }) {
  const accentMap = { green: '#22C55E', teal: '#14B8A6', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#A855F7' } as const
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '10 / span 3' }}>
      <SectionHead T={T} title="My team" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {GOLF_MY_TEAM.map((m, i) => {
          const c = accentMap[m.accent]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${c}22`, color: c, fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {m.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, color: T.text, fontWeight: 600, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  {m.name}
                  <span style={{ fontSize: 9.5, color: c, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT_MONO }}>{m.role}</span>
                </div>
                <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.status}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Fixtures (tournament schedule) ────────────────────────────────────
function FixtureCard({ T, accent, f, hot }: { T: ThemeTokens; accent: AccentTokens; f: GolfFixture; hot: boolean }) {
  return (
    <div style={{
      padding: 12, borderRadius: 10,
      background: hot ? accent.dim : T.panel2,
      border: `1px solid ${hot ? accent.border : T.border}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.text3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        <span>{f.day} {f.date}</span><span>{f.tour}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>{f.event}</div>
      <div style={{ fontSize: 11, color: T.text2 }}>{f.course}</div>
      <div style={{ fontSize: 11, color: T.text3 }}>Purse <span style={{ color: T.text2 }}>{f.purse}</span> · Cut <span style={{ color: T.text2 }}>{f.cut}</span></div>
      <div className="tnum" style={{ fontSize: 11, color: hot ? accent.hex : T.text2, fontFamily: FONT_MONO, marginTop: 'auto' }}>{f.status}</div>
    </div>
  )
}

function Fixtures({ T, accent, density, gridColumn }: Common & { gridColumn?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '1 / span 7' }}>
      <SectionHead T={T} title="Tournament schedule" right={<>see all <Icon name="chevron-right" size={11} /></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {GOLF_FIXTURES.slice(0, 5).map((f, i) => <FixtureCard key={i} T={T} accent={accent} f={f} hot={i === 0} />)}
      </div>
    </Card>
  )
}

// ─── Performance Intelligence ──────────────────────────────────────────
function Perf({ T, accent, density, gridColumn }: Common & { gridColumn?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '8 / span 5' }}>
      <SectionHead T={T} title="Performance Intelligence" right={<span style={{ fontFamily: FONT_MONO }}>L7d</span>} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {GOLF_PERF_INTEL.map((p, i) => {
          const isNeg = p.delta?.startsWith('−') || p.delta?.startsWith('-')
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, minWidth: 18, textAlign: 'center', background: accent.dim, color: accent.hex }}>{i + 1}</span>
              <div style={{ flex: 1, fontSize: 12, color: T.text, lineHeight: 1.4 }}>{p.txt}</div>
              {p.delta && <div className="tnum" style={{ fontSize: 11, fontFamily: FONT_MONO, color: isNeg ? T.bad : T.good }}>{p.delta}</div>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Recents ──────────────────────────────────────────────────────────
function Recents({ T, density, gridColumn }: Common & { gridColumn?: string }) {
  const finishTone = (f: string) => f === 'MC' ? T.bad : f.startsWith('T-') && parseInt(f.slice(2)) <= 10 ? T.good : T.text2
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '1 / span 7' }}>
      <SectionHead T={T} title="Recent results" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {GOLF_RECENTS.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ fontSize: 10.5, fontFamily: FONT_MONO, fontWeight: 700, color: finishTone(m.finish), minWidth: 56 }}>{m.finish}</span>
            <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, flex: 1 }}>{m.event}</div>
            <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.text2 }}>{m.score}</div>
            <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO, minWidth: 70, textAlign: 'right' }}>{m.date}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Photo Frame ───────────────────────────────────────────────────────
function PhotoFrame({ T, density, gridColumn, photoDataUrl }: Common & { gridColumn?: string; photoDataUrl?: string | null }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '8 / span 5' }}>
      <SectionHead T={T} title="📸 Personal photo frame" right={<span style={{ fontSize: 10, color: T.text3 }}>Today</span>} />
      <div style={{
        aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden',
        background: T.panel2, border: `1px dashed ${T.border}`,
        display: 'grid', placeItems: 'center', position: 'relative',
      }}>
        {photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 18 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: 12, color: T.text2, fontWeight: 600, marginBottom: 2 }}>Drop a tournament photo</div>
            <div style={{ fontSize: 10.5, color: T.text3 }}>Range mornings · podium shots · family at home</div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Top-level dashboard view ──────────────────────────────────────────
// Composes the v2 grid for the golf 'dashboard' route case in page.tsx.
// Layout matches rugby/cricket: hero + schedule on top, stat tiles, then
// AI summary + inbox + my-team, then fixtures + perf, then recents +
// photo frame. The right-hand player profile card stays in page.tsx
// untouched (Phase 2 will pull it into a shared shell).
export function GolfHeroBlock({
  onAskLumio, onCourseStrategy,
}: {
  onAskLumio?: () => void
  onCourseStrategy?: () => void
}) {
  const T = GOLF_THEME
  const accent = GOLF_ACCENT
  const density = GOLF_DENSITY
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
            onAsk={onAskLumio} onCourseStrategy={onCourseStrategy} />
          <TodaySchedule T={T} accent={accent} density={density} />
        </div>
      </div>
    </>
  )
}

export function GolfGridBlock({
  onAskLumio, photoDataUrl,
}: {
  onAskLumio?: () => void
  photoDataUrl?: string | null
}) {
  const T = GOLF_THEME
  const accent = GOLF_ACCENT
  const density = GOLF_DENSITY
  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: FONT, padding: density.gap, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: density.gap }}>
      <StatTiles T={T} accent={accent} density={density} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
        <AIBrief T={T} accent={accent} density={density} onAsk={onAskLumio} />
        <Inbox T={T} accent={accent} density={density} />
        <MyTeam T={T} accent={accent} density={density} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
        <Fixtures T={T} accent={accent} density={density} />
        <Perf T={T} accent={accent} density={density} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
        <Recents T={T} accent={accent} density={density} />
        <PhotoFrame T={T} accent={accent} density={density} photoDataUrl={photoDataUrl ?? null} />
      </div>
    </div>
  )
}

// Backwards-compatible monolithic view (hero + grid). Prefer GolfHeroBlock +
// GolfGridBlock when tabs are inserted between hero and grid.
export function GolfDashboardView({
  onAskLumio, onCourseStrategy, photoDataUrl,
}: {
  onAskLumio?: () => void
  onCourseStrategy?: () => void
  photoDataUrl?: string | null
}) {
  return (
    <>
      <GolfHeroBlock onAskLumio={onAskLumio} onCourseStrategy={onCourseStrategy} />
      <GolfGridBlock onAskLumio={onAskLumio} photoDataUrl={photoDataUrl} />
    </>
  )
}

// Re-export accent so the shell (and page.tsx if needed) can match it.
export { GOLF_ACCENT, GOLF_THEME, GOLF_DENSITY }
