'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  BOXING_ORG, BOXING_NEXT_FIGHT, BOXING_TODAY, BOXING_AI_BRIEF,
  BOXING_INBOX, BOXING_TOP_STATS, BOXING_MY_TEAM, BOXING_PERF_INTEL,
  BOXING_RECENTS, BOXING_FORM_LAST5,
  type BoxingAIBriefItem, type BoxingTeamMember,
} from '../_lib/boxing-dashboard-data'

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

// ─── HeroToday ─────────────────────────────────────────────────────────
// Fight prep hero — countdown is in DAYS not hours (boxing uses fight-week
// not match-day cadence). Quote prop comes from the v1 BOXING_QUOTES system
// so the daily rotation persists.

export function HeroToday({
  T, accent, density, greeting, quote, onFightPrep, onAsk,
}: Common & {
  greeting: string
  quote?: { text: string; author: string }
  onFightPrep?: () => void
  onAsk?: () => void
}) {
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / span 8', overflow: 'hidden', padding: `${density.pad}px ${density.pad + 4}px` }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: T.isDark ? 0.10 : 0.05, pointerEvents: 'none' }}>
        <defs>
          <pattern id="boxing-hero-ptn" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M0 44 L44 0" stroke={T.text} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#boxing-hero-ptn)" />
      </svg>
      <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO }}>{greeting}</span>
            <span style={{ width: 1, height: 10, background: T.borderHi }} />
            <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_MONO }}>FIGHT CAMP · DAY {BOXING_ORG.camp.day}/{BOXING_ORG.camp.total} · {BOXING_NEXT_FIGHT.broadcast}</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: density.h1 + 4, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {BOXING_ORG.fighterFull} <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> {BOXING_NEXT_FIGHT.opponent}
          </h1>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, color: T.text2, flexWrap: 'wrap' }}>
            <div><span style={{ color: T.text3 }}>Venue</span> <span style={{ color: T.text, marginLeft: 6 }}>{BOXING_NEXT_FIGHT.venue}</span></div>
            <div><span style={{ color: T.text3 }}>Days</span> <span className="tnum" style={{ color: accent.hex, fontFamily: FONT_MONO, marginLeft: 6, fontWeight: 600 }}>{BOXING_NEXT_FIGHT.daysAway}</span></div>
            <div><span style={{ color: T.text3 }}>Match</span> <span style={{ color: T.text, marginLeft: 6 }}>WBC #{BOXING_ORG.rankings.wbc} vs {BOXING_NEXT_FIGHT.opponentRanking}</span></div>
            <div><span style={{ color: T.text3 }}>Form</span> <span style={{ color: T.text, marginLeft: 6, fontFamily: FONT_MONO }}>{BOXING_FORM_LAST5.join(' ')}</span></div>
          </div>
          {quote && (
            <div style={{ marginTop: 12, fontSize: 11.5, color: T.text2, fontStyle: 'italic', lineHeight: 1.5, maxWidth: 560 }}>
              &ldquo;{quote.text}&rdquo; <span style={{ color: T.text3, fontStyle: 'normal' }}>— {quote.author}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, color: T.text2, fontSize: 12 }}>
          <div className="tnum" style={{ color: T.text, fontSize: 13 }}>{BOXING_ORG.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cloud" size={13} stroke={1.5} /> 18° · {BOXING_NEXT_FIGHT.city}</div>
          <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 28, color: accent.hex, marginTop: 6, lineHeight: 1, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {BOXING_NEXT_FIGHT.daysAway}d
          </div>
          <div style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>TO FIGHT NIGHT</div>
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          onClick={onFightPrep}
          style={{
            appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9,
            background: accent.hex, color: T.btnText,
            fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            transition: 'background .15s, transform .1s',
          }}>
          <Icon name="note" size={14} stroke={2} /> Fight prep
        </button>
        <button
          onClick={onAsk}
          style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'border-color .12s, color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accent.hex; e.currentTarget.style.color = accent.hex }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;    e.currentTarget.style.color = T.text2 }}>
          <Icon name="sparkles" size={14} stroke={1.6} /> Ask Lumio
        </button>
      </div>
    </Card>
  )
}

