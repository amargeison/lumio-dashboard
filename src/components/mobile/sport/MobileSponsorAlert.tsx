'use client'
import React from 'react'

export type MobileSponsorAlertProps = {
  /** e.g. "DUE 12:00" */
  dueLabel: string
  message: string
  onPress?: () => void
}

export function MobileSponsorAlert({ dueLabel, message, onPress }: MobileSponsorAlertProps) {
  return (
    <button
      onClick={onPress}
      className="mx-4 mt-3 w-[calc(100%-2rem)] rounded-2xl p-3 flex items-start gap-3 text-left transition-transform active:scale-[0.99]"
      style={{
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--amber) 15%, transparent), color-mix(in srgb, var(--fuchsia) 15%, transparent))',
        border: '1px solid rgba(245, 158, 11, 0.35)',
      }}
    >
      <div
        className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0 text-sm"
        style={{
          background: 'rgba(245, 158, 11, 0.22)',
          color: 'var(--yellow)',
        }}
      >
        ⚡
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="uppercase"
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1.1px',
              color: 'var(--yellow)',
            }}
          >
            Sponsor Obligation
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
            {dueLabel}
          </span>
        </div>
        <p
          className="mt-1 leading-snug"
          style={{ color: 'var(--text-primary)', fontSize: 12.5 }}
        >
          {message}
        </p>
      </div>
    </button>
  )
}
