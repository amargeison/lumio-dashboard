'use client'
import React from 'react'

export type MobileMatchCardProps = {
  /** e.g. "Today 13:00" */
  whenLabel: string
  /** e.g. "ATP MONTE-CARLO" */
  eventLabel: string
  /** e.g. "R16" */
  roundLabel: string
  /** e.g. "CLAY · H2H 3–1" */
  metaLabel: string
  home: { initials: string; name: string; rank: string }
  away: { initials: string; name: string; rank: string }
  onPrep?: () => void
  onTactics?: () => void
}

export function MobileMatchCard({
  whenLabel,
  eventLabel,
  roundLabel,
  metaLabel,
  home,
  away,
  onPrep,
  onTactics,
}: MobileMatchCardProps) {
  return (
    <div
      className="mx-4 mt-4 rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-alt) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.18)',
        animation: 'mobileCardIn 500ms 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      }}
    >
      {/* Header row: TODAY pill + event · round */}
      <div className="px-4 pt-3.5 flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{
            background: 'rgba(16, 185, 129, 0.18)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
          }}
        >
          <span
            className="w-[5px] h-[5px] rounded-full"
            style={{
              background: 'var(--green)',
              animation: 'mobileGreenPulse 1.5s ease-in-out infinite',
            }}
          />
          <span
            className="uppercase font-bold"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 9.5,
              letterSpacing: '1.1px',
              color: 'var(--green)',
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
          Match Prep AI
        </button>
        <button
          onClick={onTactics}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98]"
          style={{
            background: 'transparent',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: 'var(--text-accent)',
          }}
        >
          Tactics
        </button>
      </div>
    </div>
  )
}

function PlayerBlob({ initials, name, rank, align }: { initials: string; name: string; rank: string; align: 'left' | 'right' }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 flex-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{
          background: align === 'left'
            ? 'linear-gradient(135deg, var(--violet), var(--fuchsia))'
            : 'linear-gradient(135deg, rgb(71, 85, 105), rgb(30, 41, 59))',
        }}
      >
        {initials}
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