// ─── FightCampStatus — boxing's signature VS card ──────────────────────
// Marcus Cole WBC #6 · VS · Viktor Petrov WBC #3, with weight cut, camp-day
// progress bar, ACWR. Preserved from v1 — one of boxing's most distinctive
// widgets.

export function FightCampStatus({ T, accent, density, column = '1 / span 8' }: Common & { column?: string }) {
  const campProgress = Math.round((BOXING_ORG.camp.day / BOXING_ORG.camp.total) * 100)
  const weightToCut  = (BOXING_ORG.weight.current - BOXING_ORG.weight.target).toFixed(1)
  return (
    <Card T={T} density={density} style={{ gridColumn: column }}>
      <SectionHead
        T={T}
        title={<><Icon name="trophy" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2, display: 'inline-block' }} />Fight Camp Status</>}
        right={<span style={{ fontFamily: FONT_MONO, color: accent.hex, fontWeight: 600 }}>{BOXING_NEXT_FIGHT.daysAway} DAYS</span>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 14, padding: '8px 4px' }}>
        {/* Marcus */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: accent.dim, border: `2px solid ${accent.border}`,
            display: 'grid', placeItems: 'center', margin: '0 auto 8px',
            fontSize: 17, fontWeight: 700, color: accent.hex, fontFamily: FONT_MONO,
          }}>MC</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{BOXING_ORG.fighterFull}</div>
          <div style={{ fontSize: 11, color: accent.hex, fontFamily: FONT_MONO, fontWeight: 600 }}>WBC #{BOXING_ORG.rankings.wbc}</div>
          <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2 }}>{BOXING_ORG.record.wins}-{BOXING_ORG.record.losses} ({BOXING_ORG.record.ko} KO)</div>
        </div>
        {/* VS */}
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
          <div className="tnum" style={{ fontSize: 28, fontWeight: 700, color: T.text4, fontFamily: FONT_MONO, letterSpacing: '0.04em' }}>VS</div>
          <div style={{ fontSize: 10, color: T.text3, marginTop: 4, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>{BOXING_NEXT_FIGHT.city.toUpperCase()}</div>
          <div style={{ fontSize: 10, color: T.good, marginTop: 2, fontFamily: FONT_MONO }}>ACWR {BOXING_NEXT_FIGHT.acwr.toFixed(2)} · OPTIMAL</div>
        </div>
        {/* Petrov */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: T.hover, border: `2px solid ${T.border}`,
            display: 'grid', placeItems: 'center', margin: '0 auto 8px',
            fontSize: 17, fontWeight: 700, color: T.text2, fontFamily: FONT_MONO,
          }}>VP</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{BOXING_NEXT_FIGHT.opponent}</div>
          <div style={{ fontSize: 11, color: T.text2, fontFamily: FONT_MONO, fontWeight: 600 }}>{BOXING_NEXT_FIGHT.opponentRanking}</div>
          <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2 }}>Mandatory challenger</div>
        </div>
      </div>

      {/* Weight + Camp progress */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: 9.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5, fontFamily: FONT_MONO }}>Weight</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="tnum" style={{ fontSize: 18, fontWeight: 600, color: T.text, fontFamily: FONT_MONO }}>{BOXING_ORG.weight.current}{BOXING_ORG.weight.unit}</span>
            <Icon name="arrow-up-right" size={11} stroke={1.5} style={{ color: T.text3, transform: 'rotate(45deg)' }} />
            <span className="tnum" style={{ fontSize: 13, color: T.good, fontFamily: FONT_MONO }}>{BOXING_ORG.weight.target}{BOXING_ORG.weight.unit}</span>
            <span style={{ fontSize: 10.5, color: T.text3, marginLeft: 'auto' }}>−{weightToCut}{BOXING_ORG.weight.unit} to cut · {BOXING_NEXT_FIGHT.weightCutPerDay}{BOXING_ORG.weight.unit}/day</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5, fontFamily: FONT_MONO, display: 'flex', alignItems: 'center' }}>
            <span>Camp Day</span>
            <span className="tnum" style={{ marginLeft: 'auto', color: accent.hex, fontFamily: FONT_MONO, letterSpacing: 0 }}>{BOXING_ORG.camp.day}/{BOXING_ORG.camp.total} · {campProgress}%</span>
          </div>
          <div style={{ width: '100%', height: 6, background: T.hover, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${campProgress}%`, height: '100%', background: accent.hex, borderRadius: 999, transition: 'width 250ms ease' }} />
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── TodaySchedule ─────────────────────────────────────────────────────

export function TodaySchedule({ T, accent, density }: Common) {
  return (
    <Card T={T} density={density} hover style={{ gridColumn: '9 / span 4' }}>
      <SectionHead T={T} title="Today" right={<span className="tnum" style={{ fontFamily: FONT_MONO }}>{BOXING_ORG.date.split(',')[0]}</span>} />
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 49, top: 6, bottom: 6, width: 1, background: T.border }} />
        {BOXING_TODAY.map((it, i) => (
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
  const tiles = BOXING_TOP_STATS.map(s => ({
    label: s.label, value: s.value, sub: s.sub,
    dot: s.tone === 'urgent' ? T.bad
      : s.tone === 'warn'   ? T.warn
      : s.tone === 'danger' ? T.bad
      : s.tone === 'ok'     ? T.good
      : accent.hex,
  }))
  return (
    <div style={{ display: 'flex', gap: density.gap }}>
      {tiles.map((s, i) => (
        <Card key={i} T={T} density={density} hover style={{ flex: 1, padding: density.pad - 2 }}>
          <div style={{ position: 'absolute', top: density.pad - 2, right: density.pad, width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
          <div style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <div className="tnum" style={{ fontSize: 22, fontWeight: 500, color: T.text, letterSpacing: '-0.02em', fontFamily: FONT_MONO }}>{s.value}</div>
          </div>
          <div style={{ fontSize: 11, color: T.text2, marginTop: 2 }}>{s.sub}</div>
        </Card>
      ))}
    </div>
  )
}

// ─── AIBrief ───────────────────────────────────────────────────────────

const BRIEF_TAG_ICON: Record<BoxingAIBriefItem['tag'], string> = {
  fight: 'flag', weight: 'wave', training: 'lightning',
  medical: 'medical', sponsor: 'briefcase', op: 'plane',
}

export function AIBrief({ T, accent, density, label, onAsk, column = '1 / span 5' }: Common & { label: string; onAsk?: () => void; column?: string }) {
  const [items, setItems] = useState<(BoxingAIBriefItem & { dismissed?: boolean })[]>(BOXING_AI_BRIEF.map(x => ({ ...x })))
  const visible = items.filter(x => !x.dismissed)
  return (
    <Card T={T} density={density} style={{ gridColumn: column }}>
      <SectionHead
        T={T}
        title={<><Icon name="sparkles" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2, display: 'inline-block' }} />{label}</>}
        right={<>
          <span style={{ fontFamily: FONT_MONO }}>generated 06:42</span>
          {onAsk && (
            <button onClick={onAsk} style={{ marginLeft: 8, appearance: 'none', border: 0, background: 'transparent', color: accent.hex, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontFamily: FONT }}>Ask →</button>
          )}
        </>}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visible.map((it, i) => (
          <div key={it.txt} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
            <div style={{
              fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4,
              background: it.pri === 'high' ? 'rgba(239,68,68,0.10)' : T.hover,
              color: it.pri === 'high' ? T.bad : T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <Icon name={BRIEF_TAG_ICON[it.tag]} size={10} stroke={1.6} />{it.tag}
            </div>
            <div style={{ flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>{it.txt}</div>
            <button
              onClick={() => setItems(arr => arr.map(x => x.txt === it.txt ? { ...x, dismissed: true } : x))}
              style={{ background: 'transparent', border: 0, color: T.text3, cursor: 'pointer', padding: 2, borderRadius: 3 }}
              title="Dismiss">
              <Icon name="check" size={12} stroke={1.8} />
            </button>
          </div>
        ))}
        {visible.length === 0 && <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>All clear · briefing for tomorrow at 06:00.</div>}
      </div>
    </Card>
  )
}

// ─── MyTeam — corner team list ─────────────────────────────────────────

const TONE_HEX: Record<BoxingTeamMember['tone'], string> = {
  red:    '#ef4444',
  orange: '#F97316',
  amber:  '#F59E0B',
  cyan:   '#06B6D4',
  green:  '#22C55E',
  pink:   '#EC4899',
  purple: '#8B5CF6',
}

export function MyTeam({ T, accent, density, column = '9 / span 4' }: Common & { column?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: column }}>
      <SectionHead T={T} title="My Team" right={<span style={{ fontFamily: FONT_MONO }}>{BOXING_MY_TEAM.length}</span>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {BOXING_MY_TEAM.map(m => {
          const c = TONE_HEX[m.tone]
          return (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 0' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: `${c}22`, color: c,
                display: 'grid', placeItems: 'center',
                fontSize: 9.5, fontWeight: 700, fontFamily: FONT_MONO,
                flexShrink: 0,
              }}>{m.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, color: T.text, fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.status}</div>
              </div>
              <div style={{ fontSize: 9.5, color: c, fontFamily: FONT_MONO, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>{m.role.split(' ')[0]}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Performance signals ──────────────────────────────────────────────

export function Perf({ T, accent, density, column = '1 / span 7' }: Common & { column?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: column }}>
      <SectionHead T={T} title="Performance signals" right={<span style={{ fontFamily: FONT_MONO }}>L7d</span>} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {BOXING_PERF_INTEL.map((p, i) => {
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

// ─── Recents — last 5 fights ──────────────────────────────────────────

const resTint = (T: ThemeTokens, r: 'W' | 'L' | 'D') => {
  if (r === 'W') return { bg: 'rgba(58,171,133,0.14)', fg: T.good }
  if (r === 'L') return { bg: 'rgba(199,90,90,0.12)',  fg: T.bad }
  return { bg: T.hover, fg: T.text2 }
}

export function Recents({ T, density, column = '1 / span 7' }: Common & { column?: string }) {
  return (
    <Card T={T} density={density} style={{ gridColumn: column }}>
      <SectionHead T={T} title="Recent fights" right={
        <div style={{ display: 'flex', gap: 4 }}>
          {BOXING_RECENTS.map((m, i) => {
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
        {BOXING_RECENTS.map((m, i) => {
          const t = resTint(T, m.res)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4, fontSize: 9.5, fontWeight: 700,
                display: 'grid', placeItems: 'center',
                background: t.bg, color: t.fg,
              }}>{m.res}</span>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, minWidth: 110 }}>vs {m.vs}</div>
              <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: T.text2, flex: 1 }}>{m.method}</div>
              <div className="tnum" style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{m.date}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── PhotoFrame — preserved family/inspiration photo widget ─────────────
// Reads/writes its image to localStorage (lumio_boxing_photo) so the user's
// uploaded photo persists across sessions and matches the v1 placement.

export function PhotoFrame({ T, accent, density, column = '8 / span 5' }: Common & { column?: string }) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)
  const [photoFit, setPhotoFit] = useState<'cover' | 'contain'>('cover')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setPhotoSrc(localStorage.getItem('lumio_boxing_photo'))
      const fit = localStorage.getItem('lumio_boxing_photo_fit') as 'cover' | 'contain' | null
      if (fit) setPhotoFit(fit)
    } catch { /* private mode etc */ }
  }, [])

  const onFile = (file: File) => {
    const canvas = document.createElement('canvas')
    canvas.width = 400; canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 400, 400)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      setPhotoSrc(dataUrl)
      try { localStorage.setItem('lumio_boxing_photo', dataUrl) } catch {}
    }
    img.src = URL.createObjectURL(file)
  }

  return (
    <Card T={T} density={density} style={{ gridColumn: column }}>
      <SectionHead T={T} title={<><Icon name="people" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2, display: 'inline-block' }} />Personal Photo Frame</>}
        right={<>
          <button onClick={() => {
            const next = photoFit === 'cover' ? 'contain' : 'cover'
            setPhotoFit(next)
            try { localStorage.setItem('lumio_boxing_photo_fit', next) } catch {}
          }} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 10.5, padding: '2px 4px', fontFamily: FONT }}>
            {photoFit === 'cover' ? 'Fit' : 'Fill'}
          </button>
          {photoSrc && (
            <button onClick={() => { setPhotoSrc(null); try { localStorage.removeItem('lumio_boxing_photo') } catch {} }}
              style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 10.5, padding: '2px 4px', fontFamily: FONT }}>
              Remove
            </button>
          )}
          <button onClick={() => inputRef.current?.click()}
            style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, cursor: 'pointer', fontSize: 10.5, padding: '2px 4px', fontFamily: FONT, fontWeight: 600 }}>
            + Add
          </button>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
        </>}
      />
      <div style={{
        height: 180, borderRadius: 10, overflow: 'hidden',
        background: photoSrc ? T.panel2 : `linear-gradient(135deg, ${accent.dim}, ${T.panel2})`,
        border: `1px solid ${T.border}`,
        display: 'grid', placeItems: 'center',
      }}>
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: photoFit }} />
        ) : (
          <div style={{ textAlign: 'center', color: T.text3 }}>
            <Icon name="people" size={28} stroke={1.4} style={{ marginBottom: 6, color: accent.hex }} />
            <div style={{ fontSize: 12 }}>Add a photo — family, holidays, inspiration</div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── FightBriefPanel — slide-over fight intelligence brief ────────────
// Marcus Cole vs Viktor Petrov dossier. Document-style content matching the
// cricket MatchBriefPanel pattern; sections supplied by the spec.

export function FightBriefPanel({ T, accent, open, onClose }: { T: ThemeTokens; accent: AccentTokens; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', zIndex: 80 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(640px, 100vw)',
        background: T.bg, color: T.text, fontFamily: FONT,
        borderLeft: `1px solid ${T.borderHi}`,
        zIndex: 81, overflowY: 'auto',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: T.bg, zIndex: 1, padding: '20px 28px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO, marginBottom: 6 }}>Fight Brief</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {BOXING_ORG.fighterFull} <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> {BOXING_NEXT_FIGHT.opponent}
              </h2>
              <div style={{ fontSize: 11.5, color: T.text2, marginTop: 6, fontFamily: FONT_MONO }}>WBC #{BOXING_ORG.rankings.wbc} vs {BOXING_NEXT_FIGHT.opponentRanking} · Heavyweight</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2, fontFamily: FONT_MONO }}>{BOXING_NEXT_FIGHT.venue}, {BOXING_NEXT_FIGHT.city} · {BOXING_NEXT_FIGHT.daysAway} days · {BOXING_NEXT_FIGHT.broadcast}</div>
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: FONT }}>
              esc
            </button>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px' }}>
          <Section T={T} accent={accent} num={1} title="Fight Details">
            <Row T={T} k="Date"      v={`${BOXING_NEXT_FIGHT.daysAway} days away · fight night TBC`} />
            <Row T={T} k="Venue"     v={`${BOXING_NEXT_FIGHT.venue}, ${BOXING_NEXT_FIGHT.city}`} />
            <Row T={T} k="Broadcast" v={`${BOXING_NEXT_FIGHT.broadcast} · global pay-per-view`} />
            <Row T={T} k="Purse"     v="W: £1.2M · L: £360k · upside on KO bonus + PPV percentage" accent={accent} />
            <Row T={T} k="Sanction"  v="WBC eliminator · winner becomes mandatory challenger" />
          </Section>

          <Section T={T} accent={accent} num={2} title="Opponent Analysis — Viktor Petrov">
            <Row T={T} k="Record"   v="24-1 (18 KO) · WBC #3 · former interim champion" />
            <Row T={T} k="KO rate"  v="75% — among the highest in the division. First 6 rounds especially." />
            <SubHead T={T}>Strengths</SubHead>
            <Bullet T={T} accent={accent}
              title="Right hand on the counter"
              body="His KO weapon. 14 of 18 stoppages came from a counter right after a feint. Drops opponents who jab tall."
            />
            <Bullet T={T} accent={accent}
              title="High jab output — early rounds"
              body="42 jabs/round through round 5 — highest in the division. Sets up everything else off the lead hand."
            />
            <SubHead T={T}>Weaknesses</SubHead>
            <Bullet T={T} tone="good"
              title="Body shot vulnerability"
              body="Drops his right elbow when he loads the counter. Leaves the liver and floating ribs exposed for 2-3 frames."
            />
            <Bullet T={T} tone="good"
              title="Late-round fade"
              body="Output drops 34% rounds 8-12. Conditioning peaks early. Only 2 of his 25 fights have gone past round 10."
            />
            <Row T={T} k="Round-by-round" v="Aggressive R1-3 · sets pace R4-6 · cruise mode R7-9 · fades R10+" />
          </Section>

          <Section T={T} accent={accent} num={3} title="Our Game Plan">
            <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Work the body early — establish liver shot R2-3 to bank fade insurance.',
                'Avoid the right counter — slip outside, no straight retreats. Pivot off the lead foot.',
                'Pressure into rounds 9-10 — target stoppage window when he fades.',
                'Use the jab as a measuring stick, not a weapon — keep him cautious.',
                'Body-head pattern: 3-2 to the body, lead with hooks not crosses.',
              ].map((line, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 12.5, color: T.text, lineHeight: 1.5 }}>
                  <span className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 11, color: accent.hex, fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section T={T} accent={accent} num={4} title="Weight & Conditioning">
            <Row T={T} k="Cut timeline" v={`${BOXING_ORG.weight.current}${BOXING_ORG.weight.unit} → ${BOXING_ORG.weight.target}${BOXING_ORG.weight.unit} target · ${BOXING_NEXT_FIGHT.weightCutPerDay}${BOXING_ORG.weight.unit}/day`} />
            <Row T={T} k="ACWR"         v={`${BOXING_NEXT_FIGHT.acwr.toFixed(2)} — optimal zone, load ramping correctly`} accent={accent} />
            <Row T={T} k="Power"        v="Sparring power output up 8% over last 5 sessions, +3% vs season average" />
            <Row T={T} k="Risk"         v="Round 9-12 work rate dipped 4% vs earlier camps — Ricky adding 2nd interval block Thursday" />
          </Section>

          <Section T={T} accent={accent} num={5} title="Fight Week Logistics" last>
            <Row T={T} k="Hotel"      v="Canary Wharf Marriott · 4 nights · corner team suites adjoining" />
            <Row T={T} k="Flights"    v="BA LHR→LCY confirmed for Jim, Tony, Ricky · Marcus arrives Mon 9" />
            <Row T={T} k="Media"      v="DAZN interview prep today · talking points by 14:00 · pre-fight presser Thursday" />
            <Row T={T} k="Weigh-in"   v="Day before fight, 14:00 · scale check 12:00 · Crown Park media room" />
            <Row T={T} k="Glove check" v="Morning of fight · BBBofC commission · gloves pre-approved by both camps" />
          </Section>

          <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${T.border}`, fontSize: 10.5, color: T.text3, textAlign: 'center', fontFamily: FONT_MONO, letterSpacing: '0.04em' }}>
            Generated by Lumio · Fight intelligence · Confidential
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Brief panel sub-components (mirror cricket MatchBriefPanel) ───────

