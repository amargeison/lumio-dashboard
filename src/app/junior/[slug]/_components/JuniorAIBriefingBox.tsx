'use client'

// AI Briefing Box for the Junior dashboard. Port of WfAIBrief from
// src/app/womens/[slug]/_components/WomensDashboardModules.tsx (lines
// 212–245), rethemed Junior green and re-positioned: Women's renders
// it as a 4-col grid slot inside the Today three-column row; Junior
// renders it as a standalone full-width card at the top of the
// Overview tab content.
//
// Data: reads JUNIOR_AI_BRIEF from junior-dashboard-data.ts directly
// (same tag/pri/txt shape — Squad / Training / Safeguarding / Welfare
// / Compliance / Comms).
//
// Time-of-day label retained:
//   hour < 12 → "AI Morning Summary"
//   12 – 16  → "AI Afternoon Briefing"
//   17 +     → "AI Evening Briefing"
//
// Card + SectionHead primitives are inlined locally (mirrors the
// Women's module's own pattern — they own a local Card too). Keeps
// this component self-contained without a shared-primitive file.

import { useState, type ReactNode, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { JUNIOR_AI_BRIEF, type JuniorAIBriefItem } from '../_lib/junior-dashboard-data'

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

// ─── JuniorAIBriefingBox ───────────────────────────────────────────────

interface Props {
  T: ThemeTokens
  accent: AccentTokens
  density: Density
  onAsk?: () => void
  /** Optional style override merged onto the outer Card. Used by the
   *  dashboard to set `gridColumn` when the box sits in a 12-col row. */
  style?: CSSProperties
}

export default function JuniorAIBriefingBox({ T, accent, density, onAsk, style }: Props) {
  // Local dismissed state — matches Women's pattern. Resets on remount
  // (e.g. user navigates away from Today and back).
  const [items, setItems] = useState<(JuniorAIBriefItem & { dismissed?: boolean })[]>(
    JUNIOR_AI_BRIEF.map(x => ({ ...x })),
  )
  const visible = items.filter(x => !x.dismissed)

  const hour = new Date().getHours()
  const label = hour < 12 ? 'AI Morning Summary' : hour < 17 ? 'AI Afternoon Briefing' : 'AI Evening Briefing'

  return (
    <Card T={T} density={density} style={style}>
      <SectionHead
        T={T}
        title={<>
          <Icon name="sparkles" size={13} stroke={1.5} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2, display: 'inline-block' }} />
          {label}
        </>}
        right={<>
          <span style={{ fontFamily: FONT_MONO }}>generated 06:42</span>
          {onAsk && (
            <button
              onClick={onAsk}
              style={{ marginLeft: 8, appearance: 'none', border: 0, background: 'transparent', color: accent.hex, cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontFamily: FONT }}
            >
              Ask →
            </button>
          )}
        </>}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visible.map((it, i) => (
          <div
            key={it.txt}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '8px 0',
              borderTop: i ? `1px solid ${T.border}` : 'none',
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontFamily: FONT_MONO,
                padding: '2px 6px',
                borderRadius: 4,
                background: it.pri === 'high' ? 'rgba(199,90,90,0.10)' : T.hover,
                color: it.pri === 'high' ? T.bad : T.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 1,
              }}
            >
              {it.tag}
            </div>
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
        {visible.length === 0 && (
          <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', padding: '14px 0' }}>
            All clear · briefing for tomorrow at 06:00.
          </div>
        )}
      </div>
    </Card>
  )
}
