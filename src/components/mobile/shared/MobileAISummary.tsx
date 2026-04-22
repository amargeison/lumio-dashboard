'use client'
import React from 'react'
import { Sparkles, Volume2 } from 'lucide-react'
import type { MobileAISummaryItem } from '@/lib/mobile/types'

export type MobileAISummaryProps = {
  /** e.g. "AI Morning Summary" — caller picks based on hour-of-day. */
  title: string
  items: MobileAISummaryItem[]
  isSpeaking: boolean
  onToggle: () => void
}

export function MobileAISummary({ title, items, isSpeaking, onToggle }: MobileAISummaryProps) {
  return (
    <div className="mx-4 mt-4">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(168, 85, 247, 0.18)',
        }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between gap-2"
          style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.12)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={14} style={{ color: 'var(--violet)' }} />
            <span className="text-[12.5px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isSpeaking ? 'Stop reading' : 'Play summary'}
            aria-pressed={isSpeaking}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors active:scale-[0.95]"
            style={{
              background: isSpeaking ? 'rgba(14, 165, 233, 0.22)' : 'rgba(168, 85, 247, 0.18)',
              border: `1px solid ${isSpeaking ? 'rgba(14, 165, 233, 0.55)' : 'rgba(168, 85, 247, 0.4)'}`,
              color: isSpeaking ? 'rgb(56, 189, 248)' : 'var(--text-accent)',
            }}
          >
            <Volume2 size={12} strokeWidth={2} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {isSpeaking ? 'Stop' : 'Listen'}
            </span>
          </button>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2.5 text-[12.5px]">
              <span className="text-base flex-shrink-0 leading-tight">{item.icon}</span>
              <span style={{ color: 'rgba(245, 243, 255, 0.85)', lineHeight: 1.55 }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
