'use client'

import React, { useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

export type InjurySeverity = 'serious' | 'moderate' | 'minor' | 'doubtful' | 'recovered'
export type BodyZone =
  // Front zones
  | 'head' | 'neck'
  | 'left-shoulder' | 'right-shoulder'
  | 'left-chest' | 'right-chest'
  | 'left-forearm' | 'right-forearm'
  | 'left-hand' | 'right-hand'
  | 'abdomen' | 'groin'
  | 'left-quad' | 'right-quad'
  | 'left-knee' | 'right-knee'
  | 'left-shin' | 'right-shin'
  | 'left-ankle' | 'right-ankle'
  | 'left-foot' | 'right-foot'
  // Back zones
  | 'upper-back' | 'lower-back'
  | 'left-shoulder-blade' | 'right-shoulder-blade'
  | 'left-glute' | 'right-glute'
  | 'left-hamstring' | 'right-hamstring'
  | 'left-calf' | 'right-calf'
  | 'left-achilles' | 'right-achilles'

export type BodySide = 'front' | 'back'

export interface InjuryMarker {
  playerName: string
  injuryType: string
  bodyPart: string
  zone: BodyZone
  side: BodySide
  severity: InjurySeverity
  expectedReturn: string
  weeksRemaining: number
}

export interface FootballBodyMapProps {
  injuries: InjuryMarker[]
  size?: 'mini' | 'small' | 'large'
  /** If set, only this player's dots are shown at full opacity; others are dimmed */
  highlightPlayer?: string | null
  /** Show the colour legend below the map */
  showLegend?: boolean
  /** Show player filter buttons */
  showFilter?: boolean
  className?: string
}

// ─── Severity config ────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<InjurySeverity, { color: string; label: string; pulse: boolean; dotScale: number }> = {
  serious:   { color: '#C0392B', label: 'Serious (6w+)',  pulse: true,  dotScale: 1 },
  moderate:  { color: '#E67E22', label: 'Moderate (2–6w)', pulse: true,  dotScale: 1 },
  minor:     { color: '#F1C40F', label: 'Minor (<2w)',     pulse: true,  dotScale: 1 },
  doubtful:  { color: '#8E44AD', label: 'Doubtful',        pulse: true,  dotScale: 1 },
  recovered: { color: '#27AE60', label: 'Returning',       pulse: false, dotScale: 0.7 },
}

// ─── Anatomical zone coordinates ────────────────────────────────────────────
// Coordinates are relative to a 120x220 viewBox per figure

const ZONE_COORDS: Record<BodyZone, Record<BodySide, { x: number; y: number } | null>> = {
  // Front zones
  'head':             { front: { x: 60, y: 18 },  back: null },
  'neck':             { front: { x: 60, y: 36 },  back: null },
  'left-shoulder':    { front: { x: 34, y: 50 },  back: null },
  'right-shoulder':   { front: { x: 86, y: 50 },  back: null },
  'left-chest':       { front: { x: 44, y: 62 },  back: null },
  'right-chest':      { front: { x: 76, y: 62 },  back: null },
  'left-forearm':     { front: { x: 22, y: 90 },  back: null },
  'right-forearm':    { front: { x: 98, y: 90 },  back: null },
  'left-hand':        { front: { x: 16, y: 112 }, back: null },
  'right-hand':       { front: { x: 104, y: 112 }, back: null },
  'abdomen':          { front: { x: 60, y: 80 },  back: null },
  'groin':            { front: { x: 60, y: 100 }, back: null },
  'left-quad':        { front: { x: 48, y: 120 }, back: null },
  'right-quad':       { front: { x: 72, y: 120 }, back: null },
  'left-knee':        { front: { x: 48, y: 142 }, back: null },
  'right-knee':       { front: { x: 72, y: 142 }, back: null },
  'left-shin':        { front: { x: 48, y: 164 }, back: null },
  'right-shin':       { front: { x: 72, y: 164 }, back: null },
  'left-ankle':       { front: { x: 46, y: 188 }, back: null },
  'right-ankle':      { front: { x: 74, y: 188 }, back: null },
  'left-foot':        { front: { x: 44, y: 202 }, back: null },
  'right-foot':       { front: { x: 76, y: 202 }, back: null },
  // Back zones
  'upper-back':           { front: null, back: { x: 60, y: 58 } },
  'lower-back':           { front: null, back: { x: 60, y: 82 } },
  'left-shoulder-blade':  { front: null, back: { x: 42, y: 58 } },
  'right-shoulder-blade': { front: null, back: { x: 78, y: 58 } },
  'left-glute':           { front: null, back: { x: 48, y: 102 } },
  'right-glute':          { front: null, back: { x: 72, y: 102 } },
  'left-hamstring':       { front: null, back: { x: 48, y: 126 } },
  'right-hamstring':      { front: null, back: { x: 72, y: 126 } },
  'left-calf':            { front: null, back: { x: 48, y: 162 } },
  'right-calf':           { front: null, back: { x: 72, y: 162 } },
  'left-achilles':        { front: null, back: { x: 46, y: 186 } },
  'right-achilles':       { front: null, back: { x: 74, y: 186 } },
}

