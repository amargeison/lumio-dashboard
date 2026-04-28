'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '../_lib/theme'
import { FONT, FONT_MONO } from '../_lib/theme'
import {
  ORG, FIXTURES, TODAY, AI_BRIEF, INBOX, INJURIES, RECENTS, PERF_INTEL,
  SEASON_FORM, SQUAD_INITIALS,
  type Fixture, type AIBriefItem, type InboxChannel,
} from '../_lib/data'
import { Icon } from './Icon'

// ─── Shared ────────────────────────────────────────────────────────────

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

export function Card({
  T, density, children, style, hover, onClick,
}: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
  const [h, setH] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: 'relative',
        background: T.panel,
        border: `1px solid ${h && hover ? T.borderHi : T.border}`,
        borderRadius: density.radius,
        padding: density.pad,
        boxShadow: T.cardShadow,
        transition: 'border-color .12s, transform .12s',
        transform: h && hover ? 'translateY(-1px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div>
      <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 4 }}>{right}</div>
    </div>
  )
}

const pad2 = (n: number) => String(n).padStart(2, '0')

// ─── HeroToday ─────────────────────────────────────────────────────────

export function HeroToday({
  T, accent, density, greeting, onConfirm, onAsk, onMatchBrief,
}: Common & { greeting: string; onConfirm?: () => void; onAsk?: () => void; onMatchBrief?: () => void }) {
  const f = FIXTURES[0]
  const [confirmed, setConfirmed] = useState(false)
  const [counter, setCounter]     = useState({ h: 4, m: 18, s: 42 })

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
    <Card T={T} density={density} style={{ gridColumn: '1 / span 8', overflow: 'hidden', padding: density.pad + 8 }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: T.isDark ? 0.10 : 0.05, pointerEvents: 'none' }}>
        <defs>
          <pattern id="ptn-hero" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M0 44 L44 0" stroke={T.text} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ptn-hero)" />
      </svg>
      <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO }}>{greeting}</span>
            <span style={{ width: 1, height: 10, background: T.borderHi }} />
            <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_MONO }}>{f.comp} · Round 4 · Day 1 of 4</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: density.h1 + 4, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Oakridge CC <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> {f.opp}
          </h1>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, color: T.text2, flexWrap: 'wrap' }}>
            <div><span style={{ color: T.text3 }}>First ball</span> <span className="tnum" style={{ color: T.text, fontFamily: FONT_MONO, marginLeft: 6 }}>11:00</span></div>
            <div><span style={{ color: T.text3 }}>Toss</span> <span className="tnum" style={{ color: T.text, fontFamily: FONT_MONO, marginLeft: 6 }}>10:30</span></div>
            <div><span style={{ color: T.text3 }}>Venue</span> <span style={{ color: T.text, marginLeft: 6 }}>Oakridge Park</span></div>
            <div><span style={{ color: T.text3 }}>Squad</span> <span style={{ color: T.good, marginLeft: 6, fontWeight: 600 }}>Locked</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, color: T.text2, fontSize: 12 }}>
          <div className="tnum" style={{ color: T.text, fontSize: 13 }}>{ORG.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cloud" size={13} stroke={1.5} /> 9° · cloud</div>
          <div className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.warn }}>
            <Icon name="cloud" size={13} stroke={1.5} /> 34% rain ↓16:00
          </div>
          <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 18, color: accent.hex, marginTop: 6 }}>
            {pad2(counter.h)}:{pad2(counter.m)}:{pad2(counter.s)}
          </div>
          <div style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>TO FIRST BALL</div>
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <button
          onClick={() => { setConfirmed(true); onConfirm?.() }}
          style={{
            appearance: 'none', border: 0, padding: '10px 16px', borderRadius: 9,
            background: confirmed ? T.good : accent.hex, color: T.btnText,
            fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            transition: 'background .15s, transform .1s',
          }}>
          <Icon name="check" size={14} stroke={2} /> {confirmed ? 'Starting XI confirmed' : 'Confirm starting XI'}
        </button>
        <button
          onClick={onMatchBrief}
          style={{ appearance: 'none', padding: '10px 14px', borderRadius: 9, background: 'transparent', color: T.text, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'border-color .12s, color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accent.hex; e.currentTarget.style.color = accent.hex }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;    e.currentTarget.style.color = T.text }}
        >
          <Icon name="note" size={14} stroke={1.6} /> Match brief
        </button>
        <button
          onClick={onAsk}
          style={{ appearance: 'none', padding: '10px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'border-color .12s, color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accent.hex; e.currentTarget.style.color = accent.hex }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;    e.currentTarget.style.color = T.text2 }}>
          <Icon name="sparkles" size={14} stroke={1.6} /> Ask Lumio
        </button>
      </div>
    </Card>
  )
}

