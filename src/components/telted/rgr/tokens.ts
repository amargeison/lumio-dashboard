import type { CSSProperties } from 'react'

// Design tokens for the RGR dashboard — mirror the HTML reference.
// Kept separate so every tab uses the same palette without cross-importing.

export const T = {
  bg:      '#0b1518',
  panel:   '#132428',
  panel2:  '#16292e',
  border:  '#1f3a40',
  ink:     '#e7f4f5',
  inkDim:  '#9db5b8',
  inkMute: '#6d8588',
  teal:    '#14b8a6',
  amber:   '#f59e0b',
  red:     '#ef4444',
  green:   '#22c55e',
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  neutral: '#475569',
} as const

export const CARD: CSSProperties = {
  backgroundColor: T.panel,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: 18,
}

export const UPPER: CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: 10.5,
  color: T.inkMute,
  fontWeight: 600,
}

// Student / engagement → colour
export const RAG_COLOR: Record<string, string> = {
  red: T.red, amber: T.amber, green: T.green,
}
