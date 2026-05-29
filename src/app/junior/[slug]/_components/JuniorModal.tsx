'use client'

// JuniorModal — shared modal frame for Junior portal modals (Add Team,
// Add Player, future). Backdrop + centred card + header (icon + title +
// subtitle + close button) + children body.
//
// Frame styling derived from JuniorSendMessageModal.tsx — same Junior
// green C palette, same z-index layering, same width / maxHeight rules.
//
// Width override available via `widthPx` (default 520). Add Team uses
// default; Add Player overrides to 620 for the consent accordion.

import type { ReactNode } from 'react'

const C = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  text:       '#F9FAFB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
} as const

interface Props {
  icon: string                 // emoji
  title: string
  subtitle?: string
  widthPx?: number             // default 520
  onClose: () => void
  children: ReactNode
}

export default function JuniorModal({ icon, title, subtitle, widthPx = 520, onClose, children }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100]"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      />
      {/* Modal frame */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden flex flex-col"
        style={{
          width: `min(${widthPx}px, 92vw)`,
          maxHeight: '90vh',
          backgroundColor: C.panel,
          border: `1px solid ${C.border}`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">{icon}</span>
            <div className="min-w-0">
              <div className="text-base font-bold truncate" style={{ color: C.text }}>{title}</div>
              {subtitle && (
                <div className="text-xs truncate" style={{ color: C.text4 }}>{subtitle}</div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
            style={{ color: C.text4 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  )
}
