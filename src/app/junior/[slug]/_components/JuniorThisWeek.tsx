'use client'

// JuniorThisWeek — left slot in the dashboard's Row B (This week /
// Recent results / Performance signals). Extraction of the inline
// "This week" card that previously lived in page.tsx alongside
// "Outstanding items" in a 2-col Tailwind grid.
//
// Data is hardcoded inside the component for now — same 4 hand-written
// rows as the inline version, lifted verbatim. Future scope: accept an
// `items` prop sourced from a calendar feed.
//
// Theme-token Card + SectionHead inlined locally — same pattern as
// the other theme-token Junior cards. Row B uses gap: 8 + alignItems:
// stretch on the parent grid, matching the Women's three-column band
// convention.

import type { ReactNode, CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'

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

// ─── Data ──────────────────────────────────────────────────────────────

const THIS_WEEK_ROWS: Array<{ item: string; sub: string }> = [
  { item: 'U11 Lions — training',                sub: 'Tue 18:00 · Coach: M. Hutchings' },
  { item: 'U9 Tigers vs Harfield Juniors',       sub: 'Sat 09:30, H · Ref booked' },
  { item: 'Welfare check-in',                    sub: 'Wed 19:00 · All teams' },
  { item: 'Parent comms — match-day reminders',  sub: 'Auto-send Fri 17:00' },
]

// ─── Component ─────────────────────────────────────────────────────────

interface Props {
  T: ThemeTokens
  accent: AccentTokens
  density: Density
  style?: CSSProperties
}

export default function JuniorThisWeek({ T, density, style }: Props) {
  return (
    <Card T={T} density={density} style={style}>
      <SectionHead T={T} title="This week" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {THIS_WEEK_ROWS.map((row, i) => (
          <div
            key={row.item}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '8px 0',
              borderTop: i ? `1px solid ${T.border}` : 'none',
            }}
          >
            <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, minWidth: 0, flex: 1 }}>
              {row.item}
            </div>
            <div style={{ fontSize: 10.5, color: T.text3, flexShrink: 0 }}>
              {row.sub}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
