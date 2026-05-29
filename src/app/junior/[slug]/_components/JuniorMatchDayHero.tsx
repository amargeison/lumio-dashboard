'use client'

// Match-day hero for the Junior dashboard. Port of WfHeroToday from
// src/app/womens/[slug]/_components/WomensDashboardModules.tsx (lines
// 47–162) + the page.tsx wrapper (lines 5747–5780), rethemed Junior
// green and wired to the Junior data layer. Self-contained — owns the
// pinstripe pattern, ghost crest watermark, radial accent orb, the
// hero Card content, and the kick-off countdown.
//
// Data sources (read-only consumers of junior-dashboard-data + junior-
// quotes + junior-time):
//   - JUNIOR_ORG       — clubShort, date, season standing
//   - JUNIOR_NEXT_FIXTURE — opp, time, venue, comp, kickoffISO
//   - JUNIOR_SEASON_FORM — form W/D/L (first 5 rendered)
//   - JUNIOR_ACCENT    — green accent tokens
//   - getDayOfWeekQuote(JUNIOR_QUOTES) — day-of-week rotating quote
//   - computeCountdown(kickoffISO) — real-time countdown
//
// Theme tokens (ThemeTokens / Density / FONT / FONT_MONO / Icon) come
// from the shared cricket v2 surface — consumed across every sport
// portal, not unique to Women's. We are not modifying it.

import { useEffect, useState, type CSSProperties } from 'react'
import type { ThemeTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  JUNIOR_ACCENT,
  JUNIOR_ORG,
  JUNIOR_NEXT_FIXTURE,
  JUNIOR_SEASON_FORM,
} from '../_lib/junior-dashboard-data'
import { JUNIOR_QUOTES, getDayOfWeekQuote } from '../_lib/junior-quotes'
import { computeCountdown } from '../_lib/junior-time'

const pad2 = (n: number) => String(n).padStart(2, '0')

export type JuniorWeather = {
  tempC: number
  condition: string
  windMph: number
  windDir: string
}

interface Props {
  T: ThemeTokens
  density: Density
  greeting: string
  weather: JuniorWeather | null
  squadCount: number
  onTodaysBriefing: () => void
  onMatchdayOps: () => void
  onAsk: () => void
  /** Optional style override on the outer wrapper. Used by the dashboard
   *  to set `gridColumn: '1 / span 8'` when the hero sits in a 12-col
   *  row alongside JuniorTodayInset. Merged after the built-in styles,
   *  so callers can override margin / placement. */
  style?: CSSProperties
}

// Eyebrow takes only the last segment of the league string ("U11"),
// matching the spec — keeps the eyebrow concise. The age band is what
// the user cares about; "Surrey Youth League" is implicit context.
const ageBandLabel = JUNIOR_ORG.season.league.split('·').pop()?.trim() ?? JUNIOR_ORG.season.league
const formPreview  = JUNIOR_SEASON_FORM.slice(0, 5).join(' ')

