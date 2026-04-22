'use client'
import React from 'react'
import type { MobileScheduleItem } from '@/lib/mobile/types'

export type MobileScheduleProps = {
  items: MobileScheduleItem[]
  /** Defaults to "Today's Schedule". Override for fight nights, tournaments, etc. */
  title?: string
}

export function MobileSchedule({ items, title = "Today's Schedule" }: MobileScheduleProps) {
  return (
    <div className="mx-4 mt-5">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(168, 85, 247, 0.18)',
        }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.12)' }}
        >
          <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {title}
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
            {items.length} items
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(168, 85, 247, 0.08)' }}>
          {items.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderTop: '1px solid rgba(168, 85, 247, 0.08)' }}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  background: s.highlight ? 'var(--violet)' : 'rgba(168, 85, 247, 0.25)',
                  boxShadow: s.highlight ? '0 0 8px rgba(217, 70, 239, 0.55)' : undefined,
                }}
              />
              <span
                className="uppercase font-bold w-12 flex-shrink-0"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                  fontSize: 10.5,
                  letterSpacing: '0.7px',
                  color: 'var(--text-muted)',
                }}
              >
                {s.time}
              </span>
              <span
                className="text-[13px] flex-1 min-w-0 truncate"
                style={{
                  color: s.highlight ? 'var(--text-primary)' : 'rgba(245, 243, 255, 0.78)',
                  fontWeight: s.highlight ? 600 : 500,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