// ─── TodaySchedule ─────────────────────────────────────────────────────

export function TodaySchedule({ T, accent, density }: Common) {
  return (
    <Card T={T} density={density} hover style={{ gridColumn: '9 / span 4' }}>
      <SectionHead T={T} title="Today" right={<span className="tnum" style={{ fontFamily: FONT_MONO }}>Sat 26 Apr</span>} />
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 49, top: 6, bottom: 6, width: 1, background: T.border }} />
        {TODAY.map((it, i) => (
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

export function StatTiles({ T, accent, density }: Common) {
  const tiles = [
    { label: 'Inbox',     value: 18,      sub: '4 urgent', dot: T.bad },
    { label: 'Approvals', value: 3,       sub: 'awaiting', dot: T.warn },
    { label: 'On bench',  value: 2,       sub: 'injured',  dot: T.bad },
    { label: 'Today',     value: 5,       sub: 'sessions', dot: T.good },
    { label: 'Net runs',  value: '+0.42', sub: 'season',   dot: accent.hex },
  ]
  return (
    <div style={{ display: 'flex', gap: density.gap }}>
      {tiles.map((s, i) => (
        <Card key={i} T={T} density={density} hover style={{ flex: 1, padding: density.pad - 2 }}>
          <div style={{ position: 'absolute', top: density.pad - 2, right: density.pad, width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
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

// Time-aware label: morning before noon, afternoon to 18:00, then evening.
function timeAwareSummaryLabel(): string {
  const h = new Date().getHours()
  if (h < 12) return 'AI Morning Summary'
  if (h < 18) return 'AI Afternoon Summary'
  return 'AI Evening Summary'
}

export function AIBrief({ T, accent, density, onAsk, gridColumn }: Common & { onAsk?: () => void; gridColumn?: string }) {
  const [items, setItems] = useState<(AIBriefItem & { dismissed?: boolean })[]>(AI_BRIEF.map(x => ({ ...x })))
  const visible = items.filter(x => !x.dismissed)
  const label = timeAwareSummaryLabel()
  const dateBadge = ORG.date.replace(/^[A-Za-z]{3},\s*/, '') // strip "Sat, " prefix → "26 Apr 2026"
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '1 / span 5' }}>
      <SectionHead
        T={T}
        title={<><Icon name="sparkles" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2, display: 'inline-block' }} />{label}</>}
        right={<>
          <span style={{ fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: T.hover, color: T.text3, fontSize: 10 }}>{dateBadge}</span>
          {onAsk && (
            <button onClick={onAsk} style={{ marginLeft: 8, appearance: 'none', border: 0, background: 'transparent', color: accent.hex, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontFamily: FONT }}>Ask →</button>
          )}
        </>}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visible.map((it, i) => (
          <div key={it.txt} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none', animation: 'cricketV2FadeUp .25s' }}>
            <div style={{
              fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4,
              background: it.pri === 'high' ? 'rgba(199,90,90,0.10)' : T.hover,
              color: it.pri === 'high' ? T.bad : T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1,
            }}>{it.tag}</div>
            <div style={{ flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>{it.txt}</div>
            <button
              onClick={() => setItems(arr => arr.map(x => x.txt === it.txt ? { ...x, dismissed: true } : x))}
              style={{ background: 'transparent', border: 0, color: T.text3, cursor: 'pointer', padding: 2, borderRadius: 3 }}
              title="Dismiss"
            >
              <Icon name="check" size={12} stroke={1.8} />
            </button>
          </div>
        ))}
        {visible.length === 0 && <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>All clear · briefing for tomorrow at 06:00.</div>}
      </div>
    </Card>
  )
}

// ─── Inbox ─────────────────────────────────────────────────────────────

// Realistic cricket-specific message bodies, keyed by channel name. Used by
// the click-expand to show the full message instead of just the preview.
const INBOX_BODIES: Record<string, { sender: string; body: string }> = {
  'WhatsApp · Squad': {
    sender: 'Karan (Captain)',
    body: 'Pitch looks dry, could turn from Day 2. Spoke to groundsman, he\'s leaving a good covering of grass for Day 1 — should hold together. Should be a bat-first wicket if we win the toss. Talked to Patel about opening — he\'s up for it.',
  },
  'Email · Selectors': {
    sender: 'D. Caldwell · Head of Selection',
    body: 'Hartley availability for Saturday — completed fitness test this morning, scored 6/10 on the movement assessment. Physio recommends 12th man role with a view to playing Wednesday if no reaction. Need a final call by 09:30 Saturday so we can name the XI.',
  },
  'Slack · Coaches': {
    sender: 'A. Mehta · Bowling Coach',
    body: 'New bowling drill plan uploaded to shared drive. Focus on yorker accuracy — stats show we\'re landing only 34% in the blockhole vs 45% league average. Video attached. Want to run this Friday morning before Saturday\'s match. 45 mins, nets 2.',
  },
  'SMS · Players': {
    sender: 'A. Reed',
    body: 'Reed unavailable Wednesday — wedding (sister-in-law). Confirmed available for Saturday Championship match. Apologies for short notice on Wed — will swap with Cooper in the rotation.',
  },
  'Agent messages': {
    sender: 'Oakridge Sports · J. Kerr',
    body: 'Patel\'s contract draft attached for review. Two-year extension proposed at the figure we discussed, with a release window for The Hundred. Need a response by Wednesday close. Happy to jump on a call Tuesday afternoon if useful.',
  },
  'Board messages': {
    sender: 'M. Ashworth · Chair',
    body: 'Quarterly review docs attached. Headline numbers: gate +12% YoY, sponsorship pipeline strong (3 new categories under offer), academy revenue flat. Board meeting Tuesday 7pm — please bring your performance summary.',
  },
  'Media & Press': {
    sender: 'L. Mahmood · Telegraph',
    body: 'Telegraph match preview — looking for a quote on the Loxwood fixture and Patel\'s form. 200 words, deadline 16:00 Friday. Happy with email or 5-min call. Can also feature the academy pathway piece if you have something to add.',
  },
  'Parents & families': {
    sender: 'M. Robinson · Parent rep',
    body: 'U17 transport to away fixture at Glamorgan — confirmed minibus for 14, but need a second driver. Any of the senior staff available 06:00 Saturday? Return 19:00. Will reimburse mileage if private car used.',
  },
  'Membership': {
    sender: 'Membership office',
    body: 'Renewal flagged x2 — both long-standing members (10+ years) lapsed last week. Auto-renewal failed (card expired). Worth a personal call before they drift? Both are season-ticket holders.',
  },
  'Academy': {
    sender: 'S. Patel · Academy Director',
    body: 'Pathway update for Reed — recommended fast-track to U19 squad. Performance trending well, tactical maturity is the marker. Suggest a 4-week window in U19 nets before the next intake review.',
  },
}

function ReplyArea({ T, accent, onSent }: { T: ThemeTokens; accent: AccentTokens; onSent: () => void }) {
  const [text, setText] = useState('')
  return (
    <div style={{ marginTop: 10, padding: 10, background: T.hover, borderRadius: 7, border: `1px solid ${T.border}` }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type a reply…"
        rows={3}
        style={{
          width: '100%', resize: 'vertical', minHeight: 60,
          background: T.panel, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 5,
          padding: '8px 10px', fontSize: 12, fontFamily: FONT, outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = accent.hex }}
        onBlur={e => { e.currentTarget.style.borderColor = T.border }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
        <button
          disabled={!text.trim()}
          onClick={() => onSent()}
          style={{
            appearance: 'none', border: 0, padding: '6px 12px', borderRadius: 5,
            background: text.trim() ? accent.hex : T.hover, color: text.trim() ? T.btnText : T.text3,
            fontSize: 11, fontWeight: 600, cursor: text.trim() ? 'pointer' : 'not-allowed',
            fontFamily: FONT,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

function ForwardArea({ T, accent, onForwarded }: { T: ThemeTokens; accent: AccentTokens; onForwarded: () => void }) {
  const [to, setTo] = useState('Head Coach')
  const recipients = ['Head Coach', 'Captain', 'Medical', 'Analytics', 'Operations', 'Director', 'Senior players']
  return (
    <div style={{ marginTop: 10, padding: 10, background: T.hover, borderRadius: 7, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: FONT_MONO }}>Forward to</div>
      <select
        value={to}
        onChange={e => setTo(e.target.value)}
        style={{
          width: '100%', background: T.panel, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 5,
          padding: '7px 10px', fontSize: 12, fontFamily: FONT, outline: 'none',
        }}
      >
        {recipients.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={() => onForwarded()}
          style={{
            appearance: 'none', border: 0, padding: '6px 12px', borderRadius: 5,
            background: accent.hex, color: T.btnText,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
          }}
        >
          Forward
        </button>
      </div>
    </div>
  )
}

type InboxState = {
  expanded: string | null
  composing: 'reply' | 'forward' | null
  replied: Set<string>
  forwarded: Set<string>
  dismissed: Set<string>
}

function InboxRow({
  T, accent, c, first, state, onToggle, onCompose, onSent, onForwarded, onDismiss,
}: {
  T: ThemeTokens; accent: AccentTokens; c: InboxChannel; first: boolean
  state: InboxState
  onToggle: (ch: string) => void
  onCompose: (mode: 'reply' | 'forward') => void
  onSent: (ch: string) => void
  onForwarded: (ch: string) => void
  onDismiss: (ch: string) => void
}) {
  const [h, setH] = useState(false)
  const isOpen = state.expanded === c.ch
  const detail = INBOX_BODIES[c.ch]
  const wasReplied = state.replied.has(c.ch)
  const wasForwarded = state.forwarded.has(c.ch)
  return (
    <div style={{ borderTop: first ? 'none' : `1px solid ${T.border}` }}>
      <button
        onClick={() => onToggle(c.ch)}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          appearance: 'none', border: 0, width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 4px', margin: '0 -4px', borderRadius: 6,
          background: (h || isOpen) ? T.hover : 'transparent', cursor: 'pointer',
          color: 'inherit', fontFamily: FONT,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.urgent ? T.bad : T.text4 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            {c.ch}
            {wasReplied && <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(111,168,138,0.16)', color: T.good, fontWeight: 600 }}>Sent ✓</span>}
            {wasForwarded && <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'rgba(58,108,168,0.16)', color: accent.hex, fontWeight: 600 }}>Forwarded ✓</span>}
          </div>
          <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
        </div>
        <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{c.time}</div>
        <div className="tnum" style={{
          minWidth: 22, height: 18, padding: '0 6px', borderRadius: 9, display: 'grid', placeItems: 'center',
          fontSize: 10.5, fontWeight: 600,
          background: c.urgent ? 'rgba(199,90,90,0.12)' : T.hover,
          color: c.urgent ? T.bad : T.text2,
        }}>{c.count}</div>
      </button>

      {isOpen && (
        <div style={{ padding: '4px 6px 14px', animation: 'cricketV2FadeUp .18s' }}>
          {detail ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{detail.sender}</div>
                <div style={{
                  fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: T.hover,
                  color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>{c.ch.split(' · ')[0]}</div>
                <div className="tnum" style={{ marginLeft: 'auto', fontFamily: FONT_MONO, fontSize: 10.5, color: T.text3 }}>{c.time}</div>
              </div>
              <div style={{
                fontSize: 12.5, color: T.text2, lineHeight: 1.55,
                padding: 12, background: T.hover, borderRadius: 7, border: `1px solid ${T.border}`,
              }}>
                {detail.body}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '8px 0' }}>{c.last}</div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={() => onCompose('reply')}
              style={{
                appearance: 'none', border: `1px solid ${T.border}`,
                background: state.composing === 'reply' ? T.hover : 'transparent',
                color: T.text2, padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                fontSize: 11, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <Icon name="note" size={11} stroke={1.6} /> Reply
            </button>
            <button
              onClick={() => onCompose('forward')}
              style={{
                appearance: 'none', border: `1px solid ${T.border}`,
                background: state.composing === 'forward' ? T.hover : 'transparent',
                color: T.text2, padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                fontSize: 11, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <Icon name="arrow-up-right" size={11} stroke={1.6} /> Forward
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => onDismiss(c.ch)}
              style={{
                appearance: 'none', border: `1px solid ${T.border}`,
                background: 'transparent',
                color: T.text3, padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                fontSize: 11, fontFamily: FONT,
              }}
            >
              Dismiss
            </button>
          </div>

          {state.composing === 'reply' && (
            <ReplyArea T={T} accent={accent} onSent={() => onSent(c.ch)} />
          )}
          {state.composing === 'forward' && (
            <ForwardArea T={T} accent={accent} onForwarded={() => onForwarded(c.ch)} />
          )}
        </div>
      )}
    </div>
  )
}

export function Inbox({ T, accent, density }: Common) {
  const [filter, setFilter] = useState<'all' | 'urgent'>('all')
  const [state, setState] = useState<InboxState>({
    expanded: null,
    composing: null,
    replied: new Set(),
    forwarded: new Set(),
    dismissed: new Set(),
  })
  const items = (filter === 'urgent' ? INBOX.filter(c => c.urgent) : INBOX).filter(c => !state.dismissed.has(c.ch))
  const urgentCount = INBOX.filter(c => c.urgent && !state.dismissed.has(c.ch)).length
  const totalCount = INBOX.filter(c => !state.dismissed.has(c.ch)).length
  const tabs: [typeof filter, string, number][] = [['all', 'All', totalCount], ['urgent', 'Urgent', urgentCount]]

  const toggleExpand = (ch: string) => setState(s => ({
    ...s,
    expanded: s.expanded === ch ? null : ch,
    composing: null,
  }))
  const compose = (mode: 'reply' | 'forward') => setState(s => ({
    ...s,
    composing: s.composing === mode ? null : mode,
  }))
  const markSent = (ch: string) => setState(s => {
    const next = new Set(s.replied); next.add(ch)
    return { ...s, replied: next, composing: null }
  })
  const markForwarded = (ch: string) => setState(s => {
    const next = new Set(s.forwarded); next.add(ch)
    return { ...s, forwarded: next, composing: null }
  })
  const dismiss = (ch: string) => setState(s => {
    const next = new Set(s.dismissed); next.add(ch)
    return { ...s, dismissed: next, expanded: s.expanded === ch ? null : s.expanded, composing: null }
  })

  return (
    <Card T={T} density={density} style={{ gridColumn: '6 / span 4' }}>
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
        {items.slice(0, 7).map((c, i) => (
          <InboxRow
            key={c.ch}
            T={T} accent={accent} c={c} first={i === 0}
            state={state}
            onToggle={toggleExpand}
            onCompose={compose}
            onSent={markSent}
            onForwarded={markForwarded}
            onDismiss={dismiss}
          />
        ))}
        {items.length === 0 && (
          <div style={{ padding: '20px 0', fontSize: 12, color: T.text3, textAlign: 'center', fontStyle: 'italic' }}>
            Inbox clear · {filter === 'urgent' ? 'no urgent items' : 'all messages handled'}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Squad availability ───────────────────────────────────────────────

export function Squad({ T, accent, density }: Common) {
  return (
    <Card T={T} density={density} style={{ gridColumn: '10 / span 3' }}>
      <SectionHead T={T} title="Squad availability" />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span className="tnum" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', color: T.text }}>16</span>
        <span style={{ fontSize: 11, color: T.text2 }}>/ 22 fit</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.bad }}>2 out · 1 doubt</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11,1fr)', gap: 4, marginBottom: 12 }}>
        {Array.from({ length: 22 }).map((_, i) => {
          const status = i < 16 ? 'ok' : i < 19 ? 'doubt' : i < 20 ? 'cleared' : 'out'
          const c = status === 'ok' ? T.good : status === 'doubt' ? T.warn : status === 'cleared' ? accent.hex : T.bad
          const initials = SQUAD_INITIALS[i] ?? '··'
          return (
            <div key={i} title={`${initials} · ${status}`}
              style={{
                aspectRatio: '1', borderRadius: 4, display: 'grid', placeItems: 'center',
                fontSize: 8.5, fontWeight: 600, fontFamily: FONT_MONO,
                color: status === 'ok' ? T.text : '#0E1014',
                background: status === 'ok' ? `${c}22` : c,
                border: `1px solid ${status === 'ok' ? `${c}55` : 'transparent'}`,
                cursor: 'pointer',
              }}>
              {initials}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {INJURIES.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 11.5, color: T.text, fontWeight: 500 }}>{p.name}</div>
            <div style={{ fontSize: 10.5, color: T.text3, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.issue}</div>
            <div className="tnum" style={{ fontSize: 10.5, color: p.status === 'cleared' ? T.good : T.warn, fontFamily: FONT_MONO }}>{p.back}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Fixtures ──────────────────────────────────────────────────────────

function FixtureCard({ T, accent, f, hot, onClick }: { T: ThemeTokens; accent: AccentTokens; f: Fixture; hot: boolean; onClick?: () => void }) {
  const [h, setH] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: 12, borderRadius: 10,
        background: hot ? accent.dim : T.panel2,
        border: `1px solid ${hot ? accent.border : T.border}`,
        display: 'flex', flexDirection: 'column', gap: 6,
        transform: h ? 'translateY(-2px)' : 'none',
        transition: 'transform .15s, border-color .12s', cursor: 'pointer',
        boxShadow: h ? T.cardShadow : 'none',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.text3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        <span>{f.day} {f.date}</span><span>{f.side}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>vs {f.opp}</div>
      <div style={{ fontSize: 11, color: T.text2 }}>{f.comp}</div>
      <div style={{ fontSize: 11, color: T.text3 }}>{f.venue}</div>
      <div className="tnum" style={{ fontSize: 11, color: hot ? accent.hex : T.text2, fontFamily: FONT_MONO, marginTop: 'auto' }}>{f.time}</div>
    </div>
  )
}

export function Fixtures({ T, accent, density, onPick }: Common & { onPick?: (f: Fixture) => void }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / span 7' }}>
      <SectionHead T={T} title="Upcoming fixtures" right={<>see all <Icon name="chevron-right" size={11} /></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {FIXTURES.map((f, i) => <FixtureCard key={i} T={T} accent={accent} f={f} hot={i === 0} onClick={() => onPick?.(f)} />)}
      </div>
    </Card>
  )
}

// ─── Performance signals ──────────────────────────────────────────────

export function Perf({ T, accent, density, gridColumn }: Common & { gridColumn?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: gridColumn ?? '8 / span 5' }}>
      <SectionHead T={T} title="Performance Intelligence" right={<span style={{ fontFamily: FONT_MONO }}>L7d</span>} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {PERF_INTEL.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
            <span className="tnum" style={{
              fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700,
              padding: '1px 5px', borderRadius: 3, minWidth: 18, textAlign: 'center',
              background: accent.dim, color: accent.hex,
            }}>{i + 1}</span>
            <div style={{ flex: 1, fontSize: 12, color: T.text, lineHeight: 1.4 }}>{p.txt}</div>
            {p.delta && <div className="tnum" style={{ fontSize: 11, fontFamily: FONT_MONO, color: p.delta.startsWith('-') || p.delta.startsWith('↓') ? T.bad : T.good }}>{p.delta}</div>}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Recents ───────────────────────────────────────────────────────────

const resTint = (T: ThemeTokens, r: 'W' | 'L' | 'D') => {
  if (r === 'W') return { bg: 'rgba(58,171,133,0.14)', fg: T.good }
  if (r === 'L') return { bg: 'rgba(199,90,90,0.12)',  fg: T.bad }
  return { bg: T.hover, fg: T.text2 }
}

export function Recents({ T, density }: Common) {
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / span 7' }}>
      <SectionHead T={T} title="Recent results · 1st XI" right={
        <div style={{ display: 'flex', gap: 4 }}>
          {RECENTS.map((m, i) => {
            const t = resTint(T, m.res)
            return (
              <span key={i} style={{
                width: 18, height: 18, borderRadius: 4, fontSize: 9.5, fontWeight: 700,
                display: 'grid', placeItems: 'center',
                background: t.bg, color: t.fg,
              }}>{m.res}</span>
            )
          })}
        </div>
      } />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {RECENTS.map((m, i) => {
          const t = resTint(T, m.res)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4, fontSize: 9.5, fontWeight: 700,
                display: 'grid', placeItems: 'center',
                background: t.bg, color: t.fg,
              }}>{m.res}</span>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, minWidth: 130 }}>{m.vs}</div>
              <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.text2, flex: 1 }}>{m.score}</div>
              <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{m.date}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Season standing ─────────────────────────────────────────────────

export function Season({ T, accent, density }: Common) {
  const s = ORG.season
  return (
    <Card T={T} density={density} style={{ gridColumn: '8 / span 5', display: 'flex', flexDirection: 'column' }}>
      <SectionHead T={T} title="Season standing" right={<span>{s.league}</span>} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Position</span>
        <span className="tnum" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.03em', color: accent.hex, fontFamily: FONT }}>
          2<span style={{ fontSize: 14, color: T.text3 }}>nd</span>
        </span>
        <span style={{ fontSize: 10.5, color: T.good, fontWeight: 600 }}>↑1</span>
        <span className="tnum" style={{ fontSize: 11, color: T.text3, marginLeft: 'auto', fontFamily: FONT_MONO }}>NRR +0.42</span>
      </div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
        {SEASON_FORM.map((r, i) => {
          const t = resTint(T, r)
          return (
            <div key={i} style={{
              flex: 1, height: 18, borderRadius: 3, display: 'grid', placeItems: 'center',
              fontSize: 9, fontWeight: 700, background: t.bg, color: t.fg,
            }}>{r}</div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.text2 }}>
        <span><span style={{ color: T.good }}>●</span> W {s.won}</span>
        <span><span style={{ color: T.text3 }}>●</span> D {s.drawn}</span>
        <span><span style={{ color: T.bad }}>●</span> L {s.lost}</span>
        <span style={{ color: T.text3 }}>P {s.played}</span>
      </div>
    </Card>
  )
}
