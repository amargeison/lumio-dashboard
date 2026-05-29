'use client'

// Today inset for the Junior dashboard hero row. Port of TodaySchedule
// from src/app/(demo-workspace)/demo/football-amateur/[slug]/_components/
// NLDashboardModules.tsx (lines 126–145), rethemed Junior green.
//
// Sits to the right of JuniorMatchDayHero in the 12-col hero row, at
// gridColumn '9 / span 4' (set internally so the dashboard wrapper
// doesn't need a per-slot style override).
//
// Visual: vertical timeline rail with one dot per JUNIOR_TODAY_SCHEDULE
// entry. The row carrying `highlight: true` gets the accent treatment
// (filled dot + accent time + bolder `what`). Static — no live "what
// time is it now" computation.

import { type ReactNode, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { JUNIOR_ORG, JUNIOR_TODAY_SCHEDULE } from '../_lib/junior-dashboard-data'

// ─── Local primitives ──────────────────────────────────────────────────

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

// ─── JuniorTodayInset ──────────────────────────────────────────────────

interface Props {
  T: ThemeTokens
  accent: AccentTokens
  density: Density
}

// Extract date fragment after the weekday comma — matches Non-League's
// header convention. "Sat, 24 May 2026" → "24 May 2026". Falls back to
// the full string if the date isn't comma-separated.
const dateFragment = JUNIOR_ORG.date.split(',')[1]?.trim() ?? JUNIOR_ORG.date

export default function JuniorTodayInset({ T, accent, density }: Props) {
  return (
    <Card T={T} density={density} style={{ gridColumn: '9 / span 4' }}>
      <SectionHead
        T={T}
        title="Today"
        right={<span className="tnum" style={{ fontFamily: FONT_MONO }}>{dateFragment}</span>}
      />
      <div style={{ position: 'relative' }}>
        {/* Vertical timeline rail. */}
        <div
          style={{
            position: 'absolute',
            left: 49,
            top: 6,
            bottom: 6,
            width: 1,
            background: T.border,
          }}
        />
        {JUNIOR_TODAY_SCHEDULE.map((it, i) => (
          <div
            key={`${it.time}-${it.what}-${i}`}
            style={{ position: 'relative', display: 'flex', gap: 14, padding: '6px 0' }}
          >
            <div
              className="tnum"
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: it.highlight ? accent.hex : T.text3,
                width: 44,
                paddingTop: 2,
              }}
            >
              {it.time}
            </div>
            {/* Dot on the rail. Filled for the highlighted row, hollow
                with borderHi outline otherwise. */}
            <div
              style={{
                position: 'absolute',
                left: 46,
                top: 9,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: it.highlight ? accent.hex : T.panel,
                border: `1.5px solid ${it.highlight ? accent.hex : T.borderHi}`,
              }}
            />
            <div style={{ flex: 1, paddingLeft: 14 }}>
              <div
                style={{
                  fontSize: 12.5,
                  color: T.text,
                  fontWeight: it.highlight ? 600 : 500,
                }}
              >
                {it.what}
              </div>
              <div style={{ fontSize: 10.5, color: T.text3 }}>{it.where}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