// ─── SVG Silhouette paths ───────────────────────────────────────────────────

const FRONT_BODY_PATH = `
  M 60 8
  C 52 8, 46 12, 46 20
  C 46 28, 52 32, 60 32
  C 68 32, 74 28, 74 20
  C 74 12, 68 8, 60 8
  Z
  M 56 33 L 52 36 L 48 36 L 42 38
  C 36 40, 28 44, 24 50
  L 18 68 L 14 78 L 12 88
  C 10 96, 12 104, 14 110
  L 16 116 L 18 112
  L 22 96 L 28 80
  L 32 72 L 36 62
  L 40 54 L 44 48
  L 48 44 L 52 40
  L 56 38 L 56 33
  Z
  M 64 33 L 68 36 L 72 36 L 78 38
  C 84 40, 92 44, 96 50
  L 102 68 L 106 78 L 108 88
  C 110 96, 108 104, 106 110
  L 104 116 L 102 112
  L 98 96 L 92 80
  L 88 72 L 84 62
  L 80 54 L 76 48
  L 72 44 L 68 40
  L 64 38 L 64 33
  Z
  M 52 36 L 56 38 L 56 56
  L 54 66 L 50 76 L 48 86
  L 46 96 L 46 100
  L 50 100 L 54 96
  L 58 86 L 60 76
  L 62 86 L 66 96
  L 70 100 L 74 100
  L 74 96 L 72 86
  L 70 76 L 66 66
  L 64 56 L 64 38
  L 68 36
  L 72 36
  L 72 38 L 74 42
  L 76 46 L 78 50
  M 42 38
  L 48 42 L 46 46
  L 44 50
  M 46 100
  L 44 108 L 42 116
  L 42 126 L 42 134
  L 42 142 L 42 150
  L 44 158 L 44 166
  L 44 174 L 42 182
  L 40 190 L 38 196
  L 36 202 L 36 208
  L 40 210 L 46 210
  L 50 208 L 52 204
  L 52 196 L 50 186
  L 48 176 L 48 166
  L 48 156 L 48 146
  L 48 136 L 48 126
  L 50 116 L 50 108
  L 50 100
  M 74 100
  L 76 108 L 78 116
  L 78 126 L 78 134
  L 78 142 L 78 150
  L 76 158 L 76 166
  L 76 174 L 78 182
  L 80 190 L 82 196
  L 84 202 L 84 208
  L 80 210 L 74 210
  L 70 208 L 68 204
  L 68 196 L 70 186
  L 72 176 L 72 166
  L 72 156 L 72 146
  L 72 136 L 72 126
  L 70 116 L 70 108
  L 70 100
`

