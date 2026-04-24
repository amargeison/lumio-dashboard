'use client'

// Shared UI atoms used by multiple tabs — keeps per-tab files thin and
// the look consistent. All tokens come from ./tokens.

import type { CSSProperties } from 'react'
import { T, CARD, UPPER } from './tokens'

export function Card({ children, style, title, right }: { children: React.ReactNode; style?: CSSProperties; title?: string; right?: React.ReactNode }) {
  return (
    <section style={{ ...CARD, ...(style || {}) }}>
      {(title || right) && (
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {title && <h3 style={{ ...UPPER, margin: 0 }}>{title}</h3>}
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ ...CARD, padding: 16 }}>
      <div style={UPPER}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: T.ink, marginTop: 6, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.inkDim, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'red' | 'amber' | 'green' | 'teal' | 'blue' | 'purple' | 'neutral'; children: React.ReactNode }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    red:     { bg: 'rgba(239,68,68,0.16)',  fg: T.red },
    amber:   { bg: 'rgba(245,158,11,0.16)', fg: T.amber },
    green:   { bg: 'rgba(34,197,94,0.16)',  fg: T.green },
    teal:    { bg: 'rgba(20,184,166,0.16)', fg: T.teal },
    blue:    { bg: 'rgba(59,130,246,0.16)', fg: T.blue },
    purple:  { bg: 'rgba(139,92,246,0.16)', fg: T.purple },
    neutral: { bg: 'rgba(148,163,184,0.12)', fg: T.inkDim },
  }
  const p = palette[tone] ?? palette.neutral
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: p.bg, color: p.fg, lineHeight: 1.5 }}>
      {children}
    </span>
  )
}

export function SegControl<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: value === o.id ? T.teal : 'transparent',
            color: value === o.id ? '#03191a' : T.inkDim,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Donut({ segments, size = 160, center }: { segments: { value: number; color: string; label: string }[]; size?: number; center?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const R = size / 2 - 8
  const CX = size / 2
  const CY = size / 2
  const circ = 2 * Math.PI * R
  let offset = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <svg width={size} height={size}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={T.border} strokeWidth={16} />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ
          const dash = `${len} ${circ - len}`
          const el = (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={16}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          )
          offset += len
          return el
        })}
        {center && (
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize={18} fontWeight={700} fill={T.ink}>{center}</text>
        )}
      </svg>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12, color: T.inkDim }}>
        {segments.map((s, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, backgroundColor: s.color, borderRadius: 2, display: 'inline-block' }} />
            <span style={{ color: T.ink }}>{s.value.toLocaleString()}</span>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TableShell({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: scroll ? 'auto' : 'hidden', maxHeight: scroll ? 480 : undefined }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: T.ink }}>
        {children}
      </table>
    </div>
  )
}

export const th: CSSProperties = {
  ...UPPER,
  textAlign: 'left',
  padding: '10px 12px',
  position: 'sticky',
  top: 0,
  backgroundColor: T.panel,
  borderBottom: `1px solid ${T.border}`,
}

export const td: CSSProperties = {
  padding: '10px 12px',
  borderBottom: `1px solid ${T.border}`,
}
