'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Settings as SettingsIcon, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CRMSidebar from '@/components/crm/CRMSidebar'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [initials, setInitials] = useState('AM')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedInitials = localStorage.getItem('lumio_company_initials')
    if (storedInitials) setInitials(storedInitials)
    const storedName = localStorage.getItem('lumio_user_name')
    if (storedName) setUserName(storedName)
    const storedEmail = localStorage.getItem('lumio_user_email')
    if (storedEmail) setUserEmail(storedEmail)
    // Load user avatar
    const cachedPhoto = localStorage.getItem('lumio_user_photo')
    if (cachedPhoto && !cachedPhoto.startsWith('data:')) setUserPhoto(cachedPhoto)
    if (storedEmail) {
      const staffPhoto = localStorage.getItem(`lumio_staff_photo_${storedEmail}`)
      if (staffPhoto && !staffPhoto.startsWith('data:')) setUserPhoto(staffPhoto)
    }
    function onAvatarUpdated(e: Event) { setUserPhoto((e as CustomEvent).detail || null) }
    window.addEventListener('lumio-avatar-updated', onAvatarUpdated)
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => { document.removeEventListener('mousedown', handleClick); window.removeEventListener('lumio-avatar-updated', onAvatarUpdated) }
  }, [])

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <CRMSidebar />
      <main className="flex-1 overflow-x-hidden min-w-0" style={{ backgroundColor: '#0F1019' }}>
        {/* Avatar + bell row — top-right of CRM content */}
        <div className="flex items-center justify-end gap-3 px-6 pt-4 pb-2">
          <div ref={avatarRef} className="relative">
            <button onClick={() => setAvatarOpen(o => !o)} className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-opacity hover:opacity-80 overflow-hidden" style={{ backgroundColor: userPhoto ? 'transparent' : '#6C3FC5', color: '#F9FAFB', padding: 0 }}>
              {userPhoto ? (
                <img src={userPhoto} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={() => setUserPhoto(null)} />
              ) : initials}
            </button>
            {avatarOpen && (
              <div className="absolute right-0 rounded-xl py-2 shadow-xl" style={{ top: '100%', marginTop: 8, width: 220, backgroundColor: '#111318', border: '1px solid #1F2937', zIndex: 100 }}>
                <div className="px-4 py-2" style={{ borderBottom: '1px solid #1F2937' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: '#F9FAFB' }}>{userName || 'User'}</p>
                  <p className="text-xs truncate" style={{ color: '#6B7280' }}>{userEmail || ''}</p>
                </div>
                <Link href="/settings" onClick={() => setAvatarOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm transition-colors" style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}>
                  <SettingsIcon size={14} /> Settings
                </Link>
                <button onClick={() => { localStorage.clear(); router.push('/login') }} className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors" style={{ color: '#EF4444' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1F2937' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
          <button onClick={() => setNotificationsOpen(o => !o)} className="relative flex items-center justify-center rounded-full transition-colors" style={{ width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.borderColor = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#1F2937' }}
            aria-label="Notifications">
            <Bell size={16} strokeWidth={1.75} />
            <span className="absolute rounded-full flex items-center justify-center" style={{ top: 4, right: 4, width: 10, height: 10, backgroundColor: '#EF4444', fontSize: 6, color: '#fff', fontWeight: 700 }}>3</span>
          </button>
        </div>
        {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
        <div className="px-6 pb-6">
          {children}
        </div>
      </main>
    </div>
  )
}
