'use client'
import React from 'react'

export type MobileMatchCardPlayer = {
  initials: string
  name: string
  rank: string
  /** Optional photo URL — falls back to initials avatar when absent. */
  photoUrl?: string | null
}

export type MobileMatchCardTimeTint = 'green' | 'amber' | 'red'

export type MobileMatchCardProps = {
  /** e.g. "Today 13:00" */
  whenLabel: string
  /**
   * Time-pill colour. Green = today/live, amber = future (e.g. fight camp
   * counting down), red = urgent / past-due.
   */
  whenTint?: MobileMatchCardTimeTint
  /** e.g. "ATP MONTE-CARLO" */
  eventLabel: string
  /** e.g. "R16" */
  roundLabel: string
  /** e.g. "CLAY · H2H 3–1" */
  metaLabel: string
  home: MobileMatchCardPlayer
  away: MobileMatchCardPlayer
  /** Primary button label — defaults to "Match Prep AI". */
  primaryLabel?: string
  /** Secondary button label — defaults to "Tactics". */
  secondaryLabel?: string
  onPrep?: () => void
  onTactics?: () => void
}

const TINT_TOKENS: Record<MobileMatchCardTimeTint, { bg: string; border: string; dot: string; text: string; pulse: string }> = {
  green: {
    bg:     'rgba(16, 185, 129, 0.18)',
    border: 'rgba(16, 185, 129, 0.4)',
    dot:    'var(--green)',
    text:   'var(--green)',
    pulse:  'mobileGreenPulse',
  },
  amber: {
    bg:     'rgba(245, 158, 11, 0.18)',
    border: 'rgba(245, 158, 11, 0.4)',
    dot:    'var(--amber)',
    text:   'var(--amber)',
    pulse:  'mobileGreenPulse',
  },
  red: {
    bg:     'rgba(239, 68, 68, 0.18)',
    border: 'rgba(239, 68, 68, 0.4)',
    dot:    'var(--red)',
    text:   'var(--red)',
    pulse:  'mobileRedPulse',
  },
}

export function MobileMatchCard({
  whenLabel,
  whenTint = 'green',
  eventLabel,
  roundLabel,
  metaLabel,
  home,
  away,
  primaryLabel = 'Match Prep AI',
  secondaryLabel = 'Tactics',
  onPrep,
  onTactics,
}: MobileMatchCardProps) {
  const tint = TINT_TOKENS[whenTint]
  return (
    <div
      className="mx-4 mt-4 rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-alt) 100%)',
        border: '1px solid var(--border)',
        animation: 'mobileCardIn 500ms 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      }}
    >
      {/* Header row: TODAY pill + event · round */}
      <div className="px-4 pt-3.5 flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{
            background: tint.bg,
            border: `1px solid ${tint.border}`,
          }}
        >
          <span
            className="w-[5px] h-[5px] rounded-full"
            style={{
              background: tint.dot,
              animation: `${tint.pulse} 1.5s ease-in-out infinite`,
            }}
          />
          <span
            className="uppercase font-bold"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 9.5,
              letterSpacing: '1.1px',
              color: tint.text,
            }}
          >
            {whenLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="uppercase"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 9.5,
              letterSpacing: '1px',
              color: 'var(--text-muted)',
            }}
          >
            {eventLabel}
          </span>
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: 'var(--text-accent)' }}
          >
            {roundLabel}
          </span>
        </div>
      </div>

      {/* Players + VS block */}
      <div className="px-4 py-4 flex items-center justify-between gap-2">
        <PlayerBlob {...home} align="left" />
        <div className="flex flex-col items-center flex-shrink-0 px-1">
          <span
            className="text-[22px] font-extrabold leading-none"
            style={{ color: 'var(--text-accent)' }}
          >
            VS
          </span>
          <span
            className="mt-1 uppercase whitespace-nowrap"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 9,
              letterSpacing: '0.8px',
              color: 'var(--text-meta)',
            }}
          >
            {metaLabel}
          </span>
        </div>
        <PlayerBlob {...away} align="right" />
      </div>

      {/* Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={onPrep}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, var(--violet), var(--fuchsia))',
            animation: 'mobileMatchGlow 2s ease-in-out infinite',
          }}
        >
          {primaryLabel}
        </button>
        <button
          onClick={onTactics}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98]"
          style={{
            background: 'transparent',
            border: '1px solid color-mix(in srgb, var(--violet) 40%, transparent)',
            color: 'var(--text-accent)',
          }}
        >
          {secondaryLabel}
        </button>
      </div>
    </div>
  )
}

function PlayerBlob({ initials, name, rank, photoUrl, align }: MobileMatchCardPlayer & { align: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 flex-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{
          background: align === 'left'
            ? 'linear-gradient(135deg, var(--violet), var(--fuchsia))'
            : 'linear-gradient(135deg, rgb(71, 85, 105), rgb(30, 41, 59))',
          border: '1.5px solid color-mix(in srgb, var(--violet) 45%, transparent)',
        }}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
        <div
          className="text-sm font-bold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {name}
        </div>
        <div
          className="text-[10.5px] uppercase"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
            letterSpacing: '0.7px',
            color: 'var(--text-muted)',
          }}
        >
          {rank}
        </div>
      </div>
    </div>
  )
}
