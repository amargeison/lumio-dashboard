'use client'

// Performance Signals block for the Junior dashboard. Port of WfPerf
// from src/app/womens/[slug]/_components/WomensDashboardModules.tsx
// (lines 401–419), rethemed Junior green and re-positioned: Women's
// renders it as a 5-col grid slot beside the Fixtures module;
// Junior renders it as a standalone full-width card at the bottom
// of the Overview tab (after Recents + Squad Summary).
//
// Data: reads JUNIOR_PERF_INTEL from junior-dashboard-data.ts (six
// youth-football KPIs — equal participation, dev-band progression,
// parent highlight engagement, retention, charter compliance,
// training attendance).
//
// Row shape: dot (accent) + text (flex 1) + optional delta (mono,
// tone-coloured). Tone 'good' → T.good (green), 'bad' → T.bad
// (red), 'neutral' or undefined → T.text2.
//
// Card + SectionHead primitives inlined locally — mirrors the
// JuniorAIBriefingBox pattern and Women's own local-primitive
// convention.

import type { ReactNode, CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { JUNIOR_PERF_INTEL } from '../_lib/junior-dashboard-data'
// CSSProperties imported above is consumed by the optional `style` prop
// the dashboard uses to set gridColumn when this card sits in a 12-col row.

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

// ─── JuniorPerformanceSignals ──────────────────────────────────────────

interface Props {
  T: ThemeTokens
  accent: AccentTokens
  density: Density
  /** Optional style override merged onto the outer Card — used for
   *  gridColumn placement when this card sits inside a 12-col row. */
  style?: CSSProperties
}

export default function JuniorPerformanceSignals({ T, accent, density, style }: Props) {
  return (
    <Card T={T} density={density} style={style}>
      <SectionHead
        T={T}
        title="Performance signals"
        right={<span style={{ fontFamily: FONT_MONO }}>L7d</span>}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {JUNIOR_PERF_INTEL.map((p, i) => {
          const tone = p.tone === 'good' ? T.good : p.tone === 'bad' ? T.bad : T.text2
          return (
            <div
              key={p.txt}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                padding: '7px 0',
                borderTop: i ? `1px solid ${T.border}` : 'none',
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: accent.hex,
                  transform: 'translateY(-2px)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, fontSize: 12, color: T.text, lineHeight: 1.4 }}>{p.txt}</div>
              {p.delta && (
                <div
                  className="tnum"
                  style={{ fontSize: 11, fontFamily: FONT_MONO, color: tone }}
                >
                  {p.delta}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
