'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

/** `subtitle` is optional: a list where no item has one renders compact
 *  (single line per item), which suits a long flat menu like Sports. */
export type NavTier = { href: string; label: string; subtitle?: string }

type Props = {
  /** Trigger label (e.g. "Sports"). */
  label: string
  /** Dropdown items. */
  tiers: NavTier[]
  /** Item hover background — an accent at low alpha
   *  (e.g. 'rgba(239,68,68,0.08)'). */
  accentHover: string
  /** Text size / weight classes to match the surrounding nav. */
  className?: string
  /** Whether the parent header is scrolled (affects panel bg). */
  scrolled?: boolean
}

/**
 * Generic nav dropdown. Opens on hover or click, and is operable from the
 * keyboard: the trigger announces aria-haspopup="menu", so it also implements
 * what that promises — ArrowDown/ArrowUp to open and move between items,
 * Home/End, Escape to close with focus returned to the trigger.
 */
export function NavDropdown({ label, tiers, accentHover, className, scrolled }: Props) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  // Index to focus once the panel renders. Only set when the menu is opened
  // from the keyboard, so a mouse hover never yanks focus into the panel.
  const focusOnOpen = useRef<number | null>(null)

  // No subtitles anywhere → compact single-line rows and a narrower panel.
  const compact = tiers.every(t => !t.subtitle)

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }
  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }
  const openNow = () => { cancelClose(); setOpen(true) }

  const closeAndRestore = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  // Move focus into the panel after it has actually rendered.
  useEffect(() => {
    if (!open || focusOnOpen.current === null) return
    const i = focusOnOpen.current
    focusOnOpen.current = null
    itemRefs.current[i]?.focus()
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const focusItem = (i: number) => {
    const n = tiers.length
    if (!n) return
    itemRefs.current[((i % n) + n) % n]?.focus()
  }

  // Enter/Space are left to the button's native click handling — intercepting
  // them here as well would toggle twice.
  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const target = e.key === 'ArrowDown' ? 0 : tiers.length - 1
      if (open) focusItem(target)
      else { focusOnOpen.current = target; openNow() }
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setOpen(false)
    }
  }

  const onItemKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, idx: number) => {
    if (e.key === 'ArrowDown')      { e.preventDefault(); focusItem(idx + 1) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); focusItem(idx - 1) }
    else if (e.key === 'Home')      { e.preventDefault(); focusItem(0) }
    else if (e.key === 'End')       { e.preventDefault(); focusItem(tiers.length - 1) }
    else if (e.key === 'Escape')    { e.preventDefault(); closeAndRestore() }
    else if (e.key === 'Tab')       { setOpen(false) }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openNow())}
        onKeyDown={onTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1 rounded-lg transition-colors whitespace-nowrap ${className ?? 'px-2 py-2 font-medium text-sm'}`}
        style={{ color: '#9CA3AF' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
      >
        {label}
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: compact ? 232 : 320,
            backgroundColor: scrolled ? 'rgba(13, 17, 23, 0.98)' : 'rgba(13, 17, 23, 0.96)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(31, 41, 55, 0.9)',
            borderRadius: 14,
            padding: 8,
            boxShadow: '0 30px 60px -20px rgba(0, 0, 0, 0.75)',
            zIndex: 60,
          }}
        >
          {tiers.map((t, i) => (
            <Link
              key={t.href}
              href={t.href}
              ref={el => { itemRefs.current[i] = el }}
              onClick={() => setOpen(false)}
              onKeyDown={e => onItemKeyDown(e, i)}
              role="menuitem"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: compact ? '9px 12px' : '12px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                color: '#F9FAFB',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = accentHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent' }}
              onFocus={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = accentHover }}
              onBlur={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent' }}
            >
              <span style={{ fontSize: compact ? 13.5 : 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.label}
                <span style={{ color: '#F1C40F', fontSize: 13, opacity: 0.7 }}>→</span>
              </span>
              {t.subtitle && <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{t.subtitle}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
