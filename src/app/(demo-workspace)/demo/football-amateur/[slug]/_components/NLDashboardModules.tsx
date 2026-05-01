'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  NL_ORG, NL_FIXTURES, NL_TODAY, NL_AI_BRIEF, NL_INBOX,
  NL_INJURIES, NL_RECENTS, NL_PERF_INTEL, NL_SEASON_FORM,
  NL_TOP_STATS, NL_SQUAD,
  type NlAIBriefItem, type NlInboxChannel, type NlFixture, type NlPlayerSlot,
} from '../_lib/nl-dashboard-data'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

export function Card({ T, density, children, style, hover, onClick }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
  const [h, setH] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        position: 'relative', background: T.panel,
        border: `1px solid ${h && hover ? T.borderHi : T.border}`,
        borderRadius: density.radius, padding: density.pad,
        boxShadow: T.cardShadow, transition: 'border-color .12s, transform .12s',
        transform: h && hover ? 'translateY(-1px)' : 'none',
        cursor: onClick ? 'pointer' : 'default', ...style,
      }}>{children}</div>
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
  T, accent, density, greeting, onTodaysBriefing, onMatchdayOps, onAsk,
}: Common & { greeting: string; onTodaysBriefing?: () => void; onMatchdayOps?: () => void; onAsk?: () => void }) {
  const f = NL_FIXTURES[0]
  const [counter, setCounter]     = useState({ h: 6, m: 47, s: 12 })

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
          <pattern id="nl-hero-ptn" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M0 44 L44 0" stroke={T.text} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nl-hero-ptn)" />
      </svg>
      <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO }}>{greeting}</span>
            <span style={{ width: 1, height: 10, background: T.borderHi }} />
            <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_MONO }}>{f.comp} · MD-{NL_ORG.season.played + 1}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: accent.hex, fontFamily: FONT_MONO, padding: '2px 8px', borderRadius: 4, background: accent.dim, border: `1px solid ${accent.border}`, fontWeight: 700, letterSpacing: '0.1em' }}>{NL_ORG.formation}</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: density.h1 + 4, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {NL_ORG.clubShort} <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> {f.opp}
          </h1>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, color: T.text2, flexWrap: 'wrap' }}>
            <div><span style={{ color: T.text3 }}>Kick-off</span> <span className="tnum" style={{ color: T.text, fontFamily: FONT_MONO, marginLeft: 6 }}>{f.time}</span></div>
            <div><span style={{ color: T.text3 }}>Ground</span> <span style={{ color: T.text, marginLeft: 6 }}>{NL_ORG.ground}</span></div>
            <div><span style={{ color: T.text3 }}>League</span> <span style={{ color: T.text, marginLeft: 6, fontFamily: FONT_MONO }}>5th · 49 pts</span></div>
            <div><span style={{ color: T.text3 }}>Form</span> <span style={{ color: T.text, marginLeft: 6, fontFamily: FONT_MONO }}>W L W D W</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, color: T.text2, fontSize: 12 }}>
          <div className="tnum" style={{ color: T.text, fontSize: 13 }}>{NL_ORG.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cloud" size={13} stroke={1.5} /> 11° · heavy rain</div>
          <div className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.warn }}>
            <Icon name="cloud" size={13} stroke={1.5} /> Pitch inspect 09:00
          </div>
          <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 18, color: accent.hex, marginTop: 6 }}>
            {pad2(counter.h)}:{pad2(counter.m)}:{pad2(counter.s)}
          </div>
          <div style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>TO KICK-OFF</div>
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button onClick={onTodaysBriefing}
          style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="sun" size={14} stroke={2} /> Today&apos;s briefing
        </button>
        <button onClick={onMatchdayOps}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accent.hex; e.currentTarget.style.color = accent.hex }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;    e.currentTarget.style.color = T.text }}
          style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'border-color .12s, color .12s' }}>
          <Icon name="check" size={14} stroke={1.6} /> Matchday ops
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

