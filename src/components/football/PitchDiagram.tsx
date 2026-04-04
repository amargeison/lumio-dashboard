'use client'

import React from 'react'

// ─── Shared SVG Pitch Diagram Components ────────────────────────────────────
// Top-down football pitch with white markings on green
// Used by all three portal tiers for set piece diagrams

const PITCH_GREEN = '#2D5A1B'
const PITCH_LINES = '#ffffff'
const ATK_COLOR = '#F1C40F'   // gold — attacking players
const DEF_COLOR = '#C0392B'   // red — defending players
const BALL_COLOR = '#ffffff'
const ARROW_COLOR = '#ffffff'

// ─── Full Pitch SVG (top-down, goal at top) ─────────────────────────────────

interface PitchProps {
  width?: number
  height?: number
  children?: React.ReactNode
  /** Show only attacking half (goal at top) */
  halfPitch?: boolean
  className?: string
}

export function PitchSVG({ width = 320, height = 440, children, halfPitch = false, className }: PitchProps) {
  const vbH = halfPitch ? 260 : 500
  return (
    <svg
      width="100%"
      viewBox={`0 0 340 ${vbH}`}
      className={className}
      style={{ maxWidth: width, maxHeight: height }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pitch background */}
      <rect x="0" y="0" width="340" height={vbH} fill={PITCH_GREEN} rx="4" />

      {/* Pitch outline */}
      <rect x="20" y="20" width="300" height={vbH - 40} fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />

      {/* Centre line */}
      {!halfPitch && <line x1="20" y1={vbH / 2} x2="320" y2={vbH / 2} stroke={PITCH_LINES} strokeWidth="1.5" />}

      {/* Centre circle */}
      {!halfPitch && <circle cx="170" cy={vbH / 2} r="45" fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />}
      {!halfPitch && <circle cx="170" cy={vbH / 2} r="2" fill={PITCH_LINES} />}

      {/* Top goal area (attacking end) */}
      {/* Penalty box */}
      <rect x="70" y="20" width="200" height="90" fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
      {/* 6-yard box */}
      <rect x="115" y="20" width="110" height="35" fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
      {/* Penalty spot */}
      <circle cx="170" cy="80" r="2" fill={PITCH_LINES} />
      {/* Penalty arc */}
      <path d="M 130 110 A 45 45 0 0 0 210 110" fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
      {/* Goal */}
      <rect x="140" y="10" width="60" height="10" fill="none" stroke={PITCH_LINES} strokeWidth="2" />

      {/* Corner arcs top */}
      <path d="M 20 28 A 8 8 0 0 0 28 20" fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
      <path d="M 312 20 A 8 8 0 0 0 320 28" fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />

      {!halfPitch && <>
        {/* Bottom goal area */}
        <rect x="70" y={vbH - 110} width="200" height="90" fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
        <rect x="115" y={vbH - 55} width="110" height="35" fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
        <circle cx="170" cy={vbH - 80} r="2" fill={PITCH_LINES} />
        <path d={`M 130 ${vbH - 110} A 45 45 0 0 1 210 ${vbH - 110}`} fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
        <rect x="140" y={vbH - 20} width="60" height="10" fill="none" stroke={PITCH_LINES} strokeWidth="2" />
        <path d={`M 20 ${vbH - 28} A 8 8 0 0 1 28 ${vbH - 20}`} fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
        <path d={`M 312 ${vbH - 20} A 8 8 0 0 1 320 ${vbH - 28}`} fill="none" stroke={PITCH_LINES} strokeWidth="1.5" />
      </>}

      {halfPitch && <>
        {/* Halfway line at bottom */}
        <line x1="20" y1={vbH - 20} x2="320" y2={vbH - 20} stroke={PITCH_LINES} strokeWidth="1.5" />
        <circle cx="170" cy={vbH - 20} r="2" fill={PITCH_LINES} />
      </>}

      {children}
    </svg>
  )
}

// ─── Player circle ──────────────────────────────────────────────────────────

interface PlayerDotProps {
  x: number
  y: number
  label?: string | number
  type?: 'attack' | 'defend' | 'ball' | 'gk'
  size?: number
}

export function PlayerDot({ x, y, label, type = 'attack', size = 14 }: PlayerDotProps) {
  const fill = type === 'attack' ? ATK_COLOR : type === 'defend' ? DEF_COLOR : type === 'gk' ? '#3B82F6' : BALL_COLOR
  const textColor = type === 'ball' ? '#000' : '#000'
  const r = type === 'ball' ? size * 0.5 : size * 0.65
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} stroke={type === 'ball' ? '#ccc' : '#000'} strokeWidth={type === 'ball' ? 1 : 0.8} />
      {label !== undefined && (
        <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
          fill={textColor} fontSize={size * 0.6} fontWeight="bold" fontFamily="system-ui">
          {label}
        </text>
      )}
    </g>
  )
}

