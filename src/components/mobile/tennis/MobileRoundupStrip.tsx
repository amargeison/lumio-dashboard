'use client'
import React from 'react'
import { ChevronRight } from 'lucide-react'

export type MobileRoundupMessage = {
  sender: string
  timestamp: string
  body: string
}

export type MobileRoundupChannel = {
  id: string
  label: string
  icon: string
  count: number
  color: string
  urgent?: number
  /**
   * Demo messages surfaced when the row is tapped. Most-recent first; one
   * entry per `count` is the convention but not enforced — render whatever
   * is supplied.
   */
  demoMessages?: MobileRoundupMessage[]
}

export type MobileRoundupStripProps = {
  totalCount: number
  sinceLabel: string
  channels: MobileRoundupChannel[]
  onOpen?: () => void
  /** Receives the full channel object so the consumer can open a message sheet. */
  onChannel?: (channel: MobileRoundupChannel) => void
}

export function MobileRoundupStrip({
  totalCount,
  sinceLabel,
  channels,
  onOpen,
  onChannel,
}: MobileRoundupStripProps) {
  return (
    <div className="mx-4 mt-5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="text-[13px] font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Morning Roundup
          </span>
          <span
            className="uppercase"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 9.5,
              letterSpacing: '0.9px',
              color: 'var(--text-meta)',
            }}
          >
            {totalCount} since {sinceLabel}
          </span>
        </div>
        <button
          onClick={onOpen}
          className="text-[11px] font-semibold"
          style={{ color: 'rgb(196, 181, 253)' }}
        >
          Open triage →
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(168, 85, 247, 0.18)',
        }}
      >
        {channels.map((ch, i) => (
          <button
            key={ch.id}
            onClick={() => onChannel?.(ch)}
            className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors active:bg-[rgba(168,85,247,0.08)]"
            style={{
              borderLeft: `3px solid ${ch.color}`,
              borderBottom: i < channels.length - 1 ? '1px solid rgba(168, 85, 247, 0.08)' : 'none',
            }}
          >
            {/* coloured icon box */}
            <div
              className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0 text-[13px]"
              style={{
                background: colourWithAlpha(ch.color, 0.13),
                color: ch.color,
              }}
            >
              {ch.icon}
            </div>

            {/* label + count */}
            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
              <span
                className="text-[13px] font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {ch.label}
              </span>
              <span
                className="uppercase"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: 9.5,
                  letterSpacing: '0.9px',
                  color: 'var(--text-muted)',
                }}
              >
                {ch.count} new
              </span>
            </div>

            {/* urgent pill */}
            {ch.urgent && ch.urgent > 0 && (
              <div
                className="flex items-center gap-1 rounded-full px-2 py-0.5 flex-shrink-0"
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                }}
              >
                <span
                  className="w-[5px] h-[5px] rounded-full"
                  style={{
                    background: 'var(--red)',
                    animation: 'mobileRedPulse 1.5s ease-in-out infinite',
                  }}
                />
                <span
                  className="uppercase font-bold"
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                    fontSize: 9,
                    letterSpacing: '0.8px',
                    color: 'var(--red)',
                  }}
                >
                  Urgent
                </span>
              </div>
            )}

            <ChevronRight size={14} style={{ color: 'var(--text-meta)' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

function colourWithAlpha(rgb: string, alpha: number): string {
  // Accepts rgb(x, y, z) or #hex
  if (rgb.startsWith('rgb(')) return rgb.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`)
  return rgb
}
