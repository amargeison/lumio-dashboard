'use client'

// JuniorOutstandingItems — right slot in the dashboard's Row A (Inbox /
// AI Briefing / Outstanding items). Extraction of the inline
// "Outstanding items" card that previously lived in page.tsx alongside
// "This week" in a 2-col Tailwind grid.
//
// Receives the computed status values from TodayView (kpis + charter +
// consentColor + dbsColor) as props rather than recomputing them — the
// dashboard already has them in scope.
//
// Theme-token Card + SectionHead inlined locally. Status-pill colour
// mapping matches the standard Junior tone convention: green = good /
// amber = warn / red = bad. Per-row labels differ semantically (OK vs
// Achieved vs On track) so the mapping is row-aware.

import type { ReactNode, CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'

type StatusColor = 'green' | 'amber' | 'red'

interface JuniorKPIsShape {
  consentsCurrent: number
  consentsTotal: number
  dbsCurrent: number
  dbsTotal: number
}

interface CharterShape {
  label: string
  color: StatusColor
}

interface Props {
  T: ThemeTokens
  accent: AccentTokens
  density: Density
  kpis: JuniorKPIsShape
  charter: CharterShape
  consentColor: StatusColor
  dbsColor: StatusColor
  style?: CSSProperties
}

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

// ─── Pill styling ──────────────────────────────────────────────────────

function pillStyle(T: ThemeTokens, color: StatusColor): CSSProperties {
  const map: Record<StatusColor, { bg: string; fg: string }> = {
    green: { bg: 'rgba(58,171,133,0.14)', fg: T.good },
    amber: { bg: 'rgba(245,158,11,0.16)', fg: T.warn },
    red:   { bg: 'rgba(199,90,90,0.12)',  fg: T.bad  },
  }
  const tone = map[color]
  return {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 999,
    background: tone.bg,
    color: tone.fg,
    flexShrink: 0,
    letterSpacing: '0.04em',
  }
}

const CONSENT_LABEL:  Record<StatusColor, string> = { green: 'On track',    amber: 'Chase due',   red: 'Action needed' }
const DBS_LABEL:      Record<StatusColor, string> = { green: 'OK',          amber: 'Review',      red: 'Urgent'        }
const CHARTER_LABEL:  Record<StatusColor, string> = { green: 'Achieved',    amber: 'In progress', red: 'Not entered'   }

// ─── Component ─────────────────────────────────────────────────────────

export default function JuniorOutstandingItems({ T, density, kpis, charter, consentColor, dbsColor, style }: Props) {
  const consentsOutstanding = Math.max(0, kpis.consentsTotal - kpis.consentsCurrent)

  return (
    <Card T={T} density={density} style={style}>
      <SectionHead T={T} title="Outstanding items" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Row
          T={T}
          first
          label={`${consentsOutstanding} consent renewals outstanding`}
          pill={{ text: CONSENT_LABEL[consentColor], style: pillStyle(T, consentColor) }}
        />
        <Row
          T={T}
          label={`DBS renewals — ${kpis.dbsCurrent}/${kpis.dbsTotal} current`}
          pill={{ text: DBS_LABEL[dbsColor], style: pillStyle(T, dbsColor) }}
        />
        <Row
          T={T}
          label={`FA Charter — ${charter.label}`}
          pill={{ text: CHARTER_LABEL[charter.color], style: pillStyle(T, charter.color) }}
        />
        <Row
          T={T}
          label="Welfare flags"
          pill={{
            text: 'No open flags',
            style: {
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 999,
              background: T.hover,
              color: T.text3,
              flexShrink: 0,
              letterSpacing: '0.04em',
            },
          }}
        />
      </div>
    </Card>
  )
}

function Row({
  T, label, pill, first,
}: { T: ThemeTokens; label: string; pill: { text: string; style: CSSProperties }; first?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 0',
        borderTop: first ? 'none' : `1px solid ${T.border}`,
      }}
    >
      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500, minWidth: 0, flex: 1 }}>
        {label}
      </div>
      <span style={pill.style}>{pill.text}</span>
    </div>
  )
}