// ─── Movement arrow (dashed) ────────────────────────────────────────────────

interface ArrowProps {
  x1: number; y1: number; x2: number; y2: number
  dashed?: boolean
  color?: string
  curved?: boolean
  /** Control point for curve (offset from midpoint) */
  curveOffset?: { dx: number; dy: number }
}

export function MovementArrow({ x1, y1, x2, y2, dashed = true, color = ARROW_COLOR, curved = false, curveOffset }: ArrowProps) {
  const id = `arrow-${x1}-${y1}-${x2}-${y2}`
  if (curved && curveOffset) {
    const mx = (x1 + x2) / 2 + curveOffset.dx
    const my = (y1 + y2) / 2 + curveOffset.dy
    return (
      <g>
        <defs>
          <marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill={color} />
          </marker>
        </defs>
        <path
          d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth="1.5"
          strokeDasharray={dashed ? '5,4' : undefined}
          markerEnd={`url(#${id})`}
        />
      </g>
    )
  }
  return (
    <g>
      <defs>
        <marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth="1.5"
        strokeDasharray={dashed ? '5,4' : undefined}
        markerEnd={`url(#${id})`}
      />
    </g>
  )
}

// ─── Ball flight arc (solid) ────────────────────────────────────────────────

interface BallFlightProps {
  x1: number; y1: number; x2: number; y2: number
  /** Control point for curve */
  cx: number; cy: number
  color?: string
}

export function BallFlight({ x1, y1, x2, y2, cx, cy, color = '#fff' }: BallFlightProps) {
  const id = `bf-${x1}-${y1}-${x2}-${y2}`
  return (
    <g>
      <defs>
        <marker id={id} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M 0 0 L 5 2.5 L 0 5 Z" fill={color} />
        </marker>
      </defs>
      <path
        d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
        fill="none" stroke={color} strokeWidth="2" strokeDasharray="3,3"
        markerEnd={`url(#${id})`} opacity={0.8}
      />
    </g>
  )
}

// ─── Zone highlight ─────────────────────────────────────────────────────────

interface ZoneHighlightProps {
  x: number; y: number; width: number; height: number
  color?: string
  opacity?: number
}

export function ZoneHighlight({ x, y, width, height, color = ATK_COLOR, opacity = 0.15 }: ZoneHighlightProps) {
  return <rect x={x} y={y} width={width} height={height} fill={color} opacity={opacity} rx="2" />
}

// ─── Text label on pitch ────────────────────────────────────────────────────

interface PitchLabelProps {
  x: number; y: number; text: string; color?: string; size?: number
}

export function PitchLabel({ x, y, text, color = '#fff', size = 9 }: PitchLabelProps) {
  return (
    <text x={x} y={y} textAnchor="middle" fill={color} fontSize={size} fontWeight="600" fontFamily="system-ui" opacity={0.8}>
      {text}
    </text>
  )
}

// ─── Marking connecting line (for man-marking diagrams) ─────────────────────

export function MarkingLine({ x1, y1, x2, y2, color = '#94A3B8' }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity={0.6} />
}

// ─── Wall (group of defenders in a line) ────────────────────────────────────

interface WallProps {
  x: number; y: number; count: number; spacing?: number; color?: string
}

export function DefensiveWall({ x, y, count, spacing = 12 }: WallProps) {
  const startX = x - ((count - 1) * spacing) / 2
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <PlayerDot key={i} x={startX + i * spacing} y={y} type="defend" size={11} />
      ))}
    </g>
  )
}

// ─── Corner flag ────────────────────────────────────────────────────────────

export function CornerFlag({ side }: { side: 'left' | 'right' }) {
  const x = side === 'left' ? 20 : 320
  return (
    <g>
      <line x1={x} y1={20} x2={x} y2={8} stroke="#F1C40F" strokeWidth="1.5" />
      <polygon points={`${x},8 ${x + (side === 'left' ? 6 : -6)},11 ${x},14`} fill="#F1C40F" />
    </g>
  )
}

// ─── Throw-in position marker ───────────────────────────────────────────────

export function ThrowInMarker({ x, y, side }: { x: number; y: number; side: 'left' | 'right' }) {
  return (
    <g>
      <circle cx={x} cy={y} r="7" fill={ATK_COLOR} stroke="#000" strokeWidth="0.8" />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill="#000" fontSize="7" fontWeight="bold">T</text>
      <MovementArrow x1={x} y1={y} x2={side === 'left' ? x + 30 : x - 30} y2={y - 15} dashed />
    </g>
  )
}
