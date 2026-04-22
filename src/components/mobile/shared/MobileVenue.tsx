'use client'
import React from 'react'
import type { MobileVenueConfig } from '@/lib/mobile/types'

const TINT_MAP: Record<NonNullable<MobileVenueConfig['rows'][number]['tint']>, string> = {
  green:   'var(--green)',
  amber:   'var(--amber)',
  red:     'var(--red)',
  default: 'rgba(245, 243, 255, 0.92)',
}

export function MobileVenue({ eyebrow, name, conditionsLine, rows }: MobileVenueConfig) {
  return (
    <div className="mx-4 mt-4">
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-alt) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.18)',
        }}
      >
        <div
          className="uppercase font-bold mb-2"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
            fontSize: 10,
            letterSpacing: '1.1px',
            color: 'var(--text-meta)',
          }}
        >
          {eyebrow}
        </div>
        <div className="text-[14px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {name}
        </div>
        <div className="text-[11.5px] mb-3" style={{ color: 'rgba(196, 181, 253, 0.7)' }}>
          {conditionsLine}
        </div>
        <div
          className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-3"
          style={{ borderTop: '1px solid rgba(168, 85, 247, 0.12)' }}
        >
          {rows.map(row => (
            <React.Fragment key={row.label}>
              <span
                className="uppercase"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: 9.5,
                  letterSpacing: '0.8px',
                  color: 'var(--text-muted)',
                }}
              >
                {row.label}
              </span>
              <span
                className="text-[11.5px] font-semibold text-right"
                style={{ color: TINT_MAP[row.tint ?? 'default'] }}
              >
                {row.value}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
