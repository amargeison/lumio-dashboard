'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ClearDemoBar from '@/components/dashboard/ClearDemoBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')
    // Read slug from middleware cookie as fallback
    const cookieSlug = document.cookie.split('; ').find(r => r.startsWith('lumio_tenant_slug='))?.split('=')[1]
    if (cookieSlug) localStorage.setItem('lumio_workspace_slug', cookieSlug)
    function onStorage(e: StorageEvent) {
      if (e.key === 'lumio_sidebar_pinned') setPinned(e.newValue === 'true')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className="min-h-screen transition-[padding] duration-250"
        style={{ backgroundColor: '#07080F', paddingLeft: pinned ? 200 : 48 }}
      >
        {/* Notifications bell — top-right of content area */}
        <button
          className="fixed z-40 flex items-center justify-center rounded-full transition-colors"
          style={{ top: 16, right: 16, width: 36, height: 36, backgroundColor: '#111318', border: '1px solid #1F2937', color: '#9CA3AF' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F9FAFB'; e.currentTarget.style.borderColor = '#374151' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#1F2937' }}
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.75} />
          <span className="absolute rounded-full" style={{ top: 8, right: 8, width: 6, height: 6, backgroundColor: '#0D9488' }} />
        </button>
        <ClearDemoBar />
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  )
}
