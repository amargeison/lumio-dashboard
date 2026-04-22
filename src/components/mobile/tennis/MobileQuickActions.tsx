'use client'
import React from 'react'

export type MobileQuickAction = {
  id: string
  icon: string
  label: string
  onPress?: () => void
  active?: boolean
  /** Mirrors desktop `hot:true` — renders an "AI" badge in the corner. */
  hot?: boolean
}

export type MobileQuickActionsProps = {
  total: number
  actions: MobileQuickAction[]
  onAll?: () => void
}

export function MobileQuickActions({ total, actions, onAll }: MobileQuickActionsProps) {
  return (
    <div className="px-4 mt-5">
      <div className="flex items-center justify-between mb-2">
        <span
          className="uppercase font-bold"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
            fontSize: 11,
            letterSpacing: '1.2px',
            color: 'var(--text-muted)',
          }}
        >
          Quick actions
        </span>
        <button
          onClick={onAll}
          className="text-[11px] font-semibold"
          style={{ color: 'rgb(196, 181, 253)' }}
        >
          All {total} →
        </button>
      </div>

      {/* pt-2 reserves vertical room for the negative-offset "AI" badge.
          Without it, overflow-x: auto forces overflow-y: auto (CSS spec) and
          the badge gets clipped at the top of the scroll strip. */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pt-2 pb-1">
        {actions.map(a => {
          const active = !!a.active
          return (
            <button
              key={a.id}
              onClick={a.onPress}
              className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-transform active:scale-[0.95]"
              style={{
                background: active ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-card)',
                border: `1px solid ${active ? 'rgba(168, 85, 247, 0.5)' : 'var(--border, rgba(168, 85, 247, 0.18))'}`,
                color: active ? 'rgb(233, 213, 255)' : 'var(--text-accent)',
              }}
            >
              <span
                className="text-sm leading-none"
                style={{ color: active ? 'var(--fuchsia)' : undefined }}
              >
                {a.icon}
              </span>
              <span>{a.label}</span>
              {a.hot && (
                <span
                  className="absolute -top-1 -right-1 px-1 py-0.5 rounded-full font-black leading-none"
                  style={{
                    fontSize: 8,
                    background: 'rgba(168, 85, 247, 0.95)',
                    color: '#fff',
                    border: '1px solid rgba(217, 70, 239, 0.65)',
                  }}
                >
                  AI
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
