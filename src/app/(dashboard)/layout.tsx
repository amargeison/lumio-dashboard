'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Settings as SettingsIcon, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ClearDemoBar from '@/components/dashboard/ClearDemoBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [initials, setInitials] = useState('AM')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')
    // Read slug from middleware cookie as fallback
    const cookieSlug = document.cookie.split('; ').find(r => r.startsWith('lumio_tenant_slug='))?.split('=')[1]
    if (cookieSlug) localStorage.setItem('lumio_workspace_slug', cookieSlug)
    // Read user info
    const storedInitials = localStorage.getItem('lumio_company_initials')
    if (storedInitials) setInitials(storedInitials)
    const storedName = localStorage.getItem('lumio_user_name')
    if (storedName) setUserName(storedName)
    const storedEmail = localStorage.getItem('lumio_user_email')
    if (storedEmail) setUserEmail(storedEmail)
    function onStorage(e: StorageEvent) {
      if (e.key === 'lumio_sidebar_pinned') setPinned(e.newValue === 'true')
    }
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    window.addEventListener('storage', onStorage)
    document.addEventListener('mousedown', handleClick)
    return () => { window.removeEventListener('storage', onStorage); document.removeEventListener('mousedown', handleClick) }
  }, [])

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className="min-h-screen transition-[padding] duration-250"
        style={{ backgroundColor: '#07080F', paddingLeft: pinned ? 200 : 48 }}
      >
        {/* Top-right: avatar + bell */}
        <div className="fixed flex items-center gap-3" style={{ top: 12, right: 16, zIndex: 60 }}>
          <div ref={avatarRef} className="relative">
            <button
              onClick={() => setAvatarOpen(o => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#6C3FC5', color: '#F9FAFB' }}
            >
              {initials}
            </button>
            {avatarOpen && (
              <div
                className="absolute right-0 rounded-xl py-2 shadow-xl"
                style={{ top: '100%', marginTop: 8, width: 220, backgroundColor: '#111318', border: '1px solid #1F2937', zIndex: 100 }}
              >
                <div className="px-4 py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{userName || 'User'}</p>
                  <p className="text-xs truncate" style={{ color: '#6B7280' }}>{userEmail || ''}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm transition-colors"
                  style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
                >
                  <SettingsIcon size={14} /> Settings
                </Link>
                <button
                  onClick={() => { localStorage.clear(); router.push('/login') }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors"
                  style={{ color: '#EF4444' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
          <button
            className="relative flex items-center justify-center rounded-full transition-colors"
            style={{ width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.borderColor = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#1F2937' }}
            aria-label="Notifications"
          >
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute rounded-full" style={{ top: 6, right: 6, width: 6, height: 6, backgroundColor: '#0D9488' }} />
          </button>
        </div>
        <ClearDemoBar />
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  )
}
