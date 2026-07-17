'use client'

import React from 'react'
import { TP_RED, TP_DARK } from '@/data/tenproject/demo-data'

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E7E2DC', borderRadius: 14, padding: 18, ...style }}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: TP_DARK, letterSpacing: 0.2 }}>{children}</div>
      {sub && <div style={{ fontSize: 12, color: '#6B6560', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card style={{ padding: '14px 16px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: accent ? TP_RED : TP_DARK }}>{value}</div>
      <div style={{ fontSize: 11.5, color: '#6B6560', marginTop: 2, fontWeight: 600 }}>{label}</div>
    </Card>
  )
}

export function Pill({ children, tone = 'grey' }: { children: React.ReactNode; tone?: 'red' | 'green' | 'amber' | 'grey' | 'dark' }) {
  const tones: Record<string, { bg: string; fg: string }> = {
    red: { bg: '#FDE8E8', fg: TP_RED },
    green: { bg: '#E5F5EA', fg: '#187A3C' },
    amber: { bg: '#FCF1DC', fg: '#9A6A0B' },
    grey: { bg: '#EFEBE6', fg: '#5B554F' },
    dark: { bg: TP_DARK, fg: '#fff' },
  }
  const t = tones[tone]
  return (
    <span style={{ background: t.bg, color: t.fg, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export function Thermometer({ raised, target, height = 22 }: { raised: number; target: number; height?: number }) {
  const pct = Math.min(100, Math.round((raised / target) * 100))
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: TP_DARK, marginBottom: 6 }}>
        <span>£{raised.toLocaleString()} raised</span>
        <span style={{ color: '#6B6560' }}>target £{target.toLocaleString()}</span>
      </div>
      <div style={{ background: '#EFEBE6', borderRadius: 999, height, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${TP_RED}, #F0524F)`, borderRadius: 999, transition: 'width .6s ease' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: pct > 55 ? '#fff' : TP_DARK }}>
          {pct}%
        </div>
      </div>
    </div>
  )
}

export function DemoBadge() {
  return (
    <span style={{ background: '#FDE8E8', color: TP_RED, border: `1px solid ${TP_RED}33`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, letterSpacing: 0.6 }}>
      DEMO DATA
    </span>
  )
}
