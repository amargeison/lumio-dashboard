'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const FOOTBALL_TIERS = [
  { href: '/football/pro',         label: 'Pro & Academy', subtitle: 'EFL · Premier League · Academies' },
  { href: '/football/non-league',  label: 'Non-League',    subtitle: 'National League · Steps 1–6' },
  { href: '/football/grassroots',  label: 'Grassroots',    subtitle: 'Amateur · Youth · Sunday League' },
]

type Props = {
  /** Text size / weight classes to match the surrounding nav. */
  className?: string
  /** Whether the parent header is scrolled (affects panel bg). */
  scrolled?: boolean
}

export function FootballNavDropdown({ className, scrolled }: Props) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }
  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
  }
  const openNow = () => { cancelClose(); setOpen(true) }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openNow())}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1 rounded-lg transition-colors whitespace-nowrap ${className ?? 'px-2 py-2 font-medium text-sm'}`}
        style={{ color: '#9CA3AF' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F9FAFB' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}
      >
        Football
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
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: 320,
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
          {FOOTBALL_TIERS.map(t => (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setOpen(false)}
              role="menuitem"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: '12px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                color: '#F9FAFB',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(239, 68, 68, 0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent' }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.label}
                <span style={{ color: '#F1C40F', fontSize: 13, opacity: 0.7 }}>→</span>
              </span>
              <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{t.subtitle}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export { FOOTBALL_TIERS }
