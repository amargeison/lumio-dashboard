'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Settings as SettingsIcon, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isCRM = pathname?.includes('/crm')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [initials, setInitials] = useState('AM')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [demoActive, setDemoActive] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true')
  const [demoDismissed, setDemoDismissed] = useState(false)
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
    // Load user avatar — instant from localStorage cache
    const cachedPhoto = localStorage.getItem('lumio_user_photo')
    if (cachedPhoto && !cachedPhoto.startsWith('data:')) setUserPhoto(cachedPhoto)
    if (storedEmail) {
      const staffPhoto = localStorage.getItem(`lumio_staff_photo_${storedEmail}`)
      if (staffPhoto && !staffPhoto.startsWith('data:')) setUserPhoto(staffPhoto)
    }
    // Always fetch from Supabase in background to confirm/update avatar
    const wsToken = localStorage.getItem('workspace_session_token')
    if (wsToken) {
      fetch('/api/workspace/status', { headers: { 'x-workspace-token': wsToken } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.user_avatar_url) {
            setUserPhoto(data.user_avatar_url)
            localStorage.setItem('lumio_user_photo', data.user_avatar_url)
            if (data.owner_email) localStorage.setItem(`lumio_staff_photo_${data.owner_email}`, data.user_avatar_url)
          }
        })
        .catch(() => {})
    }
    function onAvatarUpdated(e: Event) {
      const url = (e as CustomEvent).detail
      setUserPhoto(url || null)
    }
    window.addEventListener('lumio-avatar-updated', onAvatarUpdated)
    function onStorage(e: StorageEvent) {
      if (e.key === 'lumio_sidebar_pinned') setPinned(e.newValue === 'true')
    }
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    window.addEventListener('storage', onStorage)
    document.addEventListener('mousedown', handleClick)
    return () => { window.removeEventListener('storage', onStorage); document.removeEventListener('mousedown', handleClick); window.removeEventListener('lumio-avatar-updated', onAvatarUpdated) }
  }, [])

  // CRM has its own self-contained layout (sidebar, header, avatar, bell).
  // Skip the parent dashboard chrome to avoid duplicates.
  if (isCRM) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: '#07080F' }}>
        {children}
      </main>
    )
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className="min-h-screen transition-[padding] duration-250"
        style={{ backgroundColor: '#07080F', paddingLeft: pinned ? 200 : 48 }}
      >
        {/* Demo banner */}
        {demoActive && !demoDismissed && (
          <div style={{ height: 40, minHeight: 40, flexShrink: 0, background: '#0D9488', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, fontSize: 13, color: 'white' }}>
              <span style={{ fontWeight: 600 }}>Demo workspace — exploring with sample data</span>
              <span style={{ opacity: 0.8 }}>· Connect your real tools to see live insights</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { localStorage.setItem('lumio_demo_active', 'false'); setDemoActive(false) }} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Clear Demo Data</button>
              <button onClick={() => setDemoDismissed(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>
          </div>
        )}
        {/* Top header row: avatar + bell */}
        <div className="flex items-center justify-end gap-3 px-4 py-2 md:px-6">
          <div ref={avatarRef} className="relative">
            <button
              onClick={() => setAvatarOpen(o => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-opacity hover:opacity-80 overflow-hidden"
              style={{ backgroundColor: userPhoto ? 'transparent' : '#6C3FC5', color: '#F9FAFB', padding: 0 }}
            >
              {userPhoto ? (
                <img src={userPhoto} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={() => setUserPhoto(null)} />
              ) : (
                initials
              )}
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
            onClick={() => setNotificationsOpen(o => !o)}
            className="relative flex items-center justify-center rounded-full transition-colors"
            style={{ width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.borderColor = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#1F2937' }}
            aria-label="Notifications"
          >
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute rounded-full flex items-center justify-center" style={{ top: 4, right: 4, width: 10, height: 10, backgroundColor: '#EF4444', fontSize: 6, color: '#fff', fontWeight: 700 }}>3</span>
          </button>
        </div>
        {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  )
}
