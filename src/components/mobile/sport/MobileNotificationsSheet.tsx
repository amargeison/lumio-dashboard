'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { MobileRoundupChannel, MobileRoundupMessage } from './MobileRoundupStrip'

export type MobileNotificationsSheetProps = {
  open: boolean
  onClose: () => void
  /** All roundup channels — each with demoMessages. */
  channels: MobileRoundupChannel[]
  /**
   * Tap on any notification row. The consumer typically closes this sheet
   * and opens the channel's full MessageSheet.
   */
  onSelectChannel: (channel: MobileRoundupChannel) => void
}

type FlatNotification = {
  channel: MobileRoundupChannel
  message: MobileRoundupMessage
  recencyScore: number
}

// Rough recency bucket derived from the timestamp string. Good enough to
// surface "today" messages above "Yesterday" above "N days ago" without
// parsing localized date strings — which is what the demo data uses.
function recencyScore(timestamp: string): number {
  const t = timestamp.toLowerCase()
  if (t.includes('today')) return 1000
  if (t.includes('yesterday')) return 500
  const daysMatch = t.match(/(\d+)\s*days?\s*ago/)
  if (daysMatch) return 100 - parseInt(daysMatch[1], 10)
  return 0
}

export function MobileNotificationsSheet({
  open,
  onClose,
  channels,
  onSelectChannel,
}: MobileNotificationsSheetProps) {
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

  const notifications: FlatNotification[] = useMemo(() => {
    const out: FlatNotification[] = []
    for (const ch of channels) {
      if (!ch.demoMessages) continue
      for (const msg of ch.demoMessages) {
        out.push({ channel: ch, message: msg, recencyScore: recencyScore(msg.timestamp) })
      }
    }
    // Stable sort: recent first, preserving source order for ties
    return out
      .map((item, i) => ({ item, i }))
      .sort((a, b) => b.item.recencyScore - a.item.recencyScore || a.i - b.i)
      .map(({ item }) => item)
  }, [channels])

  const totalUnread = channels.reduce((sum, c) => sum + c.count, 0)

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
          height: '85vh',
          background: 'rgba(11, 4, 16, 0.98)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderTop: '1px solid rgba(168, 85, 247, 0.4)',
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
          <div className="min-w-0">
            <div
              className="text-[13px] font-bold"
              style={{ color: 'rgb(245, 243, 255)' }}
            >
              Notifications
            </div>
            <div
              className="uppercase mt-0.5"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: 10,
                letterSpacing: '1px',
                color: 'rgba(196, 181, 253, 0.7)',
              }}
            >
              {totalUnread} unread across {channels.length} channels
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

        {/* Flat list */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            overscrollBehavior: 'contain',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          {notifications.length === 0 ? (
            <div
              className="py-10 text-center text-sm"
              style={{ color: 'rgba(196, 181, 253, 0.6)' }}
            >
              No notifications yet.
            </div>
          ) : (
            notifications.map((n, i) => {
              const oneLine = n.message.body.length > 110
                ? `${n.message.body.slice(0, 108).trim()}…`
                : n.message.body
              return (
                <button
                  key={`${n.channel.id}-${i}`}
                  onClick={() => onSelectChannel(n.channel)}
                  className="w-full text-left flex gap-3 px-5 py-3 active:bg-[rgba(168,85,247,0.08)]"
                  style={{
                    borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
                    borderLeft: `3px solid ${n.channel.color}`,
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                    style={{
                      background: `${n.channel.color}22`,
                      color: n.channel.color,
                      border: `1px solid ${n.channel.color}55`,
                    }}
                  >
                    {n.channel.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className="text-[12.5px] font-bold truncate"
                        style={{ color: 'rgb(245, 243, 255)' }}
                      >
                        {n.message.sender}
                      </span>
                      <span
                        className="uppercase flex-shrink-0"
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                          fontSize: 9.5,
                          letterSpacing: '0.8px',
                          color: 'rgba(196, 181, 253, 0.6)',
                        }}
                      >
                        {n.message.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="uppercase font-bold flex-shrink-0"
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                          fontSize: 9,
                          letterSpacing: '0.7px',
                          color: n.channel.color,
                        }}
                      >
                        {n.channel.label}
                      </span>
                      <p
                        className="text-[11.5px] leading-snug truncate"
                        style={{ color: 'rgba(245, 243, 255, 0.7)' }}
                      >
                        {oneLine}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