const BACK_BODY_PATH = `
  M 60 8
  C 52 8, 46 12, 46 20
  C 46 28, 52 32, 60 32
  C 68 32, 74 28, 74 20
  C 74 12, 68 8, 60 8
  Z
  M 56 33 L 52 36 L 48 36 L 42 38
  C 36 40, 28 44, 24 50
  L 18 68 L 14 78 L 12 88
  C 10 96, 12 104, 14 110
  L 16 116 L 18 112
  L 22 96 L 28 80
  L 32 72 L 36 62
  L 40 54 L 44 48
  L 48 44 L 52 40
  L 56 38 L 56 33
  Z
  M 64 33 L 68 36 L 72 36 L 78 38
  C 84 40, 92 44, 96 50
  L 102 68 L 106 78 L 108 88
  C 110 96, 108 104, 106 110
  L 104 116 L 102 112
  L 98 96 L 92 80
  L 88 72 L 84 62
  L 80 54 L 76 48
  L 72 44 L 68 40
  L 64 38 L 64 33
  Z
  M 52 36 L 56 38 L 56 56
  L 54 66 L 50 76 L 48 86
  L 46 96 L 46 100
  L 50 100 L 54 96
  L 58 86 L 60 76
  L 62 86 L 66 96
  L 70 100 L 74 100
  L 74 96 L 72 86
  L 70 76 L 66 66
  L 64 56 L 64 38
  L 68 36
  M 46 100
  L 44 108 L 42 116
  L 42 126 L 42 134
  L 42 142 L 42 150
  L 44 158 L 44 166
  L 44 174 L 42 182
  L 40 190 L 38 196
  L 36 202 L 36 208
  L 40 210 L 46 210
  L 50 208 L 52 204
  L 52 196 L 50 186
  L 48 176 L 48 166
  L 48 156 L 48 146
  L 48 136 L 48 126
  L 50 116 L 50 108
  L 50 100
  M 74 100
  L 76 108 L 78 116
  L 78 126 L 78 134
  L 78 142 L 78 150
  L 76 158 L 76 166
  L 76 174 L 78 182
  L 80 190 L 82 196
  L 84 202 L 84 208
  L 80 210 L 74 210
  L 70 208 L 68 204
  L 68 196 L 70 186
  L 72 176 L 72 166
  L 72 156 L 72 146
  L 72 136 L 72 126
  L 70 116 L 70 108
  L 70 100
  M 44 50 L 50 56 L 54 66
  M 76 50 L 70 56 L 66 66
`

// ─── CSS keyframes (injected once) ──────────────────────────────────────────

const PULSE_KEYFRAMES = `
@keyframes svgGlowPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.75; }
}
@keyframes svgDotPulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}
`

// ─── Size presets ───────────────────────────────────────────────────────────

const SIZE_PRESETS = {
  mini:  { figW: 40, figH: 70, gap: 4, dotR: 5, fontSize: 0, showLabels: false },
  small: { figW: 120, figH: 220, gap: 16, dotR: 9, fontSize: 9, showLabels: true },
  large: { figW: 160, figH: 290, gap: 24, dotR: 11, fontSize: 11, showLabels: true },
}

// ─── Tooltip ────────────────────────────────────────────────────────────────

