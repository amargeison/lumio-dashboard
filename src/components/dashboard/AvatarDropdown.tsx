'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  initials: string
  onConvert?: () => void
}

export default function AvatarDropdown({ initials, onConvert }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showGoLive, setShowGoLive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setName(localStorage.getItem('lumio_company_name') || '')
    setEmail(localStorage.getItem('lumio_user_email') || '')
    setShowGoLive(localStorage.getItem('lumio_demo_active') === 'true')
  }, [])

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleLogout() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('lumio_') || k.startsWith('demo_'))
      .forEach(k => localStorage.removeItem(k))
    router.push('/')
  }

  return (
    <div ref={ref} className="relative z-[9999]">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
        {initials}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 z-[9999] w-52 rounded-xl py-1 shadow-xl"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>

          {/* User info */}
          {(name || email) && (
            <>
              <div className="px-4 py-3">
                {name  && <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{name}</p>}
                {email && <p className="text-xs truncate" style={{ color: '#6B7280' }}>{email}</p>}
              </div>
              <div className="mx-3 h-px" style={{ backgroundColor: '#1F2937' }} />
            </>
          )}

          {/* Nav items */}
          <div className="py-1">
            {[
              { emoji: '👤', label: 'Profile & Settings',        href: '/settings' },
              { emoji: '🔔', label: 'Notification preferences',  href: '/settings#notifications' },
              { emoji: '❓', label: 'Help & Support',            href: '/about' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.08)'; e.currentTarget.style.color = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#9CA3AF' }}>
                <span>{item.emoji}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}

            {showGoLive && onConvert && (
              <button
                onClick={() => { setOpen(false); onConvert() }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm"
                style={{ color: '#0D9488' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13,148,136,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '' }}>
                <span>🚀</span>
                <span>Go Live</span>
              </button>
            )}
          </div>

          <div className="mx-3 h-px" style={{ backgroundColor: '#1F2937' }} />

          {/* Log out */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''; (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF' }}>
              <span>🚪</span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
