'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

export type MoreSheetItem = {
  id: string
  label: string
  icon: string
  group: string
}

export type MobileMoreSheetProps = {
  open: boolean
  onClose: () => void
  items: MoreSheetItem[]
  hiddenIds?: Set<string>
  onNavigate: (id: string) => void
  groupOrder?: string[]
}

const DEFAULT_GROUP_ORDER = ['PERFORMANCE', 'MATCH', 'TEAM', 'COMMERCIAL', 'TOOLS', 'SETTINGS']

export function MobileMoreSheet({
  open,
  onClose,
  items,
  hiddenIds,
  onNavigate,
  groupOrder = DEFAULT_GROUP_ORDER,
}: MobileMoreSheetProps) {
  const [query, setQuery] = useState('')
  const [dragOffset, setDragOffset] = useState(0)
  const startYRef = useRef<number | null>(null)
  const lastYRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) { setQuery(''); setDragOffset(0) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (query) setQuery('')
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, query, onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const visible = items.filter(i => !hiddenIds?.has(i.id))
    if (!q) return visible
    return visible.filter(i => i.label.toLowerCase().includes(q))
  }, [items, hiddenIds, query])

  const grouped = useMemo(() => {
    const map: Record<string, MoreSheetItem[]> = {}
    for (const item of filtered) {
      ;(map[item.group] ??= []).push(item)
    }
    return map
  }, [filtered])

  const orderedGroups = useMemo(() => {
    const fromOrder = groupOrder.filter(g => grouped[g]?.length)
    const extras = Object.keys(grouped).filter(g => !fromOrder.includes(g))
    return [...fromOrder, ...extras]
  }, [grouped, groupOrder])

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    lastYRef.current = e.touches[0].clientY
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current == null) return
    const delta = e.touches[0].clientY - startYRef.current
    lastYRef.current = e.touches[0].clientY
    if (delta > 0) setDragOffset(delta)
  }
  const handleTouchEnd = () => {
    const delta = dragOffset
    startYRef.current = null
    lastYRef.current = null
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
        className="absolute inset-0 transition-opacity"
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
          borderTop: '1px solid color-mix(in srgb, var(--mobile-accent) 32%, transparent)',
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
            style={{ background: 'color-mix(in srgb, var(--mobile-accent) 45%, transparent)' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--mobile-text-muted)' }}
          >
            More
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'color-mix(in srgb, var(--mobile-accent) 10%, transparent)',
              color: 'var(--mobile-text)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-1 pb-3">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: 'var(--mobile-bg-card)',
              border: '1px solid color-mix(in srgb, var(--mobile-accent) 22%, transparent)',
            }}
          >
            <Search size={14} style={{ color: 'var(--mobile-text-muted)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search sections..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--mobile-text)' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ color: 'var(--mobile-text-muted)' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Scroll content */}
        <div
          className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
          style={{ overscrollBehavior: 'contain' }}
        >
          {orderedGroups.length === 0 ? (
            <div
              className="px-4 py-12 text-center text-sm"
              style={{ color: 'var(--mobile-text-muted)' }}
            >
              No sections match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            orderedGroups.map(group => (
              <div key={group} className="pt-2">
                <div
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: 'var(--mobile-text-muted)' }}
                >
                  {group}
                </div>
                {grouped[group].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); onClose() }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[color-mix(in_srgb,var(--mobile-accent)_12%,transparent)]"
                    style={{
                      color: 'var(--mobile-text)',
                      borderBottom: '1px solid color-mix(in srgb, var(--mobile-accent) 10%, transparent)',
                    }}
                  >
                    <span className="text-lg leading-none flex-shrink-0">{item.icon}</span>
                    <span className="text-sm truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            ))
          )}
          <div className="h-6" />
        </div>
      </div>
    </div>
  )
}