function Section({
  T, accent, num, title, children, last,
}: {
  T: ThemeTokens; accent: AccentTokens; num: number; title: string; children: ReactNode; last?: boolean
}) {
  return (
    <section style={{ padding: '22px 0', borderBottom: last ? 'none' : `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <span className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: accent.hex, letterSpacing: '0.06em', fontWeight: 700 }}>§{num}</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text, letterSpacing: '-0.005em' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </section>
  )
}

function Row({ T, k, v, accent }: { T: ThemeTokens; k: string; v: string; accent?: AccentTokens }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, alignItems: 'baseline' }}>
      <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT_MONO }}>{k}</div>
      <div style={{
        fontSize: 12.5, color: accent ? T.text : T.text2, lineHeight: 1.5,
        fontWeight: accent ? 500 : 400,
        borderLeft: accent ? `2px solid ${accent.hex}` : 'none',
        paddingLeft: accent ? 10 : 0,
      }}>
        {v}
      </div>
    </div>
  )
}

function SubHead({ T, children }: { T: ThemeTokens; children: ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: FONT_MONO, marginTop: 4, marginBottom: 2 }}>
      {children}
    </div>
  )
}

function Bullet({ T, accent, tone, title, body }: {
  T: ThemeTokens; accent?: AccentTokens; tone?: 'good' | 'warn' | 'bad';
  title: string; body: string
}) {
  const tint = tone === 'good' ? T.good : tone === 'warn' ? T.warn : tone === 'bad' ? T.bad : (accent?.hex ?? T.text)
  return (
    <div style={{ borderLeft: `2px solid ${tint}`, paddingLeft: 12 }}>
      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>{body}</div>
    </div>
  )
}