export default function JuniorMatchDayHero({
  T, density, greeting, weather, squadCount,
  onTodaysBriefing, onMatchdayOps, onAsk, style,
}: Props) {
  // Real-time countdown — recomputes every second from the fixture
  // kickoffISO. Clamps to zero past kick-off so the label can swap
  // "TO KICK-OFF" → "KICK-OFF". Cleanup on unmount.
  const [counter, setCounter] = useState(() => computeCountdown(JUNIOR_NEXT_FIXTURE.kickoffISO))
  useEffect(() => {
    const id = setInterval(() => setCounter(computeCountdown(JUNIOR_NEXT_FIXTURE.kickoffISO)), 1000)
    return () => clearInterval(id)
  }, [])
  const atKickoff = counter.h === 0 && counter.m === 0 && counter.s === 0
  const countdownLabel = atKickoff ? 'KICK-OFF' : 'TO KICK-OFF'

  const quote = getDayOfWeekQuote(JUNIOR_QUOTES)

  // Weather null while open-meteo is in-flight or after an error —
  // render placeholder dashes rather than blank rows so the hero
  // doesn't visually collapse.
  const weatherLine = weather
    ? `${weather.tempC}° · ${weather.condition}`
    : '--° · loading'
  const windLine = weather
    ? `${weather.windMph} mph ${weather.windDir}`
    : '-- mph'

  return (
    // Outer wrapper — mirrors Women's page-level hero wrapper. Provides
    // the ~28px extra height needed to host the 180×180 ghost crest
    // without clipping; the inner Card alone is too short.
    <div
      style={{
        background: T.bg,
        color: T.text,
        fontFamily: FONT,
        padding: density.gap,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Ghost crest watermark — same asset Junior uses in the sidebar.
          Pro-pattern: absolute centre, 180×180, opacity 0.07,
          saturate/brightness wash to near-white, rotated -8deg. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/badges/oakridge_fc_crest.svg"
        alt=""
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%) rotate(-8deg)',
          width: 180, height: 180,
          objectFit: 'contain',
          opacity: 0.07,
          filter: 'saturate(0.2) brightness(3)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Inner hero Card — transparent background so the wrapper's ghost
          crest shows through. Border still draws so the hero retains a
          defined edge. Pinstripe SVG + radial orb live inside this Card
          (matching Women's layering). */}
      <div
        style={{
          position: 'relative',
          background: 'transparent',
          border: `1px solid ${T.border}`,
          borderRadius: density.radius,
          padding: `${density.pad}px ${density.pad + 4}px`,
          overflow: 'hidden',
          boxShadow: T.cardShadow,
        }}
      >
        {/* Diagonal pinstripe — same 44px diagonal pattern as Women's,
            wash strength depends on dark vs light theme. */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: T.isDark ? 0.10 : 0.05, pointerEvents: 'none' }}>
          <defs>
            <pattern id="jr-hero-ptn" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M0 44 L44 0" stroke={T.text} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jr-hero-ptn)" />
        </svg>

        {/* Top-right radial accent orb — Junior green dim. */}
        <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${JUNIOR_ACCENT.dim}, transparent 65%)`, pointerEvents: 'none' }} />

        {/* Bottom-center day-of-week quote. Warm gold #D4A056 — sport-
            neutral premium colour, doesn't compete with Junior green.
            Italic, single line, ellipsis if too long. */}
        <div
          style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            maxWidth: '65%', zIndex: 1, pointerEvents: 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: FONT, fontSize: 14, fontStyle: 'italic',
            color: '#D4A056', textAlign: 'center',
          }}
        >
          &ldquo;{quote.text}&rdquo;
          {quote.author && (
            <span style={{ opacity: 0.7, fontStyle: 'normal', fontFamily: FONT_MONO, marginLeft: 4 }}> — {quote.author}</span>
          )}
        </div>

        {/* Two-column content row. */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Eyebrow — greeting · age band · MD-N */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <span style={{ fontSize: 10, color: JUNIOR_ACCENT.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO }}>{greeting}</span>
              <span style={{ width: 1, height: 10, background: T.borderHi, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, color: T.text3, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: FONT_MONO, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ageBandLabel} · MD-{JUNIOR_NEXT_FIXTURE.matchday}
              </span>
            </div>

            {/* h1 — clubShort vs opp */}
            <h1 style={{ margin: 0, fontFamily: FONT, fontSize: density.h1 + 4, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {JUNIOR_ORG.clubShort} <span style={{ color: T.text3, fontWeight: 400 }}>vs</span> {JUNIOR_NEXT_FIXTURE.opp}
            </h1>

            {/* Meta row — all from data layer, no hardcoded strings. */}
            <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, color: T.text2, flexWrap: 'wrap' }}>
              <div><span style={{ color: T.text3 }}>Kick-off</span> <span className="tnum" style={{ color: T.text, fontFamily: FONT_MONO, marginLeft: 6 }}>{JUNIOR_NEXT_FIXTURE.time}</span></div>
              <div><span style={{ color: T.text3 }}>Venue</span> <span style={{ color: T.text, marginLeft: 6 }}>{JUNIOR_NEXT_FIXTURE.venue}</span></div>
              <div><span style={{ color: T.text3 }}>Squad</span> <span style={{ color: T.good, marginLeft: 6, fontWeight: 600 }}>{squadCount} named</span></div>
              <div><span style={{ color: T.text3 }}>League</span> <span style={{ color: T.text, marginLeft: 6, fontFamily: FONT_MONO }}>{JUNIOR_ORG.season.position} · {JUNIOR_ORG.season.points} pts</span></div>
              <div><span style={{ color: T.text3 }}>Form</span> <span style={{ color: T.text, marginLeft: 6, fontFamily: FONT_MONO }}>{formPreview}</span></div>
            </div>
          </div>

          {/* Right column — date, weather, wind, countdown. */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, color: T.text2, fontSize: 14 }}>
            <div className="tnum" style={{ color: T.text, fontSize: 21, fontWeight: 600, letterSpacing: '-0.01em' }}>{JUNIOR_ORG.date}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <Icon name="cloud" size={15} stroke={1.5} /> {weatherLine}
            </div>
            <div className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.warn, fontSize: 14 }}>
              <Icon name="cloud" size={15} stroke={1.5} /> {windLine}
            </div>
            <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 34, color: JUNIOR_ACCENT.hex, marginTop: 6, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {pad2(counter.h)}:{pad2(counter.m)}:{pad2(counter.s)}
            </div>
            <div style={{ fontSize: 10, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>{countdownLabel}</div>
          </div>
        </div>

        {/* Action buttons — Today's briefing (filled), Matchday ops
            (outline), Ask Lumio (outline). */}
        <div style={{ position: 'relative', display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            onClick={onTodaysBriefing}
            style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: JUNIOR_ACCENT.hex, color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <Icon name="sun" size={14} stroke={2} /> Today&apos;s briefing
          </button>
          <button
            onClick={onMatchdayOps}
            onMouseEnter={e => { e.currentTarget.style.borderColor = JUNIOR_ACCENT.hex; e.currentTarget.style.color = JUNIOR_ACCENT.hex }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;          e.currentTarget.style.color = T.text }}
            style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'border-color .12s, color .12s' }}
          >
            <Icon name="check" size={14} stroke={1.6} /> Matchday ops
          </button>
          <button
            onClick={onAsk}
            onMouseEnter={e => { e.currentTarget.style.borderColor = JUNIOR_ACCENT.hex; e.currentTarget.style.color = JUNIOR_ACCENT.hex }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;          e.currentTarget.style.color = T.text2 }}
            style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'border-color .12s, color .12s' }}
          >
            <Icon name="sparkles" size={14} stroke={1.6} /> Ask Lumio
          </button>
        </div>
      </div>
    </div>
  )
}
