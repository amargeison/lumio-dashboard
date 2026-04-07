'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import CRMSidebar from '@/components/crm/CRMSidebar'
import NotificationsPanel from '@/components/dashboard/NotificationsPanel'
import AvatarDropdown from '@/components/dashboard/AvatarDropdown'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [initials, setInitials] = useState('AM')

  useEffect(() => {
    const storedInitials = localStorage.getItem('lumio_company_initials')
    if (storedInitials) setInitials(storedInitials)
  }, [])

  const [demoActive, setDemoActive] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true')

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <CRMSidebar />
      <main className="flex-1 overflow-x-hidden min-w-0" style={{ backgroundColor: '#0F1019' }}>
        {/* Demo banner */}
        {demoActive && (
          <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 40, minHeight: 40, background: '#0D9488', color: '#F9FAFB', paddingRight: 140 }}>
            <div className="flex items-center gap-2 text-xs font-medium"><span>Demo workspace — exploring with sample data</span><span style={{ opacity: 0.7 }}>· Connect your real tools to see live insights</span></div>
            <button onClick={() => { Object.keys(localStorage).filter(k => k.startsWith('lumio_demo_') || k.startsWith('lumio_dashboard_')).forEach(k => localStorage.removeItem(k)); localStorage.setItem('lumio_demo_active', 'false'); localStorage.removeItem('lumio-photo-frame'); setDemoActive(false); window.location.reload() }} className="text-xs font-semibold px-3 py-1 rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff' }}>Clear Demo Data</button>
          </div>
        )}
        {/* Avatar + bell row — top-right of CRM content */}
        <div className="flex items-center justify-end gap-3 px-6 pt-4 pb-2">
          <AvatarDropdown initials={initials} logoutRedirect="/login" settingsHref="/settings" />
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
