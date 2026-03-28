'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import ClearDemoBar from '@/components/dashboard/ClearDemoBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    setPinned(localStorage.getItem('lumio_sidebar_pinned') === 'true')
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
        <ClearDemoBar />
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  )
}
