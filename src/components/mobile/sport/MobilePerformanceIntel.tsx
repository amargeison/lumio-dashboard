'use client'
import React from 'react'

export type MobilePerformanceIntelProps = {
  /** e.g. "AI · 12:58" */
  timestampLabel: string
  /** Rendered as React nodes so callers can highlight key numbers. */
  body: React.ReactNode
  onPress?: () => void
}

export function MobilePerformanceIntel({ timestampLabel, body, onPress }: MobilePerformanceIntelProps) {
  return (
    <button
      onClick={onPress}
      className="mx-4 mt-3 w-[calc(100%-2rem)] rounded-2xl p-3.5 text-left transition-transform active:scale-[0.99]"
      style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--violet) 14%, transparent), color-mix(in srgb, var(--cyan) 8%, transparent))',
        border: '1px solid color-mix(in srgb, var(--violet) 22%, transparent)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="uppercase"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1.2px',
            color: 'var(--fuchsia)',
          }}
        >
          ✦ Performance Intel
        </span>
        <span
          className="uppercase"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
            fontSize: 9,
            letterSpacing: '0.8px',
            color: 'var(--text-meta)',
          }}
        >
          {timestampLabel}
        </span>
      </div>
      <p
        className="mt-2 leading-snug"
        style={{ color: 'var(--text-primary)', fontSize: 12.5 }}
      >
        {body}
      </p>
    </button>
  )
}
