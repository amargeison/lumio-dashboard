'use client'
import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export type MobileMessage = {
  /** Sender display name — e.g. "James Wright (Agent)". */
  sender: string
  /** Human-readable timestamp — "09:32 today", "Yesterday 18:14". */
  timestamp: string
  /** Full body text — 2–4 realistic sentences. */
  body: string
}

export type MobileMessageSheetProps = {
  open: boolean
  onClose: () => void
  /** Channel label e.g. "SMS · Agent" or "WhatsApp · Coach". */
  channelLabel: string
  /** Channel icon (single character or emoji). */
  channelIcon: string
  /** Accent colour for the channel. */
  channelColor: string
  /** Messages to render — most recent first. */
  messages: MobileMessage[]
  /** Tap on the disabled Reply button. Wires up to ComingSoonModal upstream. */
  onReplyTap?: () => void
}

/**
 * Bottom-sheet message viewer for the Morning Roundup. Mirrors
 * MobileMoreSheet's structural pattern — same animation, drag handle, scrim,
 * Escape-to-close. Reply button is intentionally disabled and routes to a
 * Coming Soon modal upstream so the visual surface is honest about what's
 * stubbed.
 */
export function MobileMessageSheet({
  open,
  onClose,
  channelLabel,
  channelIcon,
  channelColor,
  messages,
  onReplyTap,
}: MobileMessageSheetProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const startYRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) setDragOffset(0)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current == null) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0) setDragOffset(delta)
  }
  const handleTouchEnd = () => {
    const delta = dragOffset
    startYRef.current = null
    if (delta > 100) {
      setDragOffset(0)
      onClose()
    } else {
      setDragOffset(0)
    }
  }

  if (!open && dragOffset === 0) return null

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      {/* Scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: 'rgba(6, 2, 12, 0.75)',
          opacity: open ? 1 : 0,
          transition: 'opacity 260ms ease-out',
        }}
      />

      {/* Sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 rounded-t-3xl flex flex-col"
        style={{
          maxHeight: '78vh',
          background: 'rgba(11, 4, 16, 0.98)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderTop: `1px solid ${channelColor}`,
          transform: `translateY(${open ? dragOffset : 1000}px)`,
          transition: startYRef.current == null
            ? 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)'
            : 'none',
        }}
      >
        {/* Drag handle */}
        <div
          className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'rgba(168, 85, 247, 0.45)' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
              style={{
                background: `${channelColor}24`,
                color: channelColor,
                border: `1px solid ${channelColor}55`,
              }}
            >
              {channelIcon}
            </span>
            <div
              className="text-[12px] font-bold uppercase truncate"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                letterSpacing: '1.4px',
                color: 'rgba(196, 181, 253, 0.95)',
              }}
            >
              {channelLabel}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(168, 85, 247, 0.12)',
              color: 'rgba(245, 243, 255, 0.9)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-5 pb-4 space-y-3"
          style={{ overscrollBehavior: 'contain' }}
        >
          {messages.length === 0 ? (
            <div
              className="py-10 text-center text-sm"
              style={{ color: 'rgba(196, 181, 253, 0.6)' }}
            >
              No messages yet.
            </div>
          ) : (
            messages.map((m, i) => {
              const initials = m.sender
                .replace(/\(.+?\)/g, '')
                .trim()
                .split(/\s+/)
                .map(p => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase()
              return (
                <div
                  key={i}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(22, 16, 43, 0.85)',
                    border: '1px solid rgba(168, 85, 247, 0.18)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: `${channelColor}28`,
                        color: channelColor,
                        border: `1px solid ${channelColor}55`,
                      }}
                    >
                      {initials || '·'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-[13px] font-bold truncate"
                        style={{ color: 'rgb(245, 243, 255)' }}
                      >
                        {m.sender}
                      </div>
                      <div
                        className="text-[10.5px] uppercase mt-0.5"
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                          letterSpacing: '0.9px',
                          color: 'rgba(196, 181, 253, 0.6)',
                        }}
                      >
                        {m.timestamp}
                      </div>
                    </div>
                  </div>
                  <p
                    className="text-[13.5px] leading-relaxed"
                    style={{ color: 'rgba(245, 243, 255, 0.86)' }}
                  >
                    {m.body}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Disabled reply bar */}
        <div
          className="px-5 py-3 flex items-center gap-3"
          style={{
            borderTop: '1px solid rgba(168, 85, 247, 0.16)',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          <button
            onClick={onReplyTap}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-transform active:scale-[0.98]"
            style={{
              background: 'rgba(168, 85, 247, 0.18)',
              border: '1px dashed rgba(168, 85, 247, 0.45)',
              color: 'rgba(196, 181, 253, 0.85)',
            }}
            title="Coming soon"
          >
            Reply — coming soon
          </button>
        </div>
      </div>
    </div>
  )
}