function Tooltip({ injury, x, y }: { injury: InjuryMarker; x: number; y: number }) {
  const sev = SEVERITY_CONFIG[injury.severity]
  return (
    <div
      className="absolute z-50 rounded-lg px-3 py-2 pointer-events-none"
      style={{
        left: x,
        top: y - 80,
        backgroundColor: '#1A1A2E',
        border: `1px solid ${sev.color}`,
        minWidth: 180,
        transform: 'translateX(-50%)',
      }}
    >
      <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{injury.playerName}</p>
      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{injury.injuryType}</p>
      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{injury.bodyPart}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sev.color }} />
        <span className="text-[10px] font-semibold" style={{ color: sev.color }}>{sev.label}</span>
      </div>
      <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>Return: {injury.expectedReturn}</p>
    </div>
  )
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function BodyMapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
      {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
          <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{cfg.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Single figure SVG ──────────────────────────────────────────────────────

interface FigureProps {
  side: BodySide
  injuries: InjuryMarker[]
  preset: typeof SIZE_PRESETS.small
  highlightPlayer?: string | null
  onHover: (injury: InjuryMarker | null, evt: React.MouseEvent) => void
}

function BodyFigure({ side, injuries, preset, highlightPlayer, onHover }: FigureProps) {
  const { figW, figH, dotR } = preset
  const path = side === 'front' ? FRONT_BODY_PATH : BACK_BODY_PATH
  // Scale factors from 120x220 base
  const sx = figW / 120
  const sy = figH / 220

  // Collect injuries for this side
  const dots = injuries.filter(inj => {
    const coords = ZONE_COORDS[inj.zone]
    return coords && coords[side] !== null
  })

  // Collect unique severities for SVG filter defs
  const activeSeverities = [...new Set(dots.map(d => d.severity))].filter(s => SEVERITY_CONFIG[s].pulse)

  // Offset overlapping dots in the same zone
  const zoneCount: Record<string, number> = {}

  return (
    <svg width={figW} height={figH} viewBox={`0 0 ${figW} ${figH}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {activeSeverities.map(sev => (
          <filter key={sev} id={`glow-${sev}-${side}`} x="-80%" y="-80%" width="260%" height="260%">
            <feFlood floodColor={SEVERITY_CONFIG[sev].color} floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="SourceGraphic" operator="in" result="colored" />
            <feGaussianBlur in="colored" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>
      <g transform={`scale(${sx}, ${sy})`}>
        <path d={path} fill="none" stroke="#E2E8F0" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      </g>
      {dots.map((inj, i) => {
        const coords = ZONE_COORDS[inj.zone][side]!
        const zoneKey = `${inj.zone}-${side}`
        zoneCount[zoneKey] = (zoneCount[zoneKey] || 0)
        const offset = zoneCount[zoneKey] * (dotR * 1.8)
        zoneCount[zoneKey]++

        const cx = coords.x * sx + offset
        const cy = coords.y * sy
        const sev = SEVERITY_CONFIG[inj.severity]
        const dimmed = highlightPlayer && highlightPlayer !== inj.playerName
        const r = dotR * sev.dotScale

        return (
          <g key={`${inj.playerName}-${inj.zone}-${i}`}>
            {/* Pulsing glow ring behind the dot */}
            {sev.pulse && !dimmed && (
              <circle cx={cx} cy={cy} r={r + 5} fill={sev.color} opacity={0.35}
                style={{ animation: 'svgGlowPulse 2s ease-in-out infinite' }} />
            )}
            <circle
              cx={cx} cy={cy} r={r}
              fill={sev.color}
              opacity={dimmed ? 0.2 : 0.95}
              filter={sev.pulse && !dimmed ? `url(#glow-${inj.severity}-${side})` : undefined}
              style={{
                cursor: 'pointer',
                transition: 'opacity 0.3s',
                ...(sev.pulse && !dimmed ? { animation: 'svgDotPulse 2s ease-in-out infinite' } : {}),
              }}
              onMouseEnter={e => onHover(inj, e)}
              onMouseLeave={() => onHover(null, {} as React.MouseEvent)}
            />
          </g>
        )
      })}
    </svg>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function FootballBodyMap({
  injuries,
  size = 'small',
  highlightPlayer = null,
  showLegend = true,
  showFilter = false,
  className = '',
}: FootballBodyMapProps) {
  const preset = SIZE_PRESETS[size]
  const [tooltip, setTooltip] = useState<{ injury: InjuryMarker; x: number; y: number } | null>(null)
  const [filter, setFilter] = useState<string | null>(null)

  const activeHighlight = filter || highlightPlayer

  const handleHover = (injury: InjuryMarker | null, evt: React.MouseEvent) => {
    if (!injury || size === 'mini') {
      setTooltip(null)
      return
    }
    const rect = (evt.target as SVGElement).closest('svg')?.getBoundingClientRect()
    if (!rect) return
    const svgParent = (evt.target as SVGElement).closest('[data-bodymap]')?.getBoundingClientRect()
    if (!svgParent) return
    setTooltip({
      injury,
      x: evt.clientX - svgParent.left,
      y: evt.clientY - svgParent.top,
    })
  }

  const uniquePlayers = [...new Set(injuries.map(i => i.playerName))]

  const totalWidth = preset.figW * 2 + preset.gap

  return (
    <>
      <style>{PULSE_KEYFRAMES}</style>
      <div className={`relative inline-block ${className}`} data-bodymap>
        {showFilter && uniquePlayers.length > 1 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <button
              onClick={() => setFilter(null)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
              style={{
                backgroundColor: !filter ? 'rgba(192,57,43,0.2)' : 'transparent',
                color: !filter ? '#E74C3C' : '#6B7280',
                border: `1px solid ${!filter ? 'rgba(192,57,43,0.4)' : '#374151'}`,
              }}
            >
              All Injured
            </button>
            {uniquePlayers.map(name => (
              <button
                key={name}
                onClick={() => setFilter(filter === name ? null : name)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                style={{
                  backgroundColor: filter === name ? 'rgba(192,57,43,0.2)' : 'transparent',
                  color: filter === name ? '#E74C3C' : '#6B7280',
                  border: `1px solid ${filter === name ? 'rgba(192,57,43,0.4)' : '#374151'}`,
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-start" style={{ gap: preset.gap }}>
          <div className="flex flex-col items-center">
            <BodyFigure
              side="front"
              injuries={injuries}
              preset={preset}
              highlightPlayer={activeHighlight}
              onHover={handleHover}
            />
            {preset.showLabels && (
              <span className="mt-1 text-[9px] font-semibold tracking-widest uppercase" style={{ color: '#6B7280' }}>
                Front
              </span>
            )}
          </div>
          <div className="flex flex-col items-center">
            <BodyFigure
              side="back"
              injuries={injuries}
              preset={preset}
              highlightPlayer={activeHighlight}
              onHover={handleHover}
            />
            {preset.showLabels && (
              <span className="mt-1 text-[9px] font-semibold tracking-widest uppercase" style={{ color: '#6B7280' }}>
                Back
              </span>
            )}
          </div>
        </div>

        {tooltip && <Tooltip injury={tooltip.injury} x={tooltip.x} y={tooltip.y} />}
        {showLegend && size !== 'mini' && <BodyMapLegend />}
      </div>
    </>
  )
}

// ─── Demo data helper ───────────────────────────────────────────────────────

export const DEMO_INJURIES: InjuryMarker[] = [
  {
    playerName: 'Martinez',
    injuryType: 'ACL tear',
    bodyPart: 'Left knee',
    zone: 'left-knee',
    side: 'front',
    severity: 'serious',
    expectedReturn: '7 Jul 2026',
    weeksRemaining: 14,
  },
  {
    playerName: "O'Brien",
    injuryType: 'Hamstring strain',
    bodyPart: 'Right hamstring',
    zone: 'right-hamstring',
    side: 'back',
    severity: 'moderate',
    expectedReturn: '22 Apr 2026',
    weeksRemaining: 3,
  },
  {
    playerName: 'Santos',
    injuryType: 'Calf strain',
    bodyPart: 'Left calf',
    zone: 'left-calf',
    side: 'back',
    severity: 'minor',
    expectedReturn: '8 Apr 2026',
    weeksRemaining: 1,
  },
]