export function TodaySchedule({ T, accent, density }: Common) {
  return (
    <Card T={T} density={density} hover style={{ gridColumn: '9 / span 4' }}>
      <SectionHead T={T} title="Today" right={<span className="tnum" style={{ fontFamily: FONT_MONO }}>{NL_ORG.date.split(',')[1]?.trim() ?? NL_ORG.date}</span>} />
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 49, top: 6, bottom: 6, width: 1, background: T.border }} />
        {NL_TODAY.map((it, i) => (
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
  const tiles = NL_TOP_STATS.map(s => ({
    label: s.label, value: s.value, sub: s.sub,
    dot: s.tone === 'urgent' ? T.bad : s.tone === 'warn' ? T.warn : s.tone === 'danger' ? T.bad : s.tone === 'ok' ? T.good : accent.hex,
  }))
  return (
    <div style={{ display: 'flex', gap: density.gap }}>
      {tiles.map((s, i) => (
        <Card key={i} T={T} density={density} hover style={{ flex: 1, padding: density.pad - 2 }}>
          <div style={{ position: 'absolute', top: density.pad - 2, right: density.pad, width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
          <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: T.text, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.text2 }}>{s.sub}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── AIBrief ───────────────────────────────────────────────────────────

export function AIBrief({ T, accent, density, onAsk }: Common & { onAsk?: () => void }) {
  const [items, setItems] = useState<(NlAIBriefItem & { dismissed?: boolean })[]>(NL_AI_BRIEF.map(x => ({ ...x })))
  const visible = items.filter(x => !x.dismissed)
  const hour = new Date().getHours()
  const label = hour < 12 ? 'AI Morning Summary' : hour < 17 ? 'AI Afternoon Briefing' : 'AI Evening Briefing'
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / span 5' }}>
      <SectionHead T={T}
        title={<><Icon name="sparkles" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2, display: 'inline-block' }} />{label}</>}
        right={<>
          <span style={{ fontFamily: FONT_MONO }}>generated 06:42</span>
          {onAsk && <button onClick={onAsk} style={{ marginLeft: 8, appearance: 'none', border: 0, background: 'transparent', color: accent.hex, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontFamily: FONT }}>Ask →</button>}
        </>}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visible.map((it, i) => (
          <div key={it.txt} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
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

// ─── Inbox (basic, non-interactive) ─────────────────────────────────────

function InboxRow({ T, c, first }: { T: ThemeTokens; c: NlInboxChannel; first: boolean }) {
  const [h, setH] = useState(false)
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', margin: '0 -4px', borderRadius: 6, borderTop: first ? 'none' : `1px solid ${T.border}`, background: h ? T.hover : 'transparent', cursor: 'pointer' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.urgent ? T.bad : T.text4 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{c.ch}</div>
        <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</div>
      </div>
      <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{c.time}</div>
      <div className="tnum" style={{ minWidth: 22, height: 18, padding: '0 6px', borderRadius: 9, display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, background: c.urgent ? 'rgba(199,90,90,0.12)' : T.hover, color: c.urgent ? T.bad : T.text2 }}>{c.count}</div>
    </div>
  )
}

export function Inbox({ T, density }: Common) {
  const [filter, setFilter] = useState<'all' | 'urgent'>('all')
  const items = filter === 'urgent' ? NL_INBOX.filter(c => c.urgent) : NL_INBOX
  const tabs: [typeof filter, string, number][] = [['all', 'All', NL_INBOX.length], ['urgent', 'Urgent', NL_INBOX.filter(c => c.urgent).length]]
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
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 240, overflow: 'auto' }}>
        {items.slice(0, 7).map((c, i) => <InboxRow key={c.ch} T={T} c={c} first={i === 0} />)}
      </div>
    </Card>
  )
}

// ─── Squad availability — GK / DEF / MID / FWD ────────────────────────

function SquadCell({ T, accent, slot }: { T: ThemeTokens; accent: AccentTokens; slot: NlPlayerSlot }) {
  const status = slot.status
  const c = status === 'ok' ? T.good : status === 'doubt' ? T.warn : status === 'cleared' ? accent.hex : T.bad
  return (
    <div title={`${slot.num}. ${slot.name} · ${slot.pos} · ${status}`}
      style={{
        position: 'relative', aspectRatio: '1', borderRadius: 4, display: 'grid', placeItems: 'center',
        fontSize: 8.5, fontWeight: 600, fontFamily: FONT_MONO,
        color: status === 'ok' ? T.text : '#0E1014',
        background: status === 'ok' ? `${c}22` : c,
        border: `1px solid ${status === 'ok' ? `${c}55` : 'transparent'}`,
        cursor: 'pointer',
      }}>
      <span style={{ position: 'absolute', top: 1, left: 2, fontSize: 7, color: status === 'ok' ? T.text3 : '#0E1014', opacity: 0.7 }}>{slot.num}</span>
      {slot.initials}
    </div>
  )
}

export function Squad({ T, accent, density }: Common) {
  const out = NL_SQUAD.filter(p => p.status === 'out').length
  const doubt = NL_SQUAD.filter(p => p.status === 'doubt').length
  const fit = NL_SQUAD.length - out - doubt
  const gk  = NL_SQUAD.filter(s => s.group === 'gk')
  const def = NL_SQUAD.filter(s => s.group === 'def')
  const mid = NL_SQUAD.filter(s => s.group === 'mid')
  const fwd = NL_SQUAD.filter(s => s.group === 'fwd')

  const Group = ({ label, players, cols }: { label: string; players: NlPlayerSlot[]; cols: number }) => (
    <>
      <div style={{ fontSize: 9, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 3, marginBottom: 8 }}>
        {players.map(s => <SquadCell key={s.num} T={T} accent={accent} slot={s} />)}
      </div>
    </>
  )

  return (
    <Card T={T} density={density} style={{ gridColumn: '10 / span 3' }}>
      <SectionHead T={T} title="Squad availability" />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span className="tnum" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', color: T.text }}>{fit}</span>
        <span style={{ fontSize: 11, color: T.text2 }}>/ {NL_SQUAD.length} fit</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: out + doubt > 0 ? T.bad : T.text3 }}>{out} out · {doubt} doubt</span>
      </div>
      <Group label="GK"  players={gk}  cols={6} />
      <Group label="DEF" players={def} cols={6} />
      <Group label="MID" players={mid} cols={7} />
      <Group label="FWD" players={fwd} cols={5} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {NL_INJURIES.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 11.5, color: T.text, fontWeight: 500 }}>{p.name}</div>
            <div style={{ fontSize: 10.5, color: T.text3, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.issue}</div>
            <div className="tnum" style={{ fontSize: 10.5, color: T.warn, fontFamily: FONT_MONO }}>{p.back}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Fixtures ──────────────────────────────────────────────────────────

function FixtureCard({ T, accent, f, hot, onClick }: { T: ThemeTokens; accent: AccentTokens; f: NlFixture; hot: boolean; onClick?: () => void }) {
  const [h, setH] = useState(false)
  const compTone = f.competitionTone === 'cup' ? T.warn : accent.hex
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: 12, borderRadius: 10,
        background: hot ? accent.dim : T.panel2,
        border: `1px solid ${hot ? accent.border : T.border}`,
        display: 'flex', flexDirection: 'column', gap: 6,
        transform: h ? 'translateY(-2px)' : 'none',
        transition: 'transform .15s, border-color .12s', cursor: 'pointer',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.text3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        <span>{f.day} {f.date}</span>
        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${compTone}22`, color: compTone, fontWeight: 700, letterSpacing: '0.06em' }}>{f.competitionTone === 'cup' ? 'CUP' : 'LGE'}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>vs {f.opp}</div>
      <div style={{ fontSize: 11, color: T.text2 }}>{f.comp}</div>
      <div style={{ fontSize: 11, color: T.text3 }}>{f.venue}</div>
      <div className="tnum" style={{ fontSize: 11, color: hot ? accent.hex : T.text2, fontFamily: FONT_MONO, marginTop: 'auto' }}>{f.time}</div>
    </div>
  )
}

export function Fixtures({ T, accent, density, onPick }: Common & { onPick?: (f: NlFixture) => void }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / span 7' }}>
      <SectionHead T={T} title="Upcoming fixtures" right={<>see all <Icon name="chevron-right" size={11} /></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {NL_FIXTURES.slice(0, 4).map((f, i) => <FixtureCard key={i} T={T} accent={accent} f={f} hot={i === 0} onClick={() => onPick?.(f)} />)}
      </div>
    </Card>
  )
}

// ─── Performance signals ──────────────────────────────────────────────

export function Perf({ T, accent, density }: Common) {
  return (
    <Card T={T} density={density} style={{ gridColumn: '8 / span 5' }}>
      <SectionHead T={T} title="Performance signals" right={<span style={{ fontFamily: FONT_MONO }}>L7d</span>} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {NL_PERF_INTEL.map((p, i) => {
          const tone = p.tone === 'good' ? T.good : p.tone === 'bad' ? T.bad : T.text2
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: accent.hex, transform: 'translateY(-2px)' }} />
              <div style={{ flex: 1, fontSize: 12, color: T.text, lineHeight: 1.4 }}>{p.txt}</div>
              {p.delta && <div className="tnum" style={{ fontSize: 11, fontFamily: FONT_MONO, color: tone }}>{p.delta}</div>}
            </div>
          )
        })}
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
      <SectionHead T={T} title="Recent results · 1st team" right={
        <div style={{ display: 'flex', gap: 4 }}>
          {NL_RECENTS.map((m, i) => {
            const t = resTint(T, m.res)
            return <span key={i} style={{ width: 18, height: 18, borderRadius: 4, fontSize: 9.5, fontWeight: 700, display: 'grid', placeItems: 'center', background: t.bg, color: t.fg }}>{m.res}</span>
          })}
        </div>
      } />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {NL_RECENTS.map((m, i) => {
          const t = resTint(T, m.res)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, fontSize: 9.5, fontWeight: 700, display: 'grid', placeItems: 'center', background: t.bg, color: t.fg }}>{m.res}</span>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, minWidth: 130 }}>{m.vs}</div>
              <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.text2, flex: 1 }}>{m.score}</div>
              <div style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO, padding: '1px 5px', borderRadius: 3, background: T.hover, letterSpacing: '0.04em' }}>{m.comp}</div>
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
  const s = NL_ORG.season
  const pos = s.position as number
  const posSuffix = pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'
  return (
    <Card T={T} density={density} style={{ gridColumn: '8 / span 5', display: 'flex', flexDirection: 'column' }}>
      <SectionHead T={T} title="Season standing" right={<span>{s.league}</span>} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Position</span>
        <span className="tnum" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.03em', color: accent.hex, fontFamily: FONT }}>
          {pos}<span style={{ fontSize: 14, color: T.text3 }}>{posSuffix}</span>
        </span>
        <span style={{ fontSize: 10.5, color: T.good, fontWeight: 600 }}>↑1</span>
        <span className="tnum" style={{ fontSize: 11, color: T.text3, marginLeft: 'auto', fontFamily: FONT_MONO }}>{s.points} pts · GD {s.gd}</span>
      </div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
        {NL_SEASON_FORM.map((r, i) => {
          const t = resTint(T, r)
          return <div key={i} style={{ flex: 1, height: 18, borderRadius: 3, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, background: t.bg, color: t.fg }}>{r}</div>
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
